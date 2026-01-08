package com.agrilink.order.service;

import com.agrilink.order.dto.SalesAnalyticsDto;
import com.agrilink.order.entity.Order;
import com.agrilink.order.entity.OrderItem;
import com.agrilink.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Service for exporting sales data.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SalesExportService {

    private final OrderRepository orderRepository;
    private final SalesAnalyticsService salesAnalyticsService;

    /**
     * Export orders data as CSV.
     */
    public byte[] exportOrdersAsCsv(UUID sellerId) {
        log.info("Exporting orders data as CSV for seller: {}", sellerId);
        
        List<Order> orders = orderRepository.findBySellerId(sellerId);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos);
        
        // CSV Header
        writer.println("Order Number,Order Date,Customer,Total Amount,Status,Shipping Address");
        
        for (Order order : orders) {
            String shippingAddr = buildShippingAddress(order);
            writer.printf("\"%s\",%s,\"%s\",%.2f,%s,\"%s\"%n",
                order.getOrderNumber(),
                order.getCreatedAt() != null ? order.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : "",
                "Customer " + (order.getBuyerId() != null ? order.getBuyerId().toString().substring(0, 8) : "N/A"),
                order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO,
                order.getStatus() != null ? order.getStatus().name() : "PENDING",
                escapeCsv(shippingAddr)
            );
        }
        
        writer.flush();
        return baos.toByteArray();
    }

    private String buildShippingAddress(Order order) {
        StringBuilder sb = new StringBuilder();
        if (order.getShippingAddress() != null) sb.append(order.getShippingAddress());
        if (order.getShippingCity() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(order.getShippingCity());
        }
        if (order.getShippingState() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(order.getShippingState());
        }
        if (order.getShippingPostalCode() != null) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(order.getShippingPostalCode());
        }
        return sb.toString();
    }

    /**
     * Export order items as CSV.
     */
    public byte[] exportOrderItemsAsCsv(UUID sellerId) {
        log.info("Exporting order items as CSV for seller: {}", sellerId);
        
        List<Order> orders = orderRepository.findBySellerId(sellerId);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos);
        
        // CSV Header
        writer.println("Order Number,Product Name,Quantity,Unit Price,Subtotal,Order Date");
        
        for (Order order : orders) {
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    writer.printf("\"%s\",\"%s\",%.2f,%.2f,%.2f,%s%n",
                        order.getOrderNumber(),
                        escapeCsv(item.getProductName()),
                        item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO,
                        item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO,
                        item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO,
                        order.getCreatedAt() != null ? order.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : ""
                    );
                }
            }
        }
        
        writer.flush();
        return baos.toByteArray();
    }

    /**
     * Export sales analytics summary as CSV.
     */
    public byte[] exportSalesAnalyticsAsCsv(UUID sellerId) {
        log.info("Exporting sales analytics as CSV for seller: {}", sellerId);
        
        SalesAnalyticsDto analytics = salesAnalyticsService.getSalesAnalytics(sellerId);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos);
        
        // Summary section
        writer.println("AgriLink Sales Analytics Report");
        writer.printf("Generated: %s%n", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        writer.println();
        
        // Revenue Overview
        writer.println("REVENUE OVERVIEW");
        writer.printf("Total Revenue,%.2f%n", analytics.getTotalRevenue() != null ? analytics.getTotalRevenue() : BigDecimal.ZERO);
        writer.printf("Revenue This Month,%.2f%n", analytics.getTotalRevenueThisMonth() != null ? analytics.getTotalRevenueThisMonth() : BigDecimal.ZERO);
        writer.printf("Revenue Last Month,%.2f%n", analytics.getTotalRevenueLastMonth() != null ? analytics.getTotalRevenueLastMonth() : BigDecimal.ZERO);
        writer.printf("Revenue Growth,%.1f%%%n", analytics.getRevenueGrowthPercent() != null ? analytics.getRevenueGrowthPercent() : BigDecimal.ZERO);
        writer.println();
        
        // Order Statistics
        writer.println("ORDER STATISTICS");
        writer.printf("Total Orders,%d%n", analytics.getTotalOrders());
        writer.printf("Pending Orders,%d%n", analytics.getPendingOrders());
        writer.printf("Completed Orders,%d%n", analytics.getCompletedOrders());
        writer.printf("Average Order Value,%.2f%n", analytics.getAverageOrderValue() != null ? analytics.getAverageOrderValue() : BigDecimal.ZERO);
        writer.println();
        
        // Monthly Revenue Trends
        writer.println("MONTHLY REVENUE TRENDS");
        writer.println("Period,Revenue,Order Count,Average Order Value");
        if (analytics.getRevenueByMonth() != null) {
            for (SalesAnalyticsDto.RevenueByPeriod period : analytics.getRevenueByMonth()) {
                writer.printf("%s,%.2f,%d,%.2f%n", 
                    period.getPeriod(),
                    period.getRevenue() != null ? period.getRevenue() : BigDecimal.ZERO,
                    period.getOrderCount(),
                    period.getAverageOrderValue() != null ? period.getAverageOrderValue() : BigDecimal.ZERO);
            }
        }
        writer.println();
        
        // Top Products
        writer.println("TOP SELLING PRODUCTS");
        writer.println("Product Name,Total Revenue,Quantity Sold,Order Count");
        if (analytics.getTopProducts() != null) {
            for (SalesAnalyticsDto.RevenueByProduct product : analytics.getTopProducts()) {
                writer.printf("\"%s\",%.2f,%d,%d%n", 
                    escapeCsv(product.getProductName()),
                    product.getTotalRevenue() != null ? product.getTotalRevenue() : BigDecimal.ZERO,
                    product.getQuantitySold(),
                    product.getOrderCount());
            }
        }
        writer.println();
        
        // Top Buyers
        writer.println("TOP BUYERS");
        writer.println("Buyer Name,Total Spent,Order Count,Last Order");
        if (analytics.getTopBuyers() != null) {
            for (SalesAnalyticsDto.RevenueByBuyer buyer : analytics.getTopBuyers()) {
                writer.printf("\"%s\",%.2f,%d,%s%n", 
                    escapeCsv(buyer.getBuyerName()),
                    buyer.getTotalSpent() != null ? buyer.getTotalSpent() : BigDecimal.ZERO,
                    buyer.getOrderCount(),
                    buyer.getLastOrderDate() != null ? buyer.getLastOrderDate() : "");
            }
        }
        
        writer.flush();
        return baos.toByteArray();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}
