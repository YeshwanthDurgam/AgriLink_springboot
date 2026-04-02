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
 * Notification Template entity.
 */
@Document(collection = "notification_templates")
@CompoundIndex(name = "idx_notification_templates_code", def = "{'templateCode': 1}", unique = true)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationTemplate {

    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    private String templateCode;

    private Notification.NotificationType notificationType;

    private Notification.Channel channel;

    private String titleTemplate;

    private String bodyTemplate;

    private String description;

    @Builder.Default
    private boolean active = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
