package com.agrilink.marketplace.service;

import com.agrilink.marketplace.dto.CreateListingRequest;
import com.agrilink.marketplace.dto.ListingDto;
import com.agrilink.marketplace.dto.ListingSearchCriteria;
import com.agrilink.marketplace.dto.UserPublicProfileDto;
import com.agrilink.marketplace.entity.Listing;
import com.agrilink.marketplace.repository.CategoryRepository;
import com.agrilink.marketplace.repository.ListingRepository;
import com.agrilink.marketplace.repository.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ListingService.
 */
@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @InjectMocks
    private ListingService listingService;

    private UUID sellerId;
    private UUID listingId;
    private Listing listing;
    private CreateListingRequest createRequest;

    @BeforeEach
    void setUp() {
        sellerId = UUID.randomUUID();
        listingId = UUID.randomUUID();

        listing = Listing.builder()
                .id(listingId)
                .sellerId(sellerId)
                .title("Fresh Tomatoes")
                .description("Organic fresh tomatoes")
                .cropType("Tomatoes")
                .quantity(new BigDecimal("100.00"))
                .quantityUnit("KG")
                .pricePerUnit(new BigDecimal("2.50"))
                .currency("USD")
                .organicCertified(true)
                .status(Listing.ListingStatus.DRAFT)
                .build();

        createRequest = CreateListingRequest.builder()
                .title("Fresh Tomatoes")
                .description("Organic fresh tomatoes")
                .cropType("Tomatoes")
                .quantity(new BigDecimal("100.00"))
                .pricePerUnit(new BigDecimal("2.50"))
                .organicCertified(true)
                .build();
    }

    @Test
    @DisplayName("Should create listing successfully")
    void shouldCreateListingSuccessfully() {
        // Given
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);

        // When
        ListingDto result = listingService.createListing(sellerId, createRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Fresh Tomatoes");
        assertThat(result.getSellerId()).isEqualTo(sellerId);
        verify(listingRepository).save(any(Listing.class));
    }

    @Test
    @DisplayName("Should get listing by ID")
    void shouldGetListingById() {
        // Given
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);

        // When
        ListingDto result = listingService.getListing(listingId, true);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(listingId);
    }

    @Test
    @DisplayName("Should publish listing successfully")
    void shouldPublishListingSuccessfully() {
        // Given
        Listing publishedListing = Listing.builder()
                .id(listingId)
                .sellerId(sellerId)
                .title("Fresh Tomatoes")
                .status(Listing.ListingStatus.ACTIVE)
                .build();

        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenReturn(publishedListing);

        // When
        ListingDto result = listingService.publishListing(listingId, sellerId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(Listing.ListingStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should soft delete listing")
    void shouldSoftDeleteListing() {
        // Given
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);

        // When
        listingService.deleteListing(listingId, sellerId);

        // Then
        verify(listingRepository).save(argThat(l -> l.getStatus() == Listing.ListingStatus.CANCELLED));
    }

    @Test
    @DisplayName("Should search listings with criteria")
    void shouldSearchListingsWithCriteria() {
        ListingSearchCriteria criteria = ListingSearchCriteria.builder()
                .keyword("fresh tomato")
                .minPrice(new BigDecimal("1.00"))
                .maxPrice(new BigDecimal("10.00"))
                .organicOnly(true)
                .availableOnly(true)
                .build();
        PageRequest pageable = PageRequest.of(0, 20);
        Page<Listing> page = new PageImpl<>(List.of(listing), pageable, 1);

        when(listingRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);
        when(userServiceClient.getPublicProfile(any(UUID.class))).thenReturn(UserPublicProfileDto.builder().fullName("Farmer A").build());

        Page<ListingDto> result = listingService.searchListings(criteria, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Fresh Tomatoes");
        verify(listingRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    @DisplayName("Should normalize multi-term keyword through search pipeline")
    void shouldHandleMultiTermKeywordSearch() {
        ListingSearchCriteria criteria = ListingSearchCriteria.builder()
                .keyword("fresh organic tomato")
                .build();
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Listing> page = new PageImpl<>(List.of(listing), pageable, 1);

        when(listingRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);
        when(userServiceClient.getPublicProfile(any(UUID.class))).thenReturn(UserPublicProfileDto.builder().fullName("Farmer A").build());

        Page<ListingDto> result = listingService.searchListings(criteria, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(listingRepository).findAll(any(Specification.class), eq(pageable));
    }
}
