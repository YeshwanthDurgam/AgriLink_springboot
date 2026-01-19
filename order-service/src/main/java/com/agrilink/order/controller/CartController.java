package com.agrilink.order.controller;

import com.agrilink.order.dto.*;
import com.agrilink.order.service.CartService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
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
    public ResponseEntity<CartDto> getCart(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(request, authentication);
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    /**
     * Add item to cart
     */
    @PostMapping("/items")
    public ResponseEntity<CartDto> addToCart(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody AddToCartRequest addRequest) {
        UUID userId = extractUserId(request, authentication);
        return ResponseEntity.ok(cartService.addToCart(userId, addRequest));
    }

    /**
     * Update cart item quantity
     */
    @PutMapping("/items/{listingId}")
    public ResponseEntity<CartDto> updateCartItem(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID listingId,
            @Valid @RequestBody UpdateCartItemRequest updateRequest) {
        UUID userId = extractUserId(request, authentication);
        return ResponseEntity.ok(cartService.updateCartItem(userId, listingId, updateRequest));
    }

    /**
     * Remove item from cart
     */
    @DeleteMapping("/items/{listingId}")
    public ResponseEntity<CartDto> removeFromCart(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID listingId) {
        UUID userId = extractUserId(request, authentication);
        return ResponseEntity.ok(cartService.removeFromCart(userId, listingId));
    }

    /**
     * Clear cart
     */
    @DeleteMapping
    public ResponseEntity<Void> clearCart(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(request, authentication);
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get cart item count
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Integer>> getCartCount(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(request, authentication);
        int count = cartService.getCartItemCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Extract user ID from JWT token stored in request attribute.
     */
    private UUID extractUserId(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
