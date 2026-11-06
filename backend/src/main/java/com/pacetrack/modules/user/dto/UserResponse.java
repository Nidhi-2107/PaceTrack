package com.pacetrack.modules.user.dto;

import com.pacetrack.modules.user.entity.UserEntity;

import java.time.Instant;
import java.util.UUID;

/**
 * Safe public user projection.
 * Never exposes password hashes or sensitive internal state.
 */
public record UserResponse(
    UUID id,
    String email,
    String firstName,
    String lastName,
    String role,
    Instant createdAt
) {
    public static UserResponse fromEntity(UserEntity entity) {
        return new UserResponse(
            entity.getId(),
            entity.getEmail(),
            entity.getFirstName(),
            entity.getLastName(),
            entity.getRole(),
            entity.getCreatedAt()
        );
    }
}

