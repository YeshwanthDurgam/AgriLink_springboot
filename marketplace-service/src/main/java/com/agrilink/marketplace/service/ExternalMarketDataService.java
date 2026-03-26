package com.agrilink.marketplace.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * External market-price adapter using free public datasets (e.g., data.gov.in resources).
 * This service is optional and gracefully degrades when API credentials are unavailable.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalMarketDataService {

    private final WebClient marketDataWebClient;

    @Value("${market.data.datagov.api-key:}")
    private String dataGovApiKey;

    @Value("${market.data.datagov.resource-id:}")
    private String dataGovResourceId;

    @SuppressWarnings("unchecked")
    public Optional<MarketSnapshot> getMarketSnapshot(String cropType, String state, String district) {
        if (isBlank(dataGovApiKey) || isBlank(dataGovResourceId)) {
            return Optional.empty();
        }

        try {
            String commodity = toTitleCase(cropType);
            String stateName = isBlank(state) ? null : toTitleCase(state);
            String districtName = isBlank(district) ? null : toTitleCase(district);

            Map<String, Object> response = marketDataWebClient
                    .get()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder
                                .path("/" + dataGovResourceId)
                                .queryParam("api-key", dataGovApiKey)
                                .queryParam("format", "json")
                                .queryParam("limit", 50)
                                .queryParam("filters[commodity]", commodity);
                        if (!isBlank(stateName)) {
                            builder = builder.queryParam("filters[state]", stateName);
                        }
                        if (!isBlank(districtName)) {
                            builder = builder.queryParam("filters[district]", districtName);
                        }
                        return builder.build();
                    })
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                return Optional.empty();
            }

            List<Map<String, Object>> records = (List<Map<String, Object>>) response.getOrDefault("records", Collections.emptyList());
            if (records.isEmpty()) {
                return Optional.empty();
            }

            BigDecimal modalTotal = BigDecimal.ZERO;
            int modalCount = 0;
            BigDecimal minPrice = null;
            BigDecimal maxPrice = null;
            String market = null;
                String normalizedUnit = "kg";

            for (Map<String, Object> record : records) {
                String recordUnit = detectUnit(record);
                BigDecimal modal = normalizeToPerKg(
                    pickPrice(record, "modal_price", "modal price", "Modal Price", "Modal_Price"),
                    recordUnit
                );
                BigDecimal min = normalizeToPerKg(
                    pickPrice(record, "min_price", "min price", "Min Price", "Min_Price"),
                    recordUnit
                );
                BigDecimal max = normalizeToPerKg(
                    pickPrice(record, "max_price", "max price", "Max Price", "Max_Price"),
                    recordUnit
                );

                if (modal != null && modal.compareTo(BigDecimal.ZERO) > 0) {
                    modalTotal = modalTotal.add(modal);
                    modalCount++;
                }
                if (min != null && min.compareTo(BigDecimal.ZERO) > 0) {
                    minPrice = minPrice == null ? min : minPrice.min(min);
                }
                if (max != null && max.compareTo(BigDecimal.ZERO) > 0) {
                    maxPrice = maxPrice == null ? max : maxPrice.max(max);
                }

                if (market == null) {
                    Object marketValue = firstNonNull(record, "market", "Market", "market_name");
                    if (marketValue != null) {
                        market = marketValue.toString();
                    }
                }

                if (recordUnit != null && !recordUnit.isBlank()) {
                    normalizedUnit = "kg";
                }
            }

            if (modalCount == 0 && minPrice == null && maxPrice == null) {
                return Optional.empty();
            }

            BigDecimal avgModal = modalCount > 0
                    ? modalTotal.divide(BigDecimal.valueOf(modalCount), 2, RoundingMode.HALF_UP)
                    : null;

            if (minPrice == null && avgModal != null) {
                minPrice = avgModal.multiply(new BigDecimal("0.90")).setScale(2, RoundingMode.HALF_UP);
            }
            if (maxPrice == null && avgModal != null) {
                maxPrice = avgModal.multiply(new BigDecimal("1.10")).setScale(2, RoundingMode.HALF_UP);
            }

            return Optional.of(MarketSnapshot.builder()
                    .source("datagov-agmarknet")
                    .marketName(market)
                    .minPrice(minPrice)
                    .maxPrice(maxPrice)
                    .averagePrice(avgModal)
                    .normalizedUnit(normalizedUnit)
                    .recordCount(records.size())
                    .fetchedAt(LocalDateTime.now())
                    .build());

        } catch (Exception ex) {
            log.warn("Unable to fetch external market snapshot for crop {}: {}", cropType, ex.getMessage());
            return Optional.empty();
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private Object firstNonNull(Map<String, Object> record, String... keys) {
        for (String key : keys) {
            Object value = record.get(key);
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private BigDecimal pickPrice(Map<String, Object> record, String... keys) {
        for (String key : keys) {
            Object value = record.get(key);
            if (value == null) continue;
            try {
                String sanitized = value.toString().replaceAll("[^0-9.]", "").trim();
                if (sanitized.isEmpty()) continue;
                return new BigDecimal(sanitized);
            } catch (Exception ignored) {
                // Try next key.
            }
        }
        return null;
    }

    private String toTitleCase(String input) {
        if (input == null || input.trim().isEmpty()) return input;
        String[] words = input.trim().toLowerCase().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (word.isEmpty()) continue;
            sb.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1)).append(' ');
        }
        return sb.toString().trim();
    }

    private String detectUnit(Map<String, Object> record) {
        Object raw = firstNonNull(record, "unit", "Unit", "price_unit", "Price Unit");
        return raw == null ? null : raw.toString().trim().toLowerCase();
    }

    private BigDecimal normalizeToPerKg(BigDecimal value, String rawUnit) {
        if (value == null) {
            return null;
        }
        if (rawUnit == null || rawUnit.isBlank()) {
            return value.setScale(2, RoundingMode.HALF_UP);
        }

        String unit = rawUnit.toLowerCase();
        if (unit.contains("quintal") || unit.contains("qtl")) {
            return value.divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        }
        if (unit.contains("100 kg") || unit.contains("100kg")) {
            return value.divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        }

        return value.setScale(2, RoundingMode.HALF_UP);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MarketSnapshot {
        private String source;
        private String marketName;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private BigDecimal averagePrice;
        private String normalizedUnit;
        private Integer recordCount;
        private LocalDateTime fetchedAt;
    }
}
