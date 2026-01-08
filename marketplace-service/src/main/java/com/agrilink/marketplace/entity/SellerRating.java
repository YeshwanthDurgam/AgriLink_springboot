package com.agrilink.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing aggregated seller ratings.
 */
@Entity
@Table(name = "seller_ratings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerRating {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "seller_id", nullable = false, unique = true)
    private UUID sellerId;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "average_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "five_star_count")
    @Builder.Default
    private Integer fiveStarCount = 0;

    @Column(name = "four_star_count")
    @Builder.Default
    private Integer fourStarCount = 0;

    @Column(name = "three_star_count")
    @Builder.Default
    private Integer threeStarCount = 0;

    @Column(name = "two_star_count")
    @Builder.Default
    private Integer twoStarCount = 0;

    @Column(name = "one_star_count")
    @Builder.Default
    private Integer oneStarCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void addRating(int rating) {
        this.totalReviews++;
        switch (rating) {
            case 5 -> this.fiveStarCount++;
            case 4 -> this.fourStarCount++;
            case 3 -> this.threeStarCount++;
            case 2 -> this.twoStarCount++;
            case 1 -> this.oneStarCount++;
        }
        recalculateAverage();
    }

    public void removeRating(int rating) {
        this.totalReviews = Math.max(0, this.totalReviews - 1);
        switch (rating) {
            case 5 -> this.fiveStarCount = Math.max(0, this.fiveStarCount - 1);
            case 4 -> this.fourStarCount = Math.max(0, this.fourStarCount - 1);
            case 3 -> this.threeStarCount = Math.max(0, this.threeStarCount - 1);
            case 2 -> this.twoStarCount = Math.max(0, this.twoStarCount - 1);
            case 1 -> this.oneStarCount = Math.max(0, this.oneStarCount - 1);
        }
        recalculateAverage();
    }

    private void recalculateAverage() {
        if (totalReviews == 0) {
            this.averageRating = BigDecimal.ZERO;
            return;
        }
        int totalScore = (fiveStarCount * 5) + (fourStarCount * 4) + (threeStarCount * 3) 
                       + (twoStarCount * 2) + oneStarCount;
        this.averageRating = BigDecimal.valueOf(totalScore)
                .divide(BigDecimal.valueOf(totalReviews), 2, java.math.RoundingMode.HALF_UP);
    }
}
