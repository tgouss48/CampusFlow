package com.campusflow.evenements.dto;

/**
 * Resultat du toggle inscription / desinscription sur un evenement.
 *
 * @param participating   true si l'utilisateur est inscrit apres l'operation
 * @param nombreParticipants nombre de participants apres l'operation
 * @param inscription     true si l'operation etait une inscription, false si desinscription
 */
public record ParticipationToggleResponse(boolean participating, long nombreParticipants, boolean inscription) {
}
