package com.agrilink.notification.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a message in a conversation.
 */
@Document(collection = "messages")
@CompoundIndexes({
        @CompoundIndex(name = "idx_messages_conversation_created", def = "{'conversationId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "idx_messages_recipient_read", def = "{'recipientId': 1, 'isRead': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    private UUID conversationId;

    private UUID senderId;

    private UUID recipientId;

    private String content;

    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    @Builder.Default
    private Boolean isRead = false;

    private LocalDateTime readAt;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum MessageType {
        TEXT,
        IMAGE,
        SYSTEM
    }

    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
}
