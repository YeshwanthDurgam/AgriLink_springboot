package com.agrilink.user.service;

import com.agrilink.user.dto.AddressDto;
import com.agrilink.user.entity.Address;
import com.agrilink.user.exception.ResourceNotFoundException;
import com.agrilink.user.repository.AddressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AddressService.
 */
@ExtendWith(MockitoExtension.class)
class AddressServiceTest {

    @Mock
    private AddressRepository addressRepository;

    @InjectMocks
    private AddressService addressService;

    private UUID userId;
    private UUID addressId;
    private Address address;
    private AddressDto addressDto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        addressId = UUID.randomUUID();

        address = Address.builder()
                .id(addressId)
                .userId(userId)
                .fullName("John Doe")
                .phoneNumber("+1234567890")
                .addressLine1("123 Main St")
                .addressLine2("Apt 4B")
                .city("New York")
                .state("NY")
                .country("USA")
                .postalCode("10001")
                .isDefault(true)
                .addressType(Address.AddressType.SHIPPING)
                .build();

        addressDto = AddressDto.builder()
                .fullName("John Doe")
                .phoneNumber("+1234567890")
                .addressLine1("123 Main St")
                .addressLine2("Apt 4B")
                .city("New York")
                .state("NY")
                .country("USA")
                .postalCode("10001")
                .isDefault(true)
                .addressType(Address.AddressType.SHIPPING)
                .build();
    }

    @Nested
    @DisplayName("Get User Addresses")
    class GetUserAddressesTests {

        @Test
        @DisplayName("Should return all addresses for user")
        void shouldReturnAllAddressesForUser() {
            when(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId))
                    .thenReturn(List.of(address));

            List<AddressDto> result = addressService.getUserAddresses(userId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getFullName()).isEqualTo("John Doe");
            assertThat(result.get(0).getCity()).isEqualTo("New York");
        }

        @Test
        @DisplayName("Should return empty list when user has no addresses")
        void shouldReturnEmptyListWhenNoAddresses() {
            when(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId))
                    .thenReturn(List.of());

            List<AddressDto> result = addressService.getUserAddresses(userId);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Address by ID")
    class GetAddressByIdTests {

        @Test
        @DisplayName("Should return address when found")
        void shouldReturnAddressWhenFound() {
            when(addressRepository.findByIdAndUserId(addressId, userId))
                    .thenReturn(Optional.of(address));

            AddressDto result = addressService.getAddress(userId, addressId);

            assertThat(result).isNotNull();
            assertThat(result.getFullName()).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should throw exception when address not found")
        void shouldThrowExceptionWhenNotFound() {
            when(addressRepository.findByIdAndUserId(addressId, userId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> addressService.getAddress(userId, addressId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Get Default Address")
    class GetDefaultAddressTests {

        @Test
        @DisplayName("Should return default address when exists")
        void shouldReturnDefaultAddressWhenExists() {
            when(addressRepository.findByUserIdAndIsDefaultTrue(userId))
                    .thenReturn(Optional.of(address));

            AddressDto result = addressService.getDefaultAddress(userId);

            assertThat(result).isNotNull();
            assertThat(result.isDefault()).isTrue();
        }

        @Test
        @DisplayName("Should return null when no default address")
        void shouldReturnNullWhenNoDefaultAddress() {
            when(addressRepository.findByUserIdAndIsDefaultTrue(userId))
                    .thenReturn(Optional.empty());

            AddressDto result = addressService.getDefaultAddress(userId);

            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Create Address")
    class CreateAddressTests {

        @Test
        @DisplayName("Should create first address as default")
        void shouldCreateFirstAddressAsDefault() {
            when(addressRepository.countByUserId(userId)).thenReturn(0L);
            when(addressRepository.save(any(Address.class))).thenReturn(address);

            AddressDto result = addressService.createAddress(userId, addressDto);

            assertThat(result).isNotNull();
            verify(addressRepository).save(any(Address.class));
        }

        @Test
        @DisplayName("Should create address and clear other defaults if setting as default")
        void shouldClearOtherDefaultsWhenSettingDefault() {
            addressDto.setDefault(true);
            when(addressRepository.countByUserId(userId)).thenReturn(1L);
            when(addressRepository.save(any(Address.class))).thenReturn(address);

            AddressDto result = addressService.createAddress(userId, addressDto);

            assertThat(result).isNotNull();
            verify(addressRepository).clearDefaultForUser(userId, addressId);
        }
    }

    @Nested
    @DisplayName("Update Address")
    class UpdateAddressTests {

        @Test
        @DisplayName("Should update address successfully")
        void shouldUpdateAddressSuccessfully() {
            addressDto.setCity("Los Angeles");
            when(addressRepository.findByIdAndUserId(addressId, userId))
                    .thenReturn(Optional.of(address));
            when(addressRepository.save(any(Address.class))).thenReturn(address);

            AddressDto result = addressService.updateAddress(userId, addressId, addressDto);

            assertThat(result).isNotNull();
            verify(addressRepository).save(any(Address.class));
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent address")
        void shouldThrowExceptionWhenUpdatingNonExistent() {
            when(addressRepository.findByIdAndUserId(addressId, userId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> addressService.updateAddress(userId, addressId, addressDto))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Delete Address")
    class DeleteAddressTests {

        @Test
        @DisplayName("Should delete address successfully")
        void shouldDeleteAddressSuccessfully() {
            when(addressRepository.existsByIdAndUserId(addressId, userId))
                    .thenReturn(true);

            addressService.deleteAddress(userId, addressId);

            verify(addressRepository).deleteByIdAndUserId(addressId, userId);
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent address")
        void shouldThrowExceptionWhenDeletingNonExistent() {
            when(addressRepository.existsByIdAndUserId(addressId, userId))
                    .thenReturn(false);

            assertThatThrownBy(() -> addressService.deleteAddress(userId, addressId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Get Shipping Addresses")
    class GetShippingAddressesTests {

        @Test
        @DisplayName("Should return shipping addresses")
        void shouldReturnShippingAddresses() {
            when(addressRepository.findShippingAddresses(userId))
                    .thenReturn(List.of(address));

            List<AddressDto> result = addressService.getShippingAddresses(userId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getAddressType()).isEqualTo(Address.AddressType.SHIPPING);
        }
    }

    @Nested
    @DisplayName("Get Billing Addresses")
    class GetBillingAddressesTests {

        @Test
        @DisplayName("Should return billing addresses")
        void shouldReturnBillingAddresses() {
            address.setAddressType(Address.AddressType.BILLING);
            when(addressRepository.findBillingAddresses(userId))
                    .thenReturn(List.of(address));

            List<AddressDto> result = addressService.getBillingAddresses(userId);

            assertThat(result).hasSize(1);
        }
    }
}
