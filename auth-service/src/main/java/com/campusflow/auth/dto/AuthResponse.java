package com.campusflow.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user
) {

    public record UserResponse(
            Long id,
            String email,
            String firstName,
            String lastName,
            String role,
            boolean active,
            boolean emailVerified
    ) {
    }
}
