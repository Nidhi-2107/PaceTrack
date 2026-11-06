package com.pacetrack.modules.goal.repository;

import com.pacetrack.modules.goal.entity.UserGoalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserGoalRepository extends JpaRepository<UserGoalEntity, UUID> {

    List<UserGoalEntity> findByUserIdAndIsActiveTrue(UUID userId);

    Optional<UserGoalEntity> findByUserIdAndGoalType(UUID userId, String goalType);
}

