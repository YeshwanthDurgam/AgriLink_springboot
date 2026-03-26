package com.agrilink.marketplace.repository;

import com.agrilink.marketplace.entity.ListingPriceUpdateProposal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ListingPriceUpdateProposalRepository extends JpaRepository<ListingPriceUpdateProposal, UUID> {

    Optional<ListingPriceUpdateProposal> findFirstByListingIdAndStatusOrderByCreatedAtDesc(
            UUID listingId,
            ListingPriceUpdateProposal.ProposalStatus status
    );

    Page<ListingPriceUpdateProposal> findBySellerIdAndStatusOrderByCreatedAtDesc(
            UUID sellerId,
            ListingPriceUpdateProposal.ProposalStatus status,
            Pageable pageable
    );

    Optional<ListingPriceUpdateProposal> findByIdAndSellerId(UUID id, UUID sellerId);

    List<ListingPriceUpdateProposal> findByStatusAndExpiresAtBefore(
            ListingPriceUpdateProposal.ProposalStatus status,
            LocalDateTime threshold
    );
}
