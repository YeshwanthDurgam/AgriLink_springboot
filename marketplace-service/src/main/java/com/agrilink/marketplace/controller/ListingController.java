package com.agrilink.marketplace.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.common.dto.PagedResponse;
import com.agrilink.marketplace.dto.CreateListingRequest;
import com.agrilink.marketplace.dto.ListingDto;
import com.agrilink.marketplace.dto.ListingSearchCriteria;
import com.agrilink.marketplace.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for listing operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    /**
     * Create a new listing.
     * POST /api/v1/listings
     */
    @PostMapping
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<ListingDto>> createListing(
            Authentication authentication,
            @Valid @RequestBody CreateListingRequest request) {
        UUID sellerId = UUID.nameUUIDFromBytes(authentication.getName().getBytes());
        ListingDto listing = listingService.createListing(sellerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Listing created successfully", listing));
    }

    /**
     * Get listing by ID.
     * GET /api/v1/listings/{listingId}
     */
    @GetMapping("/{listingId}")
    public ResponseEntity<ApiResponse<ListingDto>> getListing(@PathVariable UUID listingId) {
        ListingDto listing = listingService.getListing(listingId, true);
        return ResponseEntity.ok(ApiResponse.success(listing));
    }

    /**
     * Search listings with advanced filters.
     * GET /api/v1/listings/search
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PagedResponse<ListingDto>>> searchListings(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) List<UUID> categoryIds,
            @RequestParam(required = false) String cropType,
            @RequestParam(required = false) List<String> cropTypes,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Boolean organicOnly,
            @RequestParam(required = false) String qualityGrade,
            @RequestParam(required = false) List<String> qualityGrades,
            @RequestParam(required = false) BigDecimal minQuantity,
            @RequestParam(required = false) BigDecimal maxQuantity,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Boolean hasImages,
            @RequestParam(required = false) BigDecimal latitude,
            @RequestParam(required = false) BigDecimal longitude,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        ListingSearchCriteria criteria = ListingSearchCriteria.builder()
                .keyword(keyword)
                .categoryId(categoryId)
                .categoryIds(categoryIds)
                .cropType(cropType)
                .cropTypes(cropTypes)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .location(location)
                .organicOnly(organicOnly)
                .qualityGrade(qualityGrade)
                .qualityGrades(qualityGrades)
                .minQuantity(minQuantity)
                .maxQuantity(maxQuantity)
                .minRating(minRating)
                .hasImages(hasImages)
                .latitude(latitude)
                .longitude(longitude)
                .radiusKm(radiusKm)
                .build();

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ListingDto> listings = listingService.searchListings(criteria, pageable);
        PagedResponse<ListingDto> response = PagedResponse.of(listings);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get active listings.
     * GET /api/v1/listings
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ListingDto>>> getActiveListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ListingDto> listings = listingService.getActiveListings(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(listings)));
    }

    /**
     * Get listings by category.
     * GET /api/v1/listings/category/{categoryId}
     */
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<PagedResponse<ListingDto>>> getListingsByCategory(
            @PathVariable UUID categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ListingDto> listings = listingService.getListingsByCategory(categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(listings)));
    }

    /**
     * Get top listings.
     * GET /api/v1/listings/top
     */
    @GetMapping("/top")
    public ResponseEntity<ApiResponse<List<ListingDto>>> getTopListings(
            @RequestParam(defaultValue = "10") int limit) {
        List<ListingDto> listings = listingService.getTopListings(limit);
        return ResponseEntity.ok(ApiResponse.success(listings));
    }

    /**
     * Get recent listings.
     * GET /api/v1/listings/recent
     */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<ListingDto>>> getRecentListings(
            @RequestParam(defaultValue = "10") int limit) {
        List<ListingDto> listings = listingService.getRecentListings(limit);
        return ResponseEntity.ok(ApiResponse.success(listings));
    }

    /**
     * Get my listings.
     * GET /api/v1/listings/my
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<PagedResponse<ListingDto>>> getMyListings(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID sellerId = UUID.nameUUIDFromBytes(authentication.getName().getBytes());
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ListingDto> listings = listingService.getListingsBySeller(sellerId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(listings)));
    }

    /**
     * Update listing.
     * PUT /api/v1/listings/{listingId}
     */
    @PutMapping("/{listingId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<ListingDto>> updateListing(
            Authentication authentication,
            @PathVariable UUID listingId,
            @Valid @RequestBody CreateListingRequest request) {
        UUID sellerId = UUID.nameUUIDFromBytes(authentication.getName().getBytes());
        ListingDto listing = listingService.updateListing(listingId, sellerId, request);
        return ResponseEntity.ok(ApiResponse.success("Listing updated successfully", listing));
    }

    /**
     * Publish listing.
     * POST /api/v1/listings/{listingId}/publish
     */
    @PostMapping("/{listingId}/publish")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<ListingDto>> publishListing(
            Authentication authentication,
            @PathVariable UUID listingId) {
        UUID sellerId = UUID.nameUUIDFromBytes(authentication.getName().getBytes());
        ListingDto listing = listingService.publishListing(listingId, sellerId);
        return ResponseEntity.ok(ApiResponse.success("Listing published successfully", listing));
    }

    /**
     * Delete listing.
     * DELETE /api/v1/listings/{listingId}
     */
    @DeleteMapping("/{listingId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<Void>> deleteListing(
            Authentication authentication,
            @PathVariable UUID listingId) {
        UUID sellerId = UUID.nameUUIDFromBytes(authentication.getName().getBytes());
        listingService.deleteListing(listingId, sellerId);
        return ResponseEntity.ok(ApiResponse.success("Listing deleted successfully"));
    }
}
