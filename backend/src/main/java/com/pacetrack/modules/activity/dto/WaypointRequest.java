package com.pacetrack.modules.activity.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record WaypointRequest(

    @NotNull(message = "Waypoint latitude is required")
    Double latitude,

    @NotNull(message = "Waypoint longitude is required")
    Double longitude,

    Double altitude,

    Double speedMps,

    @NotNull(message = "Waypoint timestamp is required")
    Instant timestamp
) {}

