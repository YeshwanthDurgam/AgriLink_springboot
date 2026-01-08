package com.agrilink.notification.repository;

import com.agrilink.notification.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Message entity.
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    Page<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    List<Message> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC")
    Page<Message> findByConversation(@Param("conversationId") UUID conversationId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipientId = :userId AND m.isRead = false")
    int countUnreadByRecipient(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = CURRENT_TIMESTAMP " +
           "WHERE m.conversation.id = :conversationId AND m.recipientId = :userId AND m.isRead = false")
    int markConversationAsRead(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.recipientId = :userId AND m.isRead = false")
    List<Message> findUnreadInConversation(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
}
