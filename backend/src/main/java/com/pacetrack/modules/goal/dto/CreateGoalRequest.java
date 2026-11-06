package com.pacetrack.modules.goal.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateGoalRequest(

    @NotBlank(message = "Goal type is required (e.g. DAILY_STEPS)")
    String goalType,

    @NotNull(message = "Target value is required")
    @Min(value = 1, message = "Target value must be at least 1")
    Integer targetValue
) {}

