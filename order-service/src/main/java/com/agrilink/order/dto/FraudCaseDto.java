package com.agrilink.order.dto;

import com.agrilink.order.entity.FraudCase;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for FraudCase entity.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudCaseDto {

    private UUID id;
    private String caseNumber;
    private UUID reporterId;
    private UUID accusedId;
    private UUID orderId;
    private String fraudType;
    private String priority;
    private String status;
    private String description;
    private String evidenceDetails;
    private String investigationNotes;
    private String resolvedReason;
    private UUID resolvedById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;

    /**
     * Convert entity to DTO
     */
    public static FraudCaseDto fromEntity(FraudCase entity) {
        return FraudCaseDto.builder()
                .id(entity.getId())
                .caseNumber(entity.getCaseNumber())
                .reporterId(entity.getReporterId())
                .accusedId(entity.getAccusedId())
                .orderId(entity.getOrderId())
                .fraudType(entity.getFraudType().name())
                .priority(entity.getPriority().name())
                .status(entity.getStatus().name())
                .description(entity.getDescription())
                .evidenceDetails(entity.getEvidenceDetails())
                .investigationNotes(entity.getInvestigationNotes())
                .resolvedReason(entity.getResolvedReason())
                .resolvedById(entity.getResolvedById())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .resolvedAt(entity.getResolvedAt())
                .build();
    }
}
