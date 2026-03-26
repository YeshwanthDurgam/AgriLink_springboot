package com.agrilink.marketplace.service;

import com.agrilink.marketplace.entity.Listing;
import com.agrilink.marketplace.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ListingPriceSyncService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
        private static final Pattern WORD_PATTERN = Pattern.compile("[a-zA-Z][a-zA-Z-]{1,}");
        private static final Set<String> TITLE_STOPWORDS = Set.of(
            "fresh", "organic", "natural", "premium", "best", "raw", "local",
            "farm", "farms", "grade", "whole", "pure", "quality"
        );
        private static final Map<String, String> TITLE_ALIASES = Map.ofEntries(
            Map.entry("bananas", "banana"),
            Map.entry("plantain", "banana"),
            Map.entry("tomatoes", "tomato"),
            Map.entry("potatoes", "potato"),
            Map.entry("onions", "onion"),
            Map.entry("lentils", "lentils"),
            Map.entry("chickpeas", "chickpeas"),
            Map.entry("beans", "beans"),
            Map.entry("maize", "maize"),
            Map.entry("corn", "maize"),
            Map.entry("rice", "rice"),
            Map.entry("wheat", "wheat"),
            Map.entry("garlic", "garlic"),
            Map.entry("ginger", "ginger"),
            Map.entry("turmeric", "turmeric"),
            Map.entry("mango", "mango")
        );

    private final ListingRepository listingRepository;
    private final ExternalMarketDataService externalMarketDataService;
        private final PriceUpdateApprovalService priceUpdateApprovalService;

    @Value("${market.data.price-sync.enabled:true}")
    private boolean priceSyncEnabled;

    @Value("${market.data.price-sync.page-size:150}")
    private int pageSize;

    @Scheduled(
            fixedDelayString = "${market.data.price-sync.fixed-delay-ms:21600000}",
            initialDelayString = "${market.data.price-sync.initial-delay-ms:120000}"
    )
    public void syncActiveListingPrices() {
        if (!priceSyncEnabled) {
            return;
        }

        int processed = 0;
        int proposed = 0;
        int skipped = 0;

        int expired = priceUpdateApprovalService.expirePendingProposals(LocalDateTime.now());
        if (expired > 0) {
            log.info("Expired {} stale listing price proposals", expired);
        }

        Map<String, Optional<ExternalMarketDataService.MarketSnapshot>> snapshotCache = new HashMap<>();
        Pageable pageable = PageRequest.of(0, pageSize, Sort.by(Sort.Direction.ASC, "createdAt"));

        Page<Listing> page;
        do {
            page = listingRepository.findByStatusForPriceSync(Listing.ListingStatus.ACTIVE, pageable);

            for (Listing listing : page.getContent()) {
                processed++;

                String commodity = resolveCommodityForListing(listing);
                if (commodity == null) {
                    skipped++;
                    continue;
                }

                LocationContext locationContext = parseLocation(listing.getLocation());
                String cacheKey = buildCacheKey(commodity, locationContext.state, locationContext.district);

                Optional<ExternalMarketDataService.MarketSnapshot> snapshot = snapshotCache.computeIfAbsent(
                        cacheKey,
                        key -> externalMarketDataService.getMarketSnapshot(commodity, locationContext.state, locationContext.district)
                );

                if (snapshot.isEmpty()) {
                    skipped++;
                    continue;
                }

                BigDecimal resolvedPrice = resolvePrice(snapshot.get());
                if (resolvedPrice == null || resolvedPrice.compareTo(ZERO) <= 0) {
                    skipped++;
                    continue;
                }

                int confidenceScore = estimateConfidence(commodity, listing);
                String reason = String.format(
                        "Matched '%s' to market commodity '%s' and fetched current mandi snapshot.",
                        listing.getTitle(),
                        commodity
                );

                try {
                    priceUpdateApprovalService.createOrRefreshPendingProposal(
                            listing,
                            commodity,
                            snapshot.get(),
                            resolvedPrice,
                            confidenceScore,
                            reason
                    );
                    proposed++;
                } catch (Exception ex) {
                    log.warn("Failed to create proposal for listing {}: {}", listing.getId(), ex.getMessage());
                    skipped++;
                }
            }

            pageable = page.hasNext() ? page.nextPageable() : Pageable.unpaged();
        } while (page.hasNext());

        log.info(
                "Listing price sync completed. processed={}, proposed={}, skipped={}, cacheHits={}",
                processed,
                proposed,
                skipped,
                snapshotCache.size()
        );
    }

    private BigDecimal resolvePrice(ExternalMarketDataService.MarketSnapshot snapshot) {
        if (snapshot.getAveragePrice() != null && snapshot.getAveragePrice().compareTo(ZERO) > 0) {
            return snapshot.getAveragePrice();
        }

        BigDecimal min = snapshot.getMinPrice();
        BigDecimal max = snapshot.getMaxPrice();

        if (min != null && max != null && min.compareTo(ZERO) > 0 && max.compareTo(ZERO) > 0) {
            return min.add(max).divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
        }

        if (min != null && min.compareTo(ZERO) > 0) {
            return min;
        }

        if (max != null && max.compareTo(ZERO) > 0) {
            return max;
        }

        return null;
    }

    private String buildCacheKey(String cropType, String state, String district) {
        String normalizedState = normalize(state);
        String normalizedDistrict = normalize(district);
        return cropType + "|" + (normalizedState == null ? "" : normalizedState) + "|" + (normalizedDistrict == null ? "" : normalizedDistrict);
    }

    private String resolveCommodityForListing(Listing listing) {
        Set<String> candidates = new LinkedHashSet<>();

        String cropType = normalize(listing.getCropType());
        if (cropType != null) {
            candidates.add(cropType.toLowerCase());
        }

        String title = listing.getTitle();
        if (title != null) {
            candidates.addAll(extractCommodityTokens(title));
        }

        for (String candidate : candidates) {
            String normalizedCandidate = TITLE_ALIASES.getOrDefault(candidate, candidate);
            if (normalizedCandidate == null || normalizedCandidate.isBlank()) {
                continue;
            }
            return normalizedCandidate.toUpperCase();
        }

        return cropType;
    }

    private Set<String> extractCommodityTokens(String title) {
        Set<String> tokens = new HashSet<>();
        Matcher matcher = WORD_PATTERN.matcher(title.toLowerCase());
        while (matcher.find()) {
            String token = matcher.group().trim();
            if (token.length() < 3 || TITLE_STOPWORDS.contains(token)) {
                continue;
            }
            tokens.add(token);
        }
        return tokens;
    }

    private int estimateConfidence(String commodity, Listing listing) {
        String normalizedTitle = listing.getTitle() == null ? "" : listing.getTitle().toLowerCase();
        if (normalizedTitle.contains(commodity.toLowerCase())) {
            return 90;
        }
        if (listing.getCropType() != null && listing.getCropType().equalsIgnoreCase(commodity)) {
            return 85;
        }
        return 70;
    }

    private LocationContext parseLocation(String location) {
        if (location == null || location.isBlank()) {
            return new LocationContext(null, null);
        }

        String[] parts = location.split(",");
        if (parts.length == 1) {
            return new LocationContext(parts[0].trim(), null);
        }

        String state = parts[parts.length - 1].trim();
        String district = parts[parts.length - 2].trim();
        return new LocationContext(state, district);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private record LocationContext(String state, String district) {
    }
}
