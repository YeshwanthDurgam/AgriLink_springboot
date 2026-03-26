package com.agrilink.marketplace.service;

import com.agrilink.common.exception.ForbiddenException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.marketplace.dto.PriceUpdateProposalDto;
import com.agrilink.marketplace.entity.Listing;
import com.agrilink.marketplace.entity.ListingPriceUpdateProposal;
import com.agrilink.marketplace.repository.ListingPriceUpdateProposalRepository;
import com.agrilink.marketplace.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceUpdateApprovalService {

    private static final BigDecimal MIN_NOTIFY_DELTA = new BigDecimal("0.50");

    private final ListingPriceUpdateProposalRepository proposalRepository;
    private final ListingRepository listingRepository;
    private final NotificationClient notificationClient;

    @Transactional
    public void createOrRefreshPendingProposal(
            Listing listing,
            String matchedCommodity,
            ExternalMarketDataService.MarketSnapshot snapshot,
            BigDecimal suggestedPrice,
            int confidenceScore,
            String reason
    ) {
        BigDecimal roundedSuggested = suggestedPrice.setScale(2, RoundingMode.HALF_UP);
        BigDecimal currentPrice = listing.getPricePerUnit() == null
                ? BigDecimal.ZERO
                : listing.getPricePerUnit().setScale(2, RoundingMode.HALF_UP);

        if (roundedSuggested.subtract(currentPrice).abs().compareTo(MIN_NOTIFY_DELTA) < 0) {
            return;
        }

        ListingPriceUpdateProposal pendingProposal = proposalRepository
                .findFirstByListingIdAndStatusOrderByCreatedAtDesc(listing.getId(), ListingPriceUpdateProposal.ProposalStatus.PENDING)
                .orElseGet(() -> ListingPriceUpdateProposal.builder()
                        .listingId(listing.getId())
                        .sellerId(listing.getSellerId())
                        .productName(listing.getTitle())
                        .status(ListingPriceUpdateProposal.ProposalStatus.PENDING)
                        .build());

        boolean isNew = pendingProposal.getId() == null;
        boolean changed = isNew || pendingProposal.getSuggestedPrice() == null
                || pendingProposal.getSuggestedPrice().compareTo(roundedSuggested) != 0;

        pendingProposal.setMatchedCommodity(matchedCommodity);
        pendingProposal.setCurrentPrice(currentPrice);
        pendingProposal.setSuggestedPrice(roundedSuggested);
        pendingProposal.setCurrency("INR");
        pendingProposal.setMarketSource(snapshot.getSource());
        pendingProposal.setMarketName(snapshot.getMarketName());
        pendingProposal.setConfidenceScore(confidenceScore);
        pendingProposal.setReason(reason);
        pendingProposal.setExpiresAt(LocalDateTime.now().plusDays(2));

        ListingPriceUpdateProposal saved = proposalRepository.save(pendingProposal);

        if (changed) {
            sendApprovalNotification(saved, listing);
        }
    }

    @Transactional(readOnly = true)
    public Page<PriceUpdateProposalDto> getPendingProposals(UUID sellerId, Pageable pageable) {
        return proposalRepository
                .findBySellerIdAndStatusOrderByCreatedAtDesc(sellerId, ListingPriceUpdateProposal.ProposalStatus.PENDING, pageable)
                .map(this::toDto);
    }

    @Transactional
    public PriceUpdateProposalDto allowPriceUpdate(UUID proposalId, UUID sellerId) {
        ListingPriceUpdateProposal proposal = proposalRepository.findByIdAndSellerId(proposalId, sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Price update proposal", "id", proposalId));

        validatePendingProposal(proposal);

        Listing listing = listingRepository.findById(proposal.getListingId())
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", proposal.getListingId()));

        if (!listing.getSellerId().equals(sellerId)) {
            throw new ForbiddenException("You are not allowed to approve this listing price update");
        }

        listing.setPricePerUnit(proposal.getSuggestedPrice());
        listing.setCurrency(proposal.getCurrency());
        listingRepository.save(listing);

        proposal.setStatus(ListingPriceUpdateProposal.ProposalStatus.APPROVED);
        proposal.setRespondedAt(LocalDateTime.now());
        proposalRepository.save(proposal);

        return toDto(proposal);
    }

    @Transactional
    public PriceUpdateProposalDto denyPriceUpdate(UUID proposalId, UUID sellerId) {
        ListingPriceUpdateProposal proposal = proposalRepository.findByIdAndSellerId(proposalId, sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Price update proposal", "id", proposalId));

        validatePendingProposal(proposal);

        proposal.setStatus(ListingPriceUpdateProposal.ProposalStatus.DENIED);
        proposal.setRespondedAt(LocalDateTime.now());
        proposalRepository.save(proposal);

        return toDto(proposal);
    }

    @Transactional
    public int expirePendingProposals(LocalDateTime now) {
        List<ListingPriceUpdateProposal> expired = proposalRepository
                .findByStatusAndExpiresAtBefore(ListingPriceUpdateProposal.ProposalStatus.PENDING, now);

        for (ListingPriceUpdateProposal proposal : expired) {
            proposal.setStatus(ListingPriceUpdateProposal.ProposalStatus.EXPIRED);
            proposal.setRespondedAt(now);
        }

        if (!expired.isEmpty()) {
            proposalRepository.saveAll(expired);
        }

        return expired.size();
    }

    private void validatePendingProposal(ListingPriceUpdateProposal proposal) {
        if (proposal.getStatus() != ListingPriceUpdateProposal.ProposalStatus.PENDING) {
            throw new IllegalStateException("This proposal has already been processed");
        }
        if (proposal.getExpiresAt() != null && proposal.getExpiresAt().isBefore(LocalDateTime.now())) {
            proposal.setStatus(ListingPriceUpdateProposal.ProposalStatus.EXPIRED);
            proposal.setRespondedAt(LocalDateTime.now());
            proposalRepository.save(proposal);
            throw new IllegalStateException("This proposal has expired");
        }
    }

    private void sendApprovalNotification(ListingPriceUpdateProposal proposal, Listing listing) {
        String message = String.format(
                "Current market price for %s is INR %.2f/kg. Your current price is INR %.2f. Approve this update?",
                proposal.getMatchedCommodity() == null ? listing.getTitle() : proposal.getMatchedCommodity(),
                proposal.getSuggestedPrice(),
                proposal.getCurrentPrice()
        );

        Map<String, Object> notificationData = new LinkedHashMap<>();
        notificationData.put("proposalId", proposal.getId());
        notificationData.put("listingId", proposal.getListingId());
        notificationData.put("actionAllow", "/api/v1/listings/price-updates/" + proposal.getId() + "/allow");
        notificationData.put("actionDeny", "/api/v1/listings/price-updates/" + proposal.getId() + "/deny");
        notificationData.put("suggestedPrice", proposal.getSuggestedPrice());
        notificationData.put("currentPrice", proposal.getCurrentPrice());
        notificationData.put("currency", proposal.getCurrency());
        notificationData.put("expiresAt", proposal.getExpiresAt());
        if (proposal.getMatchedCommodity() != null) {
            notificationData.put("matchedCommodity", proposal.getMatchedCommodity());
        }
        if (proposal.getMarketName() != null) {
            notificationData.put("marketName", proposal.getMarketName());
        }

        notificationClient.sendInAppListingNotification(
                proposal.getSellerId(),
                "Price update approval required",
                message,
            notificationData
        );
    }

    private PriceUpdateProposalDto toDto(ListingPriceUpdateProposal proposal) {
        return PriceUpdateProposalDto.builder()
                .id(proposal.getId())
                .listingId(proposal.getListingId())
                .productName(proposal.getProductName())
                .matchedCommodity(proposal.getMatchedCommodity())
                .currentPrice(proposal.getCurrentPrice())
                .suggestedPrice(proposal.getSuggestedPrice())
                .currency(proposal.getCurrency())
                .marketSource(proposal.getMarketSource())
                .marketName(proposal.getMarketName())
                .confidenceScore(proposal.getConfidenceScore())
                .reason(proposal.getReason())
                .status(proposal.getStatus().name())
                .createdAt(proposal.getCreatedAt())
                .expiresAt(proposal.getExpiresAt())
                .respondedAt(proposal.getRespondedAt())
                .build();
    }
}
