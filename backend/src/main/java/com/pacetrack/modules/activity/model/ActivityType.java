package com.pacetrack.modules.activity.model;

public enum ActivityType {
    WALKING(3.8),
    RUNNING(9.8),
    CYCLING(7.5),
    HIKING(6.0);

    private final double metabolicEquivalent;

    ActivityType(double metabolicEquivalent) {
        this.metabolicEquivalent = metabolicEquivalent;
    }

    public double getMetabolicEquivalent() {
        return metabolicEquivalent;
    }
}

