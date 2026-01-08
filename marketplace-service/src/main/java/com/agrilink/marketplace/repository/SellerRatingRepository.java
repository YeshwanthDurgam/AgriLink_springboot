package com.agrilink.marketplace.repository;

import com.agrilink.marketplace.entity.SellerRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for SellerRating entity.
 */
@Repository
public interface SellerRatingRepository extends JpaRepository<SellerRating, UUID> {

    Optional<SellerRating> findBySellerId(UUID sellerId);

    boolean existsBySellerId(UUID sellerId);
}
