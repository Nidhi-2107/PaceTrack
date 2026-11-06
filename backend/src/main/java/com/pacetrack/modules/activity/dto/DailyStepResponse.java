package com.pacetrack.modules.activity.dto;

import com.pacetrack.modules.activity.entity.DailyStepRecordEntity;

import java.time.LocalDate;
import java.util.UUID;

public record DailyStepResponse(
    UUID id,
    LocalDate recordDate,
    int stepCount,
    double distanceMeters,
    int caloriesBurned
) {
    public static DailyStepResponse from(DailyStepRecordEntity entity) {
        return new DailyStepResponse(
            entity.getId(),
            entity.getRecordDate(),
            entity.getStepCount(),
            entity.getDistanceMeters(),
            entity.getCaloriesBurned()
        );
    }

    /** Returns a zero-value response for days with no data yet. */
    public static DailyStepResponse empty(LocalDate date) {
        return new DailyStepResponse(null, date, 0, 0.0, 0);
    }
}

