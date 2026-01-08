package com.agrilink.marketplace.repository;

import com.agrilink.marketplace.entity.Wishlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, UUID> {

    @Query("SELECT w FROM Wishlist w JOIN FETCH w.listing WHERE w.userId = :userId")
    Page<Wishlist> findByUserIdWithListing(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT w FROM Wishlist w JOIN FETCH w.listing WHERE w.userId = :userId")
    List<Wishlist> findAllByUserIdWithListing(@Param("userId") UUID userId);

    Optional<Wishlist> findByUserIdAndListingId(UUID userId, UUID listingId);

    boolean existsByUserIdAndListingId(UUID userId, UUID listingId);

    void deleteByUserIdAndListingId(UUID userId, UUID listingId);

    void deleteByUserId(UUID userId);

    long countByUserId(UUID userId);

    @Query("SELECT w.listing.id FROM Wishlist w WHERE w.userId = :userId")
    List<UUID> findListingIdsByUserId(@Param("userId") UUID userId);
}
