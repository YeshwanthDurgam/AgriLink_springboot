package com.agrilink.order.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entity representing an order.
 */
@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_buyer_id", columnList = "buyer_id"),
        @Index(name = "idx_order_seller_id", columnList = "seller_id"),
        @Index(name = "idx_order_status", columnList = "status"),
        @Index(name = "idx_order_created_at", columnList = "created_at"),
        @Index(name = "idx_order_seller_status", columnList = "seller_id, status"),
        @Index(name = "idx_order_seller_date", columnList = "seller_id, created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    @Column(name = "buyer_id", nullable = false)
    private UUID buyerId;

    @Column(name = "seller_id", nullable = false)
    private UUID sellerId;

    @Column(name = "listing_id", nullable = false)
    private UUID listingId;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(length = 3)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(name = "shipping_city", length = 100)
    private String shippingCity;

    @Column(name = "shipping_state", length = 100)
    private String shippingState;

    @Column(name = "shipping_postal_code", length = 20)
    private String shippingPostalCode;

    @Column(name = "shipping_country", length = 100)
    private String shippingCountry;

    @Column(name = "shipping_phone", length = 20)
    private String shippingPhone;

    @Column(name = "buyer_email", length = 255)
    private String buyerEmail;

    @Column(name = "buyer_name", length = 255)
    private String buyerName;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @Builder.Default
    private List<OrderStatusHistory> statusHistory = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum OrderStatus {
        PENDING,
        CONFIRMED,
        PROCESSING,
        SHIPPED,
        DELIVERED,
        COMPLETED,
        CANCELLED,
        REFUNDED
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void addStatusHistory(OrderStatusHistory history) {
        statusHistory.add(history);
        history.setOrder(this);
    }
}
