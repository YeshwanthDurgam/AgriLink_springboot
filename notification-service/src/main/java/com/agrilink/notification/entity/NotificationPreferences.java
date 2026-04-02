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
 * Notification Preferences entity.
 */
@Document(collection = "notification_preferences")
@CompoundIndex(name = "idx_notification_preferences_user", def = "{'userId': 1}", unique = true)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferences {

    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    private UUID userId;

    @Builder.Default
    private boolean emailEnabled = true;

    @Builder.Default
    private boolean smsEnabled = false;

    @Builder.Default
    private boolean pushEnabled = true;

    @Builder.Default
    private boolean orderUpdates = true;

    @Builder.Default
    private boolean listingUpdates = true;

    @Builder.Default
    private boolean priceAlerts = true;

    @Builder.Default
    private boolean weatherAlerts = true;

    @Builder.Default
    private boolean iotAlerts = true;

    @Builder.Default
    private boolean marketing = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
