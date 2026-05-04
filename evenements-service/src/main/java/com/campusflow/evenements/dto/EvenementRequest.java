package com.campusflow.evenements.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class EvenementRequest {

    @NotBlank
    @Size(max = 150)
    private String titre;

    @NotBlank
    @Size(max = 2000)
    private String description;

    @NotBlank
    @Size(max = 255)
    private String lieu;

    @NotNull
    @FutureOrPresent
    private LocalDateTime dateDebut;

    @NotNull
    @Future
    private LocalDateTime dateFin;

    @NotNull
    @Min(1)
    private Integer capaciteMax;

}
