package com.agrilink.order.controller;

import com.agrilink.order.dto.AddTrackingEventRequest;
import com.agrilink.order.dto.OrderTrackingDto;
import com.agrilink.order.service.OrderTrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for order tracking operations.
 */
@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
@Slf4j
public class OrderTrackingController {

    private final OrderTrackingService trackingService;

    /**
     * Get tracking timeline for an order
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<OrderTrackingDto>> getOrderTracking(@PathVariable UUID orderId) {
        return ResponseEntity.ok(trackingService.getOrderTracking(orderId));
    }

    /**
     * Get tracking by order number (public endpoint)
     */
    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<List<OrderTrackingDto>> getTrackingByOrderNumber(@PathVariable String orderNumber) {
        return ResponseEntity.ok(trackingService.getTrackingByOrderNumber(orderNumber));
    }

    /**
     * Get latest tracking event for an order
     */
    @GetMapping("/order/{orderId}/latest")
    public ResponseEntity<OrderTrackingDto> getLatestTracking(@PathVariable UUID orderId) {
        OrderTrackingDto latest = trackingService.getLatestTracking(orderId);
        if (latest == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(latest);
    }

    /**
     * Add tracking event (Seller/Admin only)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<OrderTrackingDto> addTrackingEvent(@Valid @RequestBody AddTrackingEventRequest request) {
        return ResponseEntity.ok(trackingService.addTrackingEvent(request));
    }

    /**
     * Update shipping info (Seller/Admin only)
     */
    @PostMapping("/order/{orderId}/shipping")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<OrderTrackingDto> updateShippingInfo(
            @PathVariable UUID orderId,
            @RequestParam String trackingNumber,
            @RequestParam String carrier,
            @RequestParam(required = false) LocalDateTime estimatedDelivery) {
        return ResponseEntity.ok(trackingService.updateShippingInfo(orderId, trackingNumber, carrier, estimatedDelivery));
    }
}
