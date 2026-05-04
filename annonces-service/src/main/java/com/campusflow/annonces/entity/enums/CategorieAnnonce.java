package com.campusflow.annonces.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CategorieAnnonce {
    LIVRES_FOURNITURES("Livres & Fournitures"),
    INFORMATIQUE("Informatique"),
    LOGEMENT("Logement"),
    TRANSPORT("Transport"),
    COURS_SOUTIEN("Cours & Soutien"),
    DIVERS("Divers");

    private final String nom;
}
