package com.agrilink.marketplace.service;

import com.agrilink.marketplace.dto.WishlistItemDto;
import com.agrilink.marketplace.entity.Listing;
import com.agrilink.marketplace.entity.Wishlist;
import com.agrilink.marketplace.exception.ResourceNotFoundException;
import com.agrilink.marketplace.repository.ListingRepository;
import com.agrilink.marketplace.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for wishlist operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ListingRepository listingRepository;

    /**
     * Get user's wishlist with pagination
     */
    @Transactional(readOnly = true)
    public Page<WishlistItemDto> getWishlist(UUID userId, Pageable pageable) {
        return wishlistRepository.findByUserIdWithListing(userId, pageable)
                .map(this::mapToDto);
    }

    /**
     * Get all wishlist items for user (no pagination)
     */
    @Transactional(readOnly = true)
    public List<WishlistItemDto> getAllWishlistItems(UUID userId) {
        return wishlistRepository.findAllByUserIdWithListing(userId).stream()
                .map(this::mapToDto)
                .toList();
    }

    /**
     * Add listing to wishlist
     */
    public WishlistItemDto addToWishlist(UUID userId, UUID listingId) {
        // Check if already in wishlist
        if (wishlistRepository.existsByUserIdAndListingId(userId, listingId)) {
            log.info("Listing {} already in wishlist for user {}", listingId, userId);
            Wishlist existing = wishlistRepository.findByUserIdAndListingId(userId, listingId)
                    .orElseThrow();
            return mapToDto(existing);
        }

        // Get listing
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found: " + listingId));

        // Create wishlist entry
        Wishlist wishlist = Wishlist.builder()
                .userId(userId)
                .listing(listing)
                .build();

        wishlist = wishlistRepository.save(wishlist);
        log.info("Added listing {} to wishlist for user {}", listingId, userId);
        return mapToDto(wishlist);
    }

    /**
     * Remove listing from wishlist
     */
    public void removeFromWishlist(UUID userId, UUID listingId) {
        wishlistRepository.deleteByUserIdAndListingId(userId, listingId);
        log.info("Removed listing {} from wishlist for user {}", listingId, userId);
    }

    /**
     * Check if listing is in user's wishlist
     */
    @Transactional(readOnly = true)
    public boolean isInWishlist(UUID userId, UUID listingId) {
        return wishlistRepository.existsByUserIdAndListingId(userId, listingId);
    }

    /**
     * Get wishlist count for user
     */
    @Transactional(readOnly = true)
    public long getWishlistCount(UUID userId) {
        return wishlistRepository.countByUserId(userId);
    }

    /**
     * Get list of listing IDs in user's wishlist
     */
    @Transactional(readOnly = true)
    public List<UUID> getWishlistListingIds(UUID userId) {
        return wishlistRepository.findListingIdsByUserId(userId);
    }

    /**
     * Clear user's wishlist
     */
    public void clearWishlist(UUID userId) {
        wishlistRepository.deleteByUserId(userId);
        log.info("Cleared wishlist for user {}", userId);
    }

    /**
     * Map Wishlist entity to DTO
     */
    private WishlistItemDto mapToDto(Wishlist wishlist) {
        Listing listing = wishlist.getListing();
        String imageUrl = listing.getImages().isEmpty() ? null : listing.getImages().get(0).getImageUrl();
        String categoryName = listing.getCategory() != null ? listing.getCategory().getName() : null;

        return WishlistItemDto.builder()
                .id(wishlist.getId())
                .listingId(listing.getId())
                .listingTitle(listing.getTitle())
                .listingDescription(listing.getDescription())
                .listingImageUrl(imageUrl)
                .price(listing.getPricePerUnit())
                .unit(listing.getQuantityUnit())
                .availableQuantity(listing.getQuantity().intValue())
                .categoryName(categoryName)
                .sellerId(listing.getSellerId())
                .addedAt(wishlist.getCreatedAt())
                .build();
    }
}
