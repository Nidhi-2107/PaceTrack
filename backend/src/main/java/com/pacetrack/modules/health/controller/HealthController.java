package com.pacetrack.modules.health.controller;

import com.pacetrack.common.api.ApiResponse;
import com.pacetrack.modules.health.dto.HealthResponse;
import com.pacetrack.modules.health.service.HealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<HealthResponse>> checkHealth() {
        HealthResponse health = healthService.getSystemHealth();
        return ResponseEntity.ok(ApiResponse.success(health, "PaceTrack backend is healthy and running"));
    }
}
