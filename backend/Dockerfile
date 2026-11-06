# -------------------------------------------------------------
# PaceTrack Spring Boot 3 Production Dockerfile
# Multi-stage build targeting Eclipse Temurin 21 JRE
# -------------------------------------------------------------

# Stage 1: Build backend JAR
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /workspace/backend

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy sources and package
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Lean runtime container
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create unprivileged system user for container security
RUN addgroup -S pacetrack && adduser -S pacetrack -G pacetrack

# Copy artifact from build stage
COPY --from=builder /workspace/backend/target/backend-0.0.1-SNAPSHOT.jar app.jar
RUN chown -R pacetrack:pacetrack /app

USER pacetrack

# Production JVM optimizations for container environments
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

