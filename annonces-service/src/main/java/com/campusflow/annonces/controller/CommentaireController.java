package com.campusflow.annonces.controller;

import com.campusflow.annonces.dto.CommentaireCreateRequest;
import com.campusflow.annonces.dto.CommentaireResponse;
import com.campusflow.annonces.dto.CommentaireUpdateRequest;
import com.campusflow.annonces.service.CommentaireService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
@RequestMapping("/api/commentaires")
@RequiredArgsConstructor
public class CommentaireController {

    private final CommentaireService commentaireService;

    @PostMapping
    public ResponseEntity<CommentaireResponse> addCommentaire(@Valid @RequestBody CommentaireCreateRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentaireService.addCommentaire(body));
    }

    @GetMapping
    public ResponseEntity<Page<CommentaireResponse>> listCommentaires(
            @RequestParam("annonceId") Long annonceId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(commentaireService.listCommentaires(annonceId, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentaireResponse> updateCommentaire(
            @PathVariable("id") Long id,
            @Valid @RequestBody CommentaireUpdateRequest body
    ) {
        return ResponseEntity.ok(commentaireService.updateCommentaire(id, body));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCommentaire(@PathVariable("id") Long id) {
        commentaireService.deleteCommentaire(id);
    }

    @GetMapping("/{parentId}/reponses")
    public ResponseEntity<Page<CommentaireResponse>> listReponses(
            @PathVariable("parentId") Long parentId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(commentaireService.listReponses(parentId, pageable));
    }
}
