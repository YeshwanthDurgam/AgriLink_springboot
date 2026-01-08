package com.agrilink.notification.service;

import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.notification.dto.*;
import com.agrilink.notification.entity.Notification;
import com.agrilink.notification.entity.NotificationPreferences;
import com.agrilink.notification.entity.NotificationTemplate;
import com.agrilink.notification.repository.NotificationPreferencesRepository;
import com.agrilink.notification.repository.NotificationRepository;
import com.agrilink.notification.repository.NotificationTemplateRepository;
import com.agrilink.notification.websocket.NotificationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for notification operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationTemplateRepository templateRepository;
    private final NotificationPreferencesRepository preferencesRepository;
    private final EmailService emailService;
    private final SmsService smsService;
    private final NotificationWebSocketHandler webSocketHandler;

    /**
     * Send a notification.
     */
    @Transactional
    public NotificationDto sendNotification(SendNotificationRequest request) {
        log.info("Sending notification to user: {}", request.getUserId());

        // Check user preferences
        NotificationPreferences preferences = preferencesRepository.findByUserId(request.getUserId())
                .orElse(createDefaultPreferences(request.getUserId()));

        if (!shouldSend(preferences, request.getNotificationType(), request.getChannel())) {
            log.info("Notification not sent due to user preferences");
            return null;
        }

        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .notificationType(request.getNotificationType())
                .channel(request.getChannel())
                .title(request.getTitle())
                .message(request.getMessage())
                .data(request.getData())
                .status(Notification.Status.PENDING)
                .build();

        notification = notificationRepository.save(notification);

        // Send via appropriate channel
        sendViaChannel(notification, request.getEmail(), request.getPhone());
        
        // Push via WebSocket for real-time delivery
        NotificationDto dto = mapToDto(notification);
        webSocketHandler.sendNotificationToUser(request.getUserId(), dto);

        return dto;
    }

    /**
     * Send notification using a template.
     */
    @Transactional
    public NotificationDto sendTemplateNotification(SendTemplateNotificationRequest request) {
        log.info("Sending template notification {} to user: {}", request.getTemplateCode(), request.getUserId());

        NotificationTemplate template = templateRepository.findByTemplateCode(request.getTemplateCode())
                .orElseThrow(() -> new ResourceNotFoundException("Template", "code", request.getTemplateCode()));

        String title = processTemplate(template.getTitleTemplate(), request.getVariables());
        String message = processTemplate(template.getBodyTemplate(), request.getVariables());

        SendNotificationRequest notificationRequest = SendNotificationRequest.builder()
                .userId(request.getUserId())
                .email(request.getEmail())
                .phone(request.getPhone())
                .notificationType(template.getNotificationType())
                .channel(template.getChannel())
                .title(title)
                .message(message)
                .build();

        return sendNotification(notificationRequest);
    }

    /**
     * Get user notifications.
     */
    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable).map(this::mapToDto);
    }

    /**
     * Get unread notifications.
     */
    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotifications(UUID userId) {
        return notificationRepository.findByUserIdAndReadFalse(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get unread count.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    /**
     * Mark notification as read.
     */
    @Transactional
    public NotificationDto markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Notification", "id", notificationId);
        }

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notification = notificationRepository.save(notification);

        return mapToDto(notification);
    }

    /**
     * Mark all notifications as read.
     */
    @Transactional
    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(userId);
        LocalDateTime now = LocalDateTime.now();

        unread.forEach(n -> {
            n.setRead(true);
            n.setReadAt(now);
        });

        notificationRepository.saveAll(unread);
    }

    /**
     * Get user notification preferences.
     */
    @Transactional(readOnly = true)
    public NotificationPreferencesDto getPreferences(UUID userId) {
        NotificationPreferences preferences = preferencesRepository.findByUserId(userId)
                .orElse(createDefaultPreferences(userId));
        return mapPreferencesToDto(preferences);
    }

    /**
     * Update notification preferences.
     */
    @Transactional
    public NotificationPreferencesDto updatePreferences(UUID userId, UpdatePreferencesRequest request) {
        NotificationPreferences preferences = preferencesRepository.findByUserId(userId)
                .orElse(createDefaultPreferences(userId));

        if (request.getEmailEnabled() != null) preferences.setEmailEnabled(request.getEmailEnabled());
        if (request.getSmsEnabled() != null) preferences.setSmsEnabled(request.getSmsEnabled());
        if (request.getPushEnabled() != null) preferences.setPushEnabled(request.getPushEnabled());
        if (request.getOrderUpdates() != null) preferences.setOrderUpdates(request.getOrderUpdates());
        if (request.getListingUpdates() != null) preferences.setListingUpdates(request.getListingUpdates());
        if (request.getPriceAlerts() != null) preferences.setPriceAlerts(request.getPriceAlerts());
        if (request.getWeatherAlerts() != null) preferences.setWeatherAlerts(request.getWeatherAlerts());
        if (request.getIotAlerts() != null) preferences.setIotAlerts(request.getIotAlerts());
        if (request.getMarketing() != null) preferences.setMarketing(request.getMarketing());

        preferences = preferencesRepository.save(preferences);
        return mapPreferencesToDto(preferences);
    }

    @Async
    protected void sendViaChannel(Notification notification, String email, String phone) {
        try {
            notification.setStatus(Notification.Status.SENDING);
            notificationRepository.save(notification);

            switch (notification.getChannel()) {
                case EMAIL -> {
                    if (email != null) {
                        emailService.sendEmail(email, notification.getTitle(), notification.getMessage());
                    }
                }
                case SMS -> {
                    if (phone != null) {
                        smsService.sendSms(phone, notification.getMessage());
                    }
                }
                case PUSH, IN_APP -> {
                    // Push notifications would integrate with Firebase/APNs
                    log.info("Push/In-app notification queued for user: {}", notification.getUserId());
                }
            }

            notification.setStatus(Notification.Status.SENT);
            notification.setSentAt(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
            notification.setStatus(Notification.Status.FAILED);
            notification.setFailedAt(LocalDateTime.now());
            notification.setFailureReason(e.getMessage());
            notification.setRetryCount(notification.getRetryCount() + 1);
        }

        notificationRepository.save(notification);
    }

    private boolean shouldSend(NotificationPreferences prefs, Notification.NotificationType type, Notification.Channel channel) {
        // Check channel preference
        boolean channelEnabled = switch (channel) {
            case EMAIL -> prefs.isEmailEnabled();
            case SMS -> prefs.isSmsEnabled();
            case PUSH, IN_APP -> prefs.isPushEnabled();
        };

        if (!channelEnabled) return false;

        // Check notification type preference
        return switch (type) {
            case ORDER -> prefs.isOrderUpdates();
            case LISTING -> prefs.isListingUpdates();
            case IOT -> prefs.isIotAlerts();
            case WEATHER -> prefs.isWeatherAlerts();
            case MARKETING -> prefs.isMarketing();
            default -> true;
        };
    }

    private String processTemplate(String template, Map<String, String> variables) {
        if (variables == null) return template;

        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("#{" + entry.getKey() + "}", entry.getValue());
        }
        return result;
    }

    private NotificationPreferences createDefaultPreferences(UUID userId) {
        return NotificationPreferences.builder()
                .userId(userId)
                .emailEnabled(true)
                .smsEnabled(false)
                .pushEnabled(true)
                .orderUpdates(true)
                .listingUpdates(true)
                .priceAlerts(true)
                .weatherAlerts(true)
                .iotAlerts(true)
                .marketing(false)
                .build();
    }

    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .notificationType(notification.getNotificationType())
                .channel(notification.getChannel())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .data(notification.getData())
                .status(notification.getStatus())
                .read(notification.isRead())
                .readAt(notification.getReadAt())
                .sentAt(notification.getSentAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    private NotificationPreferencesDto mapPreferencesToDto(NotificationPreferences prefs) {
        return NotificationPreferencesDto.builder()
                .id(prefs.getId())
                .userId(prefs.getUserId())
                .emailEnabled(prefs.isEmailEnabled())
                .smsEnabled(prefs.isSmsEnabled())
                .pushEnabled(prefs.isPushEnabled())
                .orderUpdates(prefs.isOrderUpdates())
                .listingUpdates(prefs.isListingUpdates())
                .priceAlerts(prefs.isPriceAlerts())
                .weatherAlerts(prefs.isWeatherAlerts())
                .iotAlerts(prefs.isIotAlerts())
                .marketing(prefs.isMarketing())
                .build();
    }
}
