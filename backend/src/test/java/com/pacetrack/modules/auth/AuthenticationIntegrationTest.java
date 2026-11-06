package com.pacetrack.modules.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pacetrack.modules.auth.dto.LoginRequest;
import com.pacetrack.modules.auth.dto.RegisterRequest;
import com.pacetrack.modules.user.entity.UserEntity;
import com.pacetrack.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Successful user registration generates JWT and hashes password")
    void testSuccessfulRegistration() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "runner@pacetrack.io",
                "SecretPace123!",
                "Alex",
                "Rivera"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.email").value("runner@pacetrack.io"))
                .andExpect(jsonPath("$.data.user.firstName").value("Alex"))
                .andExpect(jsonPath("$.data.user.lastName").value("Rivera"))
                .andExpect(jsonPath("$.data.user.role").value("ROLE_USER"))
                .andExpect(jsonPath("$.data.user.id").isString())
                .andReturn();

        // Verify password was hashed and never stored plain text in the database
        UserEntity savedUser = userRepository.findByEmail("runner@pacetrack.io").orElseThrow();
        assertThat(savedUser.getPasswordHash()).isNotEqualTo("SecretPace123!");
        assertThat(passwordEncoder.matches("SecretPace123!", savedUser.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("2. Duplicate email registration should be rejected with 400 Bad Request")
    void testDuplicateEmailRegistration() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "duplicate@pacetrack.io",
                "Password123!",
                "First",
                "User"
        );

        // First registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("INVALID_ARGUMENT"))
                .andExpect(jsonPath("$.message").value("Email is already registered: duplicate@pacetrack.io"));
    }

    @Test
    @DisplayName("3. Invalid email format should be rejected with 400 Validation Error")
    void testInvalidEmailRegistration() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "not-an-email",
                "Password123!",
                "First",
                "User"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("email"));
    }

    @Test
    @DisplayName("4. Short password (< 8 chars) should be rejected with 400 Validation Error")
    void testShortPasswordRegistration() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "runner@pacetrack.io",
                "short",
                "First",
                "User"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("password"));
    }

    @Test
    @DisplayName("5. Successful login with correct credentials returns valid JWT token")
    void testSuccessfulLogin() throws Exception {
        // First register
        RegisterRequest registerReq = new RegisterRequest(
                "runner@pacetrack.io",
                "SecretPace123!",
                "Alex",
                "Rivera"
        );
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Now login
        LoginRequest loginReq = new LoginRequest("runner@pacetrack.io", "SecretPace123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.email").value("runner@pacetrack.io"));
    }

    @Test
    @DisplayName("6. Login with incorrect password should be rejected with 401 Unauthorized")
    void testIncorrectPasswordLogin() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "runner@pacetrack.io",
                "SecretPace123!",
                "Alex",
                "Rivera"
        );
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest wrongLoginReq = new LoginRequest("runner@pacetrack.io", "WrongPassword999!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongLoginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("7. Unauthorized request to GET /api/v1/users/me without token returns 401")
    void testUnauthorizedProfileAccess() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("8. Authenticated request to GET /api/v1/users/me with valid Bearer token returns profile")
    void testAuthenticatedProfileAccess() throws Exception {
        // Register to obtain token
        RegisterRequest registerReq = new RegisterRequest(
                "runner@pacetrack.io",
                "SecretPace123!",
                "Alex",
                "Rivera"
        );
        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode root = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        String token = root.path("data").path("token").asText();

        // Call GET /api/v1/users/me with Bearer token
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("runner@pacetrack.io"))
                .andExpect(jsonPath("$.data.firstName").value("Alex"))
                .andExpect(jsonPath("$.data.lastName").value("Rivera"))
                .andExpect(jsonPath("$.data.role").value("ROLE_USER"))
                .andExpect(jsonPath("$.data.id").isString());
    }
}

