package com.campusflow.annonces.dto;

public record UserUpdatedEvent(Long userId, String newDisplayName) {
}
