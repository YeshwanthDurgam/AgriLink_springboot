package com.agrilink.user.service;

import com.agrilink.user.dto.AddressDto;
import com.agrilink.user.entity.Address;
import com.agrilink.user.exception.ResourceNotFoundException;
import com.agrilink.user.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for managing user addresses.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AddressService {

    private final AddressRepository addressRepository;

    /**
     * Get all addresses for a user
     */
    @Transactional(readOnly = true)
    public List<AddressDto> getUserAddresses(UUID userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    /**
     * Get address by ID for a user
     */
    @Transactional(readOnly = true)
    public AddressDto getAddress(UUID userId, UUID addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found: " + addressId));
        return mapToDto(address);
    }

    /**
     * Get default address for a user
     */
    @Transactional(readOnly = true)
    public AddressDto getDefaultAddress(UUID userId) {
        return addressRepository.findByUserIdAndIsDefaultTrue(userId)
                .map(this::mapToDto)
                .orElse(null);
    }

    /**
     * Get shipping addresses for a user
     */
    @Transactional(readOnly = true)
    public List<AddressDto> getShippingAddresses(UUID userId) {
        return addressRepository.findShippingAddresses(userId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    /**
     * Get billing addresses for a user
     */
    @Transactional(readOnly = true)
    public List<AddressDto> getBillingAddresses(UUID userId) {
        return addressRepository.findBillingAddresses(userId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    /**
     * Create new address for a user
     */
    public AddressDto createAddress(UUID userId, AddressDto dto) {
        Address address = mapToEntity(dto);
        address.setUserId(userId);

        // If this is the first address, make it default
        if (addressRepository.countByUserId(userId) == 0) {
            address.setDefault(true);
        }

        // If setting as default, clear other defaults
        if (dto.isDefault()) {
            address.setDefault(true);
        }

        address = addressRepository.save(address);

        // Clear other defaults if this is now default
        if (address.isDefault()) {
            addressRepository.clearDefaultForUser(userId, address.getId());
        }

        log.info("Created address {} for user {}", address.getId(), userId);
        return mapToDto(address);
    }

    /**
     * Update existing address
     */
    public AddressDto updateAddress(UUID userId, UUID addressId, AddressDto dto) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found: " + addressId));

        // Update fields
        address.setFullName(dto.getFullName());
        address.setPhoneNumber(dto.getPhoneNumber());
        address.setAddressLine1(dto.getAddressLine1());
        address.setAddressLine2(dto.getAddressLine2());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setCountry(dto.getCountry());
        address.setPostalCode(dto.getPostalCode());
        address.setDeliveryInstructions(dto.getDeliveryInstructions());
        address.setLatitude(dto.getLatitude());
        address.setLongitude(dto.getLongitude());

        if (dto.getAddressType() != null) {
            address.setAddressType(dto.getAddressType());
        }

        // Handle default setting
        if (dto.isDefault() && !address.isDefault()) {
            address.setDefault(true);
            addressRepository.clearDefaultForUser(userId, addressId);
        }

        address = addressRepository.save(address);
        log.info("Updated address {} for user {}", addressId, userId);
        return mapToDto(address);
    }

    /**
     * Set address as default
     */
    public AddressDto setDefaultAddress(UUID userId, UUID addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found: " + addressId));

        addressRepository.clearDefaultForUser(userId, addressId);
        address.setDefault(true);
        address = addressRepository.save(address);

        log.info("Set address {} as default for user {}", addressId, userId);
        return mapToDto(address);
    }

    /**
     * Delete address
     */
    public void deleteAddress(UUID userId, UUID addressId) {
        if (!addressRepository.existsByIdAndUserId(addressId, userId)) {
            throw new ResourceNotFoundException("Address not found: " + addressId);
        }

        addressRepository.deleteByIdAndUserId(addressId, userId);
        log.info("Deleted address {} for user {}", addressId, userId);
    }

    /**
     * Get address count for user
     */
    @Transactional(readOnly = true)
    public long getAddressCount(UUID userId) {
        return addressRepository.countByUserId(userId);
    }

    /**
     * Map entity to DTO
     */
    private AddressDto mapToDto(Address address) {
        return AddressDto.builder()
                .id(address.getId())
                .fullName(address.getFullName())
                .phoneNumber(address.getPhoneNumber())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .state(address.getState())
                .country(address.getCountry())
                .postalCode(address.getPostalCode())
                .addressType(address.getAddressType())
                .isDefault(address.isDefault())
                .deliveryInstructions(address.getDeliveryInstructions())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }

    /**
     * Map DTO to entity
     */
    private Address mapToEntity(AddressDto dto) {
        return Address.builder()
                .fullName(dto.getFullName())
                .phoneNumber(dto.getPhoneNumber())
                .addressLine1(dto.getAddressLine1())
                .addressLine2(dto.getAddressLine2())
                .city(dto.getCity())
                .state(dto.getState())
                .country(dto.getCountry())
                .postalCode(dto.getPostalCode())
                .addressType(dto.getAddressType() != null ? dto.getAddressType() : Address.AddressType.SHIPPING)
                .isDefault(dto.isDefault())
                .deliveryInstructions(dto.getDeliveryInstructions())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .build();
    }
}
