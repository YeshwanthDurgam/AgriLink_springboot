package com.agrilink.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a customer following a farmer.
 * A customer can follow multiple farmers.
 * A farmer can be followed by multiple customers.
 */
@Entity
@Table(name = "followed_farmers", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "farmer_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowedFarmer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * The customer who is following the farmer.
     */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /**
     * The farmer being followed.
     */
    @Column(name = "farmer_id", nullable = false)
    private UUID farmerId;

    @CreationTimestamp
    @Column(name = "followed_at", nullable = false, updatable = false)
    private LocalDateTime followedAt;
}
