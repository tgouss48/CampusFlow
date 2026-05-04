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
RUN mvn -pl annonces-service dependency:go-offline -q
COPY annonces-service/src annonces-service/src
RUN mvn -pl annonces-service package -DskipTests -q

# ===== Stage 2: Runtime =====
FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app/annonces-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
