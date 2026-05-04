package com.campusflow.auth.service;

import com.campusflow.auth.config.SecurityProperties;
import com.campusflow.auth.entity.RefreshToken;
import com.campusflow.auth.entity.UserAccount;
import com.campusflow.auth.repository.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private CookieService cookieService;
    @Mock
    private SecurityProperties securityProperties;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    private UserAccount user;

    @BeforeEach
    void setUp() {
        user = new UserAccount();
        user.setId(1L);

        SecurityProperties.Jwt jwt = new SecurityProperties.Jwt();
        jwt.setRefreshTokenExpiration(Duration.ofDays(7));
        when(securityProperties.getJwt()).thenReturn(jwt);
    }

    @Test
    void issueRefreshToken() {
        HttpServletResponse response = mock(HttpServletResponse.class);
        refreshTokenService.issueRefreshToken(user, "UserAgent", "127.0.0.1", response);

        verify(refreshTokenRepository).save(any(RefreshToken.class));
        verify(cookieService).writeRefreshTokenCookie(eq(response), anyString(), any());
    }

    @Test
    void rotateRefreshToken() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        RefreshToken existingToken = RefreshToken.builder()
                .user(user)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();

        when(cookieService.extractRefreshToken(request)).thenReturn(Optional.of("oldToken"));
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(existingToken));

        UserAccount result = refreshTokenService.rotateRefreshToken(request, response);

        assertEquals(user, result);
        assertNotNull(existingToken.getRevokedAt());
        verify(refreshTokenRepository).save(any(RefreshToken.class)); // For the new token
    }
}
