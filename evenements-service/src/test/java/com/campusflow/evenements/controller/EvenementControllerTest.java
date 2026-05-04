package com.campusflow.evenements.controller;

import com.campusflow.evenements.dto.EvenementRequest;
import com.campusflow.evenements.dto.EvenementResponse;
import com.campusflow.evenements.entity.enums.EvenementStatut;
import com.campusflow.evenements.security.CurrentUserProvider;
import com.campusflow.evenements.security.JwtAuthenticatedUser;
import com.campusflow.evenements.security.JwtService;
import com.campusflow.evenements.service.EvenementService;
import com.campusflow.evenements.service.NotificationService;
import com.campusflow.evenements.service.ParticipationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = EvenementController.class)
@AutoConfigureMockMvc(addFilters = false)
class EvenementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EvenementService evenementService;

    @MockitoBean
    private ParticipationService participationService;

    @MockitoBean
    private NotificationService notificationService;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @MockitoBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void listerEvenements() throws Exception {
        JwtAuthenticatedUser user = new JwtAuthenticatedUser(1L, Set.of("USER"), "First", "Last");
        when(currentUserProvider.getRequiredUser()).thenReturn(user);
        when(evenementService.listerEvenements(anyLong(), any())).thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/evenements"))
                .andExpect(status().isOk());
    }

    @Test
    void creerEvenement() throws Exception {
        JwtAuthenticatedUser user = new JwtAuthenticatedUser(1L, Set.of("ADEI"), "First", "Last");
        when(currentUserProvider.getRequiredUser()).thenReturn(user);

        EvenementRequest request = EvenementRequest.builder()
                .titre("Titre")
                .description("Desc")
                .lieu("Lieu")
                .dateDebut(LocalDateTime.now().plusDays(1))
                .dateFin(LocalDateTime.now().plusDays(2))
                .capaciteMax(100)
                .build();

        EvenementResponse response = EvenementResponse.builder()
                .id(1L)
                .titre("Titre")
                .description("Desc")
                .lieu("Lieu")
                .dateDebut(LocalDateTime.now().plusDays(1))
                .dateFin(LocalDateTime.now().plusDays(2))
                .statut(EvenementStatut.A_VENIR)
                .capaciteMax(100)
                .nombreParticipants(0L)
                .isParticipating(false)
                .previewParticipants(Collections.emptyList())
                .build();

        when(evenementService.creerEvenement(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/evenements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
