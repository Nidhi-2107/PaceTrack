package com.pacetrack.common.exception;

/**
 * Thrown when a requested resource is not found or the user is not authorised
 * to view it. Using a single exception avoids leaking existence of private data.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}

