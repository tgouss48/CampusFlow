package com.campusflow.sociale.repository;

import com.campusflow.sociale.entity.ChatMessage;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

        List<ChatMessage> findByConversationIdOrderByCreatedAtAscIdAsc(Long conversationId);

        List<ChatMessage> findByConversationIdAndCreatedAtAfterOrderByCreatedAtAscIdAsc(Long conversationId,
                        LocalDateTime cutoff);

        Optional<ChatMessage> findTopByConversationIdOrderByCreatedAtDescIdDesc(Long conversationId);

        Optional<ChatMessage> findTopByConversationIdAndCreatedAtAfterOrderByCreatedAtDescIdDesc(Long conversationId,
                        LocalDateTime cutoff);

        long countByConversationIdAndCreatedAtAfterAndSenderIdNot(Long conversationId, LocalDateTime createdAt,
                        Long senderId);

        long countByConversationIdAndSenderIdNot(Long conversationId, Long senderId);
}
