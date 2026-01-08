package com.agrilink.order.service;

import com.agrilink.order.dto.AddTrackingEventRequest;
import com.agrilink.order.dto.OrderTrackingDto;
import com.agrilink.order.entity.Order;
import com.agrilink.order.entity.OrderTracking;
import com.agrilink.order.exception.ResourceNotFoundException;
import com.agrilink.order.repository.OrderRepository;
import com.agrilink.order.repository.OrderTrackingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for order tracking operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderTrackingService {

    private final OrderTrackingRepository trackingRepository;
    private final OrderRepository orderRepository;

    /**
     * Get tracking timeline for an order
     */
    @Transactional(readOnly = true)
    public List<OrderTrackingDto> getOrderTracking(UUID orderId) {
        return trackingRepository.findByOrderIdOrderByCreatedAtAsc(orderId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    /**
     * Get tracking by order number (public tracking)
     */
    @Transactional(readOnly = true)
    public List<OrderTrackingDto> getTrackingByOrderNumber(String orderNumber) {
        return trackingRepository.findByOrderNumber(orderNumber)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    /**
     * Get latest tracking event for an order
     */
    @Transactional(readOnly = true)
    public OrderTrackingDto getLatestTracking(UUID orderId) {
        return trackingRepository.findLatestByOrderId(orderId)
                .map(this::mapToDto)
                .orElse(null);
    }

    /**
     * Add tracking event
     */
    public OrderTrackingDto addTrackingEvent(AddTrackingEventRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + request.getOrderId()));

        String title = request.getTitle();
        if (title == null || title.isBlank()) {
            title = getDefaultTitle(request.getEventType());
        }

        OrderTracking tracking = OrderTracking.builder()
                .order(order)
                .eventType(request.getEventType())
                .title(title)
                .description(request.getDescription())
                .location(request.getLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .trackingNumber(request.getTrackingNumber())
                .carrier(request.getCarrier())
                .carrierStatus(request.getCarrierStatus())
                .estimatedDelivery(request.getEstimatedDelivery())
                .eventTimestamp(request.getEventTimestamp() != null ? request.getEventTimestamp() : LocalDateTime.now())
                .build();

        tracking = trackingRepository.save(tracking);
        log.info("Added tracking event {} for order {}", request.getEventType(), request.getOrderId());

        return mapToDto(tracking);
    }

    /**
     * Add tracking event from order service
     */
    public void addTrackingEventInternal(Order order, OrderTracking.TrackingEventType eventType, String description) {
        OrderTracking tracking = OrderTracking.builder()
                .order(order)
                .eventType(eventType)
                .title(getDefaultTitle(eventType))
                .description(description)
                .eventTimestamp(LocalDateTime.now())
                .build();

        trackingRepository.save(tracking);
        log.info("Added internal tracking event {} for order {}", eventType, order.getId());
    }

    /**
     * Update shipping info
     */
    public OrderTrackingDto updateShippingInfo(UUID orderId, String trackingNumber, String carrier, LocalDateTime estimatedDelivery) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        OrderTracking tracking = OrderTracking.builder()
                .order(order)
                .eventType(OrderTracking.TrackingEventType.PICKED_UP)
                .title("Shipment Picked Up")
                .description("Your order has been picked up by " + carrier)
                .trackingNumber(trackingNumber)
                .carrier(carrier)
                .estimatedDelivery(estimatedDelivery)
                .eventTimestamp(LocalDateTime.now())
                .build();

        tracking = trackingRepository.save(tracking);
        log.info("Updated shipping info for order {}: carrier={}, tracking={}", orderId, carrier, trackingNumber);

        return mapToDto(tracking);
    }

    /**
     * Get default title for event type
     */
    private String getDefaultTitle(OrderTracking.TrackingEventType eventType) {
        return switch (eventType) {
            case ORDER_PLACED -> "Order Placed";
            case ORDER_CONFIRMED -> "Order Confirmed";
            case PAYMENT_RECEIVED -> "Payment Received";
            case PREPARING -> "Preparing Your Order";
            case PACKED -> "Order Packed";
            case READY_FOR_PICKUP -> "Ready for Pickup";
            case PICKED_UP -> "Shipment Picked Up";
            case IN_TRANSIT -> "In Transit";
            case OUT_FOR_DELIVERY -> "Out for Delivery";
            case DELIVERY_ATTEMPTED -> "Delivery Attempted";
            case DELIVERED -> "Delivered";
            case RETURNED -> "Returned";
            case CANCELLED -> "Order Cancelled";
            case REFUND_INITIATED -> "Refund Initiated";
            case REFUND_COMPLETED -> "Refund Completed";
        };
    }

    /**
     * Map entity to DTO
     */
    private OrderTrackingDto mapToDto(OrderTracking tracking) {
        return OrderTrackingDto.builder()
                .id(tracking.getId())
                .orderId(tracking.getOrder().getId())
                .orderNumber(tracking.getOrder().getOrderNumber())
                .eventType(tracking.getEventType())
                .title(tracking.getTitle())
                .description(tracking.getDescription())
                .location(tracking.getLocation())
                .latitude(tracking.getLatitude())
                .longitude(tracking.getLongitude())
                .trackingNumber(tracking.getTrackingNumber())
                .carrier(tracking.getCarrier())
                .carrierStatus(tracking.getCarrierStatus())
                .estimatedDelivery(tracking.getEstimatedDelivery())
                .eventTimestamp(tracking.getEventTimestamp())
                .createdAt(tracking.getCreatedAt())
                .build();
    }
}
