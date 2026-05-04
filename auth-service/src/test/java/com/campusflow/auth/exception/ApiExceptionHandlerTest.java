package com.campusflow.auth.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.util.Map;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ApiExceptionHandlerTest {

    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void handleConflict() {
        ResourceConflictException ex = new ResourceConflictException("Conflict");
        ResponseEntity<Map<String, Object>> response = handler.handleConflict(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Conflict", Objects.requireNonNull(response.getBody()).get("message"));
    }

    @Test
    void handleUnauthorized() {
        RuntimeException ex = new RuntimeException("Unauthorized");
        ResponseEntity<Map<String, Object>> response = handler.handleUnauthorized(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Unauthorized", Objects.requireNonNull(response.getBody()).get("message"));
    }

    @Test
    void handleAccessDenied() {
        AccessDeniedException ex = new AccessDeniedException("Forbidden");
        ResponseEntity<Map<String, Object>> response = handler.handleAccessDenied(ex);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Accès refusé", Objects.requireNonNull(response.getBody()).get("message"));
    }

    @Test
    void handleGeneric() {
        Exception ex = new Exception("Error");
        ResponseEntity<Map<String, Object>> response = handler.handleGeneric(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("Erreur inattendue", Objects.requireNonNull(response.getBody()).get("message"));
    }
}
