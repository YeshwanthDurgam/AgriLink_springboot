package com.agrilink.marketplace.service;

import com.agrilink.common.exception.BadRequestException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.marketplace.dto.CreateReviewRequest;
import com.agrilink.marketplace.dto.ReviewDto;
import com.agrilink.marketplace.dto.SellerRatingDto;
import com.agrilink.marketplace.entity.Listing;
import com.agrilink.marketplace.entity.Review;
import com.agrilink.marketplace.entity.SellerRating;
import com.agrilink.marketplace.repository.ListingRepository;
import com.agrilink.marketplace.repository.ReviewRepository;
import com.agrilink.marketplace.repository.SellerRatingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for review operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ListingRepository listingRepository;
    private final SellerRatingRepository sellerRatingRepository;

    /**
     * Create a review.
     */
    @Transactional
    public ReviewDto createReview(UUID listingId, UUID reviewerId, CreateReviewRequest request) {
        log.info("Creating review for listing: {} by user: {}", listingId, reviewerId);

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));

        // Check if user already reviewed this listing (for same order if order-based)
        if (request.getOrderId() != null) {
            if (reviewRepository.existsByListingIdAndReviewerIdAndOrderId(listingId, reviewerId, request.getOrderId())) {
                throw new BadRequestException("You have already reviewed this listing for this order");
            }
        } else {
            if (reviewRepository.existsByListingIdAndReviewerId(listingId, reviewerId)) {
                throw new BadRequestException("You have already reviewed this listing");
            }
        }

        // Cannot review own listing
        if (listing.getSellerId().equals(reviewerId)) {
            throw new BadRequestException("You cannot review your own listing");
        }

        // TODO: Check if orderId is valid and belongs to reviewer for verified purchase
        boolean isVerifiedPurchase = request.getOrderId() != null;

        Review review = Review.builder()
                .listing(listing)
                .reviewerId(reviewerId)
                .sellerId(listing.getSellerId())
                .orderId(request.getOrderId())
                .rating(request.getRating())
                .title(request.getTitle())
                .comment(request.getComment())
                .isVerifiedPurchase(isVerifiedPurchase)
                .helpfulCount(0)
                .build();

        Review savedReview = reviewRepository.save(review);
        log.info("Review created with id: {}", savedReview.getId());

        // Update listing rating
        updateListingRating(listing);

        // Update seller rating
        updateSellerRating(listing.getSellerId(), request.getRating(), true);

        return mapToDto(savedReview);
    }

    /**
     * Get reviews for a listing.
     */
    @Transactional(readOnly = true)
    public Page<ReviewDto> getReviewsByListing(UUID listingId, Pageable pageable) {
        return reviewRepository.findByListingIdOrderByCreatedAtDesc(listingId, pageable)
                .map(this::mapToDto);
    }

    /**
     * Get reviews for a seller.
     */
    @Transactional(readOnly = true)
    public Page<ReviewDto> getReviewsBySeller(UUID sellerId, Pageable pageable) {
        return reviewRepository.findBySellerId(sellerId, pageable)
                .map(this::mapToDto);
    }

    /**
     * Get average rating for a seller.
     */
    @Transactional(readOnly = true)
    public Double getSellerRating(UUID sellerId) {
        return reviewRepository.getAverageRatingBySeller(sellerId);
    }

    /**
     * Get detailed seller rating with distribution.
     */
    @Transactional(readOnly = true)
    public SellerRatingDto getSellerRatingDetails(UUID sellerId) {
        return sellerRatingRepository.findBySellerId(sellerId)
                .map(this::mapToSellerRatingDto)
                .orElse(SellerRatingDto.builder()
                        .sellerId(sellerId)
                        .averageRating(BigDecimal.ZERO)
                        .totalReviews(0)
                        .build());
    }

    /**
     * Get listing rating summary.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getListingRatingSummary(UUID listingId) {
        Double avgRating = reviewRepository.getAverageRatingByListing(listingId);
        long reviewCount = reviewRepository.countByListingId(listingId);
        List<Object[]> distribution = reviewRepository.getRatingDistributionByListing(listingId);

        Map<Integer, Long> ratingDistribution = distribution.stream()
                .collect(Collectors.toMap(
                        arr -> (Integer) arr[0],
                        arr -> (Long) arr[1]
                ));

        return Map.of(
                "averageRating", avgRating != null ? avgRating : 0.0,
                "totalReviews", reviewCount,
                "distribution", ratingDistribution
        );
    }

    /**
     * Mark review as helpful.
     */
    @Transactional
    public ReviewDto markHelpful(UUID reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        review.setHelpfulCount(review.getHelpfulCount() + 1);
        return mapToDto(reviewRepository.save(review));
    }

    /**
     * Delete a review.
     */
    @Transactional
    public void deleteReview(UUID reviewId, UUID reviewerId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getReviewerId().equals(reviewerId)) {
            throw new BadRequestException("You can only delete your own reviews");
        }

        int rating = review.getRating();
        UUID sellerId = review.getSellerId();
        Listing listing = review.getListing();

        reviewRepository.delete(review);

        // Update listing rating
        updateListingRating(listing);

        // Update seller rating
        updateSellerRating(sellerId, rating, false);
    }

    /**
     * Check if user can review a listing.
     */
    @Transactional(readOnly = true)
    public boolean canReview(UUID listingId, UUID reviewerId) {
        Listing listing = listingRepository.findById(listingId).orElse(null);
        if (listing == null || listing.getSellerId().equals(reviewerId)) {
            return false;
        }
        return !reviewRepository.existsByListingIdAndReviewerId(listingId, reviewerId);
    }

    private void updateListingRating(Listing listing) {
        Double avgRating = reviewRepository.getAverageRatingByListing(listing.getId());
        long reviewCount = reviewRepository.countByListingId(listing.getId());

        listing.setAverageRating(avgRating != null ? BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        listing.setReviewCount((int) reviewCount);
        listingRepository.save(listing);
    }

    private void updateSellerRating(UUID sellerId, int rating, boolean isAdd) {
        SellerRating sellerRating = sellerRatingRepository.findBySellerId(sellerId)
                .orElseGet(() -> SellerRating.builder().sellerId(sellerId).build());

        if (isAdd) {
            sellerRating.addRating(rating);
        } else {
            sellerRating.removeRating(rating);
        }

        sellerRatingRepository.save(sellerRating);
    }

    private ReviewDto mapToDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .listingId(review.getListing().getId())
                .listingTitle(review.getListing().getTitle())
                .reviewerId(review.getReviewerId())
                .sellerId(review.getSellerId())
                .rating(review.getRating())
                .title(review.getTitle())
                .comment(review.getComment())
                .isVerifiedPurchase(review.getIsVerifiedPurchase())
                .helpfulCount(review.getHelpfulCount())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private SellerRatingDto mapToSellerRatingDto(SellerRating sr) {
        return SellerRatingDto.builder()
                .sellerId(sr.getSellerId())
                .averageRating(sr.getAverageRating())
                .totalReviews(sr.getTotalReviews())
                .fiveStarCount(sr.getFiveStarCount())
                .fourStarCount(sr.getFourStarCount())
                .threeStarCount(sr.getThreeStarCount())
                .twoStarCount(sr.getTwoStarCount())
                .oneStarCount(sr.getOneStarCount())
                .build();
    }
}
