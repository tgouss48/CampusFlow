package com.campusflow.auth.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class RateLimitingFilterTest {

    private RateLimitingFilter filter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        com.campusflow.auth.config.SecurityProperties securityProperties = mock(com.campusflow.auth.config.SecurityProperties.class);
        com.campusflow.auth.config.SecurityProperties.RateLimiting rateLimiting = mock(com.campusflow.auth.config.SecurityProperties.RateLimiting.class);
        
        when(securityProperties.getRateLimiting()).thenReturn(rateLimiting);
        when(rateLimiting.getMaxRequests()).thenReturn(10);
        when(rateLimiting.getWindow()).thenReturn(java.time.Duration.ofSeconds(60));
        when(rateLimiting.getCleanupIntervalMs()).thenReturn(300000L);

        filter = new RateLimitingFilter(securityProperties);
        filterChain = mock(FilterChain.class);
    }

    @Test
    void shouldAllowRequestWithinLimit() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void shouldBlockRequestExceedingLimit() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("1.2.3.4");
        
        // Max limit is 10
        for (int i = 0; i < 10; i++) {
            filter.doFilterInternal(request, new MockHttpServletResponse(), filterChain);
        }

        MockHttpServletResponse lastResponse = new MockHttpServletResponse();
        filter.doFilterInternal(request, lastResponse, filterChain);

        assertEquals(429, lastResponse.getStatus());
        verify(filterChain, times(10)).doFilter(any(), any());
    }

    @Test
    void shouldNotFilterNonAuthPaths() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/other");
        boolean result = filter.shouldNotFilter(request);
        assertTrue(result);
    }
}
