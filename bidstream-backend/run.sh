#!/bin/bash

# Load environment variables from the root .env file and run Spring Boot
export $(grep -v '^#' ../../.env | xargs)
./mvnw spring-boot:run
