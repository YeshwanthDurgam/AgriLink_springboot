package com.agrilink.notification.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a conversation between two users.
 */
@Document(collection = "conversations")
@CompoundIndex(name = "uk_conversation_participants_listing", def = "{'participant1Id': 1, 'participant2Id': 1, 'listingId': 1}", unique = true)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    private UUID participant1Id;

    private UUID participant2Id;

    private UUID listingId;

    private String listingTitle;

    private LocalDateTime lastMessageAt;

    private String lastMessagePreview;

    @Builder.Default
    private Integer participant1UnreadCount = 0;

    @Builder.Default
    private Integer participant2UnreadCount = 0;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public boolean isParticipant(UUID userId) {
        return participant1Id.equals(userId) || participant2Id.equals(userId);
    }

    public UUID getOtherParticipant(UUID userId) {
        return participant1Id.equals(userId) ? participant2Id : participant1Id;
    }

    public int getUnreadCount(UUID userId) {
        return participant1Id.equals(userId) ? (participant1UnreadCount == null ? 0 : participant1UnreadCount)
                : (participant2UnreadCount == null ? 0 : participant2UnreadCount);
    }

    public void incrementUnreadCount(UUID recipientId) {
        if (participant1Id.equals(recipientId)) {
            if (participant1UnreadCount == null) {
                participant1UnreadCount = 0;
            }
            participant1UnreadCount++;
        } else {
            if (participant2UnreadCount == null) {
                participant2UnreadCount = 0;
            }
            participant2UnreadCount++;
        }
    }

    public void resetUnreadCount(UUID userId) {
        if (participant1Id.equals(userId)) {
            participant1UnreadCount = 0;
        } else {
            participant2UnreadCount = 0;
        }
    }
}
