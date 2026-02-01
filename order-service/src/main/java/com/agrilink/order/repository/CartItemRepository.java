package com.agrilink.order.repository;

import com.agrilink.order.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

    List<CartItem> findByCartId(UUID cartId);

    Optional<CartItem> findByCartIdAndListingId(UUID cartId, UUID listingId);

    void deleteByCartIdAndListingId(UUID cartId, UUID listingId);

    void deleteByCartId(UUID cartId);

    boolean existsByCartIdAndListingId(UUID cartId, UUID listingId);

    /**
     * Count cart items by user ID - efficient query without loading items
     */
    @Query("SELECT COUNT(ci) FROM CartItem ci WHERE ci.cart.userId = :userId")
    int countByCartUserId(@Param("userId") UUID userId);
}
