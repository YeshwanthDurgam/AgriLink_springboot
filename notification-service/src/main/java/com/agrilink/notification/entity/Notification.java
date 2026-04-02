package com.agrilink.notification.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Notification entity.
 */
@Document(collection = "notifications")
@CompoundIndexes({
        @CompoundIndex(name = "idx_notifications_user_status", def = "{'userId': 1, 'status': 1}"),
        @CompoundIndex(name = "idx_notifications_user_read", def = "{'userId': 1, 'read': 1}"),
        @CompoundIndex(name = "idx_notifications_status_retry", def = "{'status': 1, 'retryCount': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    private UUID userId;

    private NotificationType notificationType;

    private Channel channel;

    private String title;

    private String message;

    private String recipientEmail;

    private String recipientPhone;

    private Map<String, Object> data;

    @Builder.Default
    private Status status = Status.PENDING;

    @Builder.Default
    private boolean read = false;

    private LocalDateTime readAt;

    private LocalDateTime sentAt;

    private LocalDateTime failedAt;

    private String failureReason;

    @Builder.Default
    private int retryCount = 0;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum NotificationType {
        ORDER,
        LISTING,
        MESSAGE,
        IOT,
        WEATHER,
        SYSTEM,
        MARKETING
    }

    public enum Channel {
        EMAIL,
        SMS,
        PUSH,
        IN_APP
    }

    public enum Status {
        PENDING,
        SENDING,
        SENT,
        FAILED,
        CANCELLED
    }
}
