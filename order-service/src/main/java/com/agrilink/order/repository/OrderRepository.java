package com.agrilink.order.repository;

import com.agrilink.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Order entity.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByBuyerId(UUID buyerId, Pageable pageable);

    Page<Order> findBySellerId(UUID sellerId, Pageable pageable);

    List<Order> findBySellerId(UUID sellerId);

    Page<Order> findByBuyerIdAndStatus(UUID buyerId, Order.OrderStatus status, Pageable pageable);

    Page<Order> findBySellerIdAndStatus(UUID sellerId, Order.OrderStatus status, Pageable pageable);

    List<Order> findByStatus(Order.OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.buyerId = :buyerId")
    long countByBuyerId(@Param("buyerId") UUID buyerId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.sellerId = :sellerId")
    long countBySellerId(@Param("sellerId") UUID sellerId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.sellerId = :sellerId AND o.status = :status")
    long countBySellerIdAndStatus(@Param("sellerId") UUID sellerId, @Param("status") Order.OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.buyerId = :userId OR o.sellerId = :userId ORDER BY o.createdAt DESC")
    Page<Order> findByBuyerIdOrSellerId(@Param("userId") UUID userId, Pageable pageable);

    // Analytics queries
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.sellerId = :sellerId")
    BigDecimal sumTotalAmountBySellerId(@Param("sellerId") UUID sellerId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.sellerId = :sellerId AND o.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal sumTotalAmountBySellerIdAndDateRange(@Param("sellerId") UUID sellerId,
            @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.sellerId = :sellerId AND o.createdAt BETWEEN :startDate AND :endDate")
    long countBySellerIdAndDateRange(@Param("sellerId") UUID sellerId, @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    List<Order> findBySellerIdAndCreatedAtBetween(UUID sellerId, LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT o.listingId, COUNT(o), COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.sellerId = :sellerId GROUP BY o.listingId ORDER BY SUM(o.totalAmount) DESC")
    List<Object[]> findTopProductsBySellerId(@Param("sellerId") UUID sellerId);

    @Query("SELECT o.buyerId, COUNT(o), COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.sellerId = :sellerId GROUP BY o.buyerId ORDER BY SUM(o.totalAmount) DESC")
    List<Object[]> findTopBuyersBySellerId(@Param("sellerId") UUID sellerId);

    @Query("SELECT COUNT(DISTINCT o.buyerId) FROM Order o WHERE o.sellerId = :sellerId AND o.buyerId IN " +
            "(SELECT o2.buyerId FROM Order o2 WHERE o2.sellerId = :sellerId GROUP BY o2.buyerId HAVING COUNT(o2) > 1)")
    long countRepeatCustomersBySellerId(@Param("sellerId") UUID sellerId);

    // Optimized batch query - get monthly revenue in single query instead of 12
    // separate queries
    @Query("SELECT FUNCTION('DATE_TRUNC', 'month', o.createdAt) as month, " +
            "COALESCE(SUM(o.totalAmount), 0) as revenue, " +
            "COUNT(o) as orderCount " +
            "FROM Order o WHERE o.sellerId = :sellerId " +
            "AND o.createdAt >= :startDate " +
            "GROUP BY FUNCTION('DATE_TRUNC', 'month', o.createdAt) " +
            "ORDER BY month")
    List<Object[]> getMonthlyRevenueStats(@Param("sellerId") UUID sellerId,
            @Param("startDate") LocalDateTime startDate);

    // Batch query for all status counts in single query
    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.sellerId = :sellerId GROUP BY o.status")
    List<Object[]> getOrderCountsByStatus(@Param("sellerId") UUID sellerId);
}
