package com.campusflow.evenements.security;

import java.util.Set;

public record JwtAuthenticatedUser(
        Long userId,
        Set<String> roles,
        String firstName,
        String lastName
) {
    public String displayName() {
        String fullName = ((firstName == null ? "" : firstName.trim()) + " " + (lastName == null ? "" : lastName.trim())).trim();
        return fullName.isBlank() ? null : fullName;
    }
}
