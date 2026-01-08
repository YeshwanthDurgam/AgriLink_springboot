package com.agrilink.order.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity for detailed order tracking with locations and events.
 */
@Entity
@Table(name = "order_tracking")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private TrackingEventType eventType;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String location;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "tracking_number")
    private String trackingNumber;

    @Column
    private String carrier;

    @Column(name = "carrier_status")
    private String carrierStatus;

    @Column(name = "estimated_delivery")
    private LocalDateTime estimatedDelivery;

    @Column(name = "event_timestamp")
    private LocalDateTime eventTimestamp;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Tracking event types
     */
    public enum TrackingEventType {
        ORDER_PLACED,
        ORDER_CONFIRMED,
        PAYMENT_RECEIVED,
        PREPARING,
        PACKED,
        READY_FOR_PICKUP,
        PICKED_UP,
        IN_TRANSIT,
        OUT_FOR_DELIVERY,
        DELIVERY_ATTEMPTED,
        DELIVERED,
        RETURNED,
        CANCELLED,
        REFUND_INITIATED,
        REFUND_COMPLETED
    }
}
