package com.agrilink.marketplace.service;

import com.agrilink.marketplace.dto.DemandForecastDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.util.*;

/**
 * Service for demand forecasting based on crop type and location.
 * Currently provides simulated data based on seasonal patterns and market trends.
 * Future versions can integrate with real market analytics APIs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DemandForecastService {

    // Seasonal crop demand patterns (simulated data based on Indian agricultural patterns)
    private static final Map<String, List<Month>> HIGH_DEMAND_SEASONS = new HashMap<>();
    private static final Map<String, DemandProfile> CROP_PROFILES = new HashMap<>();
    
    static {
        // Rice - Kharif crop, high demand during festivals
        HIGH_DEMAND_SEASONS.put("RICE", Arrays.asList(Month.SEPTEMBER, Month.OCTOBER, Month.NOVEMBER, Month.DECEMBER));
        CROP_PROFILES.put("RICE", new DemandProfile(new BigDecimal("35"), new BigDecimal("55"), "kg", "Staple food with consistent demand"));
        
        // Wheat - Rabi crop
        HIGH_DEMAND_SEASONS.put("WHEAT", Arrays.asList(Month.MARCH, Month.APRIL, Month.MAY, Month.JUNE));
        CROP_PROFILES.put("WHEAT", new DemandProfile(new BigDecimal("25"), new BigDecimal("40"), "kg", "High demand for flour production"));
        
        // Tomato - Year-round with peaks
        HIGH_DEMAND_SEASONS.put("TOMATO", Arrays.asList(Month.DECEMBER, Month.JANUARY, Month.FEBRUARY));
        CROP_PROFILES.put("TOMATO", new DemandProfile(new BigDecimal("20"), new BigDecimal("80"), "kg", "Price volatile based on supply"));
        
        // Onion - Storage crop with seasonal price spikes
        HIGH_DEMAND_SEASONS.put("ONION", Arrays.asList(Month.AUGUST, Month.SEPTEMBER, Month.OCTOBER));
        CROP_PROFILES.put("ONION", new DemandProfile(new BigDecimal("15"), new BigDecimal("60"), "kg", "Highly price sensitive commodity"));
        
        // Potato - Rabi season crop
        HIGH_DEMAND_SEASONS.put("POTATO", Arrays.asList(Month.JANUARY, Month.FEBRUARY, Month.MARCH));
        CROP_PROFILES.put("POTATO", new DemandProfile(new BigDecimal("12"), new BigDecimal("35"), "kg", "Steady demand throughout year"));
        
        // Cotton - Kharif crop
        HIGH_DEMAND_SEASONS.put("COTTON", Arrays.asList(Month.OCTOBER, Month.NOVEMBER, Month.DECEMBER));
        CROP_PROFILES.put("COTTON", new DemandProfile(new BigDecimal("5500"), new BigDecimal("7500"), "quintal", "Industrial demand driven"));
        
        // Sugarcane - Crushing season
        HIGH_DEMAND_SEASONS.put("SUGARCANE", Arrays.asList(Month.NOVEMBER, Month.DECEMBER, Month.JANUARY, Month.FEBRUARY, Month.MARCH));
        CROP_PROFILES.put("SUGARCANE", new DemandProfile(new BigDecimal("280"), new BigDecimal("350"), "quintal", "Mill procurement driven"));
        
        // Mango - Summer fruit
        HIGH_DEMAND_SEASONS.put("MANGO", Arrays.asList(Month.APRIL, Month.MAY, Month.JUNE, Month.JULY));
        CROP_PROFILES.put("MANGO", new DemandProfile(new BigDecimal("40"), new BigDecimal("150"), "kg", "High seasonal demand"));
        
        // Banana - Year-round
        HIGH_DEMAND_SEASONS.put("BANANA", Arrays.asList(Month.JANUARY, Month.FEBRUARY, Month.MARCH, Month.APRIL));
        CROP_PROFILES.put("BANANA", new DemandProfile(new BigDecimal("25"), new BigDecimal("60"), "dozen", "Consistent religious and dietary demand"));
        
        // Maize/Corn
        HIGH_DEMAND_SEASONS.put("MAIZE", Arrays.asList(Month.SEPTEMBER, Month.OCTOBER, Month.NOVEMBER));
        CROP_PROFILES.put("MAIZE", new DemandProfile(new BigDecimal("18"), new BigDecimal("28"), "kg", "Feed and industrial use"));
        
        // Groundnut
        HIGH_DEMAND_SEASONS.put("GROUNDNUT", Arrays.asList(Month.OCTOBER, Month.NOVEMBER, Month.DECEMBER));
        CROP_PROFILES.put("GROUNDNUT", new DemandProfile(new BigDecimal("50"), new BigDecimal("80"), "kg", "Oil extraction demand"));
        
        // Soybean
        HIGH_DEMAND_SEASONS.put("SOYBEAN", Arrays.asList(Month.OCTOBER, Month.NOVEMBER, Month.DECEMBER));
        CROP_PROFILES.put("SOYBEAN", new DemandProfile(new BigDecimal("40"), new BigDecimal("60"), "kg", "Oil and meal demand"));
        
        // Green vegetables (generic)
        HIGH_DEMAND_SEASONS.put("VEGETABLES", Arrays.asList(Month.DECEMBER, Month.JANUARY, Month.FEBRUARY));
        CROP_PROFILES.put("VEGETABLES", new DemandProfile(new BigDecimal("20"), new BigDecimal("50"), "kg", "Seasonal availability affects price"));
    }

    // State-wise demand modifiers
    private static final Map<String, Double> STATE_DEMAND_MULTIPLIERS = new HashMap<>();
    
    static {
        STATE_DEMAND_MULTIPLIERS.put("MAHARASHTRA", 1.2);
        STATE_DEMAND_MULTIPLIERS.put("UTTAR PRADESH", 1.3);
        STATE_DEMAND_MULTIPLIERS.put("PUNJAB", 1.15);
        STATE_DEMAND_MULTIPLIERS.put("KARNATAKA", 1.1);
        STATE_DEMAND_MULTIPLIERS.put("TAMIL NADU", 1.1);
        STATE_DEMAND_MULTIPLIERS.put("GUJARAT", 1.15);
        STATE_DEMAND_MULTIPLIERS.put("MADHYA PRADESH", 1.1);
        STATE_DEMAND_MULTIPLIERS.put("RAJASTHAN", 1.05);
        STATE_DEMAND_MULTIPLIERS.put("ANDHRA PRADESH", 1.1);
        STATE_DEMAND_MULTIPLIERS.put("TELANGANA", 1.1);
        STATE_DEMAND_MULTIPLIERS.put("WEST BENGAL", 1.15);
        STATE_DEMAND_MULTIPLIERS.put("BIHAR", 1.1);
        STATE_DEMAND_MULTIPLIERS.put("HARYANA", 1.1);
        STATE_DEMAND_MULTIPLIERS.put("KERALA", 1.05);
    }

    /**
     * Get demand forecast for a specific crop and location.
     */
    public DemandForecastDto getDemandForecast(String cropType, String district, String state) {
        log.info("Getting demand forecast for crop: {}, district: {}, state: {}", cropType, district, state);
        
        String normalizedCrop = cropType != null ? cropType.toUpperCase().trim() : "VEGETABLES";
        String normalizedState = state != null ? state.toUpperCase().trim() : "";
        String normalizedDistrict = district != null ? district.trim() : "";
        
        // Get current month for seasonal analysis
        Month currentMonth = LocalDate.now().getMonth();
        
        // Check if crop profile exists
        DemandProfile profile = CROP_PROFILES.getOrDefault(normalizedCrop, 
            new DemandProfile(new BigDecimal("20"), new BigDecimal("50"), "kg", "General agricultural produce"));
        
        // Determine demand level based on season
        List<Month> highDemandMonths = HIGH_DEMAND_SEASONS.getOrDefault(normalizedCrop, Collections.emptyList());
        String demandLevel = determineDemandLevel(currentMonth, highDemandMonths);
        
        // Apply state multiplier to prices
        double stateMultiplier = STATE_DEMAND_MULTIPLIERS.getOrDefault(normalizedState, 1.0);
        BigDecimal adjustedMinPrice = profile.minPrice.multiply(BigDecimal.valueOf(stateMultiplier));
        BigDecimal adjustedMaxPrice = profile.maxPrice.multiply(BigDecimal.valueOf(stateMultiplier));
        
        // Generate trend message
        String trendMessage = generateTrendMessage(normalizedCrop, demandLevel, currentMonth);
        String trendDirection = determineTrendDirection(currentMonth, highDemandMonths);
        String seasonRecommendation = generateSeasonRecommendation(normalizedCrop, currentMonth, highDemandMonths);
        String marketInsight = generateMarketInsight(normalizedCrop, normalizedState, demandLevel);
        
        return DemandForecastDto.builder()
                .cropType(cropType)
                .district(normalizedDistrict)
                .state(state)
                .demandLevel(demandLevel)
                .minPricePerKg(adjustedMinPrice.setScale(2, java.math.RoundingMode.HALF_UP))
                .maxPricePerKg(adjustedMaxPrice.setScale(2, java.math.RoundingMode.HALF_UP))
                .priceUnit("INR/" + profile.unit)
                .trendMessage(trendMessage)
                .trendDirection(trendDirection)
                .confidence(demandLevel.equals("HIGH") ? "HIGH" : "MEDIUM")
                .seasonRecommendation(seasonRecommendation)
                .isSimulated(true)
                .marketInsight(marketInsight)
                .build();
    }

    /**
     * Get list of supported crops for demand forecasting.
     */
    public List<String> getSupportedCrops() {
        return new ArrayList<>(CROP_PROFILES.keySet());
    }

    /**
     * Get list of supported states.
     */
    public List<String> getSupportedStates() {
        return new ArrayList<>(STATE_DEMAND_MULTIPLIERS.keySet());
    }

    private String determineDemandLevel(Month currentMonth, List<Month> highDemandMonths) {
        if (highDemandMonths.contains(currentMonth)) {
            return "HIGH";
        }
        // Check if adjacent months (medium demand)
        int monthValue = currentMonth.getValue();
        for (Month highMonth : highDemandMonths) {
            int diff = Math.abs(highMonth.getValue() - monthValue);
            if (diff == 1 || diff == 11) {
                return "MEDIUM";
            }
        }
        return "LOW";
    }

    private String determineTrendDirection(Month currentMonth, List<Month> highDemandMonths) {
        if (highDemandMonths.isEmpty()) return "STABLE";
        
        int monthValue = currentMonth.getValue();
        boolean approachingHigh = false;
        boolean leavingHigh = false;
        
        for (Month highMonth : highDemandMonths) {
            int diff = highMonth.getValue() - monthValue;
            if (diff > 0 && diff <= 2) approachingHigh = true;
            if (diff < 0 && diff >= -2) leavingHigh = true;
        }
        
        if (approachingHigh) return "UP";
        if (leavingHigh) return "DOWN";
        return "STABLE";
    }

    private String generateTrendMessage(String crop, String demandLevel, Month currentMonth) {
        switch (demandLevel) {
            case "HIGH":
                return String.format("Strong demand expected for %s. Good time to plan sales.", crop.toLowerCase());
            case "MEDIUM":
                return String.format("Moderate demand for %s. Consider market timing for better prices.", crop.toLowerCase());
            case "LOW":
            default:
                return String.format("Lower demand period for %s. Consider storage or value-added processing.", crop.toLowerCase());
        }
    }

    private String generateSeasonRecommendation(String crop, Month currentMonth, List<Month> highDemandMonths) {
        if (highDemandMonths.isEmpty()) {
            return "Year-round cultivation possible. Monitor local market conditions.";
        }
        
        if (highDemandMonths.contains(currentMonth)) {
            return "Peak season - optimal time for selling. Harvest and sell for best prices.";
        }
        
        // Find next high demand month
        int currentValue = currentMonth.getValue();
        Month nextHighMonth = null;
        int minDiff = Integer.MAX_VALUE;
        
        for (Month highMonth : highDemandMonths) {
            int diff = highMonth.getValue() - currentValue;
            if (diff < 0) diff += 12;
            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                nextHighMonth = highMonth;
            }
        }
        
        if (nextHighMonth != null && minDiff <= 3) {
            return String.format("Plan cultivation now. Peak demand expected in %s.", nextHighMonth.toString());
        }
        
        return "Off-season period. Focus on soil preparation and planning.";
    }

    private String generateMarketInsight(String crop, String state, String demandLevel) {
        StringBuilder insight = new StringBuilder();
        
        if (STATE_DEMAND_MULTIPLIERS.containsKey(state)) {
            insight.append(String.format("%s is a key market for agricultural produce. ", toTitleCase(state)));
        }
        
        switch (demandLevel) {
            case "HIGH":
                insight.append("Local mandis and wholesale markets are actively procuring. Consider direct farmer-to-consumer sales for premium pricing.");
                break;
            case "MEDIUM":
                insight.append("Stable market conditions. Explore contract farming or FPO linkages for assured prices.");
                break;
            case "LOW":
                insight.append("Focus on value addition and cold storage. Explore export opportunities or food processing units.");
                break;
        }
        
        return insight.toString();
    }

    private String toTitleCase(String input) {
        if (input == null || input.isEmpty()) return input;
        StringBuilder result = new StringBuilder();
        String[] words = input.toLowerCase().split(" ");
        for (String word : words) {
            if (word.length() > 0) {
                result.append(Character.toUpperCase(word.charAt(0)))
                      .append(word.substring(1))
                      .append(" ");
            }
        }
        return result.toString().trim();
    }

    // Inner class for demand profile
    private static class DemandProfile {
        BigDecimal minPrice;
        BigDecimal maxPrice;
        String unit;
        String description;

        DemandProfile(BigDecimal minPrice, BigDecimal maxPrice, String unit, String description) {
            this.minPrice = minPrice;
            this.maxPrice = maxPrice;
            this.unit = unit;
            this.description = description;
        }
    }
}
