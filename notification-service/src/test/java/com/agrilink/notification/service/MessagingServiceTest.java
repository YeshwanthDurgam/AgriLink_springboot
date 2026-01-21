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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MessagingService.
 */
@ExtendWith(MockitoExtension.class)
class MessagingServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @InjectMocks
    private MessagingService messagingService;

    private UUID senderId;
    private UUID recipientId;
    private UUID conversationId;
    private Conversation conversation;
    private Message message;
    private SendMessageRequest sendMessageRequest;

    @BeforeEach
    void setUp() {
        senderId = UUID.randomUUID();
        recipientId = UUID.randomUUID();
        conversationId = UUID.randomUUID();

        conversation = Conversation.builder()
                .id(conversationId)
                .participant1Id(senderId)
                .participant2Id(recipientId)
                .lastMessageAt(LocalDateTime.now())
                .lastMessagePreview("Hello!")
                .participant1UnreadCount(0)
                .participant2UnreadCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        message = Message.builder()
                .id(UUID.randomUUID())
                .conversation(conversation)
                .senderId(senderId)
                .recipientId(recipientId)
                .content("Hello, I'm interested in your product!")
                .messageType(Message.MessageType.TEXT)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        sendMessageRequest = SendMessageRequest.builder()
                .recipientId(recipientId)
                .content("Hello, I'm interested in your product!")
                .build();
    }

    @Nested
    @DisplayName("Send Message")
    class SendMessageTests {

        @Test
        @DisplayName("Should send message successfully")
        void shouldSendMessageSuccessfully() {
            lenient().when(conversationRepository.findByParticipants(senderId, recipientId))
                    .thenReturn(Optional.of(conversation));
            lenient().when(messageRepository.save(any(Message.class))).thenReturn(message);
            lenient().when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);

            MessageDto result = messagingService.sendMessage(senderId, sendMessageRequest);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEqualTo("Hello, I'm interested in your product!");
        }

        @Test
        @DisplayName("Should throw exception when sending to self")
        void shouldThrowExceptionWhenSendingToSelf() {
            sendMessageRequest.setRecipientId(senderId);

            assertThatThrownBy(() -> messagingService.sendMessage(senderId, sendMessageRequest))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Cannot send message to yourself");
        }

        @Test
        @DisplayName("Should create new conversation if not exists")
        void shouldCreateNewConversationIfNotExists() {
            lenient().when(conversationRepository.findByParticipants(senderId, recipientId))
                    .thenReturn(Optional.empty());
            lenient().when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
            lenient().when(messageRepository.save(any(Message.class))).thenReturn(message);

            MessageDto result = messagingService.sendMessage(senderId, sendMessageRequest);

            assertThat(result).isNotNull();
        }
    }

    @Nested
    @DisplayName("Get Conversations")
    class GetConversationsTests {

        @Test
        @DisplayName("Should return user conversations")
        void shouldReturnUserConversations() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Conversation> page = new PageImpl<>(List.of(conversation));
            when(conversationRepository.findByParticipant(senderId, pageable)).thenReturn(page);

            Page<ConversationDto> result = messagingService.getConversations(senderId, pageable);

            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Should return empty page when no conversations")
        void shouldReturnEmptyPageWhenNoConversations() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Conversation> emptyPage = Page.empty();
            when(conversationRepository.findByParticipant(senderId, pageable)).thenReturn(emptyPage);

            Page<ConversationDto> result = messagingService.getConversations(senderId, pageable);

            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Messages")
    class GetMessagesTests {

        @Test
        @DisplayName("Should return messages in conversation")
        void shouldReturnMessagesInConversation() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Message> page = new PageImpl<>(List.of(message));
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(messageRepository.findByConversation(conversationId, pageable)).thenReturn(page);

            Page<MessageDto> result = messagingService.getMessages(senderId, conversationId, pageable);

            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Should throw exception when conversation not found")
        void shouldThrowExceptionWhenConversationNotFound() {
            Pageable pageable = PageRequest.of(0, 10);
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> messagingService.getMessages(senderId, conversationId, pageable))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when user not participant")
        void shouldThrowExceptionWhenUserNotParticipant() {
            UUID otherId = UUID.randomUUID();
            Pageable pageable = PageRequest.of(0, 10);
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

            assertThatThrownBy(() -> messagingService.getMessages(otherId, conversationId, pageable))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("not a participant");
        }
    }

    @Nested
    @DisplayName("Mark Conversation as Read")
    class MarkConversationAsReadTests {

        @Test
        @DisplayName("Should mark conversation as read")
        void shouldMarkConversationAsRead() {
            conversation.setParticipant1UnreadCount(5);
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);

            messagingService.markConversationAsRead(senderId, conversationId);

            verify(messageRepository).markConversationAsRead(conversationId, senderId);
            verify(conversationRepository).save(conversation);
        }

        @Test
        @DisplayName("Should throw exception when conversation not found")
        void shouldThrowExceptionWhenConversationNotFound() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> messagingService.markConversationAsRead(senderId, conversationId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
