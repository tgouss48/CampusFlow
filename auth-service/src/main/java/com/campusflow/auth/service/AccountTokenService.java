package com.campusflow.auth.service;

import com.campusflow.auth.config.SecurityProperties;
import com.campusflow.auth.entity.AccountToken;
import com.campusflow.auth.entity.AccountTokenType;
import com.campusflow.auth.entity.UserAccount;
import com.campusflow.auth.exception.AccountTokenException;
import com.campusflow.auth.repository.AccountTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AccountTokenRepository accountTokenRepository;
    private final SecurityProperties securityProperties;

    @Transactional
    public String issueToken(UserAccount user, AccountTokenType type) {
        LocalDateTime now = LocalDateTime.now();
        List<AccountToken> activeTokens = accountTokenRepository.findByUserAndTypeAndUsedAtIsNull(user, type);
        for (AccountToken token : activeTokens) {
            token.setUsedAt(now);
        }

        String rawToken = generateTokenValue();
        accountTokenRepository.save(AccountToken.builder()
                .user(user)
                .type(type)
                .tokenHash(hashToken(rawToken))
                .expiresAt(now.plus(resolveExpiration(type)))
                .build());
        return rawToken;
    }

    @Transactional(readOnly = true)
    public void validateToken(String rawToken, AccountTokenType type) {
        AccountToken token = accountTokenRepository.findByTokenHash(hashToken(rawToken))
                .orElseThrow(() -> new AccountTokenException("Lien invalide."));

        verifyTokenStatus(token, type);
    }

    @Transactional
    public UserAccount consumeToken(String rawToken, AccountTokenType type) {
        AccountToken token = accountTokenRepository.findByTokenHash(hashToken(rawToken))
                .orElseThrow(() -> new AccountTokenException("Lien invalide."));

        verifyTokenStatus(token, type);

        token.setUsedAt(LocalDateTime.now());
        accountTokenRepository.save(token);
        return token.getUser();
    }

    private void verifyTokenStatus(AccountToken token, AccountTokenType type) {
        if (token.getType() != type) {
            throw new AccountTokenException("Lien invalide.");
        }
        if (token.getUsedAt() != null) {
            throw new AccountTokenException("Ce lien a deja ete utilise.");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AccountTokenException("Ce lien est expire.");
        }
    }

    @Scheduled(cron = "${app.security.scheduling.purge-account-tokens-cron}")
    @Transactional
    public void purgeExpiredTokens() {
        accountTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }

    private Duration resolveExpiration(AccountTokenType type) {
        return switch (type) {
            case EMAIL_VERIFICATION -> securityProperties.getVerification().getTokenExpiration();
            case PASSWORD_RESET -> securityProperties.getPasswordReset().getTokenExpiration();
        };
    }

    private String generateTokenValue() {
        byte[] randomBytes = new byte[48];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] digest = messageDigest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm not available", exception);
        }
    }
}
