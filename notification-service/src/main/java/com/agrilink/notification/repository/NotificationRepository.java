package com.agrilink.notification.repository;

import com.agrilink.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Notification entity.
 */
@Repository
public interface NotificationRepository extends MongoRepository<Notification, UUID> {

    Page<Notification> findByUserId(UUID userId, Pageable pageable);

    Page<Notification> findByUserIdAndRead(UUID userId, boolean read, Pageable pageable);

    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndReadFalse(UUID userId);

    List<Notification> findByStatus(Notification.Status status);

    List<Notification> findByStatusAndRetryCountLessThan(Notification.Status status, int maxRetries);

    Page<Notification> findByUserIdAndNotificationType(UUID userId, Notification.NotificationType type, Pageable pageable);

    default List<Notification> findByUserIdAndReadFalse(UUID userId) {
        return findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    default long countUnreadByUserId(UUID userId) {
        return countByUserIdAndReadFalse(userId);
    }

    default List<Notification> findFailedNotificationsForRetry(int maxRetries) {
        return findByStatusAndRetryCountLessThan(Notification.Status.FAILED, maxRetries);
    }
}
