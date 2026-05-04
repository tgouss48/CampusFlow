package com.campusflow.annonces.dto;

public record LikeToggleResponse(
        boolean liked,
        long likeCount
) {
}
