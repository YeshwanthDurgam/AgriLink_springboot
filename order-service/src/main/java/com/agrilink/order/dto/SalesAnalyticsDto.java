package com.agrilink.order.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for sales analytics data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesAnalyticsDto {
    
    // Overview metrics
    private BigDecimal totalRevenue;
    private BigDecimal totalRevenueThisMonth;
    private BigDecimal totalRevenueLastMonth;
    private BigDecimal revenueGrowthPercent;
    
    private int totalOrders;
    private int ordersThisMonth;
    private int pendingOrders;
    private int completedOrders;
    
    private BigDecimal averageOrderValue;
    
    // Revenue breakdown
    private List<RevenueByPeriod> revenueByMonth;
    private List<RevenueByProduct> topProducts;
    private List<RevenueByBuyer> topBuyers;
    
    // Order status distribution
    private Map<String, Integer> ordersByStatus;
    
    // Performance metrics
    private double orderCompletionRate;
    private double averageDeliveryDays;
    private int repeatCustomers;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueByPeriod {
        private String period;
        private BigDecimal revenue;
        private int orderCount;
        private BigDecimal averageOrderValue;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueByProduct {
        private UUID listingId;
        private String productName;
        private BigDecimal totalRevenue;
        private int quantitySold;
        private int orderCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueByBuyer {
        private UUID buyerId;
        private String buyerName;
        private BigDecimal totalSpent;
        private int orderCount;
        private String lastOrderDate;
    }
}
