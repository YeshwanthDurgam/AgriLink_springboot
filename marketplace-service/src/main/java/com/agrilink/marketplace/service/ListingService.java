package com.agrilink.marketplace.service;

import com.agrilink.common.exception.ForbiddenException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.marketplace.dto.*;
import com.agrilink.marketplace.entity.Category;
import com.agrilink.marketplace.entity.Listing;
import com.agrilink.marketplace.entity.ListingImage;
import com.agrilink.marketplace.repository.CategoryRepository;
import com.agrilink.marketplace.repository.ListingRepository;
import com.agrilink.marketplace.repository.ReviewRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for listing operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;

    /**
     * Create a new listing.
     */
    @Transactional
    public ListingDto createListing(UUID sellerId, CreateListingRequest request) {
        log.info("Creating listing for seller: {}", sellerId);

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        }

        Listing listing = Listing.builder()
                .sellerId(sellerId)
                .farmId(request.getFarmId())
                .category(category)
                .title(request.getTitle())
                .description(request.getDescription())
                .cropType(request.getCropType())
                .quantity(request.getQuantity())
                .quantityUnit(request.getQuantityUnit() != null ? request.getQuantityUnit() : "KG")
                .pricePerUnit(request.getPricePerUnit())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .minimumOrder(request.getMinimumOrder())
                .harvestDate(request.getHarvestDate())
                .expiryDate(request.getExpiryDate())
                .location(request.getLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .organicCertified(request.isOrganicCertified())
                .qualityGrade(request.getQualityGrade())
                .status(Listing.ListingStatus.DRAFT)
                .build();

        // Add images
        if (request.getImageUrls() != null) {
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                ListingImage image = ListingImage.builder()
                        .imageUrl(request.getImageUrls().get(i))
                        .primary(i == 0)
                        .sortOrder(i)
                        .build();
                listing.addImage(image);
            }
        }

        Listing savedListing = listingRepository.save(listing);
        log.info("Listing created with id: {}", savedListing.getId());

        return mapToDto(savedListing);
    }

    /**
     * Get listing by ID.
     */
    @Transactional
    public ListingDto getListing(UUID listingId, boolean incrementView) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));

        if (incrementView) {
            listing.setViewCount(listing.getViewCount() + 1);
            listingRepository.save(listing);
        }

        return mapToDto(listing);
    }

    /**
     * Search listings with criteria.
     */
    @Transactional(readOnly = true)
    public Page<ListingDto> searchListings(ListingSearchCriteria criteria, Pageable pageable) {
        Specification<Listing> spec = buildSpecification(criteria);
        return listingRepository.findAll(spec, pageable).map(this::mapToDto);
    }

    /**
     * Get active listings with pagination.
     */
    @Transactional(readOnly = true)
    public Page<ListingDto> getActiveListings(Pageable pageable) {
        return listingRepository.findByStatus(Listing.ListingStatus.ACTIVE, pageable)
                .map(this::mapToDto);
    }

    /**
     * Get listings by seller.
     */
    @Transactional(readOnly = true)
    public Page<ListingDto> getListingsBySeller(UUID sellerId, Pageable pageable) {
        return listingRepository.findBySellerId(sellerId, pageable)
                .map(this::mapToDto);
    }

    /**
     * Get listings by category.
     */
    @Transactional(readOnly = true)
    public Page<ListingDto> getListingsByCategory(UUID categoryId, Pageable pageable) {
        return listingRepository.findByCategoryIdAndStatus(categoryId, Listing.ListingStatus.ACTIVE, pageable)
                .map(this::mapToDto);
    }

    /**
     * Update listing.
     */
    @Transactional
    public ListingDto updateListing(UUID listingId, UUID sellerId, CreateListingRequest request) {
        log.info("Updating listing: {}", listingId);

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));

        if (!listing.getSellerId().equals(sellerId)) {
            throw new ForbiddenException("You don't have permission to update this listing");
        }

        if (request.getTitle() != null) listing.setTitle(request.getTitle());
        if (request.getDescription() != null) listing.setDescription(request.getDescription());
        if (request.getCropType() != null) listing.setCropType(request.getCropType());
        if (request.getQuantity() != null) listing.setQuantity(request.getQuantity());
        if (request.getQuantityUnit() != null) listing.setQuantityUnit(request.getQuantityUnit());
        if (request.getPricePerUnit() != null) listing.setPricePerUnit(request.getPricePerUnit());
        if (request.getCurrency() != null) listing.setCurrency(request.getCurrency());
        if (request.getMinimumOrder() != null) listing.setMinimumOrder(request.getMinimumOrder());
        if (request.getHarvestDate() != null) listing.setHarvestDate(request.getHarvestDate());
        if (request.getExpiryDate() != null) listing.setExpiryDate(request.getExpiryDate());
        if (request.getLocation() != null) listing.setLocation(request.getLocation());
        if (request.getLatitude() != null) listing.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) listing.setLongitude(request.getLongitude());
        listing.setOrganicCertified(request.isOrganicCertified());
        if (request.getQualityGrade() != null) listing.setQualityGrade(request.getQualityGrade());

        Listing updatedListing = listingRepository.save(listing);
        return mapToDto(updatedListing);
    }

    /**
     * Publish listing (change status to ACTIVE).
     */
    @Transactional
    public ListingDto publishListing(UUID listingId, UUID sellerId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));

        if (!listing.getSellerId().equals(sellerId)) {
            throw new ForbiddenException("You don't have permission to publish this listing");
        }

        listing.setStatus(Listing.ListingStatus.ACTIVE);
        Listing updatedListing = listingRepository.save(listing);
        return mapToDto(updatedListing);
    }

    /**
     * Delete listing.
     */
    @Transactional
    public void deleteListing(UUID listingId, UUID sellerId) {
        log.info("Deleting listing: {}", listingId);

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));

        if (!listing.getSellerId().equals(sellerId)) {
            throw new ForbiddenException("You don't have permission to delete this listing");
        }

        listing.setStatus(Listing.ListingStatus.CANCELLED);
        listingRepository.save(listing);
    }

    /**
     * Get top listings by views.
     */
    @Transactional(readOnly = true)
    public List<ListingDto> getTopListings(int limit) {
        return listingRepository.findTopListings(PageRequest.of(0, limit)).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get recent listings.
     */
    @Transactional(readOnly = true)
    public List<ListingDto> getRecentListings(int limit) {
        return listingRepository.findRecentListings(PageRequest.of(0, limit)).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private Specification<Listing> buildSpecification(ListingSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Only active listings by default (unless availableOnly is false)
            if (!Boolean.FALSE.equals(criteria.getAvailableOnly())) {
                predicates.add(cb.equal(root.get("status"), Listing.ListingStatus.ACTIVE));
            }

            if (criteria.getKeyword() != null && !criteria.getKeyword().isEmpty()) {
                String keyword = "%" + criteria.getKeyword().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), keyword),
                        cb.like(cb.lower(root.get("description")), keyword),
                        cb.like(cb.lower(root.get("cropType")), keyword)
                ));
            }

            if (criteria.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), criteria.getCategoryId()));
            }
            
            if (criteria.getCategoryIds() != null && !criteria.getCategoryIds().isEmpty()) {
                predicates.add(root.get("category").get("id").in(criteria.getCategoryIds()));
            }

            if (criteria.getCropType() != null) {
                predicates.add(cb.equal(root.get("cropType"), criteria.getCropType()));
            }
            
            if (criteria.getCropTypes() != null && !criteria.getCropTypes().isEmpty()) {
                predicates.add(root.get("cropType").in(criteria.getCropTypes()));
            }

            if (criteria.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("pricePerUnit"), criteria.getMinPrice()));
            }

            if (criteria.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerUnit"), criteria.getMaxPrice()));
            }

            if (criteria.getLocation() != null) {
                predicates.add(cb.like(cb.lower(root.get("location")), "%" + criteria.getLocation().toLowerCase() + "%"));
            }

            if (Boolean.TRUE.equals(criteria.getOrganicOnly())) {
                predicates.add(cb.isTrue(root.get("organicCertified")));
            }

            if (criteria.getQualityGrade() != null) {
                predicates.add(cb.equal(root.get("qualityGrade"), criteria.getQualityGrade()));
            }
            
            if (criteria.getQualityGrades() != null && !criteria.getQualityGrades().isEmpty()) {
                predicates.add(root.get("qualityGrade").in(criteria.getQualityGrades()));
            }

            if (criteria.getSellerId() != null) {
                predicates.add(cb.equal(root.get("sellerId"), criteria.getSellerId()));
            }
            
            // Additional filters
            if (criteria.getMinQuantity() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("quantity"), criteria.getMinQuantity()));
            }
            
            if (criteria.getMaxQuantity() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("quantity"), criteria.getMaxQuantity()));
            }
            
            if (criteria.getMinRating() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("averageRating"), java.math.BigDecimal.valueOf(criteria.getMinRating())));
            }
            
            if (Boolean.TRUE.equals(criteria.getHasImages())) {
                predicates.add(cb.isNotEmpty(root.get("images")));
            }
            
            // Location-based search using Haversine formula approximation
            // Note: For precise distance calculations, consider using PostGIS
            if (criteria.getLatitude() != null && criteria.getLongitude() != null && criteria.getRadiusKm() != null) {
                // Approximate bounding box for performance
                double lat = criteria.getLatitude().doubleValue();
                double lon = criteria.getLongitude().doubleValue();
                double radiusKm = criteria.getRadiusKm();
                
                // 1 degree latitude ≈ 111 km
                double latDelta = radiusKm / 111.0;
                // 1 degree longitude varies, approximate for the latitude
                double lonDelta = radiusKm / (111.0 * Math.cos(Math.toRadians(lat)));
                
                predicates.add(cb.between(root.get("latitude"), 
                        java.math.BigDecimal.valueOf(lat - latDelta), 
                        java.math.BigDecimal.valueOf(lat + latDelta)));
                predicates.add(cb.between(root.get("longitude"), 
                        java.math.BigDecimal.valueOf(lon - lonDelta), 
                        java.math.BigDecimal.valueOf(lon + lonDelta)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private ListingDto mapToDto(Listing listing) {
        Double avgRating = reviewRepository.getAverageRatingByListing(listing.getId());
        long reviewCount = listing.getReviews() != null ? listing.getReviews().size() : 0;

        return ListingDto.builder()
                .id(listing.getId())
                .sellerId(listing.getSellerId())
                .farmId(listing.getFarmId())
                .categoryId(listing.getCategory() != null ? listing.getCategory().getId() : null)
                .categoryName(listing.getCategory() != null ? listing.getCategory().getName() : null)
                .title(listing.getTitle())
                .description(listing.getDescription())
                .cropType(listing.getCropType())
                .quantity(listing.getQuantity())
                .quantityUnit(listing.getQuantityUnit())
                .pricePerUnit(listing.getPricePerUnit())
                .currency(listing.getCurrency())
                .minimumOrder(listing.getMinimumOrder())
                .harvestDate(listing.getHarvestDate())
                .expiryDate(listing.getExpiryDate())
                .location(listing.getLocation())
                .latitude(listing.getLatitude())
                .longitude(listing.getLongitude())
                .organicCertified(listing.isOrganicCertified())
                .qualityGrade(listing.getQualityGrade())
                .status(listing.getStatus())
                .viewCount(listing.getViewCount())
                .averageRating(avgRating)
                .reviewCount((int) reviewCount)
                .images(listing.getImages().stream()
                        .map(this::mapImageToDto)
                        .collect(Collectors.toList()))
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }

    private ListingImageDto mapImageToDto(ListingImage image) {
        return ListingImageDto.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .primary(image.isPrimary())
                .sortOrder(image.getSortOrder())
                .build();
    }
}
