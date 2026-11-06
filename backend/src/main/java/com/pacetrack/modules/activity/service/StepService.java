package com.pacetrack.modules.activity.service;

import com.pacetrack.modules.activity.dto.DailyStepResponse;
import com.pacetrack.modules.activity.dto.StepSyncRequest;
import com.pacetrack.modules.activity.entity.DailyStepRecordEntity;
import com.pacetrack.modules.activity.repository.DailyStepRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class StepService {

    private final DailyStepRecordRepository stepRecordRepository;

    public StepService(DailyStepRecordRepository stepRecordRepository) {
        this.stepRecordRepository = stepRecordRepository;
    }

    /**
     * Upsert daily step record (idempotent sync from device pedometer).
     * If a record exists for that date, it is replaced with the latest device value.
     */
    public DailyStepResponse syncSteps(UUID userId, StepSyncRequest request) {
        Optional<DailyStepRecordEntity> existing =
                stepRecordRepository.findByUserIdAndRecordDate(userId, request.recordDate());

        DailyStepRecordEntity entity = existing.orElseGet(() -> {
            DailyStepRecordEntity newEntity = new DailyStepRecordEntity();
            newEntity.setUserId(userId);
            newEntity.setRecordDate(request.recordDate());
            return newEntity;
        });

        entity.setStepCount(request.stepCount());
        entity.setDistanceMeters(request.distanceMeters());
        entity.setCaloriesBurned(request.caloriesBurned() != null ? request.caloriesBurned() : 0);

        DailyStepRecordEntity saved = stepRecordRepository.save(entity);
        return DailyStepResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public DailyStepResponse getTodaySteps(UUID userId) {
        LocalDate today = LocalDate.now();
        return stepRecordRepository.findByUserIdAndRecordDate(userId, today)
                .map(DailyStepResponse::from)
                .orElse(DailyStepResponse.empty(today));
    }
}

