package com.agrilink.farm.service;

import com.agrilink.farm.dto.DashboardSummaryDto;
import com.agrilink.farm.dto.FarmAnalyticsDto;
import com.agrilink.farm.entity.CropPlan;
import com.agrilink.farm.entity.Farm;
import com.agrilink.farm.entity.Field;
import com.agrilink.farm.repository.CropPlanRepository;
import com.agrilink.farm.repository.FarmRepository;
import com.agrilink.farm.repository.FieldRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for farm analytics and dashboard data.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AnalyticsService {

    private final FarmRepository farmRepository;
    private final FieldRepository fieldRepository;
    private final CropPlanRepository cropPlanRepository;

    /**
     * Get analytics for a specific farm.
     */
    public FarmAnalyticsDto getFarmAnalytics(UUID farmId, UUID farmerId) {
        Farm farm = farmRepository.findByIdAndFarmerId(farmId, farmerId)
                .orElseThrow(() -> new RuntimeException("Farm not found"));

        List<Field> fields = fieldRepository.findByFarmIdAndActiveTrue(farmId);
        List<CropPlan> cropPlans = cropPlanRepository.findByFarmId(farmId);

        // Calculate metrics
        int activeCropPlans = (int) cropPlans.stream()
                .filter(cp -> cp.getStatus() == CropPlan.CropStatus.PLANTED || 
                             cp.getStatus() == CropPlan.CropStatus.GROWING)
                .count();

        int completedHarvests = (int) cropPlans.stream()
                .filter(cp -> cp.getStatus() == CropPlan.CropStatus.HARVESTED)
                .count();

        // Crop distribution
        List<FarmAnalyticsDto.CropDistribution> cropDistribution = calculateCropDistribution(cropPlans, fields);

        // Yield statistics
        List<FarmAnalyticsDto.YieldStat> yieldStats = calculateYieldStats(cropPlans);

        // Monthly activity for the past 12 months
        List<FarmAnalyticsDto.MonthlyActivity> monthlyActivities = calculateMonthlyActivity(cropPlans);

        // Field summaries
        List<FarmAnalyticsDto.FieldSummary> fieldSummaries = fields.stream()
                .map(field -> {
                    CropPlan currentCrop = cropPlans.stream()
                            .filter(cp -> cp.getField().getId().equals(field.getId()))
                            .filter(cp -> cp.getStatus() == CropPlan.CropStatus.PLANTED || 
                                         cp.getStatus() == CropPlan.CropStatus.GROWING)
                            .findFirst()
                            .orElse(null);

                    return FarmAnalyticsDto.FieldSummary.builder()
                            .fieldId(field.getId())
                            .fieldName(field.getName())
                            .area(field.getArea())
                            .currentCrop(currentCrop != null ? currentCrop.getCropName() : "None")
                            .status(currentCrop != null ? currentCrop.getStatus().name() : "IDLE")
                            .soilType(field.getSoilType())
                            .irrigationType(field.getIrrigationType())
                            .build();
                })
                .toList();

        // Field utilization
        long fieldsWithCrops = fieldSummaries.stream()
                .filter(f -> !"None".equals(f.getCurrentCrop()))
                .count();
        BigDecimal utilization = fields.isEmpty() ? BigDecimal.ZERO : 
                BigDecimal.valueOf(fieldsWithCrops * 100.0 / fields.size()).setScale(1, RoundingMode.HALF_UP);

        return FarmAnalyticsDto.builder()
                .farmId(farm.getId())
                .farmName(farm.getName())
                .totalArea(farm.getTotalArea())
                .areaUnit(farm.getAreaUnit())
                .totalFields(fields.size())
                .activeCropPlans(activeCropPlans)
                .completedHarvests(completedHarvests)
                .cropDistribution(cropDistribution)
                .yieldStats(yieldStats)
                .monthlyActivities(monthlyActivities)
                .fieldUtilizationPercent(utilization)
                .fieldSummaries(fieldSummaries)
                .build();
    }

    /**
     * Get dashboard summary for all farms owned by a farmer.
     */
    public DashboardSummaryDto getDashboardSummary(UUID farmerId) {
        List<Farm> farms = farmRepository.findByFarmerIdAndActiveTrue(farmerId);
        List<CropPlan> allCropPlans = cropPlanRepository.findByFarmerId(farmerId);

        // Calculate totals
        int totalFields = farms.stream()
                .mapToInt(f -> f.getFields() != null ? f.getFields().size() : 0)
                .sum();

        BigDecimal totalArea = farms.stream()
                .map(Farm::getTotalArea)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Crop counts by status
        int activeCrops = (int) allCropPlans.stream()
                .filter(cp -> cp.getStatus() == CropPlan.CropStatus.PLANTED || 
                             cp.getStatus() == CropPlan.CropStatus.GROWING)
                .count();

        int plannedCrops = (int) allCropPlans.stream()
                .filter(cp -> cp.getStatus() == CropPlan.CropStatus.PLANNED)
                .count();

        int harvestedCrops = (int) allCropPlans.stream()
                .filter(cp -> cp.getStatus() == CropPlan.CropStatus.HARVESTED)
                .count();

        // Top crops
        List<DashboardSummaryDto.TopCrop> topCrops = calculateTopCrops(allCropPlans);

        // Upcoming activities (next 30 days)
        List<DashboardSummaryDto.UpcomingActivity> upcomingActivities = calculateUpcomingActivities(allCropPlans, farms);

        // Recent harvests (past 30 days)
        List<DashboardSummaryDto.RecentHarvest> recentHarvests = calculateRecentHarvests(allCropPlans, farms);

        // Yield efficiency and total yield this year
        LocalDate startOfYear = LocalDate.now().withDayOfYear(1);
        List<CropPlan> harvestedThisYear = allCropPlans.stream()
                .filter(cp -> cp.getStatus() == CropPlan.CropStatus.HARVESTED)
                .filter(cp -> cp.getActualHarvestDate() != null && cp.getActualHarvestDate().isAfter(startOfYear))
                .toList();

        BigDecimal totalYield = harvestedThisYear.stream()
                .map(CropPlan::getActualYield)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgEfficiency = calculateAverageYieldEfficiency(harvestedThisYear);

        return DashboardSummaryDto.builder()
                .totalFarms(farms.size())
                .totalFields(totalFields)
                .totalAreaManaged(totalArea)
                .areaUnit("HECTARE")
                .activeCrops(activeCrops)
                .plannedCrops(plannedCrops)
                .harvestedCrops(harvestedCrops)
                .topCrops(topCrops)
                .upcomingActivities(upcomingActivities)
                .recentHarvests(recentHarvests)
                .averageYieldEfficiency(avgEfficiency)
                .totalYieldThisYear(totalYield)
                .yieldUnit("KG")
                .build();
    }

    private List<FarmAnalyticsDto.CropDistribution> calculateCropDistribution(List<CropPlan> cropPlans, List<Field> fields) {
        Map<String, Long> cropCounts = cropPlans.stream()
                .collect(Collectors.groupingBy(CropPlan::getCropName, Collectors.counting()));

        Map<String, BigDecimal> cropAreas = new HashMap<>();
        for (CropPlan cp : cropPlans) {
            BigDecimal fieldArea = cp.getField().getArea();
            if (fieldArea != null) {
                cropAreas.merge(cp.getCropName(), fieldArea, BigDecimal::add);
            }
        }

        int totalCrops = cropPlans.size();

        return cropCounts.entrySet().stream()
                .map(e -> FarmAnalyticsDto.CropDistribution.builder()
                        .cropName(e.getKey())
                        .count(e.getValue().intValue())
                        .area(cropAreas.getOrDefault(e.getKey(), BigDecimal.ZERO))
                        .percentage(totalCrops > 0 ? (e.getValue() * 100.0 / totalCrops) : 0)
                        .build())
                .sorted((a, b) -> Integer.compare(b.getCount(), a.getCount()))
                .limit(10)
                .toList();
    }

    private List<FarmAnalyticsDto.YieldStat> calculateYieldStats(List<CropPlan> cropPlans) {
        Map<String, List<CropPlan>> byCrop = cropPlans.stream()
                .filter(cp -> cp.getStatus() == CropPlan.CropStatus.HARVESTED)
                .collect(Collectors.groupingBy(CropPlan::getCropName));

        return byCrop.entrySet().stream()
                .map(e -> {
                    List<CropPlan> crops = e.getValue();
                    BigDecimal totalExpected = crops.stream()
                            .map(CropPlan::getExpectedYield)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalActual = crops.stream()
                            .map(CropPlan::getActualYield)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    double efficiency = totalExpected.compareTo(BigDecimal.ZERO) > 0 
                            ? totalActual.divide(totalExpected, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                            : 0;

                    return FarmAnalyticsDto.YieldStat.builder()
                            .cropName(e.getKey())
                            .expectedYield(totalExpected)
                            .actualYield(totalActual)
                            .yieldUnit(crops.get(0).getYieldUnit())
                            .yieldEfficiency(efficiency)
                            .harvestCount(crops.size())
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getYieldEfficiency(), a.getYieldEfficiency()))
                .toList();
    }

    private List<FarmAnalyticsDto.MonthlyActivity> calculateMonthlyActivity(List<CropPlan> cropPlans) {
        List<FarmAnalyticsDto.MonthlyActivity> activities = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        LocalDate now = LocalDate.now();
        for (int i = 11; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);
            
            int plantings = (int) cropPlans.stream()
                    .filter(cp -> cp.getPlantingDate() != null)
                    .filter(cp -> !cp.getPlantingDate().isBefore(monthStart) && !cp.getPlantingDate().isAfter(monthEnd))
                    .count();

            int harvests = (int) cropPlans.stream()
                    .filter(cp -> cp.getActualHarvestDate() != null)
                    .filter(cp -> !cp.getActualHarvestDate().isBefore(monthStart) && !cp.getActualHarvestDate().isAfter(monthEnd))
                    .count();

            BigDecimal yield = cropPlans.stream()
                    .filter(cp -> cp.getActualHarvestDate() != null && cp.getActualYield() != null)
                    .filter(cp -> !cp.getActualHarvestDate().isBefore(monthStart) && !cp.getActualHarvestDate().isAfter(monthEnd))
                    .map(CropPlan::getActualYield)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            activities.add(FarmAnalyticsDto.MonthlyActivity.builder()
                    .month(monthStart.format(formatter))
                    .plantings(plantings)
                    .harvests(harvests)
                    .totalYield(yield)
                    .build());
        }

        return activities;
    }

    private List<DashboardSummaryDto.TopCrop> calculateTopCrops(List<CropPlan> cropPlans) {
        Map<String, List<CropPlan>> byCrop = cropPlans.stream()
                .collect(Collectors.groupingBy(CropPlan::getCropName));

        return byCrop.entrySet().stream()
                .map(e -> {
                    List<CropPlan> crops = e.getValue();
                    BigDecimal totalArea = crops.stream()
                            .filter(cp -> cp.getField() != null && cp.getField().getArea() != null)
                            .map(cp -> cp.getField().getArea())
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalYield = crops.stream()
                            .filter(cp -> cp.getActualYield() != null)
                            .map(CropPlan::getActualYield)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return DashboardSummaryDto.TopCrop.builder()
                            .cropName(e.getKey())
                            .count(crops.size())
                            .totalArea(totalArea)
                            .totalYield(totalYield)
                            .build();
                })
                .sorted((a, b) -> Integer.compare(b.getCount(), a.getCount()))
                .limit(5)
                .toList();
    }

    private List<DashboardSummaryDto.UpcomingActivity> calculateUpcomingActivities(List<CropPlan> cropPlans, List<Farm> farms) {
        Map<UUID, String> farmNames = farms.stream()
                .collect(Collectors.toMap(Farm::getId, Farm::getName));

        LocalDate now = LocalDate.now();
        LocalDate thirtyDaysLater = now.plusDays(30);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");

        List<DashboardSummaryDto.UpcomingActivity> activities = new ArrayList<>();

        // Upcoming plantings
        cropPlans.stream()
                .filter(cp -> cp.getStatus() == CropPlan.CropStatus.PLANNED)
                .filter(cp -> cp.getPlantingDate() != null)
                .filter(cp -> !cp.getPlantingDate().isBefore(now) && !cp.getPlantingDate().isAfter(thirtyDaysLater))
                .forEach(cp -> {
                    UUID farmId = cp.getField().getFarm().getId();
                    activities.add(DashboardSummaryDto.UpcomingActivity.builder()
                            .farmId(farmId)
                            .farmName(farmNames.get(farmId))
                            .fieldId(cp.getField().getId())
                            .fieldName(cp.getField().getName())
                            .cropName(cp.getCropName())
                            .activityType("PLANTING")
                            .scheduledDate(cp.getPlantingDate().format(formatter))
                            .daysUntil((int) java.time.temporal.ChronoUnit.DAYS.between(now, cp.getPlantingDate()))
                            .build());
                });

        // Upcoming harvests
        cropPlans.stream()
                .filter(cp -> cp.getStatus() == CropPlan.CropStatus.PLANTED || cp.getStatus() == CropPlan.CropStatus.GROWING)
                .filter(cp -> cp.getExpectedHarvestDate() != null)
                .filter(cp -> !cp.getExpectedHarvestDate().isBefore(now) && !cp.getExpectedHarvestDate().isAfter(thirtyDaysLater))
                .forEach(cp -> {
                    UUID farmId = cp.getField().getFarm().getId();
                    activities.add(DashboardSummaryDto.UpcomingActivity.builder()
                            .farmId(farmId)
                            .farmName(farmNames.get(farmId))
                            .fieldId(cp.getField().getId())
                            .fieldName(cp.getField().getName())
                            .cropName(cp.getCropName())
                            .activityType("HARVESTING")
                            .scheduledDate(cp.getExpectedHarvestDate().format(formatter))
                            .daysUntil((int) java.time.temporal.ChronoUnit.DAYS.between(now, cp.getExpectedHarvestDate()))
                            .build());
                });

        return activities.stream()
                .sorted(Comparator.comparingInt(DashboardSummaryDto.UpcomingActivity::getDaysUntil))
                .limit(10)
                .toList();
    }

    private List<DashboardSummaryDto.RecentHarvest> calculateRecentHarvests(List<CropPlan> cropPlans, List<Farm> farms) {
        Map<UUID, String> farmNames = farms.stream()
                .collect(Collectors.toMap(Farm::getId, Farm::getName));

        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");

        return cropPlans.stream()
                .filter(cp -> cp.getStatus() == CropPlan.CropStatus.HARVESTED)
                .filter(cp -> cp.getActualHarvestDate() != null && cp.getActualHarvestDate().isAfter(thirtyDaysAgo))
                .sorted((a, b) -> b.getActualHarvestDate().compareTo(a.getActualHarvestDate()))
                .limit(10)
                .map(cp -> {
                    UUID farmId = cp.getField().getFarm().getId();
                    return DashboardSummaryDto.RecentHarvest.builder()
                            .farmId(farmId)
                            .farmName(farmNames.get(farmId))
                            .cropName(cp.getCropName())
                            .yield(cp.getActualYield())
                            .yieldUnit(cp.getYieldUnit())
                            .harvestDate(cp.getActualHarvestDate().format(formatter))
                            .build();
                })
                .toList();
    }

    private BigDecimal calculateAverageYieldEfficiency(List<CropPlan> harvestedCrops) {
        if (harvestedCrops.isEmpty()) {
            return BigDecimal.ZERO;
        }

        double totalEfficiency = harvestedCrops.stream()
                .filter(cp -> cp.getExpectedYield() != null && cp.getActualYield() != null)
                .filter(cp -> cp.getExpectedYield().compareTo(BigDecimal.ZERO) > 0)
                .mapToDouble(cp -> cp.getActualYield().divide(cp.getExpectedYield(), 4, RoundingMode.HALF_UP).doubleValue() * 100)
                .average()
                .orElse(0);

        return BigDecimal.valueOf(totalEfficiency).setScale(1, RoundingMode.HALF_UP);
    }
}
