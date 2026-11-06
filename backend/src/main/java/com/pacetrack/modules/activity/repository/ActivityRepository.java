package com.pacetrack.modules.activity.repository;

import com.pacetrack.modules.activity.entity.ActivityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<ActivityEntity, UUID> {

    List<ActivityEntity> findByUserIdOrderByStartTimeDesc(UUID userId);

    Optional<ActivityEntity> findByIdAndUserId(UUID id, UUID userId);

    List<ActivityEntity> findByUserIdAndStartTimeBetweenOrderByStartTimeDesc(
            UUID userId, Instant from, Instant to
    );

    boolean existsByIdempotencyKey(String idempotencyKey);

    Optional<ActivityEntity> findByIdempotencyKey(String idempotencyKey);
}

