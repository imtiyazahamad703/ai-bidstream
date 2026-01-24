FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the application, skipping tests to speed up deployment
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080 (Render expects this or we can configure it)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
