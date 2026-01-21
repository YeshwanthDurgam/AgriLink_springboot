package com.agrilink.marketplace.repository;

import com.agrilink.marketplace.entity.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Listing entity with search capabilities.
 */
@Repository
public interface ListingRepository extends JpaRepository<Listing, UUID>, JpaSpecificationExecutor<Listing> {

       @EntityGraph(attributePaths = { "images", "category" })
       Page<Listing> findByStatus(Listing.ListingStatus status, Pageable pageable);

       @EntityGraph(attributePaths = { "images", "category" })
       Page<Listing> findBySellerId(UUID sellerId, Pageable pageable);

       @EntityGraph(attributePaths = { "images", "category" })
       List<Listing> findBySellerIdAndStatus(UUID sellerId, Listing.ListingStatus status);

       @EntityGraph(attributePaths = { "images", "category" })
       Page<Listing> findByCategoryIdAndStatus(UUID categoryId, Listing.ListingStatus status, Pageable pageable);

       @EntityGraph(attributePaths = { "images", "category" })
       Optional<Listing> findById(UUID id);

       @EntityGraph(attributePaths = { "images", "category" })
       @Query("SELECT l FROM Listing l WHERE l.status = :status AND " +
                     "(LOWER(l.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                     "LOWER(l.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                     "LOWER(l.cropType) LIKE LOWER(CONCAT('%', :keyword, '%')))")
       Page<Listing> searchByKeyword(@Param("keyword") String keyword,
                     @Param("status") Listing.ListingStatus status,
                     Pageable pageable);

       @Query("SELECT l FROM Listing l WHERE l.status = 'ACTIVE' AND " +
                     "l.pricePerUnit BETWEEN :minPrice AND :maxPrice")
       Page<Listing> findByPriceRange(@Param("minPrice") BigDecimal minPrice,
                     @Param("maxPrice") BigDecimal maxPrice,
                     Pageable pageable);

       @Query("SELECT l FROM Listing l WHERE l.status = 'ACTIVE' AND l.organicCertified = true")
       Page<Listing> findOrganicListings(Pageable pageable);

       @EntityGraph(attributePaths = { "images", "category" })
       @Query("SELECT l FROM Listing l WHERE l.status = 'ACTIVE' ORDER BY l.viewCount DESC")
       List<Listing> findTopListings(Pageable pageable);

       @EntityGraph(attributePaths = { "images", "category" })
       @Query("SELECT l FROM Listing l WHERE l.status = 'ACTIVE' ORDER BY l.createdAt DESC")
       List<Listing> findRecentListings(Pageable pageable);

       @Query("SELECT COUNT(l) FROM Listing l WHERE l.sellerId = :sellerId AND l.status = :status")
       long countBySellerAndStatus(@Param("sellerId") UUID sellerId, @Param("status") Listing.ListingStatus status);

       @Query("SELECT DISTINCT l.sellerId FROM Listing l WHERE l.status = 'ACTIVE'")
       List<UUID> findDistinctSellerIds();

       @Query("SELECT COUNT(l) FROM Listing l WHERE l.sellerId = :sellerId AND l.status = 'ACTIVE'")
       int countActiveListingsBySeller(@Param("sellerId") UUID sellerId);

       @Query("SELECT AVG(l.averageRating) FROM Listing l WHERE l.sellerId = :sellerId AND l.status = 'ACTIVE' AND l.averageRating > 0")
       Double getAverageRatingBySeller(@Param("sellerId") UUID sellerId);

       @Query("SELECT SUM(l.reviewCount) FROM Listing l WHERE l.sellerId = :sellerId AND l.status = 'ACTIVE'")
       Integer getTotalReviewsBySeller(@Param("sellerId") UUID sellerId);

       @Query("SELECT l.location FROM Listing l WHERE l.sellerId = :sellerId AND l.status = 'ACTIVE' ORDER BY l.createdAt DESC LIMIT 1")
       String getLocationBySeller(@Param("sellerId") UUID sellerId);

       @Query("SELECT COUNT(l) FROM Listing l WHERE l.category.id = :categoryId AND l.status = 'ACTIVE'")
       Long countActiveListingsByCategory(@Param("categoryId") UUID categoryId);

       // Optimized batch query for seller statistics
       @Query("SELECT l.sellerId as sellerId, COUNT(l) as productCount, " +
                     "COALESCE(AVG(l.averageRating), 0) as avgRating, " +
                     "COALESCE(SUM(l.reviewCount), 0) as totalReviews, " +
                     "MAX(l.location) as location " +
                     "FROM Listing l WHERE l.sellerId IN :sellerIds AND l.status = 'ACTIVE' GROUP BY l.sellerId")
       List<Object[]> getSellerStatsBatch(@Param("sellerIds") List<UUID> sellerIds);

       // Get listings by multiple IDs with eager fetch
       @EntityGraph(attributePaths = { "images", "category" })
       @Query("SELECT l FROM Listing l WHERE l.id IN :ids")
       List<Listing> findByIdIn(@Param("ids") List<UUID> ids);
}
