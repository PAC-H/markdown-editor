# Build stage
FROM golang:1.21-alpine AS build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy the binary from build stage
COPY --from=build /app/main .
COPY --from=build /app/config.json .

# Create files directory
RUN mkdir -p /app/files

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./main"] 