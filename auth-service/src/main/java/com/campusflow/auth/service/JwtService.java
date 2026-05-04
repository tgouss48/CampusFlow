package com.campusflow.auth.service;

import com.campusflow.auth.config.SecurityProperties;
import com.campusflow.auth.entity.UserAccount;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.WeakKeyException;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private final SecurityProperties securityProperties;
    private SecretKey signingKey;

    public JwtService(SecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    @PostConstruct
    void init() {
        String secret = securityProperties.getJwt().getSecret();
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

    public String generateAccessToken(UserAccount user) {
        Instant now = Instant.now();
        Instant expiration = now.plus(securityProperties.getJwt().getAccessTokenExpiration());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        claims.put("firstName", user.getFirstName() != null ? user.getFirstName() : "");
        claims.put("lastName", user.getLastName() != null ? user.getLastName() : "");
        return Jwts.builder()
                .subject(user.getEmail())
                .claims(claims)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(signingKey)
                .compact();
    }

    public boolean isAccessTokenValid(String token, UserAccount user) {
        Claims claims = extractAllClaims(token);
        return claims.getSubject().equalsIgnoreCase(user.getEmail())
                && claims.getExpiration().after(new Date())
                && user.isActive();
    }

    public String extractSubject(String token) {
        return extractAllClaims(token).getSubject();
    }

    public long getAccessTokenExpirationSeconds() {
        return securityProperties.getJwt().getAccessTokenExpiration().toSeconds();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
