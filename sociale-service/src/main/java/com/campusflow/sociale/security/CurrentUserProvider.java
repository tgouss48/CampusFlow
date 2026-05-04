package com.campusflow.sociale.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CurrentUserProvider {

    public JwtAuthenticatedUser getRequiredUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof JwtAuthenticatedUser jwtUser) {
            return jwtUser;
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur authentifie introuvable");
    }
}
