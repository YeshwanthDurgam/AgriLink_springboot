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

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Service for exporting farm analytics data.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final FarmRepository farmRepository;
    private final FieldRepository fieldRepository;
    private final CropPlanRepository cropPlanRepository;
    private final AnalyticsService analyticsService;

    /**
     * Export farms data as CSV.
     */
    public byte[] exportFarmsAsCsv(UUID farmerId) {
        log.info("Exporting farms data as CSV for farmer: {}", farmerId);
        
        List<Farm> farms = farmRepository.findByFarmerIdAndActiveTrue(farmerId);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos);
        
        // CSV Header
        writer.println("Farm Name,Location,Total Area,Area Unit,Total Fields,Active Crops,Status,Created At");
        
        // Data rows
        for (Farm farm : farms) {
            List<Field> fields = fieldRepository.findByFarmIdAndActiveTrue(farm.getId());
            long activeCrops = cropPlanRepository.countByFarmerIdAndStatus(farmerId, CropPlan.CropStatus.PLANTED);
            
            writer.printf("\"%s\",\"%s\",%.2f,%s,%d,%d,%s,%s%n",
                escapeCsv(farm.getName()),
                escapeCsv(farm.getLocation()),
                farm.getTotalArea() != null ? farm.getTotalArea() : 0,
                farm.getAreaUnit() != null ? farm.getAreaUnit() : "HECTARE",
                fields.size(),
                activeCrops,
                farm.isActive() ? "ACTIVE" : "INACTIVE",
                farm.getCreatedAt() != null ? farm.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : ""
            );
        }
        
        writer.flush();
        return baos.toByteArray();
    }

    /**
     * Export fields data as CSV.
     */
    public byte[] exportFieldsAsCsv(UUID farmerId) {
        log.info("Exporting fields data as CSV for farmer: {}", farmerId);
        
        List<Farm> farms = farmRepository.findByFarmerIdAndActiveTrue(farmerId);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos);
        
        // CSV Header
        writer.println("Farm Name,Field Name,Area,Area Unit,Soil Type,Irrigation Type,Current Crop,Status");
        
        for (Farm farm : farms) {
            List<Field> fields = fieldRepository.findByFarmIdAndActiveTrue(farm.getId());
            
            for (Field field : fields) {
                List<CropPlan> activeCropsForField = cropPlanRepository.findActiveCropsByFieldId(field.getId());
                String currentCrop = activeCropsForField.isEmpty() ? "-" : activeCropsForField.get(0).getCropName();
                
                writer.printf("\"%s\",\"%s\",%.2f,%s,%s,%s,%s,%s%n",
                    escapeCsv(farm.getName()),
                    escapeCsv(field.getName()),
                    field.getArea() != null ? field.getArea() : 0,
                    field.getAreaUnit() != null ? field.getAreaUnit() : "HECTARE",
                    field.getSoilType() != null ? field.getSoilType() : "-",
                    field.getIrrigationType() != null ? field.getIrrigationType() : "-",
                    currentCrop,
                    field.isActive() ? "ACTIVE" : "INACTIVE"
                );
            }
        }
        
        writer.flush();
        return baos.toByteArray();
    }

    /**
     * Export crop plans data as CSV.
     */
    public byte[] exportCropPlansAsCsv(UUID farmerId) {
        log.info("Exporting crop plans data as CSV for farmer: {}", farmerId);
        
        List<CropPlan> cropPlans = cropPlanRepository.findByFieldFarmFarmerId(farmerId);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos);
        
        // CSV Header
        writer.println("Farm Name,Field Name,Crop Name,Variety,Planting Date,Expected Harvest,Expected Yield,Actual Yield,Status");
        
        for (CropPlan plan : cropPlans) {
            writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",%s,%s,%.2f,%.2f,%s%n",
                escapeCsv(plan.getField().getFarm().getName()),
                escapeCsv(plan.getField().getName()),
                escapeCsv(plan.getCropName()),
                escapeCsv(plan.getVariety() != null ? plan.getVariety() : "-"),
                plan.getPlantingDate() != null ? plan.getPlantingDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : "-",
                plan.getExpectedHarvestDate() != null ? plan.getExpectedHarvestDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : "-",
                plan.getExpectedYield() != null ? plan.getExpectedYield() : 0,
                plan.getActualYield() != null ? plan.getActualYield() : 0,
                plan.getStatus() != null ? plan.getStatus().name() : "-"
            );
        }
        
        writer.flush();
        return baos.toByteArray();
    }

    /**
     * Export analytics summary as CSV.
     */
    public byte[] exportAnalyticsSummaryAsCsv(UUID farmerId) {
        log.info("Exporting analytics summary as CSV for farmer: {}", farmerId);
        
        DashboardSummaryDto summary = analyticsService.getDashboardSummary(farmerId);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos);
        
        // Summary section
        writer.println("AgriLink Analytics Report");
        writer.printf("Generated: %s%n", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        writer.println();
        
        // Overview
        writer.println("OVERVIEW");
        writer.printf("Total Farms,%d%n", summary.getTotalFarms());
        writer.printf("Total Fields,%d%n", summary.getTotalFields());
        writer.printf("Total Area Managed,%.2f %s%n", summary.getTotalAreaManaged(), summary.getAreaUnit());
        writer.printf("Active Crops,%d%n", summary.getActiveCrops());
        writer.printf("Planned Crops,%d%n", summary.getPlannedCrops());
        writer.printf("Harvested Crops,%d%n", summary.getHarvestedCrops());
        writer.println();
        
        // Yield Statistics
        writer.println("YIELD STATISTICS");
        writer.printf("Total Yield This Year,%.2f %s%n", 
            summary.getTotalYieldThisYear() != null ? summary.getTotalYieldThisYear() : 0,
            summary.getYieldUnit() != null ? summary.getYieldUnit() : "kg");
        writer.printf("Average Yield Efficiency,%.1f%%%n", 
            summary.getAverageYieldEfficiency() != null ? summary.getAverageYieldEfficiency() : 0);
        writer.println();
        
        // Top Crops
        writer.println("TOP CROPS");
        writer.println("Crop,Count,Total Area,Total Yield");
        if (summary.getTopCrops() != null) {
            summary.getTopCrops().forEach(crop -> 
                writer.printf("%s,%d,%.2f,%.2f%n", 
                    crop.getCropName(), crop.getCount(), 
                    crop.getTotalArea() != null ? crop.getTotalArea() : 0,
                    crop.getTotalYield() != null ? crop.getTotalYield() : 0));
        }
        
        writer.flush();
        return baos.toByteArray();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}
