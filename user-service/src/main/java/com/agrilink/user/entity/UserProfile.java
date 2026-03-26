package com.agrilink.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * User Profile entity for extended user information.
 */
@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

        @Column(name = "email", length = 255)
        private String email;

        @Column(name = "phone_number", length = 20)
        private String phoneNumber;

        @Column(name = "profile_photo", columnDefinition = "TEXT")
        private String profilePhoto;

        @Column(name = "role", length = 50)
        private String role;

        @Column(name = "is_active", nullable = false)
        @Builder.Default
        private boolean active = true;

        @Column(name = "suspension_reason", columnDefinition = "TEXT")
        private String suspensionReason;

        @Column(name = "suspended_at")
        private LocalDateTime suspendedAt;

        @Column(name = "deletion_reason", columnDefinition = "TEXT")
        private String deletionReason;

        @Column(name = "deleted_at")
        private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<KycDocument> kycDocuments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public String getFullName() {
        return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
    }
}
