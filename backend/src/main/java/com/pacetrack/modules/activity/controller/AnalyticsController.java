package com.pacetrack.modules.activity.controller;

import com.pacetrack.common.api.ApiResponse;
import com.pacetrack.modules.activity.dto.WeeklyAnalyticsResponse;
import com.pacetrack.modules.activity.service.AnalyticsService;
import com.pacetrack.modules.user.entity.UserEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<WeeklyAnalyticsResponse>> getWeeklyAnalytics(
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        WeeklyAnalyticsResponse response = analyticsService.getWeeklyAnalytics(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

