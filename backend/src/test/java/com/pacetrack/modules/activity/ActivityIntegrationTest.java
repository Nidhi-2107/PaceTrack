package com.pacetrack.modules.activity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.pacetrack.modules.auth.dto.AuthResponse;
import com.pacetrack.modules.auth.dto.LoginRequest;
import com.pacetrack.modules.auth.dto.RegisterRequest;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ActivityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private static final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    // State shared across ordered tests
    private static String token;
    private static String createdActivityId;

    // -------------------------------------------------------------------------
    // Helper: register and login to get a JWT
    // -------------------------------------------------------------------------
    @BeforeAll
    static void setup(@Autowired MockMvc mockMvc) throws Exception {
        // Register a unique test user
        String email = "activitytest+" + UUID.randomUUID() + "@pacetrack.test";

        Map<String, String> reg = Map.of(
            "email", email,
            "password", "Password123!",
            "firstName", "Activity",
            "lastName", "Tester"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        // Login
        Map<String, String> login = Map.of("email", email, "password", "Password123!");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String body = loginResult.getResponse().getContentAsString();
        // Extract token from: {"success":true,"data":{"token":"..."}}
        token = mapper.readTree(body).path("data").path("token").asText();
    }

    // -------------------------------------------------------------------------
    // 1. Unauthenticated access is rejected
    // -------------------------------------------------------------------------
    @Test
    @Order(1)
    void unauthenticatedAccessIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/activities"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // 2. Create an activity
    // -------------------------------------------------------------------------
    @Test
    @Order(2)
    void createActivitySucceeds() throws Exception {
        Instant start = Instant.parse("2026-11-06T07:00:00Z");
        Instant end   = Instant.parse("2026-11-06T07:30:00Z");

        Map<String, Object> body = Map.of(
            "activityType", "RUNNING",
            "title", "Morning Run",
            "startTime", start.toString(),
            "endTime", end.toString(),
            "distanceMeters", 5000.0,
            "stepCount", 5800,
            "privacyLevel", "PRIVATE",
            "idempotencyKey", UUID.randomUUID().toString(),
            "waypoints", List.of(
                Map.of("latitude", 12.9716, "longitude", 77.5946, "timestamp", start.toString()),
                Map.of("latitude", 12.9720, "longitude", 77.5950, "timestamp", end.toString())
            )
        );

        MvcResult result = mockMvc.perform(post("/api/v1/activities")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.activityType").value("RUNNING"))
                .andExpect(jsonPath("$.data.title").value("Morning Run"))
                .andExpect(jsonPath("$.data.distanceMeters").value(5000.0))
                .andExpect(jsonPath("$.data.durationSeconds").value(1800))
                .andExpect(jsonPath("$.data.caloriesBurned").isNumber())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        createdActivityId = mapper.readTree(responseBody).path("data").path("id").asText();
    }

    // -------------------------------------------------------------------------
    // 3. Idempotency: same idempotencyKey returns existing record
    // -------------------------------------------------------------------------
    @Test
    @Order(3)
    void idempotentActivityCreationReturnsSameRecord() throws Exception {
        String idemKey = UUID.randomUUID().toString();
        Instant start = Instant.parse("2026-11-06T08:00:00Z");
        Instant end   = Instant.parse("2026-11-06T08:20:00Z");

        Map<String, Object> body = Map.of(
            "activityType", "WALKING",
            "title", "Idempotent Walk",
            "startTime", start.toString(),
            "endTime", end.toString(),
            "distanceMeters", 1500.0,
            "idempotencyKey", idemKey
        );

        // First call
        MvcResult first = mockMvc.perform(post("/api/v1/activities")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn();

        String firstId = mapper.readTree(first.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Second call with same key
        MvcResult second = mockMvc.perform(post("/api/v1/activities")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn();

        String secondId = mapper.readTree(second.getResponse().getContentAsString())
                .path("data").path("id").asText();

        Assertions.assertEquals(firstId, secondId, "Idempotent request must return the same activity ID");
    }

    // -------------------------------------------------------------------------
    // 4. Invalid activity type is rejected
    // -------------------------------------------------------------------------
    @Test
    @Order(4)
    void invalidActivityTypeIsRejected() throws Exception {
        Map<String, Object> body = Map.of(
            "activityType", "SKYDIVING",
            "title", "Sky Dive",
            "startTime", Instant.now().minusSeconds(600).toString(),
            "endTime", Instant.now().toString(),
            "distanceMeters", 100.0
        );

        mockMvc.perform(post("/api/v1/activities")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // 5. End time before start time is rejected
    // -------------------------------------------------------------------------
    @Test
    @Order(5)
    void endTimeBeforeStartTimeIsRejected() throws Exception {
        Map<String, Object> body = Map.of(
            "activityType", "RUNNING",
            "title", "Time-travel Run",
            "startTime", Instant.now().toString(),
            "endTime", Instant.now().minusSeconds(600).toString(),
            "distanceMeters", 1000.0
        );

        mockMvc.perform(post("/api/v1/activities")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // 6. Retrieve activity list
    // -------------------------------------------------------------------------
    @Test
    @Order(6)
    void getActivitiesReturnsUserActivities() throws Exception {
        mockMvc.perform(get("/api/v1/activities")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    // -------------------------------------------------------------------------
    // 7. Retrieve single activity by ID
    // -------------------------------------------------------------------------
    @Test
    @Order(7)
    void getActivityByIdReturnsCorrectActivity() throws Exception {
        Assumptions.assumeTrue(createdActivityId != null, "Activity must have been created in test 2");

        mockMvc.perform(get("/api/v1/activities/" + createdActivityId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(createdActivityId))
                .andExpect(jsonPath("$.data.waypoints").isArray());
    }

    // -------------------------------------------------------------------------
    // 8. Requesting another user's activity returns 404 (not leaking existence)
    // -------------------------------------------------------------------------
    @Test
    @Order(8)
    void randomActivityIdReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/activities/" + UUID.randomUUID())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // 9. Step sync and retrieval
    // -------------------------------------------------------------------------
    @Test
    @Order(9)
    void stepSyncAndRetrieval() throws Exception {
        Map<String, Object> syncBody = Map.of(
            "recordDate", LocalDate.now().toString(),
            "stepCount", 7500,
            "distanceMeters", 5625.0,
            "caloriesBurned", 320
        );

        mockMvc.perform(post("/api/v1/steps/sync")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(syncBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stepCount").value(7500));

        // Now retrieve today
        mockMvc.perform(get("/api/v1/steps/today")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stepCount").value(7500));
    }

    // -------------------------------------------------------------------------
    // 10. Weekly analytics
    // -------------------------------------------------------------------------
    @Test
    @Order(10)
    void weeklyAnalyticsReturnsData() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/weekly")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalActivities").isNumber())
                .andExpect(jsonPath("$.data.dailySteps").isArray());
    }

    // -------------------------------------------------------------------------
    // 11. Goals: create and retrieve
    // -------------------------------------------------------------------------
    @Test
    @Order(11)
    void createAndRetrieveGoal() throws Exception {
        Map<String, Object> goal = Map.of(
            "goalType", "DAILY_STEPS",
            "targetValue", 10000
        );

        mockMvc.perform(post("/api/v1/goals")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(goal)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.goalType").value("DAILY_STEPS"))
                .andExpect(jsonPath("$.data.targetValue").value(10000));

        mockMvc.perform(get("/api/v1/goals")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].goalType").value("DAILY_STEPS"));
    }

    // -------------------------------------------------------------------------
    // 12. Goal upsert: updating same type overwrites target
    // -------------------------------------------------------------------------
    @Test
    @Order(12)
    void goalUpsertUpdatesExistingGoal() throws Exception {
        Map<String, Object> updated = Map.of(
            "goalType", "DAILY_STEPS",
            "targetValue", 12000
        );

        mockMvc.perform(post("/api/v1/goals")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(updated)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.targetValue").value(12000));

        // List should still have only one DAILY_STEPS goal
        MvcResult listResult = mockMvc.perform(get("/api/v1/goals")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        int count = (int) mapper.readTree(listResult.getResponse().getContentAsString())
                .path("data").findValues("goalType").stream()
                .filter(n -> "DAILY_STEPS".equals(n.asText()))
                .count();
        Assertions.assertEquals(1, count, "Should have exactly one DAILY_STEPS goal after upsert");
    }
}

