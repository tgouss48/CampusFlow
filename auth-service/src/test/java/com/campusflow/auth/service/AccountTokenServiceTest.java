package com.campusflow.auth.service;

import com.campusflow.auth.config.SecurityProperties;
import com.campusflow.auth.entity.AccountToken;
import com.campusflow.auth.entity.AccountTokenType;
import com.campusflow.auth.entity.UserAccount;
import com.campusflow.auth.repository.AccountTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountTokenServiceTest {

    @Mock
    private AccountTokenRepository accountTokenRepository;

    @Mock
    private SecurityProperties securityProperties;

    @InjectMocks
    private AccountTokenService accountTokenService;

    private UserAccount user;

    @BeforeEach
    void setUp() {
        user = new UserAccount();
        user.setId(1L);
        user.setEmail("test@test.com");

        SecurityProperties.Verification verification = new SecurityProperties.Verification();
        verification.setTokenExpiration(Duration.ofHours(1));

        lenient().when(securityProperties.getVerification()).thenReturn(verification);
    }

    @Test
    void issueToken() {
        when(accountTokenRepository.findByUserAndTypeAndUsedAtIsNull(user, AccountTokenType.EMAIL_VERIFICATION))
                .thenReturn(Collections.emptyList());

        String token = accountTokenService.issueToken(user, AccountTokenType.EMAIL_VERIFICATION);

        assertNotNull(token);
        verify(accountTokenRepository).save(any(AccountToken.class));
    }

    @Test
    void validateToken_Success() {
        AccountToken token = AccountToken.builder()
                .type(AccountTokenType.EMAIL_VERIFICATION)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .user(user)
                .build();

        // We need to hash the token to match what the service does
        // But since we can't easily get the hashed value of the generated token,
        // let's mock the repository to return the token for ANY hash for this test.
        when(accountTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        assertDoesNotThrow(() -> accountTokenService.validateToken("someRawToken", AccountTokenType.EMAIL_VERIFICATION));
    }

    @Test
    void consumeToken_Success() {
        AccountToken token = AccountToken.builder()
                .type(AccountTokenType.EMAIL_VERIFICATION)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .user(user)
                .build();

        when(accountTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        UserAccount consumedUser = accountTokenService.consumeToken("someRawToken", AccountTokenType.EMAIL_VERIFICATION);

        assertEquals(user, consumedUser);
        assertNotNull(token.getUsedAt());
        verify(accountTokenRepository).save(token);
    }
}
