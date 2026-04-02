package com.agrilink.notification.repository;

import com.agrilink.notification.entity.Notification;
import com.agrilink.notification.entity.NotificationTemplate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for NotificationTemplate entity.
 */
@Repository
public interface NotificationTemplateRepository extends MongoRepository<NotificationTemplate, UUID> {

    Optional<NotificationTemplate> findByTemplateCode(String templateCode);

    List<NotificationTemplate> findByActiveTrue();

    List<NotificationTemplate> findByNotificationTypeAndActiveTrue(Notification.NotificationType type);

    List<NotificationTemplate> findByChannelAndActiveTrue(Notification.Channel channel);

    boolean existsByTemplateCode(String templateCode);
}
