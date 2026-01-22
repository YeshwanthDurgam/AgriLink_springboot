package com.agrilink.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Farmer profile entity with farm-specific information.
 * Requires verification by Manager or Admin before business operations.
 */
@Entity
@Table(name = "farmers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(length = 100)
    private String name;

    @Column(length = 50, unique = true)
    private String username;

    @Column(length = 20)
    private String phone;

    private Integer age;

    @Column(name = "profile_photo", length = 500)
    private String profilePhoto;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    @Column(name = "farm_name", length = 200)
    private String farmName;

    @Column(name = "crop_types", columnDefinition = "TEXT")
    private String cropTypes;

    @Column(name = "farm_photo", length = 500)
    private String farmPhoto;

    @Column(name = "farm_bio", columnDefinition = "TEXT")
    private String farmBio;

    @Column(columnDefinition = "TEXT")
    private String certificates;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private ProfileStatus status = ProfileStatus.PENDING;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public boolean isApproved() {
        return status == ProfileStatus.APPROVED;
    }

    public boolean isPending() {
        return status == ProfileStatus.PENDING;
    }

    public boolean isProfileComplete() {
        return name != null && !name.isBlank() &&
               username != null && !username.isBlank() &&
               phone != null && !phone.isBlank() &&
               farmName != null && !farmName.isBlank();
    }
}
