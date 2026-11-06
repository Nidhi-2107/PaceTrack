package com.pacetrack.modules.auth.dto;

import com.pacetrack.modules.user.dto.UserResponse;

public record AuthResponse(
    String token,
    String tokenType,
    long expiresInMs,
    UserResponse user
) {
    public static AuthResponse of(String token, long expiresInMs, UserResponse user) {
        return new AuthResponse(token, "Bearer", expiresInMs, user);
    }
}

