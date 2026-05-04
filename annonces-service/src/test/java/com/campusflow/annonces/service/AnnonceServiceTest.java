package com.campusflow.annonces.service;

import com.campusflow.annonces.dto.AnnonceRequest;
import com.campusflow.annonces.dto.AnnonceResponse;
import com.campusflow.annonces.entity.Annonce;
import com.campusflow.annonces.mapper.AnnonceMapper;
import com.campusflow.annonces.repository.AnnonceLikeRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnnonceServiceTest {

    @Mock
    private AnnonceRepository annonceRepository;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private AnnonceMapper annonceMapper;
    @Mock
    private CommentaireRepository commentaireRepository;
    @Mock
    private AnnonceLikeRepository annonceLikeRepository;

    @InjectMocks
    private AnnonceService annonceService;

    private Annonce annonce;

    @BeforeEach
    void setUp() {
        annonce = new Annonce();
        annonce.setId(10L);
        annonce.setOwnerId(1L);
        annonce.setTitre("Test");
        annonce.setStatut(com.campusflow.annonces.entity.enums.AnnonceStatut.ACTIF);
    }

    @Test
    void createAnnonce() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(currentUserService.getCurrentUserDisplayName()).thenReturn("User Test");
        
        when(annonceRepository.save(any(Annonce.class))).thenReturn(annonce);
        
        AnnonceResponse expectedResponse = new AnnonceResponse(
                10L, 
                "Test", 
                "", 
                com.campusflow.annonces.entity.enums.AnnonceType.OFFRE, 
                1L, 
                "User", 
                new com.campusflow.annonces.dto.CategorieResponse("CAT", "Cat"), 
                0L, 
                0L, 
                false, 
                com.campusflow.annonces.entity.enums.AnnonceStatut.ACTIF,
                java.time.LocalDateTime.now()
        );
        when(annonceMapper.toResponse(eq(annonce), eq(0L), eq(0L), eq(false))).thenReturn(expectedResponse);

        AnnonceRequest request = new AnnonceRequest("Test", "Desc", com.campusflow.annonces.entity.enums.AnnonceType.OFFRE, com.campusflow.annonces.entity.enums.CategorieAnnonce.DIVERS);
        AnnonceResponse response = annonceService.createAnnonce(request);

        assertNotNull(response);
        verify(annonceRepository).save(any(Annonce.class));
    }

    @Test
    void deleteAnnonce() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(annonceRepository.findById(10L)).thenReturn(Optional.of(annonce));
        when(currentUserService.isCurrentUserAdei()).thenReturn(false);
        when(commentaireRepository.findByAnnonceId(anyLong())).thenReturn(List.of());

        annonceService.deleteAnnonce(10L);

        verify(annonceRepository).save(annonce);
        assertEquals(com.campusflow.annonces.entity.enums.AnnonceStatut.SUPPRIME, annonce.getStatut());
    }

    @Test
    void listAnnonces() {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Annonce> page = new PageImpl<>(List.of(annonce));
        
        when(currentUserService.isCurrentUserAdei()).thenReturn(true);
        when(annonceRepository.findAll(pageable)).thenReturn(page);
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(annonceLikeRepository.findByOwnerIdAndAnnonceIdIn(anyLong(), any())).thenReturn(List.of());
        
        AnnonceResponse expectedResponse = new AnnonceResponse(10L, "Test", "", com.campusflow.annonces.entity.enums.AnnonceType.OFFRE, 1L, "User", new com.campusflow.annonces.dto.CategorieResponse("CAT", "Cat"), 0L, 0L, false, com.campusflow.annonces.entity.enums.AnnonceStatut.ACTIF, java.time.LocalDateTime.now());
        when(annonceMapper.toResponse(any(), anyLong(), anyLong(), anyBoolean())).thenReturn(expectedResponse);

        Page<AnnonceResponse> result = annonceService.listAnnonces(null, pageable);

        assertEquals(1, result.getTotalElements());
        verify(annonceRepository).findAll(pageable);
    }
}
