package com.pacetrack.modules.goal.dto;

import com.pacetrack.modules.goal.entity.UserGoalEntity;

import java.time.Instant;
import java.util.UUID;

public record GoalResponse(
    UUID id,
    String goalType,
    int targetValue,
    boolean isActive,
    Instant createdAt,
    Instant updatedAt
) {
    public static GoalResponse from(UserGoalEntity entity) {
        return new GoalResponse(
            entity.getId(),
            entity.getGoalType(),
            entity.getTargetValue(),
            entity.isActive(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}

