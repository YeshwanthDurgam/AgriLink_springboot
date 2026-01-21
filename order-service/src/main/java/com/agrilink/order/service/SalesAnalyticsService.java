package com.agrilink.order.service;

import com.agrilink.order.dto.SalesAnalyticsDto;
import com.agrilink.order.entity.Order;
import com.agrilink.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for sales analytics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SalesAnalyticsService {

    private final OrderRepository orderRepository;

    /**
     * Get sales analytics for a seller.
     */
    public SalesAnalyticsDto getSalesAnalytics(UUID sellerId) {
        log.info("Generating sales analytics for seller: {}", sellerId);

        // Get date ranges
        LocalDate now = LocalDate.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = now.atTime(LocalTime.MAX);
        LocalDateTime startOfLastMonth = now.minusMonths(1).withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfLastMonth = now.withDayOfMonth(1).minusDays(1).atTime(LocalTime.MAX);

        // Total revenue
        BigDecimal totalRevenue = orderRepository.sumTotalAmountBySellerId(sellerId);
        BigDecimal revenueThisMonth = orderRepository.sumTotalAmountBySellerIdAndDateRange(sellerId, startOfMonth,
                endOfMonth);
        BigDecimal revenueLastMonth = orderRepository.sumTotalAmountBySellerIdAndDateRange(sellerId, startOfLastMonth,
                endOfLastMonth);

        // Revenue growth
        BigDecimal revenueGrowth = BigDecimal.ZERO;
        if (revenueLastMonth.compareTo(BigDecimal.ZERO) > 0) {
            revenueGrowth = revenueThisMonth.subtract(revenueLastMonth)
                    .divide(revenueLastMonth, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
        }

        // Order counts
        long totalOrders = orderRepository.countBySellerId(sellerId);
        long ordersThisMonth = orderRepository.countBySellerIdAndDateRange(sellerId, startOfMonth, endOfMonth);
        long pendingOrders = orderRepository.countBySellerIdAndStatus(sellerId, Order.OrderStatus.PENDING);
        long completedOrders = orderRepository.countBySellerIdAndStatus(sellerId, Order.OrderStatus.DELIVERED);

        // Average order value
        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Revenue by month (last 12 months)
        List<SalesAnalyticsDto.RevenueByPeriod> revenueByMonth = calculateRevenueByMonth(sellerId);

        // Top products
        List<SalesAnalyticsDto.RevenueByProduct> topProducts = calculateTopProducts(sellerId);

        // Top buyers
        List<SalesAnalyticsDto.RevenueByBuyer> topBuyers = calculateTopBuyers(sellerId);

        // Order status distribution
        Map<String, Integer> ordersByStatus = calculateOrdersByStatus(sellerId);

        // Completion rate
        double completionRate = totalOrders > 0 ? (completedOrders * 100.0 / totalOrders) : 0;

        // Repeat customers
        long repeatCustomers = orderRepository.countRepeatCustomersBySellerId(sellerId);

        return SalesAnalyticsDto.builder()
                .totalRevenue(totalRevenue)
                .totalRevenueThisMonth(revenueThisMonth)
                .totalRevenueLastMonth(revenueLastMonth)
                .revenueGrowthPercent(revenueGrowth)
                .totalOrders((int) totalOrders)
                .ordersThisMonth((int) ordersThisMonth)
                .pendingOrders((int) pendingOrders)
                .completedOrders((int) completedOrders)
                .averageOrderValue(avgOrderValue)
                .revenueByMonth(revenueByMonth)
                .topProducts(topProducts)
                .topBuyers(topBuyers)
                .ordersByStatus(ordersByStatus)
                .orderCompletionRate(Math.round(completionRate * 10.0) / 10.0)
                .averageDeliveryDays(0) // Would need delivery tracking data
                .repeatCustomers((int) repeatCustomers)
                .build();
    }

    private List<SalesAnalyticsDto.RevenueByPeriod> calculateRevenueByMonth(UUID sellerId) {
        // OPTIMIZED: Single query for all 12 months instead of 24 queries
        LocalDate now = LocalDate.now();
        LocalDateTime startDate = now.minusMonths(11).withDayOfMonth(1).atStartOfDay();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");

        // Get all monthly data in single query
        List<Object[]> monthlyStats = orderRepository.getMonthlyRevenueStats(sellerId, startDate);

        // Create a map for quick lookup
        Map<String, Object[]> statsMap = new HashMap<>();
        for (Object[] row : monthlyStats) {
            LocalDateTime month = (LocalDateTime) row[0];
            String key = month.toLocalDate().format(formatter);
            statsMap.put(key, row);
        }

        // Build result list for all 12 months (including months with no orders)
        List<SalesAnalyticsDto.RevenueByPeriod> periods = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            String key = monthStart.format(formatter);

            BigDecimal revenue = BigDecimal.ZERO;
            int orderCount = 0;

            if (statsMap.containsKey(key)) {
                Object[] row = statsMap.get(key);
                revenue = (BigDecimal) row[1];
                orderCount = ((Long) row[2]).intValue();
            }

            BigDecimal avgOrder = orderCount > 0
                    ? revenue.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            periods.add(SalesAnalyticsDto.RevenueByPeriod.builder()
                    .period(key)
                    .revenue(revenue)
                    .orderCount(orderCount)
                    .averageOrderValue(avgOrder)
                    .build());
        }

        return periods;
    }

    private List<SalesAnalyticsDto.RevenueByProduct> calculateTopProducts(UUID sellerId) {
        List<Object[]> results = orderRepository.findTopProductsBySellerId(sellerId);

        return results.stream()
                .limit(10)
                .map(row -> SalesAnalyticsDto.RevenueByProduct.builder()
                        .listingId((UUID) row[0])
                        .productName("Product " + ((UUID) row[0]).toString().substring(0, 8))
                        .orderCount(((Long) row[1]).intValue())
                        .totalRevenue((BigDecimal) row[2])
                        .quantitySold(0) // Would need to sum from order items
                        .build())
                .toList();
    }

    private List<SalesAnalyticsDto.RevenueByBuyer> calculateTopBuyers(UUID sellerId) {
        List<Object[]> results = orderRepository.findTopBuyersBySellerId(sellerId);

        return results.stream()
                .limit(10)
                .map(row -> SalesAnalyticsDto.RevenueByBuyer.builder()
                        .buyerId((UUID) row[0])
                        .buyerName("Buyer " + ((UUID) row[0]).toString().substring(0, 8))
                        .orderCount(((Long) row[1]).intValue())
                        .totalSpent((BigDecimal) row[2])
                        .lastOrderDate(null) // Would need additional query
                        .build())
                .toList();
    }

    private Map<String, Integer> calculateOrdersByStatus(UUID sellerId) {
        // OPTIMIZED: Single query for all statuses instead of 5+ queries
        Map<String, Integer> statusCounts = new LinkedHashMap<>();

        // Initialize all statuses with 0
        for (Order.OrderStatus status : Order.OrderStatus.values()) {
            statusCounts.put(status.name(), 0);
        }

        // Fetch all counts in single query
        List<Object[]> results = orderRepository.getOrderCountsByStatus(sellerId);
        for (Object[] row : results) {
            Order.OrderStatus status = (Order.OrderStatus) row[0];
            int count = ((Long) row[1]).intValue();
            statusCounts.put(status.name(), count);
        }

        return statusCounts;
    }
}
