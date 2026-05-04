package com.campusflow.auth.dto;

public record UserUpdatedEvent(Long userId, String newDisplayName) {
}
