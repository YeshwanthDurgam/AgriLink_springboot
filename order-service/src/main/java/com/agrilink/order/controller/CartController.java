package com.agrilink.order.controller;

import com.agrilink.order.dto.*;
import com.agrilink.order.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for cart operations.
 */
@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Slf4j
public class CartController {

    private final CartService cartService;

    /**
     * Get current user's cart
     */
    @GetMapping
    public ResponseEntity<CartDto> getCart(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    /**
     * Add item to cart
     */
    @PostMapping("/items")
    public ResponseEntity<CartDto> addToCart(
            Authentication authentication,
            @Valid @RequestBody AddToCartRequest request) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(cartService.addToCart(userId, request));
    }

    /**
     * Update cart item quantity
     */
    @PutMapping("/items/{listingId}")
    public ResponseEntity<CartDto> updateCartItem(
            Authentication authentication,
            @PathVariable UUID listingId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(cartService.updateCartItem(userId, listingId, request));
    }

    /**
     * Remove item from cart
     */
    @DeleteMapping("/items/{listingId}")
    public ResponseEntity<CartDto> removeFromCart(
            Authentication authentication,
            @PathVariable UUID listingId) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(cartService.removeFromCart(userId, listingId));
    }

    /**
     * Clear cart
     */
    @DeleteMapping
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get cart item count
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Integer>> getCartCount(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        int count = cartService.getCartItemCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Extract user ID from JWT token (email) - generates deterministic UUID
     */
    private UUID extractUserId(Authentication authentication) {
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
