package com.agrilink.notification.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.common.dto.PagedResponse;
import com.agrilink.notification.dto.ConversationDto;
import com.agrilink.notification.dto.MessageDto;
import com.agrilink.notification.dto.SendMessageRequest;
import com.agrilink.notification.service.MessagingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
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
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody SendMessageRequest sendRequest) {
        UUID senderId = extractUserId(request, authentication);
        MessageDto message = messagingService.sendMessage(senderId, sendRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent", message));
    }

    /**
     * Get user's conversations
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<PagedResponse<ConversationDto>>> getConversations(
            HttpServletRequest request,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID userId = extractUserId(request, authentication);
        Pageable pageable = PageRequest.of(page, size);
        Page<ConversationDto> conversations = messagingService.getConversations(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(conversations)));
    }

    /**
     * Get a specific conversation
     */
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<ConversationDto>> getConversation(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID conversationId) {
        UUID userId = extractUserId(request, authentication);
        ConversationDto conversation = messagingService.getConversation(userId, conversationId);
        return ResponseEntity.ok(ApiResponse.success(conversation));
    }

    /**
     * Get or create conversation with a user
     */
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationDto>> getOrCreateConversation(
            HttpServletRequest request,
            Authentication authentication,
            @RequestParam UUID otherUserId,
            @RequestParam(required = false) UUID listingId,
            @RequestParam(required = false) String listingTitle) {
        UUID userId = extractUserId(request, authentication);
        ConversationDto conversation = messagingService.getOrCreateConversation(userId, otherUserId, listingId, listingTitle);
        return ResponseEntity.ok(ApiResponse.success(conversation));
    }

    /**
     * Get messages in a conversation
     */
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<PagedResponse<MessageDto>>> getMessages(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        UUID userId = extractUserId(request, authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MessageDto> messages = messagingService.getMessages(userId, conversationId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(messages)));
    }

    /**
     * Mark conversation as read
     */
    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID conversationId) {
        UUID userId = extractUserId(request, authentication);
        messagingService.markConversationAsRead(userId, conversationId);
        return ResponseEntity.ok(ApiResponse.success("Marked as read"));
    }

    /**
     * Get unread message count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getUnreadCount(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(request, authentication);
        int count = messagingService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    private UUID extractUserId(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
