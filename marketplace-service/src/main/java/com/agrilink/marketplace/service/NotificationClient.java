package com.agrilink.marketplace.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationClient {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final WebClient notificationServiceWebClient;

    public void sendInAppListingNotification(
            java.util.UUID sellerId,
            String title,
            String message,
            Map<String, Object> data
    ) {
        try {
            Map<String, Object> payload = Map.of(
                    "userId", sellerId,
                    "notificationType", "LISTING",
                    "channel", "IN_APP",
                    "title", title,
                    "message", message,
                    "data", data == null ? Map.of() : data
            );

            notificationServiceWebClient
                    .post()
                    .uri("/api/v1/notifications/send")
                    .bodyValue(payload)
                    .retrieve()
                    .toBodilessEntity()
                    .timeout(TIMEOUT)
                    .block();
        } catch (Exception ex) {
            log.warn("Failed to send listing notification to seller {}: {}", sellerId, ex.getMessage());
        }
    }
}
