package com.pacetrack.modules.health.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Health response DTO.
 * Exposes system status, version, runtime details without leaking database credentials or internals.
 */
public record HealthResponse(
    String status,
    String service,
    String version,
    String environment,
    Instant timestamp,
    Map<String, Object> details
) {
    public static HealthResponse up(String version, String environment, Map<String, Object> details) {
        return new HealthResponse("UP", "pacetrack-backend", version, environment, Instant.now(), details);
    }
}

