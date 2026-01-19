package com.agrilink.notification.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for real-time notification delivery.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    
    // Map of userId to WebSocket sessions (supports multiple sessions per user)
    private final Map<UUID, ConcurrentHashMap<String, WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connection established: {}", session.getId());
        // User will authenticate via message
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            Map<String, String> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String type = payload.get("type");
            
            if ("AUTH".equals(type)) {
                String token = payload.get("token");
                UUID userId = extractUserIdFromToken(token);
                
                if (userId != null) {
                    registerSession(userId, session);
                    sendMessage(session, Map.of(
                        "type", "AUTH_SUCCESS",
                        "message", "Connected to notification service"
                    ));
                    log.info("User {} authenticated on WebSocket session {}", userId, session.getId());
                } else {
                    sendMessage(session, Map.of(
                        "type", "AUTH_FAILED",
                        "message", "Invalid token"
                    ));
                }
            } else if ("PING".equals(type)) {
                sendMessage(session, Map.of("type", "PONG"));
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket message: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("WebSocket connection closed: {} with status {}", session.getId(), status);
        removeSession(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket transport error for session {}: {}", session.getId(), exception.getMessage());
        removeSession(session);
    }

    /**
     * Send notification to a specific user.
     */
    public void sendNotificationToUser(UUID userId, Object notification) {
        ConcurrentHashMap<String, WebSocketSession> sessions = userSessions.get(userId);
        
        if (sessions != null && !sessions.isEmpty()) {
            Map<String, Object> message = Map.of(
                "type", "NOTIFICATION",
                "data", notification
            );
            
            sessions.values().forEach(session -> {
                if (session.isOpen()) {
                    sendMessage(session, message);
                }
            });
            log.debug("Sent notification to user {} on {} sessions", userId, sessions.size());
        } else {
            log.debug("No active WebSocket sessions for user {}", userId);
        }
    }

    /**
     * Broadcast notification to all connected users.
     */
    public void broadcastNotification(Object notification) {
        Map<String, Object> message = Map.of(
            "type", "BROADCAST",
            "data", notification
        );
        
        userSessions.values().forEach(sessions -> 
            sessions.values().forEach(session -> {
                if (session.isOpen()) {
                    sendMessage(session, message);
                }
            })
        );
    }

    /**
     * Get count of connected users.
     */
    public int getConnectedUserCount() {
        return userSessions.size();
    }

    /**
     * Check if user is connected.
     */
    public boolean isUserConnected(UUID userId) {
        ConcurrentHashMap<String, WebSocketSession> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty() && 
               sessions.values().stream().anyMatch(WebSocketSession::isOpen);
    }

    private void registerSession(UUID userId, WebSocketSession session) {
        userSessions.computeIfAbsent(userId, k -> new ConcurrentHashMap<>())
                   .put(session.getId(), session);
        session.getAttributes().put("userId", userId);
    }

    private void removeSession(WebSocketSession session) {
        UUID userId = (UUID) session.getAttributes().get("userId");
        if (userId != null) {
            ConcurrentHashMap<String, WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session.getId());
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                }
            }
        }
    }

    private void sendMessage(WebSocketSession session, Object payload) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
            }
        } catch (IOException e) {
            log.error("Failed to send WebSocket message: {}", e.getMessage());
        }
    }

    private UUID extractUserIdFromToken(String token) {
        try {
            // Simple extraction - in production, validate the JWT properly
            if (token != null && !token.isEmpty()) {
                // Extract userId from JWT claims (preferred) or fallback to email-based UUID
                String[] parts = token.split("\\.");
                if (parts.length == 3) {
                    String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                    Map<String, Object> claims = objectMapper.readValue(payload, Map.class);
                    
                    // Try to get userId from claims first
                    String userId = (String) claims.get("userId");
                    if (userId != null && !userId.isEmpty()) {
                        return UUID.fromString(userId);
                    }
                    
                    // Fallback to email-based UUID for backward compatibility
                    String email = (String) claims.get("sub");
                    if (email != null) {
                        return UUID.nameUUIDFromBytes(email.getBytes());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract userId from token: {}", e.getMessage());
        }
        return null;
    }
}
