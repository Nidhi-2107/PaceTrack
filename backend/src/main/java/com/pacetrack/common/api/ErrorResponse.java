package com.pacetrack.common.api;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Standard structured error payload.
 */
public record ErrorResponse(
    boolean success,
    String error,
    String message,
    String path,
    int status,
    Instant timestamp,
    List<Map<String, String>> fieldErrors
) {
    public static ErrorResponse of(int status, String error, String message, String path, List<Map<String, String>> fieldErrors) {
        return new ErrorResponse(false, error, message, path, status, Instant.now(), fieldErrors);
    }

    public static ErrorResponse of(int status, String error, String message, String path) {
        return of(status, error, message, path, List.of());
    }
}

