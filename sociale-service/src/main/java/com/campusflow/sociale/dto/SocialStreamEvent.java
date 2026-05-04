package com.campusflow.sociale.dto;

public record SocialStreamEvent(
        String type,
        Object payload
) {
}
