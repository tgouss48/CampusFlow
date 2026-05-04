package com.campusflow.auth.controller;

import com.campusflow.auth.dto.AuthResponse;
import com.campusflow.auth.dto.ChangePasswordRequest;
import com.campusflow.auth.dto.CsrfTokenResponse;
import com.campusflow.auth.dto.EmailRequest;
import com.campusflow.auth.dto.LoginRequest;
import com.campusflow.auth.dto.MessageResponse;
import com.campusflow.auth.dto.PasswordResetConfirmRequest;
import com.campusflow.auth.dto.RegisterRequest;
import com.campusflow.auth.dto.TokenRequest;
import com.campusflow.auth.dto.UpdateProfileRequest;
import com.campusflow.auth.dto.UserAccessUpdateRequest;
import com.campusflow.auth.dto.UserDirectoryResponse;
import com.campusflow.auth.security.AuthenticatedUser;
import com.campusflow.auth.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/csrf")
    public ResponseEntity<CsrfTokenResponse> csrf(HttpServletRequest request, CsrfToken csrfToken) {
        String rawToken = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            rawToken = java.util.Arrays.stream(cookies)
                    .filter(cookie -> Objects.equals("XSRF-TOKEN", cookie.getName()))
                    .map(Cookie::getValue)
                    .filter(value -> value != null && !value.isBlank())
                    .findFirst()
                    .orElse(null);
        }

        return ResponseEntity.ok(new CsrfTokenResponse(
                csrfToken.getHeaderName(),
                csrfToken.getParameterName(),
                rawToken != null ? rawToken : csrfToken.getToken()
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request, response));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.login(request, httpRequest, response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.refresh(request, response));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.OK)
    public MessageResponse logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return new MessageResponse("Logged out successfully");
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(authService.me(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse.UserResponse> updateProfile(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(authService.updateProfile(user, request));
    }

    @PutMapping("/password")
    public ResponseEntity<MessageResponse> changePassword(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        return ResponseEntity.ok(authService.changePassword(user, request));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADEI')")
    public ResponseEntity<List<AuthResponse.UserResponse>> listUsers() {
        return ResponseEntity.ok(authService.listUsers());
    }

    @GetMapping("/directory")
    public ResponseEntity<List<UserDirectoryResponse>> listDirectoryUsers() {
        return ResponseEntity.ok(authService.listDirectoryUsers());
    }

    @PatchMapping("/users/{userId}/access")
    @PreAuthorize("hasRole('ADEI')")
    public ResponseEntity<AuthResponse.UserResponse> updateUserAccess(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long userId,
            @RequestBody UserAccessUpdateRequest request
    ) {
        return ResponseEntity.ok(authService.updateUserAccess(user, userId, request));
    }

    @PostMapping("/verify-email/request")
    public ResponseEntity<MessageResponse> requestEmailVerification(@Valid @RequestBody EmailRequest request) {
        return ResponseEntity.ok(authService.requestEmailVerification(request));
    }

    @PostMapping("/verify-email/confirm")
    public ResponseEntity<MessageResponse> confirmEmailVerification(@Valid @RequestBody TokenRequest request) {
        return ResponseEntity.ok(authService.confirmEmailVerification(request));
    }

    @GetMapping("/verify-email/validate")
    public ResponseEntity<MessageResponse> validateEmailVerificationToken(@RequestParam String token) {
        return ResponseEntity.ok(authService.validateEmailVerificationToken(token));
    }

    @PostMapping("/password/forgot")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody EmailRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @GetMapping("/password/reset/validate")
    public ResponseEntity<MessageResponse> validateResetToken(@RequestParam String token) {
        return ResponseEntity.ok(authService.validateResetToken(token));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody PasswordResetConfirmRequest request,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.resetPassword(request, response));
    }
}
