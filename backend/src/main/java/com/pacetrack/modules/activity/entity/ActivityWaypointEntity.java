package com.pacetrack.modules.activity.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "activity_waypoints", indexes = {
    @Index(name = "idx_waypoints_activity_seq", columnList = "activity_id,sequence_order ASC")
})
public class ActivityWaypointEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "activity_id", nullable = false)
    private ActivityEntity activity;

    @Column(name = "sequence_order", nullable = false)
    private int sequenceOrder;

    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;

    @Column(name = "altitude")
    private Double altitude;

    @Column(name = "speed_mps")
    private Double speedMps;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    public ActivityWaypointEntity() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public ActivityEntity getActivity() { return activity; }
    public void setActivity(ActivityEntity activity) { this.activity = activity; }

    public int getSequenceOrder() { return sequenceOrder; }
    public void setSequenceOrder(int sequenceOrder) { this.sequenceOrder = sequenceOrder; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public Double getAltitude() { return altitude; }
    public void setAltitude(Double altitude) { this.altitude = altitude; }

    public Double getSpeedMps() { return speedMps; }
    public void setSpeedMps(Double speedMps) { this.speedMps = speedMps; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}

