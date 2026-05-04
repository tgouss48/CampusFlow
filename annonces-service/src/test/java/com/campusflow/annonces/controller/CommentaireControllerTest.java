package com.campusflow.annonces.controller;

import com.campusflow.annonces.dto.CommentaireCreateRequest;
import com.campusflow.annonces.dto.CommentaireResponse;
import com.campusflow.annonces.entity.enums.AnnonceStatut;
import com.campusflow.annonces.security.JwtService;
import com.campusflow.annonces.service.CommentaireService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CommentaireController.class)
class CommentaireControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CommentaireService commentaireService;

    @MockitoBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    void listCommentaires() throws Exception {
        when(commentaireService.listCommentaires(eq(1L), any())).thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/commentaires").param("annonceId", "1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void addCommentaire() throws Exception {
        CommentaireCreateRequest request = new CommentaireCreateRequest("Contenu", 1L, null);
        CommentaireResponse response = new CommentaireResponse(1L, "Contenu", 1L, "User", 1L, null, 0, AnnonceStatut.ACTIF, LocalDateTime.now(), LocalDateTime.now());

        when(commentaireService.addCommentaire(any())).thenReturn(response);

        mockMvc.perform(post("/api/commentaires")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
