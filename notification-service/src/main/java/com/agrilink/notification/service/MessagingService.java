package com.agrilink.notification.service;

import com.agrilink.common.exception.BadRequestException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.notification.dto.ConversationDto;
import com.agrilink.notification.dto.MessageDto;
import com.agrilink.notification.dto.SendMessageRequest;
import com.agrilink.notification.entity.Conversation;
import com.agrilink.notification.entity.Message;
import com.agrilink.notification.repository.ConversationRepository;
import com.agrilink.notification.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * Service for messaging operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessagingService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserServiceClient userServiceClient;
    private final NotificationService notificationService;

    /**
     * Send a message to another user with role-based validation.
     * 
     * Role-based messaging rules:
     * - CUSTOMER can only message FARMER
     * - FARMER can message CUSTOMER, MANAGER, or ADMIN
     * - MANAGER can only message FARMER
     * - ADMIN can message FARMER or MANAGER
     */
    @Transactional
    public MessageDto sendMessage(UUID senderId, String senderRole, SendMessageRequest request) {
        log.info("User {} (role: {}) sending message to {}", senderId, senderRole, request.getRecipientId());

        if (senderId.equals(request.getRecipientId())) {
            throw new BadRequestException("Cannot send message to yourself");
        }

        // Get recipient's role
        String recipientRole = userServiceClient.getUserRole(request.getRecipientId());
        log.info("Recipient {} has role: {}", request.getRecipientId(), recipientRole);

        // Validate role-based messaging rules
        validateMessagingPermission(senderRole, recipientRole);

        // Find or create conversation
        Conversation conversation = findOrCreateConversation(
                senderId, 
                request.getRecipientId(), 
                request.getListingId(),
                request.getListingTitle()
        );

        // Create message
        Message message = Message.builder()
                .conversation(conversation)
                .senderId(senderId)
                .recipientId(request.getRecipientId())
                .content(request.getContent())
                .messageType(Message.MessageType.TEXT)
                .isRead(false)
                .build();

        message = messageRepository.save(message);

        // Update conversation
        conversation.setLastMessageAt(LocalDateTime.now());
        conversation.setLastMessagePreview(truncateMessage(request.getContent()));
        conversation.incrementUnreadCount(request.getRecipientId());
        conversationRepository.save(conversation);

        log.info("Message sent with id: {}", message.getId());

        // Send notification to recipient
        try {
            String senderName = userServiceClient.getUserName(senderId);
            notificationService.sendNotification(
                    request.getRecipientId(),
                    "New Message from " + senderName,
                    truncateMessage(request.getContent()),
                    "MESSAGE",
                    message.getId().toString()
            );
        } catch (Exception e) {
            log.warn("Failed to send message notification: {}", e.getMessage());
        }

        return mapToMessageDto(message, senderId);
    }

    /**
     * Validate if sender is allowed to message recipient based on their roles.
     */
    private void validateMessagingPermission(String senderRole, String recipientRole) {
        boolean allowed = switch (senderRole.toUpperCase()) {
            case "CUSTOMER", "BUYER" -> 
                // Customer can only message Farmer
                Set.of("FARMER").contains(recipientRole.toUpperCase());
            case "FARMER" -> 
                // Farmer can message Customer, Manager, or Admin
                Set.of("CUSTOMER", "BUYER", "MANAGER", "ADMIN").contains(recipientRole.toUpperCase());
            case "MANAGER" -> 
                // Manager can only message Farmer
                Set.of("FARMER").contains(recipientRole.toUpperCase());
            case "ADMIN" -> 
                // Admin can message Farmer or Manager
                Set.of("FARMER", "MANAGER").contains(recipientRole.toUpperCase());
            default -> false;
        };

        if (!allowed) {
            throw new BadRequestException(
                String.format("Users with role %s cannot send messages to users with role %s", 
                    senderRole, recipientRole)
            );
        }
    }

    /**
     * Send a message (legacy method for backward compatibility).
     */
    @Transactional
    public MessageDto sendMessage(UUID senderId, SendMessageRequest request) {
        // Default to CUSTOMER role if not provided (maintains backward compatibility)
        return sendMessage(senderId, "CUSTOMER", request);
    }

    /**
     * Get user's conversations.
     */
    @Transactional(readOnly = true)
    public Page<ConversationDto> getConversations(UUID userId, Pageable pageable) {
        return conversationRepository.findByParticipant(userId, pageable)
                .map(conv -> mapToConversationDto(conv, userId));
    }

    /**
     * Get messages in a conversation.
     */
    @Transactional(readOnly = true)
    public Page<MessageDto> getMessages(UUID userId, UUID conversationId, Pageable pageable) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conversation.isParticipant(userId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }

        return messageRepository.findByConversation(conversationId, pageable)
                .map(msg -> mapToMessageDto(msg, userId));
    }

    /**
     * Get or create a conversation with another user.
     */
    @Transactional
    public ConversationDto getOrCreateConversation(UUID userId, UUID otherUserId, UUID listingId, String listingTitle) {
        Conversation conversation = findOrCreateConversation(userId, otherUserId, listingId, listingTitle);
        return mapToConversationDto(conversation, userId);
    }

    /**
     * Mark conversation as read.
     */
    @Transactional
    public void markConversationAsRead(UUID userId, UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conversation.isParticipant(userId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }

        messageRepository.markConversationAsRead(conversationId, userId);
        conversation.resetUnreadCount(userId);
        conversationRepository.save(conversation);
    }

    /**
     * Get total unread message count.
     */
    @Transactional(readOnly = true)
    public int getUnreadCount(UUID userId) {
        return conversationRepository.getTotalUnreadCount(userId);
    }

    /**
     * Get conversation by ID.
     */
    @Transactional(readOnly = true)
    public ConversationDto getConversation(UUID userId, UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conversation.isParticipant(userId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }

        return mapToConversationDto(conversation, userId);
    }

    private Conversation findOrCreateConversation(UUID user1, UUID user2, UUID listingId, String listingTitle) {
        // Normalize participant order for consistent lookup
        UUID participant1 = user1.compareTo(user2) < 0 ? user1 : user2;
        UUID participant2 = user1.compareTo(user2) < 0 ? user2 : user1;

        return conversationRepository.findByParticipantsAndListing(participant1, participant2, listingId)
                .orElseGet(() -> {
                    Conversation newConversation = Conversation.builder()
                            .participant1Id(participant1)
                            .participant2Id(participant2)
                            .listingId(listingId)
                            .listingTitle(listingTitle)
                            .participant1UnreadCount(0)
                            .participant2UnreadCount(0)
                            .build();
                    return conversationRepository.save(newConversation);
                });
    }

    private String truncateMessage(String content) {
        if (content == null) return null;
        return content.length() > 100 ? content.substring(0, 100) + "..." : content;
    }

    private ConversationDto mapToConversationDto(Conversation conversation, UUID currentUserId) {
        UUID otherParticipantId = conversation.getOtherParticipant(currentUserId);
        String otherParticipantName = userServiceClient.getUserName(otherParticipantId);
        
        return ConversationDto.builder()
                .id(conversation.getId())
                .otherParticipantId(otherParticipantId)
                .otherParticipantName(otherParticipantName)
                .listingId(conversation.getListingId())
                .listingTitle(conversation.getListingTitle())
                .lastMessagePreview(conversation.getLastMessagePreview())
                .lastMessageAt(conversation.getLastMessageAt())
                .unreadCount(conversation.getUnreadCount(currentUserId))
                .createdAt(conversation.getCreatedAt())
                .build();
    }

    private MessageDto mapToMessageDto(Message message, UUID currentUserId) {
        return MessageDto.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSenderId())
                .recipientId(message.getRecipientId())
                .content(message.getContent())
                .messageType(message.getMessageType())
                .isRead(message.getIsRead())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .isOwn(message.getSenderId().equals(currentUserId))
                .build();
    }
}
