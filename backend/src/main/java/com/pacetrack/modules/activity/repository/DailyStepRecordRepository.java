package com.pacetrack.modules.activity.repository;

import com.pacetrack.modules.activity.entity.DailyStepRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyStepRecordRepository extends JpaRepository<DailyStepRecordEntity, UUID> {

    Optional<DailyStepRecordEntity> findByUserIdAndRecordDate(UUID userId, LocalDate recordDate);

    List<DailyStepRecordEntity> findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
            UUID userId, LocalDate from, LocalDate to
    );
}

