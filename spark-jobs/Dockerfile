# Stage 1: Build the fat jar
FROM maven:3.9-eclipse-temurin-11 AS builder

WORKDIR /app

# Cache dependencies first
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Build the application
COPY src/ ./src/
RUN mvn package -DskipTests -q

# Stage 2: Runtime image
FROM apache/spark:3.5.1

USER root

COPY --from=builder /app/target/spark-streaming-job-*.jar /app/spark-job.jar
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER spark

ENTRYPOINT ["/app/entrypoint.sh"]
