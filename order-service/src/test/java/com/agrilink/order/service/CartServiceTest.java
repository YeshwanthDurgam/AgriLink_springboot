package com.agrilink.order.service;

import com.agrilink.order.dto.*;
import com.agrilink.order.entity.Cart;
import com.agrilink.order.entity.CartItem;
import com.agrilink.order.exception.ResourceNotFoundException;
import com.agrilink.order.repository.CartItemRepository;
import com.agrilink.order.repository.CartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CartService.
 */
@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @InjectMocks
    private CartService cartService;

    private UUID userId;
    private UUID listingId;
    private UUID sellerId;
    private Cart cart;
    private CartItem cartItem;
    private AddToCartRequest addToCartRequest;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        listingId = UUID.randomUUID();
        sellerId = UUID.randomUUID();

        cart = Cart.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .items(new ArrayList<>())
                .build();

        cartItem = CartItem.builder()
                .id(UUID.randomUUID())
                .cart(cart)
                .listingId(listingId)
                .sellerId(sellerId)
                .listingTitle("Fresh Tomatoes")
                .quantity(10)
                .unitPrice(new BigDecimal("2.50"))
                .unit("KG")
                .availableQuantity(100)
                .build();

        addToCartRequest = AddToCartRequest.builder()
                .listingId(listingId)
                .sellerId(sellerId)
                .listingTitle("Fresh Tomatoes")
                .quantity(10)
                .unitPrice(new BigDecimal("2.50"))
                .unit("KG")
                .availableQuantity(100)
                .build();
    }

    @Nested
    @DisplayName("Get Cart")
    class GetCartTests {

        @Test
        @DisplayName("Should return existing cart")
        void shouldReturnExistingCart() {
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.of(cart));

            CartDto result = cartService.getCart(userId);

            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(userId);
            verify(cartRepository).findByUserIdWithItems(userId);
        }

        @Test
        @DisplayName("Should create new cart if not exists")
        void shouldCreateNewCartIfNotExists() {
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.empty());
            when(cartRepository.save(any(Cart.class))).thenReturn(cart);

            CartDto result = cartService.getCart(userId);

            assertThat(result).isNotNull();
            verify(cartRepository).save(any(Cart.class));
        }
    }

    @Nested
    @DisplayName("Add to Cart")
    class AddToCartTests {

        @Test
        @DisplayName("Should add new item to cart")
        void shouldAddNewItemToCart() {
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.of(cart));
            when(cartRepository.save(any(Cart.class))).thenReturn(cart);

            CartDto result = cartService.addToCart(userId, addToCartRequest);

            assertThat(result).isNotNull();
            verify(cartRepository).save(any(Cart.class));
        }

        @Test
        @DisplayName("Should update quantity if item already in cart")
        void shouldUpdateQuantityIfItemExists() {
            cart.getItems().add(cartItem);
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.of(cart));
            when(cartRepository.save(any(Cart.class))).thenReturn(cart);

            addToCartRequest.setQuantity(5);
            CartDto result = cartService.addToCart(userId, addToCartRequest);

            assertThat(result).isNotNull();
            // Item quantity should be updated (10 + 5 = 15)
            assertThat(cartItem.getQuantity()).isEqualTo(15);
        }

        @Test
        @DisplayName("Should create cart if not exists when adding item")
        void shouldCreateCartIfNotExistsWhenAddingItem() {
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.empty());
            when(cartRepository.save(any(Cart.class))).thenReturn(cart);

            CartDto result = cartService.addToCart(userId, addToCartRequest);

            assertThat(result).isNotNull();
            verify(cartRepository, times(2)).save(any(Cart.class));
        }
    }

    @Nested
    @DisplayName("Update Cart Item")
    class UpdateCartItemTests {

        @Test
        @DisplayName("Should update cart item quantity")
        void shouldUpdateCartItemQuantity() {
            cart.getItems().add(cartItem);
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.of(cart));
            when(cartRepository.save(any(Cart.class))).thenReturn(cart);

            UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                    .quantity(20)
                    .build();

            CartDto result = cartService.updateCartItem(userId, listingId, request);

            assertThat(result).isNotNull();
            assertThat(cartItem.getQuantity()).isEqualTo(20);
        }

        @Test
        @DisplayName("Should throw exception when cart not found")
        void shouldThrowExceptionWhenCartNotFound() {
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.empty());

            UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                    .quantity(20)
                    .build();

            assertThatThrownBy(() -> cartService.updateCartItem(userId, listingId, request))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when item not in cart")
        void shouldThrowExceptionWhenItemNotInCart() {
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.of(cart));

            UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                    .quantity(20)
                    .build();

            assertThatThrownBy(() -> cartService.updateCartItem(userId, listingId, request))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Remove from Cart")
    class RemoveFromCartTests {

        @Test
        @DisplayName("Should remove item from cart")
        void shouldRemoveItemFromCart() {
            cart.getItems().add(cartItem);
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.of(cart));
            when(cartRepository.save(any(Cart.class))).thenReturn(cart);

            CartDto result = cartService.removeFromCart(userId, listingId);

            assertThat(result).isNotNull();
            assertThat(cart.getItems()).isEmpty();
        }

        @Test
        @DisplayName("Should throw exception when cart not found")
        void shouldThrowExceptionWhenCartNotFound() {
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> cartService.removeFromCart(userId, listingId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Clear Cart")
    class ClearCartTests {

        @Test
        @DisplayName("Should clear all items from cart")
        void shouldClearAllItemsFromCart() {
            cart.getItems().add(cartItem);
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.of(cart));
            when(cartRepository.save(any(Cart.class))).thenReturn(cart);

            cartService.clearCart(userId);

            assertThat(cart.getItems()).isEmpty();
            verify(cartRepository).save(cart);
        }

        @Test
        @DisplayName("Should do nothing if cart not exists")
        void shouldDoNothingIfCartNotExists() {
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.empty());

            cartService.clearCart(userId);

            verify(cartRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Get Cart Item Count")
    class GetCartItemCountTests {

        @Test
        @DisplayName("Should return cart item count")
        void shouldReturnCartItemCount() {
            cart.getItems().add(cartItem);
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.of(cart));

            int count = cartService.getCartItemCount(userId);

            // getTotalItems returns sum of quantities, not count of items
            assertThat(count).isEqualTo(10);
        }

        @Test
        @DisplayName("Should return zero when cart not exists")
        void shouldReturnZeroWhenCartNotExists() {
            when(cartRepository.findByUserIdWithItems(userId)).thenReturn(Optional.empty());

            int count = cartService.getCartItemCount(userId);

            assertThat(count).isEqualTo(0);
        }
    }
}
