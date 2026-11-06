package com.pacetrack.modules.health.service;

import com.pacetrack.modules.health.dto.HealthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.util.HashMap;
import java.util.Map;

@Service
public class HealthService {

    private final Environment environment;

    @Value("${spring.application.name:pacetrack-backend}")
    private String applicationName;

    public HealthService(Environment environment) {
        this.environment = environment;
    }

    public HealthResponse getSystemHealth() {
        String activeProfile = environment.getActiveProfiles().length > 0 
                ? String.join(",", environment.getActiveProfiles()) 
                : "default";

        Map<String, Object> details = new HashMap<>();
        details.put("javaVersion", System.getProperty("java.version"));
        details.put("os", System.getProperty("os.name"));
        details.put("uptimeMs", ManagementFactory.getRuntimeMXBean().getUptime());

        return HealthResponse.up("1.0.0", activeProfile, details);
    }
}
