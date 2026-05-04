package com.campusflow.auth.service;

import com.campusflow.auth.config.SecurityProperties;
import com.campusflow.auth.entity.Role;
import com.campusflow.auth.entity.UserAccount;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @Mock
    private SecurityProperties securityProperties;

    @InjectMocks
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        SecurityProperties.Jwt jwt = new SecurityProperties.Jwt();
        // Must be at least 32 bytes
        jwt.setSecret("verylongsecretkeythatisatleast32byteslong");
        jwt.setAccessTokenExpiration(Duration.ofMinutes(15));
        when(securityProperties.getJwt()).thenReturn(jwt);
        jwtService.init();
    }

    @Test
    void generateAccessToken() {
        UserAccount user = UserAccount.builder()
                .id(1L)
                .email("test@test.com")
                .role(Role.USER)
                .firstName("First")
                .lastName("Last")
                .build();

        String token = jwtService.generateAccessToken(user);

        assertNotNull(token);
        assertEquals("test@test.com", jwtService.extractSubject(token));
    }

    @Test
    void isAccessTokenValid() {
        UserAccount user = UserAccount.builder()
                .id(1L)
                .email("test@test.com")
                .role(Role.USER)
                .active(true)
                .build();

        String token = jwtService.generateAccessToken(user);

        assertTrue(jwtService.isAccessTokenValid(token, user));
    }
}
