package com.campusflow.sociale.repository;

import com.campusflow.sociale.entity.ChatConversationParticipant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatConversationParticipantRepository extends JpaRepository<ChatConversationParticipant, Long> {

    Optional<ChatConversationParticipant> findByConversationIdAndUserId(Long conversationId, Long userId);

    List<ChatConversationParticipant> findByUserId(Long userId);

}
