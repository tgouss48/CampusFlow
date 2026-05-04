package com.campusflow.evenements.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipationResponse {

    private Long id;
    private Long participantId;
    private String participantDisplayName;
    private LocalDateTime createdAt;
}
