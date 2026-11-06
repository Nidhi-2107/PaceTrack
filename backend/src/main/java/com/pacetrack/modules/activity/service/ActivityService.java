package com.pacetrack.modules.activity.service;

import com.pacetrack.common.exception.ResourceNotFoundException;
import com.pacetrack.modules.activity.dto.ActivityResponse;
import com.pacetrack.modules.activity.dto.CreateActivityRequest;
import com.pacetrack.modules.activity.dto.WaypointRequest;
import com.pacetrack.modules.activity.entity.ActivityEntity;
import com.pacetrack.modules.activity.entity.ActivityWaypointEntity;
import com.pacetrack.modules.activity.model.ActivityType;
import com.pacetrack.modules.activity.model.PrivacyLevel;
import com.pacetrack.modules.activity.repository.ActivityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ActivityService {

    private final ActivityRepository activityRepository;

    public ActivityService(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    /**
     * Create a new activity. If an idempotency key is provided and a matching
     * record already exists, return the existing record (safe retry).
     */
    public ActivityResponse createActivity(UUID userId, CreateActivityRequest request) {
        // Idempotency check: if a previous submission succeeded, return it
        if (request.idempotencyKey() != null && !request.idempotencyKey().isBlank()) {
            var existing = activityRepository.findByIdempotencyKey(request.idempotencyKey());
            if (existing.isPresent()) {
                return ActivityResponse.from(existing.get());
            }
        }

        // Parse and validate activity type
        ActivityType type;
        try {
            type = ActivityType.valueOf(request.activityType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Invalid activity type: " + request.activityType() +
                ". Allowed: WALKING, RUNNING, CYCLING, HIKING"
            );
        }

        // Validate time window
        if (!request.endTime().isAfter(request.startTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        // Parse privacy level (default PRIVATE)
        PrivacyLevel privacyLevel = PrivacyLevel.PRIVATE;
        if (request.privacyLevel() != null) {
            try {
                privacyLevel = PrivacyLevel.valueOf(request.privacyLevel().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException(
                    "Invalid privacy level: " + request.privacyLevel() +
                    ". Allowed: PRIVATE, FRIENDS_ONLY, PUBLIC"
                );
            }
        }

        // Calculate derived fields
        long durationSeconds = ChronoUnit.SECONDS.between(request.startTime(), request.endTime());
        double distanceKm = request.distanceMeters() / 1000.0;
        double avgPace = (distanceKm > 0.001)
            ? (double) durationSeconds / distanceKm
            : 0.0;

        // Calorie estimate using MET formula: kcal = MET * weight_kg * hours
        // We use a default weight of 70 kg as the user's weight is not in scope yet.
        double weightKg = 70.0;
        double hours = durationSeconds / 3600.0;
        int calories = (int) Math.round(type.getMetabolicEquivalent() * weightKg * hours);

        // Build entity
        ActivityEntity entity = new ActivityEntity();
        entity.setUserId(userId);
        entity.setIdempotencyKey(request.idempotencyKey());
        entity.setActivityType(type);
        entity.setTitle(request.title().trim());
        entity.setStartTime(request.startTime());
        entity.setEndTime(request.endTime());
        entity.setDurationSeconds((int) durationSeconds);
        entity.setDistanceMeters(request.distanceMeters());
        entity.setAvgPaceSecondsPerKm(avgPace);
        entity.setCaloriesBurned(calories);
        entity.setStepCount(request.stepCount() != null ? request.stepCount() : 0);
        entity.setPrivacyLevel(privacyLevel);

        // Attach waypoints
        if (request.waypoints() != null && !request.waypoints().isEmpty()) {
            List<ActivityWaypointEntity> waypointEntities = new ArrayList<>();
            int sequence = 0;
            for (WaypointRequest wp : request.waypoints()) {
                ActivityWaypointEntity waypointEntity = new ActivityWaypointEntity();
                waypointEntity.setActivity(entity);
                waypointEntity.setSequenceOrder(sequence++);
                waypointEntity.setLatitude(wp.latitude());
                waypointEntity.setLongitude(wp.longitude());
                waypointEntity.setAltitude(wp.altitude());
                waypointEntity.setSpeedMps(wp.speedMps());
                waypointEntity.setTimestamp(wp.timestamp());
                waypointEntities.add(waypointEntity);
            }
            entity.setWaypoints(waypointEntities);
        }

        ActivityEntity saved = activityRepository.save(entity);
        return ActivityResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getUserActivities(UUID userId) {
        return activityRepository.findByUserIdOrderByStartTimeDesc(userId)
                .stream()
                .map(ActivityResponse::fromSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public ActivityResponse getActivityById(UUID userId, UUID activityId) {
        ActivityEntity entity = activityRepository.findByIdAndUserId(activityId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));
        return ActivityResponse.from(entity);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getUserActivitiesBetween(UUID userId, Instant from, Instant to) {
        return activityRepository.findByUserIdAndStartTimeBetweenOrderByStartTimeDesc(userId, from, to)
                .stream()
                .map(ActivityResponse::fromSummary)
                .toList();
    }
}

