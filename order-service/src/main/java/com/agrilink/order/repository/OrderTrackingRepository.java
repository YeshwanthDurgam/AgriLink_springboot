package com.agrilink.order.repository;

import com.agrilink.order.entity.OrderTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderTrackingRepository extends JpaRepository<OrderTracking, UUID> {

    List<OrderTracking> findByOrderIdOrderByCreatedAtAsc(UUID orderId);

    List<OrderTracking> findByOrderIdOrderByCreatedAtDesc(UUID orderId);

    @Query("SELECT t FROM OrderTracking t WHERE t.order.id = :orderId ORDER BY t.createdAt DESC LIMIT 1")
    Optional<OrderTracking> findLatestByOrderId(@Param("orderId") UUID orderId);

    @Query("SELECT t FROM OrderTracking t WHERE t.order.orderNumber = :orderNumber ORDER BY t.createdAt ASC")
    List<OrderTracking> findByOrderNumber(@Param("orderNumber") String orderNumber);

    boolean existsByOrderIdAndEventType(UUID orderId, OrderTracking.TrackingEventType eventType);
}
