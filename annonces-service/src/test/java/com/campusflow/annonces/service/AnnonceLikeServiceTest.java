package com.campusflow.annonces.service;

import com.campusflow.annonces.dto.LikeToggleResponse;
import com.campusflow.annonces.entity.Annonce;
import com.campusflow.annonces.entity.AnnonceLike;
import com.campusflow.annonces.repository.AnnonceLikeRepository;
import com.campusflow.annonces.repository.AnnonceRepository;
import com.campusflow.annonces.security.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnnonceLikeServiceTest {

    @Mock
    private AnnonceLikeRepository annonceLikeRepository;

    @Mock
    private AnnonceRepository annonceRepository;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private AnnonceLikeService annonceLikeService;

    private Annonce annonce;

    @BeforeEach
    void setUp() {
        annonce = new Annonce();
        annonce.setId(10L);
    }

    @Test
    void toggleLike_AddLike() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(annonceRepository.findById(10L)).thenReturn(Optional.of(annonce));
        when(annonceLikeRepository.existsByAnnonceIdAndOwnerId(10L, 1L)).thenReturn(false);
        when(annonceLikeRepository.countByAnnonceId(10L)).thenReturn(5L);

        LikeToggleResponse response = annonceLikeService.toggleLike(10L);

        assertTrue(response.liked());
        assertEquals(5L, response.likeCount());
        verify(annonceLikeRepository).save(any(AnnonceLike.class));
    }

    @Test
    void toggleLike_RemoveLike() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(annonceRepository.findById(10L)).thenReturn(Optional.of(annonce));
        when(annonceLikeRepository.existsByAnnonceIdAndOwnerId(10L, 1L)).thenReturn(true);
        when(annonceLikeRepository.countByAnnonceId(10L)).thenReturn(4L);

        LikeToggleResponse response = annonceLikeService.toggleLike(10L);

        assertFalse(response.liked());
        assertEquals(4L, response.likeCount());
        verify(annonceLikeRepository).deleteByAnnonceIdAndOwnerId(10L, 1L);
        verify(annonceLikeRepository, never()).save(any(AnnonceLike.class));
    }
}
