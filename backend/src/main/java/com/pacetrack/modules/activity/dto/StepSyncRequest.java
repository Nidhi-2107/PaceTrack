package com.pacetrack.modules.activity.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record StepSyncRequest(

    @NotNull(message = "Record date is required")
    LocalDate recordDate,

    @NotNull(message = "Step count is required")
    @Min(value = 0, message = "Step count cannot be negative")
    Integer stepCount,

    @NotNull(message = "Distance is required")
    @DecimalMin(value = "0.0", message = "Distance cannot be negative")
    Double distanceMeters,

    @Min(value = 0, message = "Calories cannot be negative")
    Integer caloriesBurned
) {}

