package com.pacetrack.modules.goal.service;

import com.pacetrack.modules.goal.dto.CreateGoalRequest;
import com.pacetrack.modules.goal.dto.GoalResponse;
import com.pacetrack.modules.goal.entity.UserGoalEntity;
import com.pacetrack.modules.goal.repository.UserGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class GoalService {

    private final UserGoalRepository goalRepository;

    public GoalService(UserGoalRepository goalRepository) {
        this.goalRepository = goalRepository;
    }

    /**
     * Create or update a goal. If a goal of the same type exists, it is updated (upsert).
     */
    public GoalResponse createOrUpdateGoal(UUID userId, CreateGoalRequest request) {
        String goalType = request.goalType().toUpperCase();

        UserGoalEntity entity = goalRepository
                .findByUserIdAndGoalType(userId, goalType)
                .orElseGet(() -> {
                    UserGoalEntity newGoal = new UserGoalEntity();
                    newGoal.setUserId(userId);
                    newGoal.setGoalType(goalType);
                    return newGoal;
                });

        entity.setTargetValue(request.targetValue());
        entity.setActive(true);

        UserGoalEntity saved = goalRepository.save(entity);
        return GoalResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getActiveGoals(UUID userId) {
        return goalRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .map(GoalResponse::from)
                .toList();
    }
}

