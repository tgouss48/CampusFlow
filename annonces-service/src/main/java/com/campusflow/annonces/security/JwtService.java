package com.campusflow.annonces.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.WeakKeyException;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;

@Service
public class JwtService {

    private final String secret;

    public JwtService(@Value("${security.jwt.secret}") String secret) {
        this.secret = secret;
    }

    private SecretKey signingKey;

    @PostConstruct
    void init() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        try {
            byte[] decodedBytes = Decoders.BASE64.decode(secret);
            if (decodedBytes.length >= 32) {
                keyBytes = decodedBytes;
            }
        } catch (IllegalArgumentException ignored) {
            // Fallback to raw UTF-8 bytes when the configured secret is not Base64.
        }
        try {
            signingKey = Keys.hmacShaKeyFor(keyBytes);
        } catch (WeakKeyException exception) {
            throw new IllegalStateException("La clé secrète JWT doit contenir au moins 32 octets", exception);
        }
    }


    public CampusflowUserPrincipal parseUserPrincipal(String token) {
        Claims claims = parseClaims(token);
        Long userId = extractUserIdFromClaims(claims);
        return new CampusflowUserPrincipal(userId, buildDisplayName(claims), extractRoles(claims));
    }

    private Long extractUserIdFromClaims(Claims claims) {
        Object userIdRaw = claims.get("userId");
        if (userIdRaw instanceof Number userIdNumber) {
            return userIdNumber.longValue();
        }
        if (userIdRaw != null) {
            try {
                return Long.parseLong(userIdRaw.toString());
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }

        Number idClaim = claims.get("id", Number.class);
        if (idClaim != null) {
            return idClaim.longValue();
        }

        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new JwtException("JWT ne contient pas d'identifiant utilisateur");
        }

        try {
            return Long.parseLong(subject);
        } catch (NumberFormatException ex) {
            throw new JwtException("JWT subject n'est pas un identifiant utilisateur valide", ex);
        }
    }

    private static String buildDisplayName(Claims claims) {
        String first = claimString(claims, "firstName");
        String last = claimString(claims, "lastName");
        String combined = (first + " " + last).trim();
        if (!combined.isEmpty()) {
            return combined;
        }
        return "Utilisateur";
    }

    private static String claimString(Claims claims, String name) {
        Object raw = claims.get(name);
        if (raw == null) {
            return "";
        }
        return raw.toString().trim();
    }

    private static Set<String> extractRoles(Claims claims) {
        Set<String> roles = new LinkedHashSet<>();
        addRoles(roles, claims.get("roles"));
        addRoles(roles, claims.get("authorities"));
        addRoles(roles, claims.get("role"));
        return Set.copyOf(roles);
    }

    private static void addRoles(Set<String> roles, Object rawRoles) {
        if (rawRoles == null) {
            return;
        }

        if (rawRoles instanceof Collection<?> collection) {
            collection.stream()
                    .map(String::valueOf)
                    .map(String::trim)
                    .filter(value -> !value.isBlank())
                    .forEach(roles::add);
            return;
        }

        Arrays.stream(String.valueOf(rawRoles).split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .forEach(roles::add);
    }


    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
