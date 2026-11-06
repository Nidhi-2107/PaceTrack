package com.pacetrack.modules.activity.dto;

import com.pacetrack.modules.activity.entity.ActivityWaypointEntity;

import java.time.Instant;
import java.util.UUID;

public record WaypointDto(
    UUID id,
    int sequenceOrder,
    double latitude,
    double longitude,
    Double altitude,
    Double speedMps,
    Instant timestamp
) {
    public static WaypointDto from(ActivityWaypointEntity entity) {
        return new WaypointDto(
            entity.getId(),
            entity.getSequenceOrder(),
            entity.getLatitude(),
            entity.getLongitude(),
            entity.getAltitude(),
            entity.getSpeedMps(),
            entity.getTimestamp()
        );
    }
}

