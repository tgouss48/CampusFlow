package com.campusflow.auth.service;

import com.campusflow.auth.entity.Role;
import com.campusflow.auth.entity.UserAccount;
import com.campusflow.auth.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @Test
    void loadUserByUsername_Success() {
        UserAccount user = UserAccount.builder()
                .email("test@test.com")
                .passwordHash("hash")
                .role(Role.USER)
                .build();
        when(userAccountRepository.findByEmailIgnoreCase("test@test.com")).thenReturn(Optional.of(user));

        UserDetails details = userDetailsService.loadUserByUsername("test@test.com");

        assertNotNull(details);
        assertEquals("test@test.com", details.getUsername());
    }

    @Test
    void loadUserByUsername_NotFound() {
        when(userAccountRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> userDetailsService.loadUserByUsername("unknown"));
    }
}
