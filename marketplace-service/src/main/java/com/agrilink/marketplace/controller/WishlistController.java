package com.agrilink.marketplace.controller;

import com.agrilink.marketplace.dto.WishlistItemDto;
import com.agrilink.marketplace.service.WishlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for wishlist operations.
 */
@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
@Slf4j
public class WishlistController {

    private final WishlistService wishlistService;

    /**
     * Get user's wishlist with pagination
     */
    @GetMapping
    public ResponseEntity<Page<WishlistItemDto>> getWishlist(
            Authentication authentication,
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(wishlistService.getWishlist(userId, pageable));
    }

    /**
     * Get all wishlist items (no pagination)
     */
    @GetMapping("/all")
    public ResponseEntity<List<WishlistItemDto>> getAllWishlistItems(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(wishlistService.getAllWishlistItems(userId));
    }

    /**
     * Add listing to wishlist
     */
    @PostMapping("/{listingId}")
    public ResponseEntity<WishlistItemDto> addToWishlist(
            Authentication authentication,
            @PathVariable UUID listingId) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(wishlistService.addToWishlist(userId, listingId));
    }

    /**
     * Remove listing from wishlist
     */
    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> removeFromWishlist(
            Authentication authentication,
            @PathVariable UUID listingId) {
        UUID userId = extractUserId(authentication);
        wishlistService.removeFromWishlist(userId, listingId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Check if listing is in wishlist
     */
    @GetMapping("/check/{listingId}")
    public ResponseEntity<Map<String, Boolean>> isInWishlist(
            Authentication authentication,
            @PathVariable UUID listingId) {
        UUID userId = extractUserId(authentication);
        boolean inWishlist = wishlistService.isInWishlist(userId, listingId);
        return ResponseEntity.ok(Map.of("inWishlist", inWishlist));
    }

    /**
     * Get wishlist count
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getWishlistCount(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        long count = wishlistService.getWishlistCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Get listing IDs in wishlist
     */
    @GetMapping("/ids")
    public ResponseEntity<List<UUID>> getWishlistIds(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(wishlistService.getWishlistListingIds(userId));
    }

    /**
     * Clear wishlist
     */
    @DeleteMapping
    public ResponseEntity<Void> clearWishlist(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        wishlistService.clearWishlist(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Extract user ID from JWT token (email) - generates deterministic UUID
     */
    private UUID extractUserId(Authentication authentication) {
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
