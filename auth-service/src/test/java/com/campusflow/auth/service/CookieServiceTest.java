package com.campusflow.auth.service;

import com.campusflow.auth.config.SecurityProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CookieServiceTest {

    @Mock
    private SecurityProperties securityProperties;

    @InjectMocks
    private CookieService cookieService;

    @BeforeEach
    void setUp() {
        SecurityProperties.RefreshCookie refreshCookie = new SecurityProperties.RefreshCookie();
        refreshCookie.setName("refreshToken");
        refreshCookie.setPath("/");
        refreshCookie.setSameSite("Strict");
        refreshCookie.setSecure(true);

        when(securityProperties.getRefreshCookie()).thenReturn(refreshCookie);
    }

    @Test
    void writeRefreshTokenCookie() {
        HttpServletResponse response = mock(HttpServletResponse.class);
        cookieService.writeRefreshTokenCookie(response, "tokenValue", Duration.ofDays(1));
        verify(response).addHeader(eq("Set-Cookie"), anyString());
    }

    @Test
    void extractRefreshToken() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        Cookie cookie = new Cookie("refreshToken", "tokenValue");
        when(request.getCookies()).thenReturn(new Cookie[]{cookie});

        Optional<String> result = cookieService.extractRefreshToken(request);

        assertTrue(result.isPresent());
        assertEquals("tokenValue", result.get());
    }
}
