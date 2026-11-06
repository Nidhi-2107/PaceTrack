package com.pacetrack.modules.activity.dto;

import com.pacetrack.modules.activity.entity.ActivityEntity;
import com.pacetrack.modules.activity.entity.ActivityWaypointEntity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Public DTO for activity responses. Never exposes the JPA entity directly.
 */
public record ActivityResponse(
    UUID id,
    UUID userId,
    String activityType,
    String title,
    Instant startTime,
    Instant endTime,
    int durationSeconds,
    double distanceMeters,
    double avgPaceSecondsPerKm,
    int caloriesBurned,
    int stepCount,
    String privacyLevel,
    Instant createdAt,
    List<WaypointDto> waypoints
) {
    public static ActivityResponse from(ActivityEntity entity) {
        List<WaypointDto> waypointDtos = entity.getWaypoints().stream()
                .map(WaypointDto::from)
                .toList();

        return new ActivityResponse(
            entity.getId(),
            entity.getUserId(),
            entity.getActivityType().name(),
            entity.getTitle(),
            entity.getStartTime(),
            entity.getEndTime(),
            entity.getDurationSeconds(),
            entity.getDistanceMeters(),
            entity.getAvgPaceSecondsPerKm(),
            entity.getCaloriesBurned(),
            entity.getStepCount(),
            entity.getPrivacyLevel().name(),
            entity.getCreatedAt(),
            waypointDtos
        );
    }

    public static ActivityResponse fromSummary(ActivityEntity entity) {
        // List version: skip loading waypoints to avoid N+1 (waypoints are LAZY)
        return new ActivityResponse(
            entity.getId(),
            entity.getUserId(),
            entity.getActivityType().name(),
            entity.getTitle(),
            entity.getStartTime(),
            entity.getEndTime(),
            entity.getDurationSeconds(),
            entity.getDistanceMeters(),
            entity.getAvgPaceSecondsPerKm(),
            entity.getCaloriesBurned(),
            entity.getStepCount(),
            entity.getPrivacyLevel().name(),
            entity.getCreatedAt(),
            List.of() // Waypoints excluded in list view
        );
    }
}

