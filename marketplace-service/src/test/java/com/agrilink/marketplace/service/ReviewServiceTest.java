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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ReviewService.
 */
@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private SellerRatingRepository sellerRatingRepository;

    @InjectMocks
    private ReviewService reviewService;

    private UUID listingId;
    private UUID reviewerId;
    private UUID sellerId;
    private Listing listing;
    private Review review;
    private CreateReviewRequest createReviewRequest;

    @BeforeEach
    void setUp() {
        listingId = UUID.randomUUID();
        reviewerId = UUID.randomUUID();
        sellerId = UUID.randomUUID();

        listing = Listing.builder()
                .id(listingId)
                .sellerId(sellerId)
                .title("Fresh Tomatoes")
                .status(Listing.ListingStatus.ACTIVE)
                .build();

        review = Review.builder()
                .id(UUID.randomUUID())
                .listing(listing)
                .reviewerId(reviewerId)
                .sellerId(sellerId)
                .rating(5)
                .title("Great quality!")
                .comment("Very fresh tomatoes, highly recommend!")
                .isVerifiedPurchase(false)
                .helpfulCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        createReviewRequest = CreateReviewRequest.builder()
                .rating(5)
                .title("Great quality!")
                .comment("Very fresh tomatoes, highly recommend!")
                .build();
    }

    @Nested
    @DisplayName("Create Review")
    class CreateReviewTests {

        @Test
        @DisplayName("Should create review successfully")
        void shouldCreateReviewSuccessfully() {
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(reviewRepository.existsByListingIdAndReviewerId(listingId, reviewerId)).thenReturn(false);
            when(reviewRepository.save(any(Review.class))).thenReturn(review);
            when(reviewRepository.getAverageRatingByListing(listingId)).thenReturn(5.0);
            when(reviewRepository.countByListingId(listingId)).thenReturn(1L);
            when(sellerRatingRepository.findBySellerId(sellerId)).thenReturn(Optional.empty());
            when(sellerRatingRepository.save(any(SellerRating.class))).thenReturn(mock(SellerRating.class));

            ReviewDto result = reviewService.createReview(listingId, reviewerId, createReviewRequest);

            assertThat(result).isNotNull();
            assertThat(result.getRating()).isEqualTo(5);
            assertThat(result.getTitle()).isEqualTo("Great quality!");
            verify(reviewRepository).save(any(Review.class));
        }

        @Test
        @DisplayName("Should throw exception when listing not found")
        void shouldThrowExceptionWhenListingNotFound() {
            when(listingRepository.findById(listingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reviewService.createReview(listingId, reviewerId, createReviewRequest))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when user already reviewed listing")
        void shouldThrowExceptionWhenAlreadyReviewed() {
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(reviewRepository.existsByListingIdAndReviewerId(listingId, reviewerId)).thenReturn(true);

            assertThatThrownBy(() -> reviewService.createReview(listingId, reviewerId, createReviewRequest))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("already reviewed");
        }

        @Test
        @DisplayName("Should throw exception when reviewing own listing")
        void shouldThrowExceptionWhenReviewingOwnListing() {
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(reviewRepository.existsByListingIdAndReviewerId(listingId, sellerId)).thenReturn(false);

            assertThatThrownBy(() -> reviewService.createReview(listingId, sellerId, createReviewRequest))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("cannot review your own listing");
        }

        @Test
        @DisplayName("Should create verified purchase review with orderId")
        void shouldCreateVerifiedPurchaseReviewWithOrderId() {
            UUID orderId = UUID.randomUUID();
            createReviewRequest.setOrderId(orderId);
            
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(reviewRepository.existsByListingIdAndReviewerIdAndOrderId(listingId, reviewerId, orderId))
                    .thenReturn(false);
            when(reviewRepository.save(any(Review.class))).thenReturn(review);
            when(reviewRepository.getAverageRatingByListing(listingId)).thenReturn(5.0);
            when(reviewRepository.countByListingId(listingId)).thenReturn(1L);
            when(sellerRatingRepository.findBySellerId(sellerId)).thenReturn(Optional.empty());
            when(sellerRatingRepository.save(any(SellerRating.class))).thenReturn(mock(SellerRating.class));

            ReviewDto result = reviewService.createReview(listingId, reviewerId, createReviewRequest);

            assertThat(result).isNotNull();
            verify(reviewRepository).existsByListingIdAndReviewerIdAndOrderId(listingId, reviewerId, orderId);
        }
    }

    @Nested
    @DisplayName("Get Reviews by Listing")
    class GetReviewsByListingTests {

        @Test
        @DisplayName("Should return reviews for listing")
        void shouldReturnReviewsForListing() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Review> reviewPage = new PageImpl<>(List.of(review));

            when(reviewRepository.findByListingIdOrderByCreatedAtDesc(listingId, pageable))
                    .thenReturn(reviewPage);

            Page<ReviewDto> result = reviewService.getReviewsByListing(listingId, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getRating()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should return empty page when no reviews")
        void shouldReturnEmptyPageWhenNoReviews() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Review> emptyPage = Page.empty();

            when(reviewRepository.findByListingIdOrderByCreatedAtDesc(listingId, pageable))
                    .thenReturn(emptyPage);

            Page<ReviewDto> result = reviewService.getReviewsByListing(listingId, pageable);

            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Reviews by Seller")
    class GetReviewsBySellerTests {

        @Test
        @DisplayName("Should return reviews for seller")
        void shouldReturnReviewsForSeller() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Review> reviewPage = new PageImpl<>(List.of(review));

            when(reviewRepository.findBySellerId(sellerId, pageable))
                    .thenReturn(reviewPage);

            Page<ReviewDto> result = reviewService.getReviewsBySeller(sellerId, pageable);

            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Get Seller Rating")
    class GetSellerRatingTests {

        @Test
        @DisplayName("Should return average rating for seller")
        void shouldReturnAverageRatingForSeller() {
            when(reviewRepository.getAverageRatingBySeller(sellerId)).thenReturn(4.5);

            Double result = reviewService.getSellerRating(sellerId);

            assertThat(result).isEqualTo(4.5);
        }

        @Test
        @DisplayName("Should return null when no reviews")
        void shouldReturnNullWhenNoReviews() {
            when(reviewRepository.getAverageRatingBySeller(sellerId)).thenReturn(null);

            Double result = reviewService.getSellerRating(sellerId);

            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Get Seller Rating Details")
    class GetSellerRatingDetailsTests {

        @Test
        @DisplayName("Should return seller rating details")
        void shouldReturnSellerRatingDetails() {
            SellerRating sellerRating = SellerRating.builder()
                    .sellerId(sellerId)
                    .averageRating(new BigDecimal("4.5"))
                    .totalReviews(10)
                    .fiveStarCount(5)
                    .fourStarCount(3)
                    .threeStarCount(2)
                    .twoStarCount(0)
                    .oneStarCount(0)
                    .build();

            when(sellerRatingRepository.findBySellerId(sellerId))
                    .thenReturn(Optional.of(sellerRating));

            SellerRatingDto result = reviewService.getSellerRatingDetails(sellerId);

            assertThat(result).isNotNull();
            assertThat(result.getAverageRating()).isEqualByComparingTo(new BigDecimal("4.5"));
            assertThat(result.getTotalReviews()).isEqualTo(10);
        }

        @Test
        @DisplayName("Should return default when no rating exists")
        void shouldReturnDefaultWhenNoRatingExists() {
            when(sellerRatingRepository.findBySellerId(sellerId))
                    .thenReturn(Optional.empty());

            SellerRatingDto result = reviewService.getSellerRatingDetails(sellerId);

            assertThat(result).isNotNull();
            assertThat(result.getSellerId()).isEqualTo(sellerId);
            assertThat(result.getAverageRating()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getTotalReviews()).isEqualTo(0);
        }
    }
}
