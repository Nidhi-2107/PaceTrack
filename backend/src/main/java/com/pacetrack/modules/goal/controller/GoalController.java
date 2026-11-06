package com.pacetrack.modules.goal.controller;

import com.pacetrack.common.api.ApiResponse;
import com.pacetrack.modules.goal.dto.CreateGoalRequest;
import com.pacetrack.modules.goal.dto.GoalResponse;
import com.pacetrack.modules.goal.service.GoalService;
import com.pacetrack.modules.user.entity.UserEntity;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GoalResponse>>> getGoals(
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        List<GoalResponse> goals = goalService.getActiveGoals(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(goals));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GoalResponse>> createOrUpdateGoal(
            @AuthenticationPrincipal UserEntity currentUser,
            @Valid @RequestBody CreateGoalRequest request
    ) {
        GoalResponse response = goalService.createOrUpdateGoal(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Goal saved successfully"));
    }
}

