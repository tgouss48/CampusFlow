package com.campusflow.sociale.security;

import java.util.Set;

public record JwtAuthenticatedUser(
        Long userId,
        Set<String> roles,
        String firstName,
        String lastName
) {
}
