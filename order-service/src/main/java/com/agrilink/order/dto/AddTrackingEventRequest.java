package com.agrilink.order.dto;

import com.agrilink.order.entity.OrderTracking;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddTrackingEventRequest {
    
    @NotNull(message = "Order ID is required")
    private UUID orderId;
    
    @NotNull(message = "Event type is required")
    private OrderTracking.TrackingEventType eventType;
    
    private String title;
    private String description;
    private String location;
    private Double latitude;
    private Double longitude;
    private String trackingNumber;
    private String carrier;
    private String carrierStatus;
    private LocalDateTime estimatedDelivery;
    private LocalDateTime eventTimestamp;
}
