package com.agrilink.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Manager profile entity.
 * Requires verification by Admin before they can verify farmers.
 */
@Entity
@Table(name = "managers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagerProfile {

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
               phone != null && !phone.isBlank();
    }
}
