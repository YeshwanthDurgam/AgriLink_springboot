package com.agrilink.notification.service;

import com.agrilink.notification.dto.NotificationDto;
import com.agrilink.notification.dto.SendNotificationRequest;
import com.agrilink.notification.entity.Notification;
import com.agrilink.notification.entity.NotificationPreferences;
import com.agrilink.notification.repository.NotificationPreferencesRepository;
import com.agrilink.notification.repository.NotificationRepository;
import com.agrilink.notification.websocket.NotificationWebSocketHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for NotificationService.
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationPreferencesRepository preferencesRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private SmsService smsService;

    @Mock
    private NotificationWebSocketHandler webSocketHandler;

    @InjectMocks
    private NotificationService notificationService;

    private UUID userId;
    private Notification notification;
    private NotificationPreferences preferences;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        notification = Notification.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .notificationType(Notification.NotificationType.ORDER)
                .channel(Notification.Channel.EMAIL)
                .title("Order Confirmation")
                .message("Your order has been placed")
                .status(Notification.Status.PENDING)
                .read(false)
                .build();

        preferences = NotificationPreferences.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .emailEnabled(true)
                .smsEnabled(false)
                .pushEnabled(true)
                .orderUpdates(true)
                .build();
    }

    @Test
    @DisplayName("Should send notification successfully")
    void shouldSendNotificationSuccessfully() {
        // Given
        SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(userId)
                .email("user@example.com")
                .notificationType(Notification.NotificationType.ORDER)
                .channel(Notification.Channel.EMAIL)
                .title("Order Confirmation")
                .message("Your order has been placed")
                .build();

        when(preferencesRepository.findByUserId(userId)).thenReturn(Optional.of(preferences));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        // When
        NotificationDto result = notificationService.sendNotification(request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Order Confirmation");
        verify(notificationRepository, atLeast(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("Should not send when preferences disabled")
    void shouldNotSendWhenPreferencesDisabled() {
        // Given
        preferences.setEmailEnabled(false);
        
        SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(userId)
                .email("user@example.com")
                .notificationType(Notification.NotificationType.ORDER)
                .channel(Notification.Channel.EMAIL)
                .title("Order Confirmation")
                .message("Your order has been placed")
                .build();

        when(preferencesRepository.findByUserId(userId)).thenReturn(Optional.of(preferences));

        // When
        NotificationDto result = notificationService.sendNotification(request);

        // Then
        assertThat(result).isNull();
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("Should get unread count")
    void shouldGetUnreadCount() {
        // Given
        when(notificationRepository.countUnreadByUserId(userId)).thenReturn(5L);

        // When
        long count = notificationService.getUnreadCount(userId);

        // Then
        assertThat(count).isEqualTo(5L);
    }

    @Test
    @DisplayName("Should mark notification as read")
    void shouldMarkNotificationAsRead() {
        // Given
        when(notificationRepository.findById(notification.getId())).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        // When
        NotificationDto result = notificationService.markAsRead(notification.getId(), userId);

        // Then
        assertThat(result).isNotNull();
        verify(notificationRepository).save(any(Notification.class));
    }
}
