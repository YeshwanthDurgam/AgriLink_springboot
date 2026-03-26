package com.agrilink.order.service;

import com.agrilink.order.dto.CreateFraudCaseRequest;
import com.agrilink.order.dto.FraudCaseDto;
import com.agrilink.order.entity.FraudCase;
import com.agrilink.order.repository.FraudCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for managing fraud cases.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FraudCaseService {

    private final FraudCaseRepository fraudCaseRepository;

    /**
     * Create a new fraud case.
     */
    public FraudCaseDto createFraudCase(UUID reporterId, CreateFraudCaseRequest request) {
        log.info("Creating fraud case - Reporter: {}, Accused: {}, Type: {}", 
                 reporterId, request.getAccusedId(), request.getFraudType());

        FraudCase fraudCase = FraudCase.builder()
                .caseNumber(generateCaseNumber())
                .reporterId(reporterId)
                .accusedId(request.getAccusedId())
                .orderId(request.getOrderId())
                .fraudType(FraudCase.FraudType.valueOf(request.getFraudType()))
                .priority(FraudCase.FraudPriority.valueOf(request.getPriority()))
                .status(FraudCase.FraudStatus.OPEN)
                .description(request.getDescription())
                .evidenceDetails(request.getEvidenceDetails())
                .build();

        FraudCase savedCase = fraudCaseRepository.save(fraudCase);
        log.info("Fraud case created with ID: {}", savedCase.getId());
        
        return FraudCaseDto.fromEntity(savedCase);
    }

    /**
     * Get fraud case by ID.
     */
    public FraudCaseDto getFraudCase(UUID caseId) {
        FraudCase fraudCase = fraudCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Fraud case not found: " + caseId));
        return FraudCaseDto.fromEntity(fraudCase);
    }

    /**
     * Get all fraud cases with pagination.
     */
    public Page<FraudCaseDto> getAllFraudCases(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return fraudCaseRepository.findAll(pageable)
                .map(FraudCaseDto::fromEntity);
    }

    /**
     * Get fraud cases by status.
     */
    public Page<FraudCaseDto> getFraudCasesByStatus(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        FraudCase.FraudStatus fraudStatus = FraudCase.FraudStatus.valueOf(status);
        return fraudCaseRepository.findByStatus(fraudStatus, pageable)
                .map(FraudCaseDto::fromEntity);
    }

    /**
     * Get fraud cases by priority.
     */
    public Page<FraudCaseDto> getFraudCasesByPriority(String priority, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        FraudCase.FraudPriority fraudPriority = FraudCase.FraudPriority.valueOf(priority);
        return fraudCaseRepository.findByPriority(fraudPriority, pageable)
                .map(FraudCaseDto::fromEntity);
    }

    /**
     * Get fraud cases by accused user ID.
     */
    public Page<FraudCaseDto> getFraudCasesByAccused(UUID accusedId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return fraudCaseRepository.findByAccusedId(accusedId, pageable)
                .map(FraudCaseDto::fromEntity);
    }

    /**
     * Update fraud case status.
     */
    public FraudCaseDto updateFraudCaseStatus(UUID caseId, String newStatus, UUID resolvedById, String resolution) {
        FraudCase fraudCase = fraudCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Fraud case not found: " + caseId));

        FraudCase.FraudStatus status = FraudCase.FraudStatus.valueOf(newStatus);
        fraudCase.setStatus(status);

        if (status == FraudCase.FraudStatus.RESOLVED || status == FraudCase.FraudStatus.CLOSED) {
            fraudCase.setResolvedById(resolvedById);
            fraudCase.setResolvedReason(resolution);
            fraudCase.setResolvedAt(LocalDateTime.now());
            log.info("Fraud case {} resolved by admin {}", caseId, resolvedById);
        }

        FraudCase updatedCase = fraudCaseRepository.save(fraudCase);
        return FraudCaseDto.fromEntity(updatedCase);
    }

    /**
     * Add investigation notes to a fraud case.
     */
    public FraudCaseDto addInvestigationNotes(UUID caseId, String notes) {
        FraudCase fraudCase = fraudCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Fraud case not found: " + caseId));

        StringBuilder notesBuilder = new StringBuilder();
        if (fraudCase.getInvestigationNotes() != null) {
            notesBuilder.append(fraudCase.getInvestigationNotes()).append("\n\n");
        }
        notesBuilder.append("[").append(LocalDateTime.now()).append("] ").append(notes);
        
        fraudCase.setInvestigationNotes(notesBuilder.toString());
        fraudCase.setStatus(FraudCase.FraudStatus.INVESTIGATING);

        FraudCase updatedCase = fraudCaseRepository.save(fraudCase);
        return FraudCaseDto.fromEntity(updatedCase);
    }

    /**
     * Get count of open fraud cases.
     */
    public long getOpenCasesCount() {
        return fraudCaseRepository.countByStatus(FraudCase.FraudStatus.OPEN);
    }

    /**
     * Generate unique case number.
     */
    private String generateCaseNumber() {
        return "FRAUD-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
