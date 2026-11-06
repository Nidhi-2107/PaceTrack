package com.pacetrack.modules.activity.service;

import com.pacetrack.modules.activity.dto.ActivityResponse;
import com.pacetrack.modules.activity.dto.DailyStepResponse;
import com.pacetrack.modules.activity.dto.WeeklyAnalyticsResponse;
import com.pacetrack.modules.activity.entity.ActivityEntity;
import com.pacetrack.modules.activity.entity.DailyStepRecordEntity;
import com.pacetrack.modules.activity.repository.ActivityRepository;
import com.pacetrack.modules.activity.repository.DailyStepRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final ActivityRepository activityRepository;
    private final DailyStepRecordRepository stepRecordRepository;

    public AnalyticsService(
            ActivityRepository activityRepository,
            DailyStepRecordRepository stepRecordRepository
    ) {
        this.activityRepository = activityRepository;
        this.stepRecordRepository = stepRecordRepository;
    }

    public WeeklyAnalyticsResponse getWeeklyAnalytics(UUID userId) {
        // Current week: Monday 00:00 UTC to Sunday 23:59 UTC
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate weekStart = today.with(java.time.DayOfWeek.MONDAY);
        LocalDate weekEnd = today.with(java.time.DayOfWeek.SUNDAY);

        Instant from = weekStart.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to = weekEnd.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant();

        List<ActivityEntity> weekActivities =
                activityRepository.findByUserIdAndStartTimeBetweenOrderByStartTimeDesc(userId, from, to);

        List<DailyStepRecordEntity> weekSteps =
                stepRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(userId, weekStart, weekEnd);

        // Aggregate totals from activities this week
        int totalActivities = weekActivities.size();
        double totalDistance = weekActivities.stream()
                .mapToDouble(ActivityEntity::getDistanceMeters).sum();
        int totalDuration = weekActivities.stream()
                .mapToInt(ActivityEntity::getDurationSeconds).sum();
        int totalCalories = weekActivities.stream()
                .mapToInt(ActivityEntity::getCaloriesBurned).sum();

        // Total steps from pedometer records this week
        int totalSteps = weekSteps.stream()
                .mapToInt(DailyStepRecordEntity::getStepCount).sum();

        List<DailyStepResponse> dailyStepResponses = weekSteps.stream()
                .map(DailyStepResponse::from)
                .toList();

        // Most recent 5 activities as summary cards
        List<ActivityResponse> recentActivities = weekActivities.stream()
                .limit(5)
                .map(ActivityResponse::fromSummary)
                .toList();

        return new WeeklyAnalyticsResponse(
            totalActivities,
            totalDistance,
            totalDuration,
            totalCalories,
            totalSteps,
            dailyStepResponses,
            recentActivities
        );
    }
}

