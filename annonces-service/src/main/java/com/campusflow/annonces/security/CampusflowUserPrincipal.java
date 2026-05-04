package com.campusflow.annonces.security;

import java.util.Set;

public record CampusflowUserPrincipal(Long userId, String displayName, Set<String> roles) {
}
