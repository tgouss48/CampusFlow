package com.campusflow.auth.dto;

public record CsrfTokenResponse(
        String headerName,
        String parameterName,
        String token
) {
}
