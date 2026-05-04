package com.campusflow.sociale.repository;

import com.campusflow.sociale.entity.ChatConversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    @EntityGraph(attributePaths = {"participants"})
    List<ChatConversation> findByParticipants_UserIdOrderByUpdatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"participants"})
    Optional<ChatConversation> findWithParticipantsById(Long id);

}
