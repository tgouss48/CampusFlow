package com.campusflow.annonces.controller;

import com.campusflow.annonces.dto.AnnonceRequest;
import com.campusflow.annonces.dto.AnnonceResponse;
import com.campusflow.annonces.dto.LikeToggleResponse;
import com.campusflow.annonces.entity.enums.AnnonceStatut;
import com.campusflow.annonces.service.AnnonceLikeService;
import com.campusflow.annonces.service.AnnonceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/annonces")
@RequiredArgsConstructor
public class AnnonceController {

    private final AnnonceService annonceService;
    private final AnnonceLikeService annonceLikeService;

    @GetMapping
    public ResponseEntity<Page<AnnonceResponse>> listAnnonces(
            @RequestParam(value = "statut", required = false) AnnonceStatut statut,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(annonceService.listAnnonces(statut, pageable));
    }

    @PostMapping
    public ResponseEntity<AnnonceResponse> createAnnonce(@Valid @RequestBody AnnonceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(annonceService.createAnnonce(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnnonceResponse> updateAnnonce(
            @PathVariable("id") Long id,
            @Valid @RequestBody AnnonceRequest request
    ) {
        return ResponseEntity.ok(annonceService.updateAnnonce(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAnnonce(@PathVariable("id") Long id) {
        annonceService.deleteAnnonce(id);
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<LikeToggleResponse> toggleLikeAnnonce(@PathVariable("id") Long id) {
        return ResponseEntity.ok(annonceLikeService.toggleLike(id));
    }
}
