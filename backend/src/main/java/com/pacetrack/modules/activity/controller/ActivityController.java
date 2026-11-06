package com.pacetrack.modules.activity.controller;

import com.pacetrack.common.api.ApiResponse;
import com.pacetrack.modules.activity.dto.ActivityResponse;
import com.pacetrack.modules.activity.dto.CreateActivityRequest;
import com.pacetrack.modules.activity.service.ActivityService;
import com.pacetrack.modules.user.entity.UserEntity;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/activities")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ActivityResponse>> createActivity(
            @AuthenticationPrincipal UserEntity currentUser,
            @Valid @RequestBody CreateActivityRequest request
    ) {
        ActivityResponse response = activityService.createActivity(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Activity saved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getUserActivities(
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        List<ActivityResponse> activities = activityService.getUserActivities(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ActivityResponse>> getActivityById(
            @AuthenticationPrincipal UserEntity currentUser,
            @PathVariable UUID id
    ) {
        ActivityResponse activity = activityService.getActivityById(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }
}

