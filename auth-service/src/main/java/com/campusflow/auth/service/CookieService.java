package com.campusflow.auth.service;

import com.campusflow.auth.config.SecurityProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CookieService {

    private final SecurityProperties securityProperties;

    public void writeRefreshTokenCookie(HttpServletResponse response, String token, Duration maxAge) {
        ResponseCookie cookie = ResponseCookie.from(securityProperties.getRefreshCookie().getName(), token)
                .httpOnly(true)
                .secure(securityProperties.getRefreshCookie().isSecure())
                .path(securityProperties.getRefreshCookie().getPath())
                .sameSite(securityProperties.getRefreshCookie().getSameSite())
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(securityProperties.getRefreshCookie().getName(), "")
                .httpOnly(true)
                .secure(securityProperties.getRefreshCookie().isSecure())
                .path(securityProperties.getRefreshCookie().getPath())
                .sameSite(securityProperties.getRefreshCookie().getSameSite())
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public Optional<String> extractRefreshToken(HttpServletRequest request) {
        return extractCookieValue(request, securityProperties.getRefreshCookie().getName());
    }

    private Optional<String> extractCookieValue(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> cookieName.equals(cookie.getName()))
                .map(jakarta.servlet.http.Cookie::getValue)
                .filter(StringUtils::hasText)
                .findFirst();
    }
}
