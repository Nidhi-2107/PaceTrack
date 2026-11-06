package com.pacetrack.common.api;

import java.time.Instant;

/**
 * Standard unified API response envelope for all PaceTrack endpoints.
 * Never expose raw entities directly.
 */
public record ApiResponse<T>(
    boolean success,
    String message,
    T data,
    Instant timestamp
) {
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data, Instant.now());
    }

    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Operation completed successfully");
    }

    public static <T> ApiResponse<T> failure(String message) {
        return new ApiResponse<>(false, message, null, Instant.now());
    }
}
