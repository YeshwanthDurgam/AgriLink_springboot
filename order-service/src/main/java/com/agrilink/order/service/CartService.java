package com.agrilink.order.service;

import com.agrilink.order.dto.*;
import com.agrilink.order.entity.Cart;
import com.agrilink.order.entity.CartItem;
import com.agrilink.order.exception.ResourceNotFoundException;
import com.agrilink.order.repository.CartItemRepository;
import com.agrilink.order.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for cart operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    /**
     * Get or create cart for user
     */
    public CartDto getCart(UUID userId) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseGet(() -> createCart(userId));
        return mapToDto(cart);
    }

    /**
     * Add item to cart
     */
    public CartDto addToCart(UUID userId, AddToCartRequest request) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseGet(() -> createCart(userId));

        // Check if item already exists in cart
        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getListingId().equals(request.getListingId()))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            // Update quantity
            existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
            existingItem.setUnitPrice(request.getUnitPrice());
            existingItem.setAvailableQuantity(request.getAvailableQuantity());
        } else {
            // Create new cart item
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .listingId(request.getListingId())
                    .sellerId(request.getSellerId())
                    .listingTitle(request.getListingTitle())
                    .listingImageUrl(request.getListingImageUrl())
                    .quantity(request.getQuantity())
                    .unitPrice(request.getUnitPrice())
                    .unit(request.getUnit())
                    .availableQuantity(request.getAvailableQuantity())
                    .build();
            cart.getItems().add(newItem);
        }

        cart = cartRepository.save(cart);
        log.info("Added item {} to cart for user {}", request.getListingId(), userId);
        return mapToDto(cart);
    }

    /**
     * Update cart item quantity
     */
    public CartDto updateCartItem(UUID userId, UUID listingId, UpdateCartItemRequest request) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getListingId().equals(listingId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        item.setQuantity(request.getQuantity());
        cart = cartRepository.save(cart);
        log.info("Updated item {} quantity to {} for user {}", listingId, request.getQuantity(), userId);
        return mapToDto(cart);
    }

    /**
     * Remove item from cart
     */
    public CartDto removeFromCart(UUID userId, UUID listingId) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        cart.getItems().removeIf(item -> item.getListingId().equals(listingId));
        cart = cartRepository.save(cart);
        log.info("Removed item {} from cart for user {}", listingId, userId);
        return mapToDto(cart);
    }

    /**
     * Clear all items from cart
     */
    public void clearCart(UUID userId) {
        Cart cart = cartRepository.findByUserIdWithItems(userId).orElse(null);
        if (cart != null) {
            cart.getItems().clear();
            cartRepository.save(cart);
            log.info("Cleared cart for user {}", userId);
        }
    }

    /**
     * Get cart item count - OPTIMIZED: doesn't load all items
     */
    @Transactional(readOnly = true)
    public int getCartItemCount(UUID userId) {
        return cartItemRepository.countByCartUserId(userId);
    }

    /**
     * Create new cart for user
     */
    private Cart createCart(UUID userId) {
        Cart cart = Cart.builder()
                .userId(userId)
                .build();
        return cartRepository.save(cart);
    }

    /**
     * Map Cart entity to DTO
     */
    private CartDto mapToDto(Cart cart) {
        List<CartItemDto> itemDtos = cart.getItems().stream()
                .map(this::mapItemToDto)
                .collect(Collectors.toList());

        return CartDto.builder()
                .id(cart.getId())
                .userId(cart.getUserId())
                .items(itemDtos)
                .totalAmount(cart.getTotalAmount())
                .totalItems(cart.getTotalItems())
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt())
                .build();
    }

    /**
     * Map CartItem entity to DTO
     */
    private CartItemDto mapItemToDto(CartItem item) {
        return CartItemDto.builder()
                .id(item.getId())
                .listingId(item.getListingId())
                .sellerId(item.getSellerId())
                .listingTitle(item.getListingTitle())
                .listingImageUrl(item.getListingImageUrl())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .unit(item.getUnit())
                .availableQuantity(item.getAvailableQuantity())
                .subtotal(item.getSubtotal())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
