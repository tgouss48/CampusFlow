package com.campusflow.sociale.controller;

import com.campusflow.sociale.dto.ConversationSummaryResponse;
import com.campusflow.sociale.dto.CreateDirectMessageRequest;
import com.campusflow.sociale.dto.CreateMessageRequest;
import com.campusflow.sociale.dto.MessageResponse;
import com.campusflow.sociale.service.SocialeService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sociale")
@RequiredArgsConstructor
public class SocialeController {

    private final SocialeService socialeService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationSummaryResponse>> listConversations() {
        return ResponseEntity.ok(socialeService.listConversations());
    }

    // Conversation non encore creer
    @PostMapping("/direct-messages")
    public ResponseEntity<MessageResponse> sendDirectMessage(@Valid @RequestBody CreateDirectMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(socialeService.sendDirectMessage(request));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<MessageResponse>> listMessages(@PathVariable Long conversationId) {
        return ResponseEntity.ok(socialeService.listMessages(conversationId));
    }

    // Conversation deja cree et on continue l'envoi
    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody CreateMessageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(socialeService.sendMessage(conversationId, request));
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<ConversationSummaryResponse> markConversationAsRead(@PathVariable Long conversationId) {
        return ResponseEntity.ok(socialeService.markConversationAsRead(conversationId));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<Void> deleteConversation(@PathVariable Long conversationId) {
        socialeService.deleteConversation(conversationId);
        return ResponseEntity.noContent().build();
    }
}
