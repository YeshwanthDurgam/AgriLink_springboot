package com.agrilink.user.controller;

import com.agrilink.user.dto.AddressDto;
import com.agrilink.user.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for address management.
 */
@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
@Slf4j
public class AddressController {

    private final AddressService addressService;

    /**
     * Get all addresses for current user
     */
    @GetMapping
    public ResponseEntity<List<AddressDto>> getAddresses(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(addressService.getUserAddresses(userId));
    }

    /**
     * Get address by ID
     */
    @GetMapping("/{addressId}")
    public ResponseEntity<AddressDto> getAddress(
            Authentication authentication,
            @PathVariable UUID addressId) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(addressService.getAddress(userId, addressId));
    }

    /**
     * Get default address
     */
    @GetMapping("/default")
    public ResponseEntity<AddressDto> getDefaultAddress(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        AddressDto defaultAddress = addressService.getDefaultAddress(userId);
        if (defaultAddress == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(defaultAddress);
    }

    /**
     * Get shipping addresses
     */
    @GetMapping("/shipping")
    public ResponseEntity<List<AddressDto>> getShippingAddresses(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(addressService.getShippingAddresses(userId));
    }

    /**
     * Get billing addresses
     */
    @GetMapping("/billing")
    public ResponseEntity<List<AddressDto>> getBillingAddresses(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(addressService.getBillingAddresses(userId));
    }

    /**
     * Create new address
     */
    @PostMapping
    public ResponseEntity<AddressDto> createAddress(
            Authentication authentication,
            @Valid @RequestBody AddressDto addressDto) {
        UUID userId = extractUserId(authentication);
        AddressDto created = addressService.createAddress(userId, addressDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update address
     */
    @PutMapping("/{addressId}")
    public ResponseEntity<AddressDto> updateAddress(
            Authentication authentication,
            @PathVariable UUID addressId,
            @Valid @RequestBody AddressDto addressDto) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(addressService.updateAddress(userId, addressId, addressDto));
    }

    /**
     * Set address as default
     */
    @PatchMapping("/{addressId}/default")
    public ResponseEntity<AddressDto> setDefaultAddress(
            Authentication authentication,
            @PathVariable UUID addressId) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(addressService.setDefaultAddress(userId, addressId));
    }

    /**
     * Delete address
     */
    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            Authentication authentication,
            @PathVariable UUID addressId) {
        UUID userId = extractUserId(authentication);
        addressService.deleteAddress(userId, addressId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get address count
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getAddressCount(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        long count = addressService.getAddressCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Extract user ID from JWT token - generates deterministic UUID from email
     */
    private UUID extractUserId(Authentication authentication) {
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
