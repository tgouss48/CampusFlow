package com.campusflow.auth.service;

import com.campusflow.auth.config.SecurityProperties;
import com.campusflow.auth.entity.RefreshToken;
import com.campusflow.auth.entity.UserAccount;
import com.campusflow.auth.exception.InvalidTokenException;
import com.campusflow.auth.repository.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final CookieService cookieService;
    private final SecurityProperties securityProperties;

    @Transactional
    public void issueRefreshToken(
            UserAccount user,
            String userAgent,
            String ipAddress,
            HttpServletResponse response) {
        String rawToken = generateTokenValue();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(rawToken))
                .expiresAt(LocalDateTime.now().plus(securityProperties.getJwt().getRefreshTokenExpiration()))
                .userAgent(truncate(userAgent, 255))
                .createdByIp(truncate(ipAddress, 64))
                .build();

        refreshTokenRepository.save(refreshToken);
        cookieService.writeRefreshTokenCookie(
                response,
                rawToken,
                securityProperties.getJwt().getRefreshTokenExpiration());
    }

    @Transactional
    public UserAccount rotateRefreshToken(HttpServletRequest request, HttpServletResponse response) {
        RefreshToken existingToken = resolveValidRefreshToken(request);
        existingToken.setRevokedAt(LocalDateTime.now());

        UserAccount user = existingToken.getUser();
        issueRefreshToken(user, request.getHeader("User-Agent"), request.getRemoteAddr(), response);
        return user;
    }

    @Transactional
    public void revokeRefreshTokenFromRequest(HttpServletRequest request) {
        cookieService.extractRefreshToken(request)
                .map(this::hashToken)
                .flatMap(refreshTokenRepository::findByTokenHash)
                .filter(RefreshToken::isActive)
                .ifPresent(token -> token.setRevokedAt(LocalDateTime.now()));
    }

    public void clearRefreshCookie(HttpServletResponse response) {
        cookieService.clearRefreshTokenCookie(response);
    }

    @Transactional
    public void revokeAllUserRefreshTokens(UserAccount user) {
        LocalDateTime now = LocalDateTime.now();
        refreshTokenRepository.findByUserIdAndRevokedAtIsNull(user.getId()).stream()
                .filter(RefreshToken::isActive)
                .forEach(token -> token.setRevokedAt(now));
    }

    @Scheduled(cron = "${app.security.scheduling.purge-expired-tokens-cron}")
    @Transactional
    public void purgeExpiredTokens() {
        refreshTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }

    private RefreshToken resolveValidRefreshToken(HttpServletRequest request) {
        String rawToken = cookieService.extractRefreshToken(request)
                .orElseThrow(() -> new InvalidTokenException("Refresh token est manquant"));

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hashToken(rawToken))
                .orElseThrow(() -> new InvalidTokenException("Refresh token est invalide"));

        if (!refreshToken.isActive()) {
            throw new InvalidTokenException("Refresh token est expire ou revoque");
        }

        return refreshToken;
    }

    private String generateTokenValue() {
        byte[] randomBytes = new byte[64];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] digest = messageDigest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm not available", exception);
        }
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
