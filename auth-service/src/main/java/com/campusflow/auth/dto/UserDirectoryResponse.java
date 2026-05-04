package com.campusflow.auth.dto;

public record UserDirectoryResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String role
) {
}
