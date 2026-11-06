package com.pacetrack.modules.activity.dto;

import java.util.List;

public record WeeklyAnalyticsResponse(
    int totalActivities,
    double totalDistanceMeters,
    int totalDurationSeconds,
    int totalCaloriesBurned,
    int totalSteps,
    List<DailyStepResponse> dailySteps,
    List<ActivityResponse> recentActivities
) {}

