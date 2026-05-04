package com.campusflow.annonces.service;

import com.campusflow.annonces.dto.CommentaireCreateRequest;
import com.campusflow.annonces.dto.CommentaireResponse;
import com.campusflow.annonces.entity.Annonce;
import com.campusflow.annonces.entity.enums.AnnonceStatut;
import com.campusflow.annonces.entity.Commentaire;
import com.campusflow.annonces.mapper.CommentaireMapper;
import com.campusflow.annonces.repository.AnnonceRepository;
import com.campusflow.annonces.repository.CommentaireRepository;
import com.campusflow.annonces.security.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommentaireServiceTest {

    @Mock
    private AnnonceRepository annonceRepository;
    @Mock
    private CommentaireRepository commentaireRepository;
    @Mock
    private CommentaireMapper commentaireMapper;
    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private CommentaireService commentaireService;

    private Annonce annonce;
    private Commentaire commentaire;

    @BeforeEach
    void setUp() {
        annonce = new Annonce();
        annonce.setId(10L);
        annonce.setStatut(AnnonceStatut.ACTIF);

        commentaire = new Commentaire();
        commentaire.setId(100L);
        commentaire.setAnnonce(annonce);
        commentaire.setOwnerId(1L);
    }

    @Test
    void addCommentaire() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(currentUserService.getCurrentUserDisplayName()).thenReturn("User");
        when(annonceRepository.findById(10L)).thenReturn(Optional.of(annonce));
        when(commentaireRepository.save(any(Commentaire.class))).thenReturn(commentaire);
        
        CommentaireResponse expectedResponse = new CommentaireResponse(100L, "Content", 1L, "User", 10L, null, 0L, AnnonceStatut.ACTIF, java.time.LocalDateTime.now(), java.time.LocalDateTime.now());
        when(commentaireMapper.toResponse(any(), eq(0L))).thenReturn(expectedResponse);

        CommentaireCreateRequest request = new CommentaireCreateRequest("Content", 10L, null);
        CommentaireResponse response = commentaireService.addCommentaire(request);

        assertNotNull(response);
        verify(commentaireRepository).save(any(Commentaire.class));
    }

    @Test
    void deleteCommentaire() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(commentaireRepository.findById(100L)).thenReturn(Optional.of(commentaire));
        when(currentUserService.isCurrentUserAdei()).thenReturn(false);
        when(commentaireRepository.findByParentId(anyLong())).thenReturn(List.of());

        commentaireService.deleteCommentaire(100L);

        verify(commentaireRepository).save(commentaire);
        assertEquals(AnnonceStatut.SUPPRIME, commentaire.getStatut());
    }

    @Test
    void listCommentaires() {
        PageRequest pageable = PageRequest.of(0, 10);
        when(annonceRepository.findById(10L)).thenReturn(Optional.of(annonce));
        when(currentUserService.isCurrentUserAdei()).thenReturn(false);
        when(commentaireRepository.findByAnnonceIdAndParentIsNullAndStatut(10L, AnnonceStatut.ACTIF, pageable))
                .thenReturn(new PageImpl<>(List.of(commentaire)));
        
        CommentaireResponse expectedResponse = new CommentaireResponse(100L, "Content", 1L, "User", 10L, null, 0L, AnnonceStatut.ACTIF, java.time.LocalDateTime.now(), java.time.LocalDateTime.now());
        when(commentaireMapper.toResponse(any(), anyLong())).thenReturn(expectedResponse);
        when(commentaireRepository.countByParentIdAndStatut(anyLong(), eq(AnnonceStatut.ACTIF))).thenReturn(0L);

        Page<CommentaireResponse> result = commentaireService.listCommentaires(10L, pageable);

        assertEquals(1, result.getTotalElements());
    }
}
