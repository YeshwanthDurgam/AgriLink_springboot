package com.agrilink.notification.service;

import com.agrilink.notification.entity.Notification;
import com.agrilink.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Periodically retries failed notifications within retry policy limits.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationRetryScheduler {

    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Value("${notification.retry.enabled:true}")
    private boolean retryEnabled;

    @Value("${notification.retry.max-retries:5}")
    private int maxRetries;

    @Scheduled(fixedDelayString = "${notification.retry.interval-ms:60000}")
    public void retryFailedNotifications() {
        if (!retryEnabled) {
            return;
        }

        List<Notification> failed = notificationRepository.findFailedNotificationsForRetry(maxRetries);
        if (failed.isEmpty()) {
            return;
        }

        int attempted = 0;
        for (Notification notification : failed) {
            String reason = notification.getFailureReason() == null ? "" : notification.getFailureReason();
            if (reason.startsWith("DESTINATION_MISSING")) {
                continue;
            }
            try {
                notificationService.retryNotification(notification.getId());
                attempted++;
            } catch (Exception ex) {
                log.warn("Retry attempt failed for notification {}: {}", notification.getId(), ex.getMessage());
            }
        }

        if (attempted > 0) {
            log.info("Retried {} failed notifications", attempted);
        }
    }
}
