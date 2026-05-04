# ===== Stage 1: Build =====
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY auth-service/pom.xml auth-service/pom.xml
COPY annonces-service/pom.xml annonces-service/pom.xml
COPY evenements-service/pom.xml evenements-service/pom.xml
COPY sociale-service/pom.xml sociale-service/pom.xml
COPY gateway-service/pom.xml gateway-service/pom.xml
COPY discovery-service/pom.xml discovery-service/pom.xml
RUN mvn -pl evenements-service dependency:go-offline -q
COPY evenements-service/src evenements-service/src
RUN mvn -pl evenements-service package -DskipTests -q

# ===== Stage 2: Runtime =====
FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app/evenements-service/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
