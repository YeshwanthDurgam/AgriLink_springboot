package com.agrilink.notification.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.common.dto.PagedResponse;
import com.agrilink.notification.dto.ConversationDto;
import com.agrilink.notification.dto.MessageDto;
import com.agrilink.notification.dto.SendMessageRequest;
import com.agrilink.notification.service.MessagingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for messaging operations.
 */
@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService messagingService;

    /**
     * Send a message
     */
    @PostMapping
    public ResponseEntity<ApiResponse<MessageDto>> sendMessage(
            Authentication authentication,
            @Valid @RequestBody SendMessageRequest request) {
        UUID senderId = extractUserId(authentication);
        MessageDto message = messagingService.sendMessage(senderId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent", message));
    }

    /**
     * Get user's conversations
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<PagedResponse<ConversationDto>>> getConversations(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID userId = extractUserId(authentication);
        Pageable pageable = PageRequest.of(page, size);
        Page<ConversationDto> conversations = messagingService.getConversations(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(conversations)));
    }

    /**
     * Get a specific conversation
     */
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<ConversationDto>> getConversation(
            Authentication authentication,
            @PathVariable UUID conversationId) {
        UUID userId = extractUserId(authentication);
        ConversationDto conversation = messagingService.getConversation(userId, conversationId);
        return ResponseEntity.ok(ApiResponse.success(conversation));
    }

    /**
     * Get or create conversation with a user
     */
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationDto>> getOrCreateConversation(
            Authentication authentication,
            @RequestParam UUID otherUserId,
            @RequestParam(required = false) UUID listingId,
            @RequestParam(required = false) String listingTitle) {
        UUID userId = extractUserId(authentication);
        ConversationDto conversation = messagingService.getOrCreateConversation(userId, otherUserId, listingId, listingTitle);
        return ResponseEntity.ok(ApiResponse.success(conversation));
    }

    /**
     * Get messages in a conversation
     */
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<PagedResponse<MessageDto>>> getMessages(
            Authentication authentication,
            @PathVariable UUID conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        UUID userId = extractUserId(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MessageDto> messages = messagingService.getMessages(userId, conversationId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(messages)));
    }

    /**
     * Mark conversation as read
     */
    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            Authentication authentication,
            @PathVariable UUID conversationId) {
        UUID userId = extractUserId(authentication);
        messagingService.markConversationAsRead(userId, conversationId);
        return ResponseEntity.ok(ApiResponse.success("Marked as read"));
    }

    /**
     * Get unread message count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getUnreadCount(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        int count = messagingService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    private UUID extractUserId(Authentication authentication) {
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
