package com.campusflow.auth.service;

import com.campusflow.auth.dto.AuthResponse;
import com.campusflow.auth.dto.ChangePasswordRequest;
import com.campusflow.auth.dto.EmailRequest;
import com.campusflow.auth.dto.LoginRequest;
import com.campusflow.auth.dto.MessageResponse;
import com.campusflow.auth.dto.PasswordResetConfirmRequest;
import com.campusflow.auth.dto.RegisterRequest;
import com.campusflow.auth.dto.TokenRequest;
import com.campusflow.auth.dto.UpdateProfileRequest;
import com.campusflow.auth.dto.UserAccessUpdateRequest;
import com.campusflow.auth.dto.UserDirectoryResponse;
import com.campusflow.auth.dto.UserUpdatedEvent;
import com.campusflow.auth.entity.AccountTokenType;
import com.campusflow.auth.entity.Role;
import com.campusflow.auth.entity.UserAccount;
import com.campusflow.auth.exception.AccountNotVerifiedException;
import com.campusflow.auth.exception.InvalidTokenException;
import com.campusflow.auth.exception.ResourceConflictException;
import com.campusflow.auth.repository.UserAccountRepository;
import com.campusflow.auth.security.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.campusflow.auth.config.SecurityProperties;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AccountTokenService accountTokenService;
    private final EmailService emailService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final SecurityProperties securityProperties;

    @Transactional
    public MessageResponse register(RegisterRequest request, HttpServletResponse response) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResourceConflictException("Email deja utilise");
        }

        UserAccount user = userAccountRepository.save(UserAccount.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .role(Role.USER)
                .active(true)
                .build());

        String verificationToken = accountTokenService.issueToken(user, AccountTokenType.EMAIL_VERIFICATION);
        emailService.sendEmailVerification(user.getEmail(), verificationToken);
        refreshTokenService.clearRefreshCookie(response);

        return new MessageResponse("Inscription reussie. Veuillez verifier votre email avant de vous connecter.");
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        String normalizedEmail = normalizeEmail(request.email());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password()));

        UserAccount user = userAccountRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Identifiants invalides"));

        if (!user.isActive()) {
            throw new DisabledException("Compte utilisateur desactive");
        }
        if (!user.isEmailVerified()) {
            throw new AccountNotVerifiedException("Email non verifie");
        }

        return issueTokens(user, httpRequest.getHeader("User-Agent"), httpRequest.getRemoteAddr(), response);
    }

    @Transactional
    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        UserAccount user = refreshTokenService.rotateRefreshToken(request, response);
        String accessToken = jwtService.generateAccessToken(user);
        return buildAuthResponse(user, accessToken);
    }

    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        refreshTokenService.revokeRefreshTokenFromRequest(request);
        refreshTokenService.clearRefreshCookie(response);
    }

    @Transactional(readOnly = true)
    public AuthResponse.UserResponse me(Object principal) {
        return toUserResponse(requireAuthenticatedUser(principal));
    }

    @Transactional
    public AuthResponse.UserResponse updateProfile(Object principal, UpdateProfileRequest request) {
        UserAccount user = requireAuthenticatedUser(principal);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());

        String newDisplayName = user.getFirstName() + " " + user.getLastName();
        kafkaTemplate.send(securityProperties.getKafka().getTopics().getUserProfileUpdates(), String.valueOf(user.getId()),
                new UserUpdatedEvent(user.getId(), newDisplayName));

        return toUserResponse(user);
    }

    @Transactional
    public MessageResponse changePassword(
            Object principal,
            ChangePasswordRequest request) {
        UserAccount user = requireAuthenticatedUser(principal);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Mot de passe actuel incorrect");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ResourceConflictException("Le nouveau mot de passe doit etre different de l'ancien");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        return new MessageResponse("Mot de passe mis a jour avec succes.");
    }

    @Transactional(readOnly = true)
    public List<AuthResponse.UserResponse> listUsers() {
        return userAccountRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(user -> user.getRole() != Role.ADEI)
                .map(this::toUserResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserDirectoryResponse> listDirectoryUsers() {
        return userAccountRepository.findAllByActiveTrueAndEmailVerifiedTrueOrderByFirstNameAscLastNameAsc().stream()
                .map(user -> new UserDirectoryResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getRole().name()))
                .toList();
    }

    @Transactional
    public AuthResponse.UserResponse updateUserAccess(
            Object principal,
            Long userId,
            UserAccessUpdateRequest request) {
        UserAccount authenticatedUser = requireAuthenticatedUser(principal);
        UserAccount targetUser = userAccountRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable"));

        if (authenticatedUser.getId().equals(targetUser.getId()) && !request.active()) {
            throw new ResourceConflictException("Vous ne pouvez pas desactiver votre propre acces");
        }

        if (targetUser.getRole() == Role.ADEI && !request.active()) {
            throw new ResourceConflictException("Vous ne pouvez pas desactiver un compte administrateur (ADEI)");
        }

        targetUser.setActive(request.active());
        if (!request.active()) {
            refreshTokenService.revokeAllUserRefreshTokens(targetUser);
        }

        return toUserResponse(targetUser);
    }

    @Transactional
    public MessageResponse requestEmailVerification(EmailRequest request) {
        userAccountRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .filter(user -> !user.isEmailVerified())
                .ifPresent(user -> {
                    String token = accountTokenService.issueToken(user, AccountTokenType.EMAIL_VERIFICATION);
                    emailService.sendEmailVerification(user.getEmail(), token);
                });

        return new MessageResponse("Un email de vérification a été envoyé.");
    }

    @Transactional
    public MessageResponse confirmEmailVerification(TokenRequest request) {
        UserAccount user = accountTokenService.consumeToken(request.token(), AccountTokenType.EMAIL_VERIFICATION);
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        return new MessageResponse("Email vérifié avec succès.");
    }

    @Transactional(readOnly = true)
    public MessageResponse validateEmailVerificationToken(String token) {
        accountTokenService.validateToken(token, AccountTokenType.EMAIL_VERIFICATION);
        return new MessageResponse("Token valide");
    }

    @Transactional
    public MessageResponse forgotPassword(EmailRequest request) {
        userAccountRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .filter(UserAccount::isEmailVerified)
                .ifPresent(user -> {
                    String token = accountTokenService.issueToken(user, AccountTokenType.PASSWORD_RESET);
                    emailService.sendPasswordReset(user.getEmail(), token);
                });

        return new MessageResponse(
                "Si le compte existe et l'email est vérifié, un e-mail de réinitialisation de mot de passe sera envoyé.");
    }

    @Transactional(readOnly = true)
    public MessageResponse validateResetToken(String token) {
        accountTokenService.validateToken(token, AccountTokenType.PASSWORD_RESET);
        return new MessageResponse("Token valide");
    }

    @Transactional
    public MessageResponse resetPassword(PasswordResetConfirmRequest request, HttpServletResponse response) {
        UserAccount user = accountTokenService.consumeToken(request.token(), AccountTokenType.PASSWORD_RESET);
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        refreshTokenService.revokeAllUserRefreshTokens(user);
        refreshTokenService.clearRefreshCookie(response);
        return new MessageResponse("Mot de passe réinitialisé avec succès.");
    }

    private AuthResponse issueTokens(
            UserAccount user,
            String userAgent,
            String ipAddress,
            HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(user);
        refreshTokenService.issueRefreshToken(user, userAgent, ipAddress, response);
        return buildAuthResponse(user, accessToken);
    }

    private AuthResponse buildAuthResponse(UserAccount user, String accessToken) {
        return new AuthResponse(
                accessToken,
                "Bearer",
                jwtService.getAccessTokenExpirationSeconds(),
                toUserResponse(user));
    }

    private AuthResponse.UserResponse toUserResponse(UserAccount user) {
        return new AuthResponse.UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name(),
                user.isActive(),
                user.isEmailVerified());
    }

    private UserAccount requireAuthenticatedUser(Object principal) {
        if (!(principal instanceof AuthenticatedUser authenticatedUser)) {
            throw new InvalidTokenException("Utilisateur non authentifié");
        }

        return userAccountRepository.findById(authenticatedUser.user().getId())
                .orElseThrow(() -> new InvalidTokenException("Utilisateur non authentifié"));
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
