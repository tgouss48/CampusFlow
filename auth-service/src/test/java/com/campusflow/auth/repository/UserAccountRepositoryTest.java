package com.campusflow.auth.repository;

import com.campusflow.auth.entity.UserAccount;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class UserAccountRepositoryTest {

    @Autowired
    private UserAccountRepository repository;

    @Test
    void findByEmailIgnoreCase() {
        UserAccount user = new UserAccount();
        user.setEmail("TEST@test.com");
        user.setPasswordHash("pass");
        user.setFirstName("First");
        user.setLastName("Last");
        user.setActive(true);
        repository.save(user);

        Optional<UserAccount> found = repository.findByEmailIgnoreCase("test@test.com");
        assertTrue(found.isPresent());
        assertEquals("TEST@test.com", found.get().getEmail());
    }

    @Test
    void existsByEmailIgnoreCase() {
        UserAccount user = new UserAccount();
        user.setEmail("exists@test.com");
        user.setPasswordHash("pass");
        user.setFirstName("First");
        user.setLastName("Last");
        repository.save(user);

        assertTrue(repository.existsByEmailIgnoreCase("EXists@test.com"));
        assertFalse(repository.existsByEmailIgnoreCase("notfound@test.com"));
    }
}
