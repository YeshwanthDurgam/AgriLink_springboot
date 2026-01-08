package com.agrilink.iot.repository;

import com.agrilink.iot.entity.Telemetry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for Telemetry entity.
 */
@Repository
public interface TelemetryRepository extends JpaRepository<Telemetry, UUID> {

    Page<Telemetry> findByDeviceId(UUID deviceId, Pageable pageable);

    List<Telemetry> findByDeviceIdAndMetricType(UUID deviceId, Telemetry.MetricType metricType);

    @Query("SELECT t FROM Telemetry t WHERE t.device.id = :deviceId AND t.recordedAt BETWEEN :start AND :end ORDER BY t.recordedAt DESC")
    List<Telemetry> findByDeviceIdAndTimeRange(
            @Param("deviceId") UUID deviceId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT t FROM Telemetry t WHERE t.device.id = :deviceId AND t.metricType = :metricType AND t.recordedAt BETWEEN :start AND :end ORDER BY t.recordedAt ASC")
    List<Telemetry> findByDeviceIdAndMetricTypeAndTimeRange(
            @Param("deviceId") UUID deviceId,
            @Param("metricType") Telemetry.MetricType metricType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT t FROM Telemetry t WHERE t.device.id = :deviceId ORDER BY t.recordedAt DESC")
    List<Telemetry> findLatestByDeviceId(@Param("deviceId") UUID deviceId, Pageable pageable);

    @Query("SELECT AVG(t.metricValue) FROM Telemetry t WHERE t.device.id = :deviceId AND t.metricType = :metricType AND t.recordedAt BETWEEN :start AND :end")
    Double getAverageMetricValue(
            @Param("deviceId") UUID deviceId,
            @Param("metricType") Telemetry.MetricType metricType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT MAX(t.metricValue) FROM Telemetry t WHERE t.device.id = :deviceId AND t.metricType = :metricType AND t.recordedAt BETWEEN :start AND :end")
    Double getMaxMetricValue(
            @Param("deviceId") UUID deviceId,
            @Param("metricType") Telemetry.MetricType metricType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT MIN(t.metricValue) FROM Telemetry t WHERE t.device.id = :deviceId AND t.metricType = :metricType AND t.recordedAt BETWEEN :start AND :end")
    Double getMinMetricValue(
            @Param("deviceId") UUID deviceId,
            @Param("metricType") Telemetry.MetricType metricType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
    
    @Query("SELECT t FROM Telemetry t WHERE t.device.farmerId = :farmerId AND t.metricType = :metricType AND t.recordedAt BETWEEN :start AND :end ORDER BY t.recordedAt ASC")
    List<Telemetry> findByFarmerIdAndMetricTypeAndTimeRange(
            @Param("farmerId") UUID farmerId,
            @Param("metricType") Telemetry.MetricType metricType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
    
    @Query("SELECT t FROM Telemetry t WHERE t.device.farmerId = :farmerId ORDER BY t.recordedAt DESC")
    List<Telemetry> findLatestByFarmerId(@Param("farmerId") UUID farmerId, Pageable pageable);
}
