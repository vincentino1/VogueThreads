# Private Nexus Docker registry
ARG DOCKER_PRIVATE_REPO=3-98-125-121.sslip.io/myapp-docker-group

# Stage 1 - Build the Angular app
# Use Node 20 Alpine image from private Nexus Docker group registry
FROM ${DOCKER_PRIVATE_REPO}/node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy only the dependency files first to optimize Docker caching
COPY package*.json ./

# Install exact dependency versions from package-lock.json
RUN npm ci 

# Copy all application source files into the container
COPY . .

# Build Angular app (Angular 17 defaults to production build)
RUN npm run build 

# Stage 2: Serve with Nginx
FROM ${DOCKER_PRIVATE_REPO}/nginx:alpine

# Remove existing content
RUN rm -rf /usr/share/nginx/html/*

# COPY from the builder stage, not from host
COPY --from=builder /app/dist/voguethreads/browser /usr/share/nginx/html

# Expose port 80 for container runtime
EXPOSE 80

# Run nginx in foreground (required for Docker containers)
CMD ["nginx", "-g", "daemon off;"]
