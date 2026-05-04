package com.campusflow.annonces.controller;

import com.campusflow.annonces.dto.AnnonceRequest;
import com.campusflow.annonces.dto.AnnonceResponse;
import com.campusflow.annonces.entity.enums.AnnonceStatut;
import com.campusflow.annonces.entity.enums.AnnonceType;
import com.campusflow.annonces.entity.enums.CategorieAnnonce;
import com.campusflow.annonces.security.JwtService;
import com.campusflow.annonces.service.AnnonceLikeService;
import com.campusflow.annonces.service.AnnonceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnnonceController.class)
class AnnonceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnnonceService annonceService;

    @MockitoBean
    private AnnonceLikeService annonceLikeService;

    @MockitoBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    void listAnnonces() throws Exception {
        when(annonceService.listAnnonces(any(), any())).thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/annonces"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void createAnnonce() throws Exception {
        AnnonceRequest request = new AnnonceRequest("Titre", "Desc", AnnonceType.OFFRE, CategorieAnnonce.DIVERS);
        AnnonceResponse response = new AnnonceResponse(1L, "Titre", "Desc", AnnonceType.OFFRE, 1L, "Owner", null, 0, 0, false, AnnonceStatut.ACTIF, LocalDateTime.now());

        when(annonceService.createAnnonce(any())).thenReturn(response);

        mockMvc.perform(post("/api/annonces")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
