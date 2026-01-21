package com.agrilink.user.service;

import com.agrilink.user.dto.KycDocumentDto;
import com.agrilink.user.entity.KycDocument;
import com.agrilink.user.entity.UserProfile;
import com.agrilink.user.repository.KycDocumentRepository;
import com.agrilink.user.repository.UserProfileRepository;
import com.agrilink.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for KycService.
 */
@ExtendWith(MockitoExtension.class)
class KycServiceTest {

    @Mock
    private KycDocumentRepository kycDocumentRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private KycService kycService;

    private UUID userId;
    private UUID documentId;
    private UserProfile userProfile;
    private KycDocument kycDocument;
    private KycDocumentDto kycDocumentDto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        documentId = UUID.randomUUID();

        userProfile = UserProfile.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .build();

        kycDocument = KycDocument.builder()
                .id(documentId)
                .userProfile(userProfile)
                .documentType("AADHAAR")
                .documentNumber("1234-5678-9012")
                .documentUrl("https://storage.example.com/kyc/doc.pdf")
                .status(KycDocument.KycStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        kycDocumentDto = KycDocumentDto.builder()
                .documentType("AADHAAR")
                .documentNumber("1234-5678-9012")
                .documentUrl("https://storage.example.com/kyc/doc.pdf")
                .build();
    }

    @Nested
    @DisplayName("Submit Document")
    class SubmitDocumentTests {

        @Test
        @DisplayName("Should submit KYC document for existing profile")
        void shouldSubmitKycDocumentForExistingProfile() {
            when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(userProfile));
            when(kycDocumentRepository.save(any(KycDocument.class))).thenReturn(kycDocument);

            KycDocumentDto result = kycService.submitDocument(userId, kycDocumentDto);

            assertThat(result).isNotNull();
            assertThat(result.getDocumentType()).isEqualTo("AADHAAR");
            assertThat(result.getStatus()).isEqualTo(KycDocument.KycStatus.PENDING);
            verify(kycDocumentRepository).save(any(KycDocument.class));
        }

        @Test
        @DisplayName("Should create profile and submit KYC document")
        void shouldCreateProfileAndSubmitDocument() {
            when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());
            when(userProfileRepository.save(any(UserProfile.class))).thenReturn(userProfile);
            when(kycDocumentRepository.save(any(KycDocument.class))).thenReturn(kycDocument);

            KycDocumentDto result = kycService.submitDocument(userId, kycDocumentDto);

            assertThat(result).isNotNull();
            verify(userProfileRepository).save(any(UserProfile.class));
            verify(kycDocumentRepository).save(any(KycDocument.class));
        }

        @Test
        @DisplayName("Should set initial status as PENDING")
        void shouldSetInitialStatusAsPending() {
            when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(userProfile));
            when(kycDocumentRepository.save(any(KycDocument.class))).thenReturn(kycDocument);

            KycDocumentDto result = kycService.submitDocument(userId, kycDocumentDto);

            assertThat(result.getStatus()).isEqualTo(KycDocument.KycStatus.PENDING);
        }
    }

    @Nested
    @DisplayName("Get Documents")
    class GetDocumentsTests {

        @Test
        @DisplayName("Should return all documents for user")
        void shouldReturnAllDocumentsForUser() {
            when(kycDocumentRepository.findByUserProfileUserId(userId))
                    .thenReturn(List.of(kycDocument));

            List<KycDocumentDto> result = kycService.getDocuments(userId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getDocumentType()).isEqualTo("AADHAAR");
        }

        @Test
        @DisplayName("Should return empty list when no documents")
        void shouldReturnEmptyListWhenNoDocuments() {
            when(kycDocumentRepository.findByUserProfileUserId(userId))
                    .thenReturn(List.of());

            List<KycDocumentDto> result = kycService.getDocuments(userId);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return multiple documents")
        void shouldReturnMultipleDocuments() {
            KycDocument secondDoc = KycDocument.builder()
                    .id(UUID.randomUUID())
                    .userProfile(userProfile)
                    .documentType("PAN")
                    .documentNumber("ABCDE1234F")
                    .documentUrl("https://storage.example.com/kyc/pan.pdf")
                    .status(KycDocument.KycStatus.APPROVED)
                    .build();

            when(kycDocumentRepository.findByUserProfileUserId(userId))
                    .thenReturn(List.of(kycDocument, secondDoc));

            List<KycDocumentDto> result = kycService.getDocuments(userId);

            assertThat(result).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Get Document by ID")
    class GetDocumentByIdTests {

        @Test
        @DisplayName("Should return document when found")
        void shouldReturnDocumentWhenFound() {
            when(kycDocumentRepository.findById(documentId)).thenReturn(Optional.of(kycDocument));

            KycDocumentDto result = kycService.getDocument(documentId);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(documentId);
            assertThat(result.getDocumentType()).isEqualTo("AADHAAR");
        }

        @Test
        @DisplayName("Should throw exception when document not found")
        void shouldThrowExceptionWhenNotFound() {
            when(kycDocumentRepository.findById(documentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> kycService.getDocument(documentId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Document Status")
    class DocumentStatusTests {

        @Test
        @DisplayName("Should map approved document correctly")
        void shouldMapApprovedDocumentCorrectly() {
            kycDocument.setStatus(KycDocument.KycStatus.APPROVED);
            kycDocument.setVerifiedAt(LocalDateTime.now());
            when(kycDocumentRepository.findById(documentId)).thenReturn(Optional.of(kycDocument));

            KycDocumentDto result = kycService.getDocument(documentId);

            assertThat(result.getStatus()).isEqualTo(KycDocument.KycStatus.APPROVED);
            assertThat(result.getVerifiedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should map rejected document correctly")
        void shouldMapRejectedDocumentCorrectly() {
            kycDocument.setStatus(KycDocument.KycStatus.REJECTED);
            kycDocument.setRejectionReason("Invalid document format");
            when(kycDocumentRepository.findById(documentId)).thenReturn(Optional.of(kycDocument));

            KycDocumentDto result = kycService.getDocument(documentId);

            assertThat(result.getStatus()).isEqualTo(KycDocument.KycStatus.REJECTED);
            assertThat(result.getRejectionReason()).isEqualTo("Invalid document format");
        }
    }
}
