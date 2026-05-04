package com.campusflow.evenements.dto;

public record UserUpdatedEvent(Long userId, String newDisplayName) {
}
