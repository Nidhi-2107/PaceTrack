package com.pacetrack.modules.activity.entity;

import com.pacetrack.modules.activity.model.ActivityType;
import com.pacetrack.modules.activity.model.PrivacyLevel;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "activities", indexes = {
    @Index(name = "idx_activities_user_start_time", columnList = "user_id,start_time DESC"),
    @Index(name = "idx_activities_user_type", columnList = "user_id,activity_type")
})
public class ActivityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "idempotency_key", length = 128, unique = true)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 32)
    private ActivityType activityType;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Column(name = "duration_seconds", nullable = false)
    private int durationSeconds;

    @Column(name = "distance_meters", nullable = false)
    private double distanceMeters;

    @Column(name = "avg_pace_seconds_per_km", nullable = false)
    private double avgPaceSecondsPerKm;

    @Column(name = "calories_burned", nullable = false)
    private int caloriesBurned;

    @Column(name = "step_count", nullable = false)
    private int stepCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "privacy_level", nullable = false, length = 32)
    private PrivacyLevel privacyLevel = PrivacyLevel.PRIVATE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sequenceOrder ASC")
    private List<ActivityWaypointEntity> waypoints = new ArrayList<>();

    public ActivityEntity() {}

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (privacyLevel == null) privacyLevel = PrivacyLevel.PRIVATE;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public ActivityType getActivityType() { return activityType; }
    public void setActivityType(ActivityType activityType) { this.activityType = activityType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }

    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }

    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }

    public double getDistanceMeters() { return distanceMeters; }
    public void setDistanceMeters(double distanceMeters) { this.distanceMeters = distanceMeters; }

    public double getAvgPaceSecondsPerKm() { return avgPaceSecondsPerKm; }
    public void setAvgPaceSecondsPerKm(double avgPaceSecondsPerKm) { this.avgPaceSecondsPerKm = avgPaceSecondsPerKm; }

    public int getCaloriesBurned() { return caloriesBurned; }
    public void setCaloriesBurned(int caloriesBurned) { this.caloriesBurned = caloriesBurned; }

    public int getStepCount() { return stepCount; }
    public void setStepCount(int stepCount) { this.stepCount = stepCount; }

    public PrivacyLevel getPrivacyLevel() { return privacyLevel; }
    public void setPrivacyLevel(PrivacyLevel privacyLevel) { this.privacyLevel = privacyLevel; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<ActivityWaypointEntity> getWaypoints() { return waypoints; }
    public void setWaypoints(List<ActivityWaypointEntity> waypoints) { this.waypoints = waypoints; }
}

