package com.campusflow.annonces.security;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class CurrentUserService {
    private static final Set<String> ADEI_ROLES = Set.of("ADEI", "ROLE_ADEI");

    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new IllegalStateException("Aucun utilisateur authentifie trouve dans le contexte de securite");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof CampusflowUserPrincipal campusflowUser) {
            return campusflowUser.userId();
        }

        if (principal instanceof Long userId) {
            return userId;
        }

        if (principal instanceof String userIdAsString) {
            return Long.parseLong(userIdAsString);
        }

        throw new IllegalStateException("Type de principal authentifie non supporte");
    }

    public String getCurrentUserDisplayName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new IllegalStateException("Aucun utilisateur authentifie trouve dans le contexte de securite");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof CampusflowUserPrincipal campusflowUser) {
            return campusflowUser.displayName();
        }

        return "Utilisateur";
    }

    public boolean isCurrentUserAdei() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(ADEI_ROLES::contains);
    }
}
