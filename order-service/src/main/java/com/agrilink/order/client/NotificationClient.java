package com.agrilink.order.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Client for communicating with the Notification Service.
 * Used to send email notifications for orders, payments, etc.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationClient {

    private final RestTemplate restTemplate;

    @Value("${notification.service.url:http://notification-service:8087}")
    private String notificationServiceUrl;

    /**
     * Send order confirmation email.
     */
    @Async
    public void sendOrderConfirmationEmail(String email, String customerName, String orderNumber,
            BigDecimal totalAmount, List<Map<String, Object>> items,
            String shippingAddress, String estimatedDelivery) {
        try {
            String url = notificationServiceUrl + "/api/v1/emails/order-confirmation";

            Map<String, Object> request = new HashMap<>();
            request.put("email", email);
            request.put("customerName", customerName);
            request.put("orderNumber", orderNumber);
            request.put("totalAmount", totalAmount);
            request.put("items", items);
            request.put("shippingAddress", shippingAddress);
            request.put("estimatedDelivery", estimatedDelivery);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            restTemplate.postForEntity(url, entity, String.class);
            log.info("Order confirmation email request sent for order: {}", orderNumber);
        } catch (Exception e) {
            log.error("Failed to send order confirmation email for order {}: {}", orderNumber, e.getMessage());
        }
    }

    /**
     * Send order status update email.
     */
    @Async
    public void sendOrderStatusEmail(String email, String customerName, String orderNumber,
            String status, String statusMessage, String trackingNumber) {
        try {
            String url = notificationServiceUrl + "/api/v1/emails/order-status";

            Map<String, Object> request = new HashMap<>();
            request.put("email", email);
            request.put("customerName", customerName);
            request.put("orderNumber", orderNumber);
            request.put("status", status);
            request.put("statusMessage", statusMessage);
            request.put("trackingNumber", trackingNumber);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            restTemplate.postForEntity(url, entity, String.class);
            log.info("Order status email request sent for order: {}", orderNumber);
        } catch (Exception e) {
            log.error("Failed to send order status email for order {}: {}", orderNumber, e.getMessage());
        }
    }

    /**
     * Send payment receipt email.
     */
    @Async
    public void sendPaymentReceiptEmail(String email, String customerName, String orderNumber,
            BigDecimal amount, String paymentMethod, String transactionId) {
        try {
            String url = notificationServiceUrl + "/api/v1/emails/payment-receipt";

            Map<String, Object> request = new HashMap<>();
            request.put("email", email);
            request.put("customerName", customerName);
            request.put("orderNumber", orderNumber);
            request.put("amount", amount);
            request.put("paymentMethod", paymentMethod);
            request.put("transactionId", transactionId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            restTemplate.postForEntity(url, entity, String.class);
            log.info("Payment receipt email request sent for order: {}", orderNumber);
        } catch (Exception e) {
            log.error("Failed to send payment receipt email for order {}: {}", orderNumber, e.getMessage());
        }
    }
}
