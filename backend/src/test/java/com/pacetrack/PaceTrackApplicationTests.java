package com.pacetrack;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class PaceTrackApplicationTests {

    @Test
    void contextLoads() {
        // Verifies Spring context initialization with active test profile
    }
}

