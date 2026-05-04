package com.campusflow.evenements.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> details = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            details.put(error.getField(), error.getDefaultMessage());
        }
        return buildResponse(HttpStatus.BAD_REQUEST, "Erreur de validation", details);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableBody(HttpMessageNotReadableException ex) {
        String hint = "Verifiez que le corps de la requete est un JSON valide et non vide.";
        Map<String, String> details = new LinkedHashMap<>();
        details.put("hint", hint);
        if (ex.getMessage() != null) {
            details.put("technical", ex.getMessage());
        }
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Corps de requete absent ou JSON invalide",
                details);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleBadRequest(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> details = new LinkedHashMap<>();
        for (ConstraintViolation<?> v : ex.getConstraintViolations()) {
            details.put(v.getPropertyPath().toString(), v.getMessage());
        }
        return buildResponse(HttpStatus.BAD_REQUEST, "Erreur de validation (entite)", details);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleForbidden(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), null);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        return buildResponse(status, ex.getReason(), null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException ex) {
        String cause = ex.getMostSpecificCause().getMessage();
        log.warn("Contrainte base de donnees: {}", cause);
        Map<String, String> details = new LinkedHashMap<>();
        details.put("cause", cause != null ? cause : ex.getMessage());
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Donnees invalides ou contrainte en base (cle etrangere, doublon, etc.)",
                details);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiError> handleDataAccess(DataAccessException ex) {
        String cause = ex.getMostSpecificCause().getMessage();
        log.error("Erreur d'acces aux donnees", ex);
        Map<String, String> details = new LinkedHashMap<>();
        details.put("cause", cause != null ? cause : ex.getMessage());
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur base de donnees", details);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex) {
        log.error("Erreur non geree", ex);
        Map<String, String> details = new LinkedHashMap<>();
        details.put("exception", ex.getClass().getSimpleName());
        if (ex.getMessage() != null) {
            details.put("message", ex.getMessage());
        }
        Throwable cause = ex.getCause();
        if (cause != null && cause.getMessage() != null) {
            details.put("cause", cause.getMessage());
        }
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur serveur inattendue", details);
    }

    private ResponseEntity<ApiError> buildResponse(HttpStatus status, String message, Map<String, String> details) {
        ApiError body = new ApiError(
                Instant.now().toString(),
                status.value(),
                status.getReasonPhrase(),
                message == null ? status.getReasonPhrase() : message,
                details);
        return ResponseEntity.status(status).body(body);
    }

    public record ApiError(
            String timestamp,
            int status,
            String error,
            String message,
            Map<String, String> details) {
    }
}
