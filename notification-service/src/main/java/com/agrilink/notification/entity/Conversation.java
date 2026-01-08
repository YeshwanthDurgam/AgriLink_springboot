package com.agrilink.notification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entity representing a conversation between two users.
 */
@Entity
@Table(name = "conversations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"participant1_id", "participant2_id", "listing_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "participant1_id", nullable = false)
    private UUID participant1Id;

    @Column(name = "participant2_id", nullable = false)
    private UUID participant2Id;

    @Column(name = "listing_id")
    private UUID listingId;

    @Column(name = "listing_title")
    private String listingTitle;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "last_message_preview")
    private String lastMessagePreview;

    @Column(name = "participant1_unread_count")
    @Builder.Default
    private Integer participant1UnreadCount = 0;

    @Column(name = "participant2_unread_count")
    @Builder.Default
    private Integer participant2UnreadCount = 0;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isParticipant(UUID userId) {
        return participant1Id.equals(userId) || participant2Id.equals(userId);
    }

    public UUID getOtherParticipant(UUID userId) {
        return participant1Id.equals(userId) ? participant2Id : participant1Id;
    }

    public int getUnreadCount(UUID userId) {
        return participant1Id.equals(userId) ? participant1UnreadCount : participant2UnreadCount;
    }

    public void incrementUnreadCount(UUID recipientId) {
        if (participant1Id.equals(recipientId)) {
            participant1UnreadCount++;
        } else {
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
