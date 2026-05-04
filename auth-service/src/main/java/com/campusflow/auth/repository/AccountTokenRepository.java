package com.campusflow.auth.repository;

import com.campusflow.auth.entity.AccountToken;
import com.campusflow.auth.entity.AccountTokenType;
import com.campusflow.auth.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AccountTokenRepository extends JpaRepository<AccountToken, Long> {

    Optional<AccountToken> findByTokenHash(String tokenHash);

    List<AccountToken> findByUserAndTypeAndUsedAtIsNull(UserAccount user, AccountTokenType type);

    void deleteByExpiresAtBefore(LocalDateTime cutoff);
}
