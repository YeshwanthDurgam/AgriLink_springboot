package com.agrilink.marketplace.repository;

import com.agrilink.marketplace.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Review entity.
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Page<Review> findByListingId(UUID listingId, Pageable pageable);

    Page<Review> findByListingIdOrderByCreatedAtDesc(UUID listingId, Pageable pageable);

    Page<Review> findBySellerId(UUID sellerId, Pageable pageable);

    List<Review> findByReviewerId(UUID reviewerId);

    Optional<Review> findByListingIdAndReviewerId(UUID listingId, UUID reviewerId);

    Optional<Review> findByListingIdAndReviewerIdAndOrderId(UUID listingId, UUID reviewerId, UUID orderId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.sellerId = :sellerId")
    Double getAverageRatingBySeller(@Param("sellerId") UUID sellerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.listing.id = :listingId")
    Double getAverageRatingByListing(@Param("listingId") UUID listingId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.sellerId = :sellerId")
    long countBySellerId(@Param("sellerId") UUID sellerId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.listing.id = :listingId")
    long countByListingId(@Param("listingId") UUID listingId);

    boolean existsByListingIdAndReviewerId(UUID listingId, UUID reviewerId);

    boolean existsByListingIdAndReviewerIdAndOrderId(UUID listingId, UUID reviewerId, UUID orderId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.listing.id = :listingId GROUP BY r.rating")
    List<Object[]> getRatingDistributionByListing(@Param("listingId") UUID listingId);
}
