package com.agrilink.marketplace.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.common.dto.PagedResponse;
import com.agrilink.marketplace.dto.CreateListingRequest;
import com.agrilink.marketplace.dto.ListingDto;
import com.agrilink.marketplace.dto.ListingSearchCriteria;
import com.agrilink.marketplace.dto.PriceUpdateProposalDto;
import com.agrilink.marketplace.service.ListingService;
import com.agrilink.marketplace.service.PriceUpdateApprovalService;
import jakarta.servlet.http.HttpServletRequest;
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
import java.util.Set;
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

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt",
            "pricePerUnit",
            "averageRating",
            "title",
            "quantity"
    );

    private final ListingService listingService;
    private final PriceUpdateApprovalService priceUpdateApprovalService;

    /**
     * Helper method to get seller ID from JWT token stored in request attribute.
     */
    private UUID getSellerIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (userIdStr != null) {
            return UUID.fromString(userIdStr);
        }
        // Fallback to generating UUID from email (for backward compatibility)
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }

    /**
     * Create a new listing.
     * POST /api/v1/listings
     */
    @PostMapping
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<ListingDto>> createListing(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody CreateListingRequest createRequest) {
        UUID sellerId = getSellerIdFromRequest(request, authentication);
        ListingDto listing = listingService.createListing(sellerId, createRequest);
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
            @RequestParam(required = false) UUID sellerId,
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

            String normalizedKeyword = normalizeKeyword(keyword);
            String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
            String safeSortDir = "asc".equalsIgnoreCase(sortDir) ? "asc" : "desc";

        ListingSearchCriteria criteria = ListingSearchCriteria.builder()
                .keyword(normalizedKeyword)
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
                .sellerId(sellerId)
                .minQuantity(minQuantity)
                .maxQuantity(maxQuantity)
                .minRating(minRating)
                .hasImages(hasImages)
                .latitude(latitude)
                .longitude(longitude)
                .radiusKm(radiusKm)
                .build();

            Sort sort = "asc".equals(safeSortDir) ? Sort.by(safeSortBy).ascending() : Sort.by(safeSortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ListingDto> listings = listingService.searchListings(criteria, pageable);
        PagedResponse<ListingDto> response = PagedResponse.of(listings);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String normalized = keyword.trim().replaceAll("\\s+", " ");
        return normalized.isEmpty() ? null : normalized;
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
            HttpServletRequest request,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID sellerId = getSellerIdFromRequest(request, authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ListingDto> listings = listingService.getListingsBySeller(sellerId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(listings)));
    }

    /**
     * Get pending automated price update proposals for the authenticated farmer.
     * GET /api/v1/listings/price-updates/pending
     */
    @GetMapping("/price-updates/pending")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<PagedResponse<PriceUpdateProposalDto>>> getPendingPriceUpdates(
            HttpServletRequest request,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID sellerId = getSellerIdFromRequest(request, authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PriceUpdateProposalDto> proposals = priceUpdateApprovalService.getPendingProposals(sellerId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(proposals)));
    }

    /**
     * Approve a suggested market-driven price update.
     * POST /api/v1/listings/price-updates/{proposalId}/allow
     */
    @PostMapping("/price-updates/{proposalId}/allow")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<PriceUpdateProposalDto>> allowPriceUpdate(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID proposalId) {
        UUID sellerId = getSellerIdFromRequest(request, authentication);
        PriceUpdateProposalDto updated = priceUpdateApprovalService.allowPriceUpdate(proposalId, sellerId);
        return ResponseEntity.ok(ApiResponse.success("Price update approved", updated));
    }

    /**
     * Reject a suggested market-driven price update.
     * POST /api/v1/listings/price-updates/{proposalId}/deny
     */
    @PostMapping("/price-updates/{proposalId}/deny")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<PriceUpdateProposalDto>> denyPriceUpdate(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID proposalId) {
        UUID sellerId = getSellerIdFromRequest(request, authentication);
        PriceUpdateProposalDto updated = priceUpdateApprovalService.denyPriceUpdate(proposalId, sellerId);
        return ResponseEntity.ok(ApiResponse.success("Price update denied", updated));
    }

    /**
     * Update listing.
     * PUT /api/v1/listings/{listingId}
     */
    @PutMapping("/{listingId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<ListingDto>> updateListing(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID listingId,
            @Valid @RequestBody CreateListingRequest updateRequest) {
        UUID sellerId = getSellerIdFromRequest(request, authentication);
        ListingDto listing = listingService.updateListing(listingId, sellerId, updateRequest);
        return ResponseEntity.ok(ApiResponse.success("Listing updated successfully", listing));
    }

    /**
     * Publish listing.
     * POST /api/v1/listings/{listingId}/publish
     */
    @PostMapping("/{listingId}/publish")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<ListingDto>> publishListing(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID listingId) {
        UUID sellerId = getSellerIdFromRequest(request, authentication);
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
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID listingId) {
        UUID sellerId = getSellerIdFromRequest(request, authentication);
        listingService.deleteListing(listingId, sellerId);
        return ResponseEntity.ok(ApiResponse.success("Listing deleted successfully"));
    }

    /**
     * Get all sellers (farmers) with their product statistics.
     * GET /api/v1/listings/sellers
     */
    @GetMapping("/sellers")
    public ResponseEntity<ApiResponse<List<com.agrilink.marketplace.dto.SellerDto>>> getSellers() {
        List<com.agrilink.marketplace.dto.SellerDto> sellers = listingService.getSellers();
        return ResponseEntity.ok(ApiResponse.success(sellers));
    }

    /**
     * Admin: Get pending listings for approval.
     * GET /api/v1/listings/admin/pending
     */
    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<ListingDto>>> getPendingListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ListingDto> listings = listingService.getPendingListings(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(listings)));
    }

    /**
     * Admin: Approve a listing (changes status from DRAFT to ACTIVE for customer visibility).
     * POST /api/v1/listings/admin/{listingId}/approve
     */
    @PostMapping("/admin/{listingId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ListingDto>> approveListing(@PathVariable UUID listingId) {
        ListingDto listing = listingService.updateListingStatus(listingId, Listing.ListingStatus.ACTIVE);
        return ResponseEntity.ok(ApiResponse.success("Listing approved and activated successfully", listing));
    }

    /**
     * Admin: Suspend/Reject a listing with reason.
     * POST /api/v1/listings/admin/{listingId}/suspend
     */
    @PostMapping("/admin/{listingId}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ListingDto>> suspendListing(
            @PathVariable UUID listingId,
            @RequestParam(required = false) String reason) {
        ListingDto listing = listingService.suspendListing(listingId, reason);
        return ResponseEntity.ok(ApiResponse.success("Listing suspended successfully", listing));
    }
}
