package com.agrilink.order.service;

import com.agrilink.common.exception.BadRequestException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.order.dto.*;
import com.agrilink.order.entity.*;
import com.agrilink.order.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for checkout and order creation flow.
 * Handles cart to order conversion with Razorpay payment integration.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CheckoutService {

    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final RazorpayService razorpayService;
    private final CartService cartService;

    // Shipping charge thresholds
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("500");
    private static final BigDecimal SHIPPING_CHARGE = new BigDecimal("40");
    private static final BigDecimal TAX_RATE = new BigDecimal("0.05"); // 5% GST

    /**
     * Initialize checkout process.
     * Creates order from cart and initializes Razorpay payment.
     * 
     * @param userId        User ID
     * @param request       Checkout request with shipping details
     * @param customerEmail Customer email for Razorpay
     * @param customerName  Customer name for Razorpay
     * @param customerPhone Customer phone for Razorpay
     * @return Checkout response with order and payment details
     */
    @Transactional
    public CheckoutResponse initializeCheckout(UUID userId, CheckoutRequest request,
            String customerEmail, String customerName, String customerPhone) {
        log.info("Initializing checkout for user: {}", userId);

        // Get cart
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new BadRequestException("Cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        // Calculate totals
        BigDecimal subtotal = cart.getTotalAmount();
        BigDecimal shippingCharges = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0
                ? BigDecimal.ZERO
                : SHIPPING_CHARGE;
        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(shippingCharges).add(tax);

        // Create order(s) - one per seller
        Map<UUID, List<CartItem>> itemsBySeller = cart.getItems().stream()
                .collect(Collectors.groupingBy(CartItem::getSellerId));

        // For simplicity, create a single consolidated order
        // In production, you might create separate orders per seller
        Order order = createOrderFromCart(userId, cart, request, subtotal, shippingCharges, tax, totalAmount);

        // Create Razorpay payment order
        Payment payment = razorpayService.createPaymentOrder(order, totalAmount);

        // Build response
        CheckoutResponse response = CheckoutResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .subtotal(subtotal)
                .shippingCharges(shippingCharges)
                .tax(tax)
                .totalAmount(totalAmount)
                .currency(razorpayService.getCurrency())
                .itemCount(cart.getTotalItems())
                .razorpayOrderId(payment.getRazorpayOrderId())
                .razorpayKeyId(razorpayService.getKeyId())
                .razorpayAmount(totalAmount.multiply(BigDecimal.valueOf(100))) // In paise
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .shippingAddress(CheckoutResponse.ShippingAddress.builder()
                        .fullName(request.getFullName())
                        .addressLine1(request.getAddressLine1())
                        .addressLine2(request.getAddressLine2())
                        .city(request.getCity())
                        .state(request.getState())
                        .country(request.getCountry())
                        .postalCode(request.getPostalCode())
                        .phoneNumber(request.getPhoneNumber())
                        .build())
                .items(cart.getItems().stream()
                        .map(item -> CheckoutResponse.OrderItemSummary.builder()
                                .listingId(item.getListingId())
                                .title(item.getListingTitle())
                                .imageUrl(item.getListingImageUrl())
                                .quantity(item.getQuantity())
                                .unit(item.getUnit())
                                .unitPrice(item.getUnitPrice())
                                .subtotal(item.getSubtotal())
                                .build())
                        .collect(Collectors.toList()))
                .build();

        log.info("Checkout initialized for order: {} with Razorpay order: {}",
                order.getOrderNumber(), payment.getRazorpayOrderId());

        return response;
    }

    /**
     * Complete checkout after successful payment verification.
     * 
     * @param request Payment verification request
     * @param userId  User ID
     * @return Payment verification response
     */
    @Transactional
    public PaymentVerificationResponse completeCheckout(PaymentVerificationRequest request, UUID userId) {
        log.info("Completing checkout for order: {}", request.getOrderId());

        // Verify payment
        Payment payment = razorpayService.verifyAndCompletePayment(request);
        Order order = payment.getOrder();

        // Verify order belongs to user
        if (!order.getBuyerId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }

        PaymentVerificationResponse response;

        if (payment.getPaymentStatus() == Payment.PaymentStatus.COMPLETED) {
            // Update order status
            order.setStatus(Order.OrderStatus.CONFIRMED);

            // Add status history
            OrderStatusHistory history = OrderStatusHistory.builder()
                    .status(Order.OrderStatus.CONFIRMED)
                    .notes("Payment received via Razorpay. Transaction ID: " + payment.getRazorpayPaymentId())
                    .changedBy(userId)
                    .build();
            order.addStatusHistory(history);

            orderRepository.save(order);

            // Clear cart
            cartService.clearCart(userId);

            response = PaymentVerificationResponse.builder()
                    .success(true)
                    .message("Payment successful! Your order has been confirmed.")
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .orderStatus(order.getStatus().name())
                    .paymentId(payment.getId())
                    .transactionId(payment.getTransactionId())
                    .paymentStatus(payment.getPaymentStatus().name())
                    .amount(payment.getAmount())
                    .currency(payment.getCurrency())
                    .paidAt(payment.getPaidAt())
                    .redirectUrl("/orders/" + order.getId())
                    .build();

            log.info("Checkout completed successfully for order: {}", order.getOrderNumber());

        } else {
            response = PaymentVerificationResponse.builder()
                    .success(false)
                    .message("Payment verification failed. Please try again.")
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .orderStatus(order.getStatus().name())
                    .paymentId(payment.getId())
                    .paymentStatus(payment.getPaymentStatus().name())
                    .build();

            log.error("Payment verification failed for order: {}", order.getOrderNumber());
        }

        return response;
    }

    /**
     * Create order from cart items.
     */
    private Order createOrderFromCart(UUID buyerId, Cart cart, CheckoutRequest request,
            BigDecimal subtotal, BigDecimal shippingCharges,
            BigDecimal tax, BigDecimal totalAmount) {
        // Get first seller ID (for single-seller orders)
        UUID sellerId = cart.getItems().get(0).getSellerId();
        UUID firstListingId = cart.getItems().get(0).getListingId();

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .buyerId(buyerId)
                .sellerId(sellerId)
                .listingId(firstListingId)
                .totalAmount(totalAmount)
                .currency("INR")
                .shippingAddress(request.getAddressLine1() +
                        (request.getAddressLine2() != null ? ", " + request.getAddressLine2() : ""))
                .shippingCity(request.getCity())
                .shippingState(request.getState())
                .shippingPostalCode(request.getPostalCode())
                .shippingCountry(request.getCountry())
                .shippingPhone(request.getPhoneNumber())
                .notes(request.getNotes())
                .status(Order.OrderStatus.PENDING)
                .build();

        // Add order items
        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = OrderItem.builder()
                    .listingId(cartItem.getListingId())
                    .productName(cartItem.getListingTitle())
                    .quantity(BigDecimal.valueOf(cartItem.getQuantity()))
                    .quantityUnit(cartItem.getUnit())
                    .unitPrice(cartItem.getUnitPrice())
                    .subtotal(cartItem.getSubtotal())
                    .build();
            order.addItem(orderItem);
        }

        // Add initial status history
        OrderStatusHistory history = OrderStatusHistory.builder()
                .status(Order.OrderStatus.PENDING)
                .notes("Order created, awaiting payment")
                .changedBy(buyerId)
                .build();
        order.addStatusHistory(history);

        return orderRepository.save(order);
    }

    /**
     * Generate unique order number.
     */
    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return "ORD" + timestamp + random;
    }

    /**
     * Get checkout summary without creating order (for preview).
     * 
     * @param userId User ID
     * @return Checkout summary
     */
    @Transactional(readOnly = true)
    public CheckoutSummary getCheckoutSummary(UUID userId) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new BadRequestException("Cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        BigDecimal subtotal = cart.getTotalAmount();
        BigDecimal shippingCharges = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0
                ? BigDecimal.ZERO
                : SHIPPING_CHARGE;
        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(shippingCharges).add(tax);
        BigDecimal amountForFreeShipping = FREE_SHIPPING_THRESHOLD.subtract(subtotal).max(BigDecimal.ZERO);

        return CheckoutSummary.builder()
                .itemCount(cart.getTotalItems())
                .subtotal(subtotal)
                .shippingCharges(shippingCharges)
                .tax(tax)
                .totalAmount(totalAmount)
                .currency("INR")
                .freeShippingThreshold(FREE_SHIPPING_THRESHOLD)
                .amountForFreeShipping(amountForFreeShipping)
                .items(cart.getItems().stream()
                        .map(item -> CheckoutSummary.ItemSummary.builder()
                                .listingId(item.getListingId())
                                .title(item.getListingTitle())
                                .imageUrl(item.getListingImageUrl())
                                .quantity(item.getQuantity())
                                .unit(item.getUnit())
                                .unitPrice(item.getUnitPrice())
                                .subtotal(item.getSubtotal())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
