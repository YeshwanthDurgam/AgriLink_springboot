package com.agrilink.user.controller;

import com.agrilink.user.dto.AddressDto;
import com.agrilink.user.service.AddressService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
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
    public ResponseEntity<List<AddressDto>> getAddresses(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(request, authentication);
        return ResponseEntity.ok(addressService.getUserAddresses(userId));
    }

    /**
     * Get address by ID
     */
    @GetMapping("/{addressId}")
    public ResponseEntity<AddressDto> getAddress(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID addressId) {
        UUID userId = extractUserId(request, authentication);
        return ResponseEntity.ok(addressService.getAddress(userId, addressId));
    }

    /**
     * Get default address
     */
    @GetMapping("/default")
    public ResponseEntity<AddressDto> getDefaultAddress(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(request, authentication);
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
    public ResponseEntity<List<AddressDto>> getShippingAddresses(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(request, authentication);
        return ResponseEntity.ok(addressService.getShippingAddresses(userId));
    }

    /**
     * Get billing addresses
     */
    @GetMapping("/billing")
    public ResponseEntity<List<AddressDto>> getBillingAddresses(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(request, authentication);
        return ResponseEntity.ok(addressService.getBillingAddresses(userId));
    }

    /**
     * Create new address
     */
    @PostMapping
    public ResponseEntity<AddressDto> createAddress(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody AddressDto addressDto) {
        UUID userId = extractUserId(request, authentication);
        AddressDto created = addressService.createAddress(userId, addressDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update address
     */
    @PutMapping("/{addressId}")
    public ResponseEntity<AddressDto> updateAddress(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID addressId,
            @Valid @RequestBody AddressDto addressDto) {
        UUID userId = extractUserId(request, authentication);
        return ResponseEntity.ok(addressService.updateAddress(userId, addressId, addressDto));
    }

    /**
     * Set address as default
     */
    @PatchMapping("/{addressId}/default")
    public ResponseEntity<AddressDto> setDefaultAddress(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID addressId) {
        UUID userId = extractUserId(request, authentication);
        return ResponseEntity.ok(addressService.setDefaultAddress(userId, addressId));
    }

    /**
     * Delete address
     */
    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID addressId) {
        UUID userId = extractUserId(request, authentication);
        addressService.deleteAddress(userId, addressId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get address count
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getAddressCount(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(request, authentication);
        long count = addressService.getAddressCount(userId);
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
        // Fallback to generating UUID from email (for backward compatibility)
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
