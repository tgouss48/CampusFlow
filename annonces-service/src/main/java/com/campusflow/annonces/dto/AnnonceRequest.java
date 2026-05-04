package com.campusflow.annonces.dto;

import com.campusflow.annonces.entity.enums.AnnonceType;
import com.campusflow.annonces.entity.enums.CategorieAnnonce;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AnnonceRequest(
                @NotBlank @Size(max = 150) String titre,

                @NotBlank @Size(max = 2000) String description,

                @NotNull AnnonceType type,

                @NotNull CategorieAnnonce categorie) {
}
