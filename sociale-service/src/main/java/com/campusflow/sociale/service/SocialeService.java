package com.campusflow.sociale.service;

import com.campusflow.sociale.dto.*;
import com.campusflow.sociale.entity.ChatConversation;
import com.campusflow.sociale.entity.ChatConversationParticipant;
import com.campusflow.sociale.entity.ChatMessage;
import com.campusflow.sociale.repository.ChatConversationParticipantRepository;
import com.campusflow.sociale.repository.ChatConversationRepository;
import com.campusflow.sociale.repository.ChatMessageRepository;
import com.campusflow.sociale.security.CurrentUserProvider;
import com.campusflow.sociale.security.JwtAuthenticatedUser;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SocialeService {

        private final ChatConversationRepository conversationRepository;
        private final ChatConversationParticipantRepository participantRepository;
        private final ChatMessageRepository messageRepository;
        private final CurrentUserProvider currentUserProvider;
        private final PresenceService presenceService;
        private final SocialStreamService socialStreamService;

        public SocialeService(
                        ChatConversationRepository conversationRepository,
                        ChatConversationParticipantRepository participantRepository,
                        ChatMessageRepository messageRepository,
                        CurrentUserProvider currentUserProvider,
                        PresenceService presenceService,
                        SocialStreamService socialStreamService) {
                this.conversationRepository = conversationRepository;
                this.participantRepository = participantRepository;
                this.messageRepository = messageRepository;
                this.currentUserProvider = currentUserProvider;
                this.presenceService = presenceService;
                this.socialStreamService = socialStreamService;
        }

        @Transactional
        public List<ConversationSummaryResponse> listConversations() {
                JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
                return conversationRepository.findByParticipants_UserIdOrderByUpdatedAtDesc(currentUser.userId())
                                .stream()
                                .filter(conversation -> isVisibleForUser(conversation, currentUser.userId()))
                                .sorted(Comparator.comparing(ChatConversation::getUpdatedAt).reversed())
                                .map(conversation -> toConversationSummary(conversation, currentUser.userId()))
                                .toList();
        }

        @Transactional
        public MessageResponse sendDirectMessage(CreateDirectMessageRequest request) {
                JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
                ChatConversation conversation = findOrCreateDirectConversation(
                                currentUser,
                                request.participantId(),
                                request.participantDisplayName());
                return sendMessage(conversation.getId(), new CreateMessageRequest(request.content()));
        }

        @Transactional
        public List<MessageResponse> listMessages(Long conversationId) {
                JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
                ChatConversationParticipant participant = participantRepository
                                .findByConversationIdAndUserId(conversationId, currentUser.userId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "Conversation inaccessible"));

                List<ChatMessage> messages;
                if (participant.getHistoryCutoffAt() != null) {
                        messages = messageRepository.findByConversationIdAndCreatedAtAfterOrderByCreatedAtAscIdAsc(
                                        conversationId, participant.getHistoryCutoffAt());
                } else {
                        messages = messageRepository.findByConversationIdOrderByCreatedAtAscIdAsc(conversationId);
                }

                return messages.stream()
                                .map(message -> toMessageResponse(message, currentUser.userId()))
                                .toList();
        }

        @Transactional
        public MessageResponse sendMessage(Long conversationId, CreateMessageRequest request) {
                JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
                ChatConversation conversation = loadConversationForUser(conversationId, currentUser.userId());

                ChatMessage message = new ChatMessage();
                message.setConversation(conversation);
                message.setSenderId(currentUser.userId());
                message.setSenderDisplayName(buildDisplayName(currentUser.firstName(), currentUser.lastName()));
                message.setContent(request.content().trim());
                ChatMessage savedMessage = messageRepository.save(message);

                ChatConversationParticipant senderParticipant = conversation.getParticipants().stream()
                                .filter(p -> p.getUserId().equals(currentUser.userId()))
                                .findFirst()
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "Conversation inaccessible"));

                senderParticipant.setLastReadAt(savedMessage.getCreatedAt());
                senderParticipant.setHiddenAt(null);
                conversation.setUpdatedAt(savedMessage.getCreatedAt());

                MessageResponse response = toMessageResponse(savedMessage, currentUser.userId());
                ConversationSummaryResponse summary = toConversationSummary(conversation, currentUser.userId());

                socialStreamService.sendToUser(currentUser.userId(),
                                new SocialStreamEvent("message.created", response));
                socialStreamService.sendToUser(currentUser.userId(),
                                new SocialStreamEvent("conversation.updated", summary));

                conversation.getParticipants().stream()
                                .filter(participant -> !participant.getUserId().equals(currentUser.userId()))
                                .forEach(participant -> {
                                        participant.setHiddenAt(null);
                                        socialStreamService.sendToUser(participant.getUserId(), new SocialStreamEvent(
                                                        "message.created",
                                                        toMessageResponse(savedMessage, participant.getUserId())));
                                        socialStreamService.sendToUser(participant.getUserId(), new SocialStreamEvent(
                                                        "conversation.updated",
                                                        toConversationSummary(conversation, participant.getUserId())));
                                });

                return response;
        }

        @Transactional
        public ConversationSummaryResponse markConversationAsRead(Long conversationId) {
                JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
                ChatConversation conversation = loadConversationForUser(conversationId, currentUser.userId());

                ChatConversationParticipant participant = conversation.getParticipants().stream()
                                .filter(p -> p.getUserId().equals(currentUser.userId()))
                                .findFirst()
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "Conversation inaccessible"));
                participant.setLastReadAt(LocalDateTime.now());

                ConversationSummaryResponse summary = toConversationSummary(conversation, currentUser.userId());
                socialStreamService.sendToUser(currentUser.userId(),
                                new SocialStreamEvent("conversation.updated", summary));
                return summary;
        }

        @Transactional
        public void deleteConversation(Long conversationId) {
                JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
                ChatConversation conversation = loadConversationForUser(conversationId, currentUser.userId());
                ChatConversationParticipant participant = conversation.getParticipants().stream()
                                .filter(p -> p.getUserId().equals(currentUser.userId()))
                                .findFirst()
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "Conversation inaccessible"));
                participant.setHiddenAt(LocalDateTime.now());
                participant.setHistoryCutoffAt(LocalDateTime.now());

                socialStreamService.sendToUser(
                                currentUser.userId(),
                                new SocialStreamEvent("conversation.deleted",
                                                Map.of("conversationId", conversationId)));
        }

        private ChatConversation findOrCreateDirectConversation(
                        JwtAuthenticatedUser currentUser,
                        Long participantId,
                        String participantDisplayName) {
                if (Objects.equals(currentUser.userId(), participantId)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Vous ne pouvez pas creer une conversation avec vous-meme");
                }

                List<ChatConversationParticipant> candidateParticipants = participantRepository
                                .findByUserId(currentUser.userId());
                Optional<ChatConversation> existingConversation = candidateParticipants.stream()
                                .map(ChatConversationParticipant::getConversation)
                                .filter(c -> c.getParticipants().size() == 2)
                                .filter(c -> c.getParticipants().stream()
                                                .anyMatch(p -> p.getUserId().equals(participantId)))
                                .findFirst();

                if (existingConversation.isPresent()) {
                        existingConversation.get().getParticipants().stream()
                                        .filter(participant -> participant.getUserId().equals(currentUser.userId()))
                                        .findFirst()
                                        .ifPresent(participant -> participant.setHiddenAt(null));
                        return existingConversation.get();
                }

                ChatConversation conversation = new ChatConversation();

                ChatConversationParticipant currentParticipant = new ChatConversationParticipant();
                currentParticipant.setConversation(conversation);
                currentParticipant.setUserId(currentUser.userId());
                currentParticipant.setDisplayName(buildDisplayName(currentUser.firstName(), currentUser.lastName()));

                ChatConversationParticipant targetParticipant = new ChatConversationParticipant();
                targetParticipant.setConversation(conversation);
                targetParticipant.setUserId(participantId);
                targetParticipant.setDisplayName(resolveParticipantDisplayName(participantDisplayName, participantId));

                conversation.getParticipants().add(currentParticipant);
                conversation.getParticipants().add(targetParticipant);
                return conversationRepository.save(conversation);
        }

        private ChatConversation loadConversationForUser(Long conversationId, Long userId) {
                ChatConversation conversation = conversationRepository.findWithParticipantsById(conversationId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Conversation introuvable"));
                boolean member = conversation.getParticipants().stream()
                                .anyMatch(participant -> participant.getUserId().equals(userId));
                if (!member) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation inaccessible");
                }
                return conversation;
        }

        private ConversationSummaryResponse toConversationSummary(ChatConversation conversation, Long viewerId) {
                ChatConversationParticipant viewerParticipant = conversation.getParticipants().stream()
                                .filter(participant -> participant.getUserId().equals(viewerId))
                                .findFirst()
                                .orElse(null);

                Optional<ChatMessage> lastMessageOpt;
                if (viewerParticipant != null && viewerParticipant.getHistoryCutoffAt() != null) {
                        lastMessageOpt = messageRepository
                                        .findTopByConversationIdAndCreatedAtAfterOrderByCreatedAtDescIdDesc(
                                                        conversation.getId(), viewerParticipant.getHistoryCutoffAt());
                } else {
                        lastMessageOpt = messageRepository
                                        .findTopByConversationIdOrderByCreatedAtDescIdDesc(conversation.getId());
                }

                MessageResponse lastMessage = lastMessageOpt
                                .map(message -> toMessageResponse(message, viewerId))
                                .orElse(null);

                List<ParticipantResponse> participants = conversation.getParticipants().stream()
                                .sorted(Comparator.comparing(ChatConversationParticipant::getId))
                                .map(this::toParticipantResponse)
                                .toList();

                long unreadCount = viewerParticipant == null
                                ? 0
                                : countUnreadMessages(conversation.getId(), viewerParticipant);

                return new ConversationSummaryResponse(
                                conversation.getId(),
                                participants,
                                lastMessage,
                                unreadCount,
                                conversation.getUpdatedAt());
        }

        private boolean isVisibleForUser(ChatConversation conversation, Long userId) {
                return conversation.getParticipants().stream()
                                .filter(participant -> participant.getUserId().equals(userId))
                                .findFirst()
                                .map(participant -> participant.getHiddenAt() == null)
                                .orElse(false);
        }

        private long countUnreadMessages(Long conversationId, ChatConversationParticipant participant) {
                LocalDateTime effectiveCutoff = participant.getLastReadAt();
                if (participant.getHistoryCutoffAt() != null) {
                        if (effectiveCutoff == null || participant.getHistoryCutoffAt().isAfter(effectiveCutoff)) {
                                effectiveCutoff = participant.getHistoryCutoffAt();
                        }
                }

                if (effectiveCutoff == null) {
                        return messageRepository.countByConversationIdAndSenderIdNot(conversationId,
                                        participant.getUserId());
                }
                return messageRepository.countByConversationIdAndCreatedAtAfterAndSenderIdNot(
                                conversationId,
                                effectiveCutoff,
                                participant.getUserId());
        }

        private ParticipantResponse toParticipantResponse(ChatConversationParticipant participant) {
                PresenceResponse presence = presenceService.getPresence(participant.getUserId());
                return new ParticipantResponse(
                                participant.getUserId(),
                                participant.getDisplayName(),
                                presence.online(),
                                presence.lastSeenAt(),
                                participant.getLastReadAt());
        }

        private MessageResponse toMessageResponse(ChatMessage message, Long viewerId) {
                return new MessageResponse(
                                message.getId(),
                                message.getConversation().getId(),
                                message.getSenderId(),
                                message.getSenderDisplayName(),
                                message.getContent(),
                                message.getCreatedAt(),
                                Objects.equals(message.getSenderId(), viewerId));
        }

        private String buildDisplayName(String firstName, String lastName) {
                String displayName = ((firstName == null ? "" : firstName.trim()) + " "
                                + (lastName == null ? "" : lastName.trim())).trim();
                return displayName.isBlank() ? "Utilisateur" : displayName;
        }

        private String resolveParticipantDisplayName(String providedDisplayName, Long participantId) {
                if (providedDisplayName != null && !providedDisplayName.trim().isBlank()) {
                        return providedDisplayName.trim();
                }
                return "Utilisateur #" + participantId;
        }
}
