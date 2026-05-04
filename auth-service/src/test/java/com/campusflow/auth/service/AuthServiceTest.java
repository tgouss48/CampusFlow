package com.campusflow.auth.service;

import com.campusflow.auth.dto.LoginRequest;
import com.campusflow.auth.dto.MessageResponse;
import com.campusflow.auth.dto.RegisterRequest;
import com.campusflow.auth.entity.UserAccount;
import com.campusflow.auth.repository.UserAccountRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserAccountRepository userAccountRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private AccountTokenService accountTokenService;
    @Mock
    private EmailService emailService;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;
    @Mock
    private com.campusflow.auth.config.SecurityProperties securityProperties;

    @InjectMocks
    private AuthService authService;

    @Test
    void register() {
        RegisterRequest request = new RegisterRequest("test@test.com", "password", "First", "Last");
        HttpServletResponse response = mock(HttpServletResponse.class);

        when(userAccountRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(i -> i.getArguments()[0]);

        MessageResponse msg = authService.register(request, response);

        assertNotNull(msg);
        verify(accountTokenService).issueToken(any(), any());
        verify(emailService).sendEmailVerification(eq("test@test.com"), any());
    }

    @Test
    void login() {
        LoginRequest request = new LoginRequest("test@test.com", "password");
        HttpServletRequest httpRequest = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        UserAccount user = UserAccount.builder()
                .email("test@test.com")
                .role(com.campusflow.auth.entity.Role.USER)
                .active(true)
                .emailVerified(true)
                .build();

        when(userAccountRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user)).thenReturn("accessToken");

        authService.login(request, httpRequest, response);

        verify(authenticationManager).authenticate(any());
        verify(refreshTokenService).issueRefreshToken(eq(user), any(), any(), eq(response));
    }

    @Test
    void updateProfile() {
        com.campusflow.auth.security.AuthenticatedUser principal = mock(
                com.campusflow.auth.security.AuthenticatedUser.class);
        UserAccount user = new UserAccount();
        user.setId(1L);
        user.setFirstName("Old");
        user.setLastName("Name");

        com.campusflow.auth.entity.Role role = com.campusflow.auth.entity.Role.USER;
        user.setRole(role);

        when(principal.user()).thenReturn(user);
        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(user));

        com.campusflow.auth.dto.UpdateProfileRequest request = new com.campusflow.auth.dto.UpdateProfileRequest("New",
                "Name");

        // Mocking SecurityProperties for Kafka topic
        com.campusflow.auth.config.SecurityProperties.Kafka kafkaConfig = mock(com.campusflow.auth.config.SecurityProperties.Kafka.class);
        com.campusflow.auth.config.SecurityProperties.Kafka.Topics topicsConfig = mock(com.campusflow.auth.config.SecurityProperties.Kafka.Topics.class);
        when(securityProperties.getKafka()).thenReturn(kafkaConfig);
        when(kafkaConfig.getTopics()).thenReturn(topicsConfig);
        when(topicsConfig.getUserProfileUpdates()).thenReturn("user-profile-updates");

        authService.updateProfile(principal, request);

        assertEquals("New", user.getFirstName());
        verify(kafkaTemplate).send(eq("user-profile-updates"), eq("1"), any());
    }
}
