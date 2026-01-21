package com.agrilink.order.service;

import com.agrilink.common.exception.ForbiddenException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.order.dto.*;
import com.agrilink.order.entity.Order;
import com.agrilink.order.entity.OrderItem;
import com.agrilink.order.entity.OrderStatusHistory;
import com.agrilink.order.entity.Payment;
import com.agrilink.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for order operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final PaymentService paymentService;

    /**
     * Create a new order.
     */
    @Transactional
    public OrderDto createOrder(UUID buyerId, CreateOrderRequest request,
            UUID sellerId, String productName, BigDecimal unitPrice) {
        log.info("Creating order for buyer: {} from listing: {}", buyerId, request.getListingId());

        BigDecimal subtotal = unitPrice.multiply(request.getQuantity());

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .buyerId(buyerId)
                .sellerId(sellerId)
                .listingId(request.getListingId())
                .totalAmount(subtotal)
                .currency("USD")
                .shippingAddress(request.getShippingAddress())
                .shippingCity(request.getShippingCity())
                .shippingState(request.getShippingState())
                .shippingPostalCode(request.getShippingPostalCode())
                .shippingCountry(request.getShippingCountry())
                .shippingPhone(request.getShippingPhone())
                .notes(request.getNotes())
                .status(Order.OrderStatus.PENDING)
                .build();

        OrderItem item = OrderItem.builder()
                .listingId(request.getListingId())
                .productName(productName)
                .quantity(request.getQuantity())
                .quantityUnit(request.getQuantityUnit() != null ? request.getQuantityUnit() : "KG")
                .unitPrice(unitPrice)
                .subtotal(subtotal)
                .build();
        order.addItem(item);

        // Add initial status history
        OrderStatusHistory history = OrderStatusHistory.builder()
                .status(Order.OrderStatus.PENDING)
                .notes("Order created")
                .changedBy(buyerId)
                .build();
        order.addStatusHistory(history);

        Order savedOrder = orderRepository.save(order);
        log.info("Order created with number: {}", savedOrder.getOrderNumber());

        return mapToDto(savedOrder);
    }

    /**
     * Get order by ID.
     */
    @Transactional(readOnly = true)
    public OrderDto getOrder(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Check if user is buyer or seller
        if (!order.getBuyerId().equals(userId) && !order.getSellerId().equals(userId)) {
            throw new ForbiddenException("You don't have access to this order");
        }

        return mapToDto(order);
    }

    /**
     * Get order by order number.
     */
    @Transactional(readOnly = true)
    public OrderDto getOrderByNumber(String orderNumber, UUID userId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", orderNumber));

        if (!order.getBuyerId().equals(userId) && !order.getSellerId().equals(userId)) {
            throw new ForbiddenException("You don't have access to this order");
        }

        return mapToDto(order);
    }

    /**
     * Get orders for buyer.
     */
    @Transactional(readOnly = true)
    public Page<OrderDto> getOrdersForBuyer(UUID buyerId, Pageable pageable) {
        return orderRepository.findByBuyerId(buyerId, pageable).map(this::mapToDto);
    }

    /**
     * Get orders for seller.
     */
    @Transactional(readOnly = true)
    public Page<OrderDto> getOrdersForSeller(UUID sellerId, Pageable pageable) {
        return orderRepository.findBySellerId(sellerId, pageable).map(this::mapToDto);
    }

    /**
     * Update order status.
     */
    @Transactional
    public OrderDto updateOrderStatus(UUID orderId, UUID userId, Order.OrderStatus newStatus, String notes) {
        log.info("Updating order {} status to {}", orderId, newStatus);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Validate permission (seller can update most statuses, buyer can cancel)
        if (newStatus == Order.OrderStatus.CANCELLED) {
            if (!order.getBuyerId().equals(userId) && !order.getSellerId().equals(userId)) {
                throw new ForbiddenException("You don't have permission to cancel this order");
            }
        } else {
            if (!order.getSellerId().equals(userId)) {
                throw new ForbiddenException("Only seller can update order status");
            }
        }

        order.setStatus(newStatus);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .status(newStatus)
                .notes(notes)
                .changedBy(userId)
                .build();
        order.addStatusHistory(history);

        Order updatedOrder = orderRepository.save(order);
        return mapToDto(updatedOrder);
    }

    /**
     * Cancel order.
     */
    @Transactional
    public OrderDto cancelOrder(UUID orderId, UUID userId, String reason) {
        return updateOrderStatus(orderId, userId, Order.OrderStatus.CANCELLED, reason);
    }

    /**
     * Confirm order (seller confirms).
     */
    @Transactional
    public OrderDto confirmOrder(UUID orderId, UUID sellerId) {
        return updateOrderStatus(orderId, sellerId, Order.OrderStatus.CONFIRMED, "Order confirmed by seller");
    }

    /**
     * Mark order as shipped.
     */
    @Transactional
    public OrderDto shipOrder(UUID orderId, UUID sellerId) {
        return updateOrderStatus(orderId, sellerId, Order.OrderStatus.SHIPPED, "Order shipped");
    }

    /**
     * Mark order as delivered.
     */
    @Transactional
    public OrderDto deliverOrder(UUID orderId, UUID sellerId) {
        return updateOrderStatus(orderId, sellerId, Order.OrderStatus.DELIVERED, "Order delivered");
    }

    /**
     * Complete order.
     */
    @Transactional
    public OrderDto completeOrder(UUID orderId, UUID userId) {
        return updateOrderStatus(orderId, userId, Order.OrderStatus.COMPLETED, "Order completed");
    }

    /**
     * Start demo progress - automatically progress order status through stages.
     * This is for demo/testing purposes only.
     */
    public void startDemoProgress(UUID orderId) {
        log.info("Starting demo progress for order: {}", orderId);

        // Run in a separate thread to not block the request
        new Thread(() -> {
            try {
                Order.OrderStatus[] statuses = {
                        Order.OrderStatus.CONFIRMED,
                        Order.OrderStatus.PROCESSING,
                        Order.OrderStatus.SHIPPED,
                        Order.OrderStatus.DELIVERED
                };

                for (Order.OrderStatus status : statuses) {
                    Thread.sleep(5000); // 5 second delay between status changes

                    try {
                        Order order = orderRepository.findById(orderId).orElse(null);
                        if (order == null || order.getStatus() == Order.OrderStatus.CANCELLED) {
                            log.info("Order {} not found or cancelled, stopping demo progress", orderId);
                            break;
                        }
                        if (order.getStatus() == Order.OrderStatus.DELIVERED) {
                            log.info("Order {} already delivered, stopping demo progress", orderId);
                            break;
                        }

                        order.setStatus(status);
                        OrderStatusHistory history = OrderStatusHistory.builder()
                                .status(status)
                                .notes("Demo: Status updated to " + status)
                                .changedBy(order.getSellerId())
                                .build();
                        order.addStatusHistory(history);
                        orderRepository.save(order);

                        log.info("Demo progress: Order {} status updated to {}", orderId, status);
                    } catch (Exception e) {
                        log.error("Error updating order status in demo mode: {}", e.getMessage());
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Demo progress interrupted for order: {}", orderId);
            }
        }).start();
    }

    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return "ORD-" + timestamp + "-" + random;
    }

    private OrderDto mapToDto(Order order) {
        Payment latestPayment = order.getPayments().stream()
                .reduce((first, second) -> second)
                .orElse(null);

        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .buyerId(order.getBuyerId())
                .sellerId(order.getSellerId())
                .listingId(order.getListingId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .currency(order.getCurrency())
                .shippingAddress(order.getShippingAddress())
                .shippingCity(order.getShippingCity())
                .shippingState(order.getShippingState())
                .shippingPostalCode(order.getShippingPostalCode())
                .shippingCountry(order.getShippingCountry())
                .shippingPhone(order.getShippingPhone())
                .notes(order.getNotes())
                .items(order.getItems().stream()
                        .map(this::mapItemToDto)
                        .collect(Collectors.toList()))
                .latestPayment(latestPayment != null ? paymentService.mapToDto(latestPayment) : null)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private OrderItemDto mapItemToDto(OrderItem item) {
        return OrderItemDto.builder()
                .id(item.getId())
                .listingId(item.getListingId())
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .quantityUnit(item.getQuantityUnit())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .build();
    }
}
