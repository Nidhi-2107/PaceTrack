package com.pacetrack.modules.activity.controller;

import com.pacetrack.common.api.ApiResponse;
import com.pacetrack.modules.activity.dto.DailyStepResponse;
import com.pacetrack.modules.activity.dto.StepSyncRequest;
import com.pacetrack.modules.activity.service.StepService;
import com.pacetrack.modules.user.entity.UserEntity;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/steps")
public class StepController {

    private final StepService stepService;

    public StepController(StepService stepService) {
        this.stepService = stepService;
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<DailyStepResponse>> getTodaySteps(
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        DailyStepResponse response = stepService.getTodaySteps(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<DailyStepResponse>> syncSteps(
            @AuthenticationPrincipal UserEntity currentUser,
            @Valid @RequestBody StepSyncRequest request
    ) {
        DailyStepResponse response = stepService.syncSteps(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Step record synced"));
    }
}

