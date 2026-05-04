package com.campusflow.evenements.dto;

import com.campusflow.evenements.entity.enums.EvenementStatut;
import java.time.LocalDateTime;
import java.util.List;
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
public class EvenementResponse {

    private Long id;
    private String titre;
    private String description;
    private String lieu;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private EvenementStatut statut;
    private Integer capaciteMax;
    private long nombreParticipants;
    private boolean isParticipating;
    private List<ParticipantPreviewResponse> previewParticipants;
}
