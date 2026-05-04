package com.campusflow.annonces.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@SuppressWarnings("ClassEscapesDefinedScope")
@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiError> handleResourceNotFound(ResourceNotFoundException ex) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(new ApiError(
                                                LocalDateTime.now(),
                                                HttpStatus.NOT_FOUND.value(),
                                                HttpStatus.NOT_FOUND.getReasonPhrase(),
                                                ex.getMessage(),
                                                null));
        }

        @ExceptionHandler(ForbiddenOperationException.class)
        public ResponseEntity<ApiError> handleForbidden(ForbiddenOperationException ex) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(new ApiError(
                                                LocalDateTime.now(),
                                                HttpStatus.FORBIDDEN.value(),
                                                HttpStatus.FORBIDDEN.getReasonPhrase(),
                                                ex.getMessage(),
                                                null));
        }

        @ExceptionHandler({ InvalidOperationException.class, IllegalArgumentException.class })
        public ResponseEntity<ApiError> handleBadRequest(RuntimeException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(new ApiError(
                                                LocalDateTime.now(),
                                                HttpStatus.BAD_REQUEST.value(),
                                                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                                                ex.getMessage(),
                                                null));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiError> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
                Map<String, String> validationErrors = new HashMap<>();
                for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
                        validationErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
                }

                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(new ApiError(
                                                LocalDateTime.now(),
                                                HttpStatus.BAD_REQUEST.value(),
                                                "Validation échouée",
                                                "Un ou plusieurs champs de la requête sont invalides",
                                                validationErrors));
        }

        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex) {
                Map<String, String> validationErrors = new HashMap<>();
                ex.getConstraintViolations().forEach(violation -> validationErrors
                                .put(violation.getPropertyPath().toString(), violation.getMessage()));

                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(new ApiError(
                                                LocalDateTime.now(),
                                                HttpStatus.BAD_REQUEST.value(),
                                                "Validation échouée",
                                                "Un ou plusieurs champs de la requête sont invalides",
                                                validationErrors));
        }

        private record ApiError(
                        LocalDateTime timestamp,
                        int status,
                        String error,
                        String message,
                        Map<String, String> details) {
        }
}
