package com.agrilink.notification.repository;

import com.agrilink.notification.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Message entity.
 */
@Repository
public interface MessageRepository extends MongoRepository<Message, UUID> {

    Page<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    List<Message> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    Page<Message> findByConversationId(UUID conversationId, Pageable pageable);

    int countByRecipientIdAndIsReadFalse(UUID userId);

    List<Message> findByConversationIdAndRecipientIdAndIsReadFalse(UUID conversationId, UUID userId);

    default Page<Message> findByConversation(UUID conversationId, Pageable pageable) {
        return findByConversationId(conversationId, pageable);
    }

    default int countUnreadByRecipient(UUID userId) {
        return countByRecipientIdAndIsReadFalse(userId);
    }

    default int markConversationAsRead(UUID conversationId, UUID userId) {
        List<Message> unread = findByConversationIdAndRecipientIdAndIsReadFalse(conversationId, userId);
        unread.forEach(Message::markAsRead);
        saveAll(unread);
        return unread.size();
    }

    default List<Message> findUnreadInConversation(UUID conversationId, UUID userId) {
        return findByConversationIdAndRecipientIdAndIsReadFalse(conversationId, userId);
    }
}
