# ===== Stage 1: Build =====
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
# Copier tous les POM pour satisfaire la structure multi-module de Maven
COPY pom.xml .
COPY discovery-service/pom.xml discovery-service/pom.xml
COPY gateway-service/pom.xml gateway-service/pom.xml
COPY auth-service/pom.xml auth-service/pom.xml
COPY annonces-service/pom.xml annonces-service/pom.xml
COPY evenements-service/pom.xml evenements-service/pom.xml
COPY sociale-service/pom.xml sociale-service/pom.xml

RUN mvn -pl discovery-service dependency:go-offline -q

COPY discovery-service/src discovery-service/src
RUN mvn -pl discovery-service package -DskipTests -q

# ===== Stage 2: Runtime =====
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/discovery-service/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
