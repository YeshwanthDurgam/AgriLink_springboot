package com.agrilink.order.service;

import com.agrilink.common.exception.BadRequestException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.order.dto.PaymentDto;
import com.agrilink.order.dto.ProcessPaymentRequest;
import com.agrilink.order.entity.Order;
import com.agrilink.order.entity.Payment;
import com.agrilink.order.repository.OrderRepository;
import com.agrilink.order.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PaymentService.
 */
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private PaymentService paymentService;

    private UUID orderId;
    private UUID paymentId;
    private Order order;
    private Payment payment;
    private ProcessPaymentRequest processPaymentRequest;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        paymentId = UUID.randomUUID();

        order = Order.builder()
                .id(orderId)
                .orderNumber("ORD-123456")
                .buyerId(UUID.randomUUID())
                .sellerId(UUID.randomUUID())
                .totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PENDING)
                .build();

        payment = Payment.builder()
                .id(paymentId)
                .order(order)
                .paymentMethod("CARD")
                .amount(new BigDecimal("100.00"))
                .currency("USD")
                .paymentGateway("MOCK")
                .paymentStatus(Payment.PaymentStatus.COMPLETED)
                .transactionId("TXN-12345678")
                .paidAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        processPaymentRequest = ProcessPaymentRequest.builder()
                .orderId(orderId)
                .paymentMethod("CARD")
                .amount(new BigDecimal("100.00"))
                .currency("USD")
                .paymentGateway("MOCK")
                .build();
    }

    @Nested
    @DisplayName("Process Payment")
    class ProcessPaymentTests {

        @Test
        @DisplayName("Should process payment successfully")
        void shouldProcessPaymentSuccessfully() {
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
            when(orderRepository.save(any(Order.class))).thenReturn(order);

            PaymentDto result = paymentService.processPayment(processPaymentRequest);

            assertThat(result).isNotNull();
            assertThat(result.getPaymentStatus()).isEqualTo(Payment.PaymentStatus.COMPLETED);
            verify(paymentRepository).save(any(Payment.class));
            verify(orderRepository).save(any(Order.class));
        }

        @Test
        @DisplayName("Should throw exception when order not found")
        void shouldThrowExceptionWhenOrderNotFound() {
            when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.processPayment(processPaymentRequest))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when order already delivered")
        void shouldThrowExceptionWhenOrderAlreadyDelivered() {
            order.setStatus(Order.OrderStatus.DELIVERED);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            assertThatThrownBy(() -> paymentService.processPayment(processPaymentRequest))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Cannot process payment for order in status");
        }

        @Test
        @DisplayName("Should throw exception when amount mismatch")
        void shouldThrowExceptionWhenAmountMismatch() {
            processPaymentRequest.setAmount(new BigDecimal("50.00")); // Different from order total
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            assertThatThrownBy(() -> paymentService.processPayment(processPaymentRequest))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Payment amount does not match order total");
        }

        @Test
        @DisplayName("Should process payment for confirmed order")
        void shouldProcessPaymentForConfirmedOrder() {
            order.setStatus(Order.OrderStatus.CONFIRMED);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
            when(orderRepository.save(any(Order.class))).thenReturn(order);

            PaymentDto result = paymentService.processPayment(processPaymentRequest);

            assertThat(result).isNotNull();
            assertThat(result.getPaymentStatus()).isEqualTo(Payment.PaymentStatus.COMPLETED);
        }

        @Test
        @DisplayName("Should use default currency when not provided")
        void shouldUseDefaultCurrencyWhenNotProvided() {
            processPaymentRequest.setCurrency(null);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
            when(orderRepository.save(any(Order.class))).thenReturn(order);

            PaymentDto result = paymentService.processPayment(processPaymentRequest);

            assertThat(result).isNotNull();
        }
    }

    @Nested
    @DisplayName("Get Payment")
    class GetPaymentTests {

        @Test
        @DisplayName("Should return payment when found")
        void shouldReturnPaymentWhenFound() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

            PaymentDto result = paymentService.getPayment(paymentId);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(paymentId);
            assertThat(result.getPaymentStatus()).isEqualTo(Payment.PaymentStatus.COMPLETED);
        }

        @Test
        @DisplayName("Should throw exception when payment not found")
        void shouldThrowExceptionWhenPaymentNotFound() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.getPayment(paymentId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Refund Payment")
    class RefundPaymentTests {

        @Test
        @DisplayName("Should refund payment successfully")
        void shouldRefundPaymentSuccessfully() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
            when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
            when(orderRepository.save(any(Order.class))).thenReturn(order);

            PaymentDto result = paymentService.refundPayment(paymentId);

            assertThat(result).isNotNull();
            verify(paymentRepository).save(any(Payment.class));
            verify(orderRepository).save(any(Order.class));
        }

        @Test
        @DisplayName("Should throw exception when payment not found")
        void shouldThrowExceptionWhenPaymentNotFound() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.refundPayment(paymentId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when refunding non-completed payment")
        void shouldThrowExceptionWhenRefundingNonCompletedPayment() {
            payment.setPaymentStatus(Payment.PaymentStatus.PENDING);
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

            assertThatThrownBy(() -> paymentService.refundPayment(paymentId))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Can only refund completed payments");
        }

        @Test
        @DisplayName("Should update order status to refunded")
        void shouldUpdateOrderStatusToRefunded() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
            when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
            when(orderRepository.save(any(Order.class))).thenReturn(order);

            paymentService.refundPayment(paymentId);

            assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.REFUNDED);
            verify(orderRepository).save(order);
        }
    }
}
