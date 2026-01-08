package com.agrilink.order.repository;

import com.agrilink.order.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
