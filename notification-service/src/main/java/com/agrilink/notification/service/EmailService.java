package com.agrilink.notification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Email Service for sending HTML emails using Thymeleaf templates.
 * Supports Gmail SMTP with async delivery.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${notification.email.from}")
    private String fromAddress;

    @Value("${notification.email.from-name:AgriLink}")
    private String fromName;

    @Value("${notification.email.enabled}")
    private boolean emailEnabled;

    @Value("${notification.email.base-url:http://localhost:3000}")
    private String baseUrl;

    @Value("${notification.email.provider:smtp}")
    private String emailProvider;

    @Value("${notification.email.brevo.api-key:}")
    private String brevoApiKey;

    /**
     * Send a plain text email asynchronously.
     */
    @Async
    public void sendEmail(String to, String subject, String body) {
        try {
            sendEmailOrThrow(to, subject, body);

        } catch (Exception e) {
            log.error("❌ Failed to send email to {}: {}", to, e.getMessage(), e);
            // Don't throw - email failures shouldn't break the main flow
        }
    }

    /**
     * Send an HTML email using a Thymeleaf template.
     */
    @Async
    public void sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        try {
            log.info("Sending HTML email to {} with subject: {} using template: {}", to, subject, templateName);

            // Create mutable copy of variables to add common variables
            Map<String, Object> templateVariables = new java.util.HashMap<>(variables);

            // Add common variables
            templateVariables.put("baseUrl", baseUrl);
            templateVariables.put("currentYear", LocalDateTime.now().getYear());

            // Process Thymeleaf template
            Context context = new Context();
            context.setVariables(templateVariables);
            String htmlContent = templateEngine.process("email/" + templateName, context);

            sendEmailContentOrThrow(to, subject, htmlContent, true);
            log.info("Email sent successfully to {}", to);

        } catch (Exception e) {
            log.error("❌ Failed to send HTML email to {}: {}", to, e.getMessage(), e);
            // Build a helpful plain text fallback based on the template type and variables
            String fallbackBody = buildPlainTextFallback(templateName, variables);
            sendEmail(to, subject, fallbackBody);
        }
    }

    /**
     * Delivery method for notification pipeline. Throws if delivery fails.
     */
    public void sendEmailOrThrow(String to, String subject, String body) {
        sendEmailContentOrThrow(to, subject, body, false);
    }

    private void sendEmailContentOrThrow(String to, String subject, String body, boolean html) {
        if (!emailEnabled) {
            throw new IllegalStateException("EMAIL_DISABLED");
        }

        if ("brevo".equalsIgnoreCase(emailProvider)) {
            sendViaBrevo(to, subject, body, html);
            return;
        }

        sendViaSmtp(to, subject, body, html);
    }

    private void sendViaSmtp(String to, String subject, String body, boolean html) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, html);

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("SMTP_SEND_FAILED: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("SMTP_SEND_FAILED: " + e.getMessage(), e);
        }
    }

    private void sendViaBrevo(String to, String subject, String body, boolean html) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            throw new IllegalStateException("BREVO_API_KEY_MISSING");
        }

        Map<String, Object> sender = Map.of(
                "name", fromName,
                "email", fromAddress
        );

        Map<String, Object> recipient = Map.of("email", to);

        Map<String, Object> payload = new HashMap<>();
        payload.put("sender", sender);
        payload.put("to", List.of(recipient));
        payload.put("subject", subject);
        if (html) {
            payload.put("htmlContent", body);
        } else {
            payload.put("textContent", body);
        }

        try {
            Integer statusCode = WebClient.builder()
                    .baseUrl("https://api.brevo.com")
                    .defaultHeader("api-key", brevoApiKey)
                    .build()
                    .post()
                    .uri("/v3/smtp/email")
                    .bodyValue(payload)
                    .exchangeToMono(response -> response.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .map(bodyText -> {
                                int code = response.statusCode().value();
                                if (code < 200 || code >= 300) {
                                    throw new RuntimeException("BREVO_SEND_FAILED: status=" + code + ", body=" + bodyText);
                                }
                                return code;
                            }))
                    .block();

            if (statusCode == null || statusCode < 200 || statusCode >= 300) {
                throw new RuntimeException("BREVO_SEND_FAILED: no response status");
            }
        } catch (Exception e) {
            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            }
            throw new RuntimeException("BREVO_SEND_FAILED: " + e.getMessage(), e);
        }
    }

    /**
     * Build plain text email content as fallback when HTML fails.
     */
    private String buildPlainTextFallback(String templateName, Map<String, Object> variables) {
        StringBuilder sb = new StringBuilder();
        sb.append("AgriLink Notification\n");
        sb.append("=====================\n\n");

        switch (templateName) {
            case "welcome":
                sb.append("Welcome to AgriLink, ").append(variables.getOrDefault("userName", "User")).append("!\n\n");
                sb.append("We're thrilled to have you join our community.\n\n");
                sb.append("Get started:\n");
                sb.append("- Complete your profile: ")
                        .append(variables.getOrDefault("profileUrl", baseUrl + "/profile")).append("\n");
                sb.append("- Browse marketplace: ")
                        .append(variables.getOrDefault("marketplaceUrl", baseUrl + "/marketplace")).append("\n");
                break;
            case "password-reset":
                sb.append("Password Reset Request\n\n");
                sb.append("Hi ").append(variables.getOrDefault("userName", "User")).append(",\n\n");
                sb.append("Click the link below to reset your password:\n");
                sb.append(variables.getOrDefault("resetUrl", baseUrl + "/reset-password")).append("\n\n");
                sb.append("This link expires in 24 hours.\n");
                sb.append("If you didn't request this, please ignore this email.\n");
                break;
            case "email-verification":
                sb.append("Email Verification\n\n");
                sb.append("Hi ").append(variables.getOrDefault("userName", "User")).append(",\n\n");
                sb.append("Click the link below to verify your email:\n");
                sb.append(variables.getOrDefault("verifyUrl", baseUrl + "/verify-email")).append("\n\n");
                sb.append("This link expires in 48 hours.\n");
                break;
            case "order-confirmation":
                sb.append("Order Confirmation - ").append(variables.getOrDefault("orderNumber", "")).append("\n\n");
                sb.append("Thank you for your order, ").append(variables.getOrDefault("customerName", "Customer"))
                        .append("!\n\n");
                sb.append("Total: ").append(variables.getOrDefault("currency", "INR")).append(" ")
                        .append(variables.getOrDefault("totalAmount", "")).append("\n");
                sb.append("Track your order: ").append(variables.getOrDefault("trackOrderUrl", baseUrl)).append("\n");
                break;
            default:
                sb.append("You have a new notification from AgriLink.\n");
                sb.append("Please visit ").append(baseUrl).append(" for more details.\n");
        }

        sb.append("\n--\nAgriLink Team\n");
        sb.append(baseUrl).append("\n");
        return sb.toString();
    }

    /**
     * Send a welcome email to new users.
     */
    @Async
    public void sendWelcomeEmail(String to, String userName) {
        String subject = "🌱 Welcome to AgriLink!";

        Map<String, Object> variables = Map.of(
                "userName", userName,
                "loginUrl", baseUrl + "/login",
                "marketplaceUrl", baseUrl + "/marketplace",
                "profileUrl", baseUrl + "/profile");

        sendHtmlEmail(to, subject, "welcome", variables);
    }

    /**
     * Send an order confirmation email.
     */
    @Async
    public void sendOrderConfirmationEmail(String to, String customerName, String orderNumber,
            BigDecimal totalAmount, String currency,
            List<OrderItemInfo> items, String shippingAddress) {
        String subject = "✅ Order Confirmed - " + orderNumber;

        Map<String, Object> variables = Map.of(
                "customerName", customerName,
                "orderNumber", orderNumber,
                "totalAmount", totalAmount,
                "currency", currency,
                "items", items,
                "shippingAddress", shippingAddress,
                "orderDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")),
                "trackOrderUrl", baseUrl + "/orders/" + orderNumber);

        sendHtmlEmail(to, subject, "order-confirmation", variables);
    }

    /**
     * Send an order status update email.
     */
    @Async
    public void sendOrderStatusEmail(String to, String customerName, String orderNumber,
            String newStatus, String statusMessage) {
        String subject = "📦 Order Update - " + orderNumber;

        Map<String, Object> variables = Map.of(
                "customerName", customerName,
                "orderNumber", orderNumber,
                "newStatus", newStatus,
                "statusMessage", statusMessage,
                "trackOrderUrl", baseUrl + "/orders/" + orderNumber);

        sendHtmlEmail(to, subject, "order-status", variables);
    }

    /**
     * Send a password reset email.
     * 
     * @param to       recipient email
     * @param userName display name
     * @param resetUrl full password reset URL (already contains token)
     */
    @Async
    public void sendPasswordResetEmail(String to, String userName, String resetUrl) {
        String subject = "🔐 Reset Your AgriLink Password";

        Map<String, Object> variables = Map.of(
                "userName", userName,
                "resetUrl", resetUrl,
                "expiryHours", 24);

        sendHtmlEmail(to, subject, "password-reset", variables);
    }

    /**
     * Send email verification email.
     * 
     * @param to        recipient email
     * @param userName  display name
     * @param verifyUrl full email verification URL (already contains token)
     */
    @Async
    public void sendEmailVerificationEmail(String to, String userName, String verifyUrl) {
        String subject = "✉️ Verify Your AgriLink Email";

        Map<String, Object> variables = Map.of(
                "userName", userName,
                "verifyUrl", verifyUrl,
                "expiryHours", 48);

        sendHtmlEmail(to, subject, "email-verification", variables);
    }

    /**
     * Send farmer approval notification.
     */
    @Async
    public void sendFarmerApprovalEmail(String to, String farmerName, boolean approved, String reason) {
        String subject = approved
                ? "🎉 Your Farmer Account is Approved!"
                : "❌ Farmer Account Application Status";

        Map<String, Object> variables = Map.of(
                "farmerName", farmerName,
                "approved", approved,
                "reason", reason != null ? reason : "",
                "dashboardUrl", baseUrl + "/farmer/dashboard",
                "supportEmail", fromAddress);

        sendHtmlEmail(to, subject, "farmer-approval", variables);
    }

    /**
     * Send payment receipt email.
     */
    @Async
    public void sendPaymentReceiptEmail(String to, String customerName, String orderNumber,
            String transactionId, BigDecimal amount, String currency,
            String paymentMethod) {
        String subject = "💳 Payment Receipt - " + orderNumber;

        Map<String, Object> variables = Map.of(
                "customerName", customerName,
                "orderNumber", orderNumber,
                "transactionId", transactionId,
                "amount", amount,
                "currency", currency,
                "paymentMethod", paymentMethod,
                "paymentDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy HH:mm")),
                "orderUrl", baseUrl + "/orders/" + orderNumber);

        sendHtmlEmail(to, subject, "payment-receipt", variables);
    }

    /**
     * Send new message notification email.
     */
    @Async
    public void sendNewMessageEmail(String to, String recipientName, String senderName,
            String messagePreview) {
        String subject = "💬 New Message from " + senderName;

        Map<String, Object> variables = Map.of(
                "recipientName", recipientName,
                "senderName", senderName,
                "messagePreview", messagePreview.length() > 100
                        ? messagePreview.substring(0, 100) + "..."
                        : messagePreview,
                "messagesUrl", baseUrl + "/messages");

        sendHtmlEmail(to, subject, "new-message", variables);
    }

    /**
     * DTO for order item information in emails.
     */
    public record OrderItemInfo(
            String productName,
            int quantity,
            String unit,
            BigDecimal unitPrice,
            BigDecimal totalPrice,
            String imageUrl) {
    }
}
