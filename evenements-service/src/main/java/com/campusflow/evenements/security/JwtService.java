package com.campusflow.evenements.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final int MIN_HMAC_KEY_LENGTH = 32;
    private final SecretKey signingKey;

    public JwtService(@Value("${security.jwt.secret}") String base64Secret) {
        byte[] decodedSecret = Decoders.BASE64.decode(base64Secret);
        if (decodedSecret.length < MIN_HMAC_KEY_LENGTH) {
            throw new IllegalStateException("La cle JWT doit faire au minimum 256 bits (32 octets)");
        }
        this.signingKey = Keys.hmacShaKeyFor(decodedSecret);
    }

    public JwtAuthenticatedUser parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        Long userId = extractUserId(claims);
        Set<String> roles = extractRoles(claims);
        String firstName = extractStringClaim(claims, "firstName");
        String lastName = extractStringClaim(claims, "lastName");
        return new JwtAuthenticatedUser(userId, roles, firstName, lastName);
    }

    public Collection<? extends GrantedAuthority> toAuthorities(Set<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return Set.of();
        }
        return roles.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(role -> !role.isBlank())
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }

    private Long extractUserId(Claims claims) {
        Object userIdClaim = firstNonNull(claims.get("userId"), claims.get("id"), claims.get("user_id"), claims.getSubject());
        if (userIdClaim == null) {
            throw new JwtException("Token invalide: userId absent");
        }
        try {
            return Long.parseLong(String.valueOf(userIdClaim));
        } catch (NumberFormatException ex) {
            throw new JwtException("Token invalide: userId non numerique");
        }
    }

    private Set<String> extractRoles(Claims claims) {
        Object rolesClaim = firstNonNull(claims.get("roles"), claims.get("role"), claims.get("authorities"));
        if (rolesClaim == null) {
            return Set.of();
        }

        Set<String> roles = new LinkedHashSet<>();
        if (rolesClaim instanceof Collection<?> collection) {
            collection.stream().map(String::valueOf).forEach(roles::add);
            return roles;
        }

        String rawRoles = String.valueOf(rolesClaim);
        Arrays.stream(rawRoles.split(","))
                .map(String::trim)
                .filter(role -> !role.isBlank())
                .forEach(roles::add);
        return roles;
    }

    private String extractStringClaim(Claims claims, String key) {
        Object value = claims.get(key);
        if (value == null) {
            return null;
        }
        String normalized = String.valueOf(value).trim();
        return normalized.isBlank() ? null : normalized;
    }

    private Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }
}
