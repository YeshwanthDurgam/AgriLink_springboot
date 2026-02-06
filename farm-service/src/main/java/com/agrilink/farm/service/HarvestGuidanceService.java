package com.agrilink.farm.service;

import com.agrilink.farm.dto.HarvestGuidanceDto;
import com.agrilink.farm.dto.HarvestGuidanceDto.*;
import com.agrilink.farm.dto.WeatherDto;
import com.agrilink.farm.entity.Farm;
import com.agrilink.farm.repository.FarmRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.util.*;

/**
 * Service for providing harvest guidance and crop planning recommendations.
 * Integrates weather data with agricultural best practices.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HarvestGuidanceService {

    private final WeatherService weatherService;
    private final FarmRepository farmRepository;

    // Crop-specific data
    private static final Map<String, CropProfile> CROP_PROFILES = new HashMap<>();
    
    static {
        // Rice
        CROP_PROFILES.put("RICE", new CropProfile(
            Arrays.asList("Transplanter", "Weeder", "Sprayer", "Harvester", "Thresher"),
            Arrays.asList(
                new FertilizerInfo("DAP", "CHEMICAL", "100 kg/acre", "Before transplanting", "Phosphorus for root development"),
                new FertilizerInfo("Urea", "CHEMICAL", "50 kg/acre", "21 days after transplanting", "Nitrogen for vegetative growth"),
                new FertilizerInfo("MOP", "CHEMICAL", "40 kg/acre", "At panicle initiation", "Potassium for grain filling"),
                new FertilizerInfo("Vermicompost", "ORGANIC", "2 tons/acre", "During land preparation", "Improves soil health")
            ),
            "FLOOD",
            "Every 3-4 days",
            new BigDecimal("5000"),
            120,
            Arrays.asList("Check grain hardness", "Golden yellow color of panicles", "20-25% grain moisture")
        ));
        
        // Wheat
        CROP_PROFILES.put("WHEAT", new CropProfile(
            Arrays.asList("Seed Drill", "Cultivator", "Sprayer", "Combine Harvester"),
            Arrays.asList(
                new FertilizerInfo("DAP", "CHEMICAL", "50 kg/acre", "At sowing", "Phosphorus for root establishment"),
                new FertilizerInfo("Urea", "CHEMICAL", "65 kg/acre", "Split application", "Nitrogen for tillering"),
                new FertilizerInfo("Zinc Sulphate", "CHEMICAL", "10 kg/acre", "At sowing", "Micronutrient supplement"),
                new FertilizerInfo("FYM", "ORGANIC", "4 tons/acre", "Before sowing", "Organic matter improvement")
            ),
            "SPRINKLER",
            "Every 15-20 days",
            new BigDecimal("2000"),
            135,
            Arrays.asList("Golden straw color", "Hard grain texture", "12-14% grain moisture")
        ));
        
        // Tomato
        CROP_PROFILES.put("TOMATO", new CropProfile(
            Arrays.asList("Transplanting trays", "Sprayer", "Staking materials", "Drip system", "Harvesting baskets"),
            Arrays.asList(
                new FertilizerInfo("NPK 19:19:19", "CHEMICAL", "25 kg/acre", "Basal dose", "Balanced nutrition"),
                new FertilizerInfo("Calcium Nitrate", "CHEMICAL", "10 kg/acre", "Foliar spray", "Prevents blossom end rot"),
                new FertilizerInfo("Neem Cake", "ORGANIC", "100 kg/acre", "At transplanting", "Pest deterrent"),
                new FertilizerInfo("Seaweed Extract", "BIO", "2 L/acre", "Foliar application", "Growth promoter")
            ),
            "DRIP",
            "Daily",
            new BigDecimal("3000"),
            90,
            Arrays.asList("Full red color at bottom", "Firm texture", "Slight give when pressed")
        ));
        
        // Onion
        CROP_PROFILES.put("ONION", new CropProfile(
            Arrays.asList("Raised bed former", "Drip system", "Sprayer", "Curing shed"),
            Arrays.asList(
                new FertilizerInfo("DAP", "CHEMICAL", "50 kg/acre", "At transplanting", "Root development"),
                new FertilizerInfo("Potash", "CHEMICAL", "50 kg/acre", "At bulb formation", "Bulb development"),
                new FertilizerInfo("Sulphur", "CHEMICAL", "15 kg/acre", "Basal", "Pungency and storage quality"),
                new FertilizerInfo("Trichoderma", "BIO", "2 kg/acre", "Soil application", "Disease prevention")
            ),
            "DRIP",
            "Every 5-7 days",
            new BigDecimal("2500"),
            120,
            Arrays.asList("Neck fall - 50% fallen tops", "Bulb skin papery", "Firm bulb texture")
        ));
        
        // Potato
        CROP_PROFILES.put("POTATO", new CropProfile(
            Arrays.asList("Potato planter", "Ridger", "Sprayer", "Potato digger", "Grader"),
            Arrays.asList(
                new FertilizerInfo("NPK 10:26:26", "CHEMICAL", "75 kg/acre", "At planting", "Phosphorus and potassium"),
                new FertilizerInfo("Urea", "CHEMICAL", "50 kg/acre", "At earthing up", "Vegetative growth"),
                new FertilizerInfo("Calcium Ammonium Nitrate", "CHEMICAL", "25 kg/acre", "Top dressing", "Tuber development"),
                new FertilizerInfo("Mustard Cake", "ORGANIC", "200 kg/acre", "Before planting", "Soil enrichment")
            ),
            "FURROW",
            "Every 10-12 days",
            new BigDecimal("3500"),
            100,
            Arrays.asList("Yellowing of leaves", "Skin set - firm skin", "Adequate tuber size")
        ));
        
        // Cotton
        CROP_PROFILES.put("COTTON", new CropProfile(
            Arrays.asList("Seed drill", "Sprayer", "Picking bags", "Ginning equipment"),
            Arrays.asList(
                new FertilizerInfo("DAP", "CHEMICAL", "60 kg/acre", "At sowing", "Root establishment"),
                new FertilizerInfo("Urea", "CHEMICAL", "80 kg/acre", "Split doses", "Vegetative and reproductive growth"),
                new FertilizerInfo("MOP", "CHEMICAL", "30 kg/acre", "At flowering", "Boll development"),
                new FertilizerInfo("Azotobacter", "BIO", "1 kg/acre", "Soil application", "Nitrogen fixing")
            ),
            "DRIP",
            "Every 10-15 days",
            new BigDecimal("4000"),
            180,
            Arrays.asList("Boll opening - 60%+", "White fluffy cotton visible", "Dry weather period")
        ));
        
        // Maize
        CROP_PROFILES.put("MAIZE", new CropProfile(
            Arrays.asList("Maize planter", "Cultivator", "Sprayer", "Sheller"),
            Arrays.asList(
                new FertilizerInfo("DAP", "CHEMICAL", "50 kg/acre", "At sowing", "Early root development"),
                new FertilizerInfo("Urea", "CHEMICAL", "100 kg/acre", "Split doses", "Nitrogen requirement"),
                new FertilizerInfo("Zinc Sulphate", "CHEMICAL", "10 kg/acre", "Basal", "Prevents zinc deficiency"),
                new FertilizerInfo("Jeevamrutha", "ORGANIC", "200 L/acre", "Every 15 days", "Soil biological activity")
            ),
            "FURROW",
            "Every 8-10 days",
            new BigDecimal("3000"),
            110,
            Arrays.asList("Cob husk turns brown", "Kernels dent and harden", "Black layer formation")
        ));
        
        // Sugarcane
        CROP_PROFILES.put("SUGARCANE", new CropProfile(
            Arrays.asList("Sugarcane planter", "Earthing up equipment", "Sprayer", "Cane harvester", "Trailer"),
            Arrays.asList(
                new FertilizerInfo("DAP", "CHEMICAL", "100 kg/acre", "At planting", "Establishment"),
                new FertilizerInfo("Urea", "CHEMICAL", "200 kg/acre", "Split 3 doses", "Vegetative growth"),
                new FertilizerInfo("MOP", "CHEMICAL", "60 kg/acre", "At grand growth", "Sugar accumulation"),
                new FertilizerInfo("Press Mud", "ORGANIC", "10 tons/acre", "Before planting", "Soil amendment")
            ),
            "FURROW",
            "Every 15-20 days",
            new BigDecimal("8000"),
            360,
            Arrays.asList("Brix reading 18%+", "Leaves yellowing and drying", "Juice quality at peak")
        ));
        
        // Default for unknown crops
        CROP_PROFILES.put("DEFAULT", new CropProfile(
            Arrays.asList("Basic hand tools", "Sprayer", "Watering equipment"),
            Arrays.asList(
                new FertilizerInfo("NPK", "CHEMICAL", "As per soil test", "Basal and top dressing", "Balanced nutrition"),
                new FertilizerInfo("Compost", "ORGANIC", "5 tons/acre", "Before planting", "Soil health")
            ),
            "DRIP",
            "As per crop requirement",
            new BigDecimal("2500"),
            90,
            Arrays.asList("Check maturity indicators for specific crop", "Visual inspection", "Appropriate moisture level")
        ));
    }

    /**
     * Get harvest guidance for a specific crop and location.
     */
    public HarvestGuidanceDto getHarvestGuidance(String cropName, String location, UUID farmId) {
        log.info("Getting harvest guidance for crop: {}, location: {}, farmId: {}", cropName, location, farmId);
        
        String normalizedCrop = cropName != null ? cropName.toUpperCase().trim() : "DEFAULT";
        CropProfile profile = CROP_PROFILES.getOrDefault(normalizedCrop, CROP_PROFILES.get("DEFAULT"));
        
        // Get weather data
        WeatherSummary weatherSummary = getWeatherSummary(farmId, location);
        
        // Build tool recommendations
        List<ToolRecommendation> tools = buildToolRecommendations(profile, normalizedCrop);
        
        // Build fertilizer suggestions
        List<FertilizerSuggestion> fertilizers = buildFertilizerSuggestions(profile);
        
        // Build irrigation guidance
        IrrigationGuidance irrigation = buildIrrigationGuidance(profile, weatherSummary);
        
        // Build harvest readiness
        HarvestReadiness harvestReadiness = buildHarvestReadiness(profile, normalizedCrop);
        
        // Build cultivation tips
        List<String> tips = buildCultivationTips(normalizedCrop, weatherSummary);
        
        return HarvestGuidanceDto.builder()
                .cropName(cropName)
                .location(location)
                .weatherSummary(weatherSummary)
                .recommendedTools(tools)
                .fertilizerSuggestions(fertilizers)
                .irrigationGuidance(irrigation)
                .harvestReadiness(harvestReadiness)
                .cultivationTips(tips)
                .isSimulated(true)
                .build();
    }

    /**
     * Get list of supported crops.
     */
    public List<String> getSupportedCrops() {
        return CROP_PROFILES.keySet().stream()
                .filter(c -> !c.equals("DEFAULT"))
                .sorted()
                .toList();
    }

    private WeatherSummary getWeatherSummary(UUID farmId, String location) {
        try {
            WeatherDto weather = null;
            
            if (farmId != null) {
                weather = weatherService.getWeatherForFarm(farmId);
            }
            
            if (weather != null && weather.getCurrent() != null) {
                List<DayForecast> dailyForecast = new ArrayList<>();
                if (weather.getForecast() != null) {
                    for (int i = 0; i < Math.min(5, weather.getForecast().size()); i++) {
                        WeatherDto.DailyForecast df = weather.getForecast().get(i);
                        dailyForecast.add(DayForecast.builder()
                                .day(df.getDate().getDayOfWeek().toString().substring(0, 3))
                                .condition(df.getCondition())
                                .minTemp(BigDecimal.valueOf(df.getTempMin()))
                                .maxTemp(BigDecimal.valueOf(df.getTempMax()))
                                .rainChance(BigDecimal.valueOf(df.getPrecipitationChance()))
                                .build());
                    }
                }
                
                return WeatherSummary.builder()
                        .condition(weather.getCurrent().getCondition())
                        .temperature(BigDecimal.valueOf(weather.getCurrent().getTemperature()))
                        .humidity(BigDecimal.valueOf(weather.getCurrent().getHumidity()))
                        .rainfall(BigDecimal.valueOf(weather.getCurrent().getPrecipitation() != null ? 
                                weather.getCurrent().getPrecipitation() : 0))
                        .forecast(generateForecastSummary(weather))
                        .advisoryMessage(generateWeatherAdvisory(weather))
                        .dailyForecast(dailyForecast)
                        .build();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch weather data: {}", e.getMessage());
        }
        
        // Return simulated weather if actual data not available
        return createSimulatedWeatherSummary(location);
    }

    private WeatherSummary createSimulatedWeatherSummary(String location) {
        Month currentMonth = LocalDate.now().getMonth();
        String condition;
        BigDecimal temp;
        BigDecimal humidity;
        
        // Simulate based on season
        if (currentMonth.getValue() >= 6 && currentMonth.getValue() <= 9) {
            condition = "Monsoon - Cloudy with intermittent rain";
            temp = new BigDecimal("28");
            humidity = new BigDecimal("85");
        } else if (currentMonth.getValue() >= 11 || currentMonth.getValue() <= 2) {
            condition = "Winter - Clear and cool";
            temp = new BigDecimal("18");
            humidity = new BigDecimal("60");
        } else {
            condition = "Summer - Hot and dry";
            temp = new BigDecimal("35");
            humidity = new BigDecimal("40");
        }
        
        List<DayForecast> forecast = Arrays.asList(
            DayForecast.builder().day("Today").condition(condition).minTemp(temp.subtract(new BigDecimal("5"))).maxTemp(temp.add(new BigDecimal("5"))).rainChance(new BigDecimal("20")).build(),
            DayForecast.builder().day("Tomorrow").condition(condition).minTemp(temp.subtract(new BigDecimal("4"))).maxTemp(temp.add(new BigDecimal("6"))).rainChance(new BigDecimal("25")).build(),
            DayForecast.builder().day("Day 3").condition(condition).minTemp(temp.subtract(new BigDecimal("5"))).maxTemp(temp.add(new BigDecimal("4"))).rainChance(new BigDecimal("15")).build()
        );
        
        return WeatherSummary.builder()
                .condition(condition)
                .temperature(temp)
                .humidity(humidity)
                .rainfall(new BigDecimal("0"))
                .forecast("Weather data simulated based on seasonal patterns. Check local forecasts for accurate information.")
                .advisoryMessage("Monitor local weather updates for field operations planning.")
                .dailyForecast(forecast)
                .build();
    }

    private String generateForecastSummary(WeatherDto weather) {
        if (weather.getForecast() == null || weather.getForecast().isEmpty()) {
            return "Forecast data not available";
        }
        
        double avgRainChance = weather.getForecast().stream()
                .mapToDouble(f -> f.getPrecipitationChance() != null ? f.getPrecipitationChance() : 0)
                .average()
                .orElse(0);
        
        if (avgRainChance > 60) {
            return "High chance of rain expected. Plan field operations accordingly.";
        } else if (avgRainChance > 30) {
            return "Moderate chance of rain. Keep harvested produce protected.";
        } else {
            return "Mostly dry conditions expected. Good for field operations.";
        }
    }

    private String generateWeatherAdvisory(WeatherDto weather) {
        if (weather.getCurrent() == null) {
            return "Check local weather for updates";
        }
        
        StringBuilder advisory = new StringBuilder();
        
        if (weather.getCurrent().getTemperature() != null) {
            if (weather.getCurrent().getTemperature() > 40) {
                advisory.append("Extreme heat warning. Avoid fieldwork during 11 AM - 4 PM. ");
            } else if (weather.getCurrent().getTemperature() < 5) {
                advisory.append("Frost warning. Protect sensitive crops. ");
            }
        }
        
        if (weather.getCurrent().getHumidity() != null) {
            if (weather.getCurrent().getHumidity() > 85) {
                advisory.append("High humidity - monitor for fungal diseases. ");
            }
        }
        
        if (advisory.length() == 0) {
            advisory.append("Weather conditions suitable for normal farming activities.");
        }
        
        return advisory.toString().trim();
    }

    private List<ToolRecommendation> buildToolRecommendations(CropProfile profile, String cropName) {
        List<ToolRecommendation> tools = new ArrayList<>();
        List<String> toolNames = profile.tools;
        
        for (int i = 0; i < toolNames.size(); i++) {
            String priority = i < 2 ? "ESSENTIAL" : (i < 4 ? "RECOMMENDED" : "OPTIONAL");
            tools.add(ToolRecommendation.builder()
                    .name(toolNames.get(i))
                    .category(getToolCategory(toolNames.get(i)))
                    .purpose(getToolPurpose(toolNames.get(i), cropName))
                    .priority(priority)
                    .build());
        }
        
        return tools;
    }

    private String getToolCategory(String toolName) {
        String lower = toolName.toLowerCase();
        if (lower.contains("sprayer") || lower.contains("spray")) return "Plant Protection";
        if (lower.contains("harvester") || lower.contains("digger") || lower.contains("sheller")) return "Harvesting";
        if (lower.contains("planter") || lower.contains("drill") || lower.contains("transplant")) return "Planting";
        if (lower.contains("drip") || lower.contains("water")) return "Irrigation";
        return "General Equipment";
    }

    private String getToolPurpose(String toolName, String cropName) {
        String lower = toolName.toLowerCase();
        if (lower.contains("sprayer")) return "Pesticide and fertilizer application";
        if (lower.contains("harvester")) return "Mechanical harvesting of " + cropName.toLowerCase();
        if (lower.contains("planter") || lower.contains("drill")) return "Precision planting and seed placement";
        if (lower.contains("thresher") || lower.contains("sheller")) return "Post-harvest grain separation";
        if (lower.contains("drip")) return "Water-efficient irrigation system";
        return "Essential for " + cropName.toLowerCase() + " cultivation";
    }

    private List<FertilizerSuggestion> buildFertilizerSuggestions(CropProfile profile) {
        return profile.fertilizers.stream()
                .map(f -> FertilizerSuggestion.builder()
                        .name(f.name)
                        .type(f.type)
                        .dosage(f.dosage)
                        .applicationMethod(getApplicationMethod(f.type))
                        .timing(f.timing)
                        .benefit(f.benefit)
                        .build())
                .toList();
    }

    private String getApplicationMethod(String type) {
        return switch (type) {
            case "ORGANIC" -> "Broadcast and incorporate into soil";
            case "BIO" -> "Soil drenching or foliar spray";
            case "CHEMICAL" -> "Band placement or broadcasting";
            default -> "As per product instructions";
        };
    }

    private IrrigationGuidance buildIrrigationGuidance(CropProfile profile, WeatherSummary weather) {
        List<String> tips = new ArrayList<>();
        tips.add("Irrigate during early morning or late evening to minimize evaporation");
        tips.add("Monitor soil moisture before irrigation to avoid over-watering");
        
        String currentAdvice;
        if (weather.getRainfall() != null && weather.getRainfall().compareTo(BigDecimal.ZERO) > 0) {
            currentAdvice = "Recent rainfall detected. Delay irrigation and check soil moisture.";
            tips.add("Wait for soil to drain before next irrigation");
        } else if (weather.getHumidity() != null && weather.getHumidity().compareTo(new BigDecimal("80")) > 0) {
            currentAdvice = "High humidity - reduce irrigation frequency to prevent waterlogging.";
            tips.add("Improve field drainage if water stagnation observed");
        } else {
            currentAdvice = "Normal conditions. Follow regular irrigation schedule.";
        }
        
        tips.add("Use mulching to conserve soil moisture");
        
        return IrrigationGuidance.builder()
                .method(profile.irrigationMethod)
                .frequency(profile.irrigationFrequency)
                .waterRequirement(profile.waterRequirement)
                .bestTime("Early morning (6-8 AM) or Evening (5-7 PM)")
                .currentAdvice(currentAdvice)
                .tips(tips)
                .build();
    }

    private HarvestReadiness buildHarvestReadiness(CropProfile profile, String cropName) {
        // Simulate harvest readiness based on typical crop cycle
        // In real implementation, this would be based on actual crop planting date
        
        Month currentMonth = LocalDate.now().getMonth();
        String status;
        int readinessPercentage;
        String estimatedDays;
        
        // Simulate based on crop and season
        if (isHarvestSeason(cropName, currentMonth)) {
            status = "READY";
            readinessPercentage = 85;
            estimatedDays = "0-7 days";
        } else if (isApproachingHarvest(cropName, currentMonth)) {
            status = "APPROACHING";
            readinessPercentage = 65;
            estimatedDays = "15-30 days";
        } else {
            status = "NOT_READY";
            readinessPercentage = 30;
            estimatedDays = "45+ days";
        }
        
        List<String> harvestTips = Arrays.asList(
            "Harvest during dry weather conditions",
            "Ensure proper equipment maintenance before harvesting",
            "Arrange storage and transportation in advance",
            "Keep moisture measuring equipment ready"
        );
        
        return HarvestReadiness.builder()
                .readinessPercentage(readinessPercentage)
                .status(status)
                .estimatedDays(estimatedDays)
                .readinessIndicators(profile.harvestIndicators)
                .harvestingTips(harvestTips)
                .build();
    }

    private boolean isHarvestSeason(String crop, Month month) {
        return switch (crop) {
            case "RICE" -> month == Month.OCTOBER || month == Month.NOVEMBER;
            case "WHEAT" -> month == Month.APRIL || month == Month.MAY;
            case "COTTON" -> month == Month.NOVEMBER || month == Month.DECEMBER;
            default -> false;
        };
    }

    private boolean isApproachingHarvest(String crop, Month month) {
        return switch (crop) {
            case "RICE" -> month == Month.SEPTEMBER;
            case "WHEAT" -> month == Month.MARCH;
            case "COTTON" -> month == Month.OCTOBER;
            default -> false;
        };
    }

    private List<String> buildCultivationTips(String cropName, WeatherSummary weather) {
        List<String> tips = new ArrayList<>();
        
        // General tips
        tips.add("Maintain regular field scouting for pests and diseases");
        tips.add("Keep records of all farming activities for better planning");
        
        // Weather-based tips
        if (weather.getTemperature() != null) {
            if (weather.getTemperature().compareTo(new BigDecimal("35")) > 0) {
                tips.add("High temperature alert: Increase irrigation frequency and consider mulching");
            }
            if (weather.getTemperature().compareTo(new BigDecimal("10")) < 0) {
                tips.add("Low temperature: Consider protective measures for young crops");
            }
        }
        
        // Crop-specific tips
        switch (cropName) {
            case "RICE" -> {
                tips.add("Maintain proper water level in paddy fields");
                tips.add("Scout for stem borer and leaf folder regularly");
            }
            case "WHEAT" -> {
                tips.add("Watch for aphid infestation during flowering");
                tips.add("Apply light irrigation at grain filling stage");
            }
            case "TOMATO" -> {
                tips.add("Stake plants and remove suckers for better yield");
                tips.add("Monitor for early and late blight symptoms");
            }
            case "COTTON" -> {
                tips.add("Scout for bollworm at weekly intervals");
                tips.add("Maintain proper plant population for air circulation");
            }
            default -> tips.add("Follow recommended package of practices for your crop");
        }
        
        return tips;
    }

    // Helper classes
    private static class CropProfile {
        List<String> tools;
        List<FertilizerInfo> fertilizers;
        String irrigationMethod;
        String irrigationFrequency;
        BigDecimal waterRequirement;
        int growthDays;
        List<String> harvestIndicators;
        
        CropProfile(List<String> tools, List<FertilizerInfo> fertilizers, String irrigationMethod,
                    String irrigationFrequency, BigDecimal waterRequirement, int growthDays,
                    List<String> harvestIndicators) {
            this.tools = tools;
            this.fertilizers = fertilizers;
            this.irrigationMethod = irrigationMethod;
            this.irrigationFrequency = irrigationFrequency;
            this.waterRequirement = waterRequirement;
            this.growthDays = growthDays;
            this.harvestIndicators = harvestIndicators;
        }
    }
    
    private static class FertilizerInfo {
        String name;
        String type;
        String dosage;
        String timing;
        String benefit;
        
        FertilizerInfo(String name, String type, String dosage, String timing, String benefit) {
            this.name = name;
            this.type = type;
            this.dosage = dosage;
            this.timing = timing;
            this.benefit = benefit;
        }
    }
}
