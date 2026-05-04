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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocialeServiceTest {

        @Mock
        private ChatConversationRepository conversationRepository;
        @Mock
        private ChatConversationParticipantRepository participantRepository;
        @Mock
        private ChatMessageRepository messageRepository;
        @Mock
        private CurrentUserProvider currentUserProvider;
        @Mock
        private PresenceService presenceService;
        @Mock
        private SocialStreamService socialStreamService;

        private SocialeService socialeService;

        private JwtAuthenticatedUser currentUser;

        @BeforeEach
        void setUp() {
                socialeService = new SocialeService(
                                conversationRepository,
                                participantRepository,
                                messageRepository,
                                currentUserProvider,
                                presenceService,
                                socialStreamService);

                currentUser = new JwtAuthenticatedUser(1L, java.util.Set.of("ROLE_USER"), "User", "One");

                // Default mocks for internal service calls (presence, summary, etc.)
                lenient().when(currentUserProvider.getRequiredUser()).thenReturn(currentUser);
                lenient().when(presenceService.getPresence(anyLong())).thenReturn(new PresenceResponse(0L, false, null));
                lenient().when(messageRepository.findTopByConversationIdOrderByCreatedAtDescIdDesc(anyLong())).thenReturn(Optional.empty());
                lenient().when(messageRepository.findTopByConversationIdAndCreatedAtAfterOrderByCreatedAtDescIdDesc(anyLong(), any())).thenReturn(Optional.empty());
                lenient().when(messageRepository.countByConversationIdAndSenderIdNot(anyLong(), anyLong())).thenReturn(0L);
                lenient().when(messageRepository.countByConversationIdAndCreatedAtAfterAndSenderIdNot(anyLong(), any(), anyLong())).thenReturn(0L);
        }

        @Test
        void testListConversations() {
                ChatConversation conversation = new ChatConversation();
                conversation.setId(10L);
                conversation.setUpdatedAt(LocalDateTime.now());

                ChatConversationParticipant participant1 = new ChatConversationParticipant();
                participant1.setId(100L);
                participant1.setUserId(1L);
                participant1.setConversation(conversation);

                ChatConversationParticipant participant2 = new ChatConversationParticipant();
                participant2.setId(200L);
                participant2.setUserId(2L);
                participant2.setConversation(conversation);

                conversation.getParticipants().add(participant1);
                conversation.getParticipants().add(participant2);

                when(conversationRepository.findByParticipants_UserIdOrderByUpdatedAtDesc(1L))
                                .thenReturn(List.of(conversation));

                when(presenceService.getPresence(anyLong())).thenReturn(new PresenceResponse(2L, true, null));

                List<ConversationSummaryResponse> result = socialeService.listConversations();

                assertNotNull(result);
                assertEquals(1, result.size());
                assertEquals(10L, result.get(0).id());
        }

        @Test
        void testSendMessage() {
                when(currentUserProvider.getRequiredUser()).thenReturn(currentUser);

                Long conversationId = 10L;
                ChatConversation conversation = new ChatConversation();
                conversation.setId(conversationId);

                ChatConversationParticipant participant1 = new ChatConversationParticipant();
                participant1.setId(100L);
                participant1.setUserId(1L);
                participant1.setConversation(conversation);

                ChatConversationParticipant participant2 = new ChatConversationParticipant();
                participant2.setId(200L);
                participant2.setUserId(2L);
                participant2.setConversation(conversation);

                conversation.getParticipants().add(participant1);
                conversation.getParticipants().add(participant2);

                when(conversationRepository.findWithParticipantsById(conversationId))
                                .thenReturn(Optional.of(conversation));

                ChatMessage savedMessage = new ChatMessage();
                savedMessage.setId(100L);
                savedMessage.setConversation(conversation);
                savedMessage.setSenderId(1L);
                savedMessage.setSenderDisplayName("User One");
                savedMessage.setContent("Hello World");
                savedMessage.setCreatedAt(LocalDateTime.now());

                when(messageRepository.save(any(ChatMessage.class))).thenReturn(savedMessage);

                CreateMessageRequest request = new CreateMessageRequest("Hello World");
                MessageResponse response = socialeService.sendMessage(conversationId, request);

                assertNotNull(response);
                assertEquals(100L, response.id());
                assertEquals("Hello World", response.content());

                verify(messageRepository, times(1)).save(any(ChatMessage.class));
                verify(socialStreamService, atLeastOnce()).sendToUser(eq(1L), any(SocialStreamEvent.class));
        }

        @Test
        void testSendDirectMessage() {
                when(currentUserProvider.getRequiredUser()).thenReturn(currentUser);

                ChatConversation conversation = getChatConversation();

                when(participantRepository.findByUserId(1L)).thenReturn(List.of());
                when(conversationRepository.save(any(ChatConversation.class))).thenReturn(conversation);

                when(conversationRepository.findWithParticipantsById(10L)).thenReturn(Optional.of(conversation));

                ChatMessage savedMessage = new ChatMessage();
                savedMessage.setId(100L);
                savedMessage.setConversation(conversation);
                savedMessage.setSenderId(1L);
                savedMessage.setContent("Hello");
                savedMessage.setCreatedAt(LocalDateTime.now());
                when(messageRepository.save(any())).thenReturn(savedMessage);

                CreateDirectMessageRequest request = new CreateDirectMessageRequest(2L, "User Two", "Hello");
                MessageResponse response = socialeService.sendDirectMessage(request);

                assertNotNull(response);
                assertEquals("Hello", response.content());
                verify(conversationRepository, times(1)).save(any(ChatConversation.class));
        }

        private static ChatConversation getChatConversation() {
                ChatConversation conversation = new ChatConversation();
                conversation.setId(10L);
                ChatConversationParticipant participant1 = new ChatConversationParticipant();
                participant1.setId(100L);
                participant1.setUserId(1L);
                ChatConversationParticipant participant2 = new ChatConversationParticipant();
                participant2.setId(200L);
                participant2.setUserId(2L);
                conversation.setParticipants(new ArrayList<>(List.of(participant1, participant2)));
                return conversation;
        }

        @Test
        void testMarkConversationAsRead() {
                when(currentUserProvider.getRequiredUser()).thenReturn(currentUser);

                Long conversationId = 10L;
                ChatConversation conversation = new ChatConversation();
                conversation.setId(conversationId);

                ChatConversationParticipant participant1 = new ChatConversationParticipant();
                participant1.setId(100L);
                participant1.setUserId(1L);
                participant1.setConversation(conversation);
                conversation.getParticipants().add(participant1);

                when(conversationRepository.findWithParticipantsById(conversationId))
                                .thenReturn(Optional.of(conversation));


                ConversationSummaryResponse response = socialeService.markConversationAsRead(conversationId);

                assertNotNull(response);
                assertNotNull(participant1.getLastReadAt());
                verify(socialStreamService, times(1)).sendToUser(eq(1L), any(SocialStreamEvent.class));
        }

        @Test
        void testDeleteConversation() {
                Long conversationId = 10L;
                ChatConversation conversation = new ChatConversation();
                conversation.setId(conversationId);

                ChatConversationParticipant participant1 = new ChatConversationParticipant();
                participant1.setId(100L);
                participant1.setUserId(1L);
                participant1.setConversation(conversation);

                ChatConversationParticipant participant2 = new ChatConversationParticipant();
                participant2.setId(200L);
                participant2.setUserId(2L);
                participant2.setConversation(conversation);

                conversation.getParticipants().add(participant1);
                conversation.getParticipants().add(participant2);

                when(conversationRepository.findWithParticipantsById(conversationId))
                                .thenReturn(Optional.of(conversation));


                socialeService.deleteConversation(conversationId);

                assertNotNull(participant1.getHiddenAt());
                verify(conversationRepository, never()).delete(any(ChatConversation.class));
                verify(socialStreamService, times(1)).sendToUser(eq(1L), any(SocialStreamEvent.class));
        }
}
