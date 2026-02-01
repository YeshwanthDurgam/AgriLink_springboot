package com.agrilink.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for new message notification email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewMessageEmailRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Recipient name is required")
    private String recipientName;

    @NotBlank(message = "Sender name is required")
    private String senderName;

    private String messagePreview;

    @NotBlank(message = "Conversation link is required")
    private String conversationLink;
}
