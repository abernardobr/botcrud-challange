# MongoDB Dockerfile for BotCRUD Backend
# Uses MongoDB latest with search capabilities

FROM mongo:latest

# Set environment variables
ENV MONGO_INITDB_ROOT_USERNAME=admin
ENV MONGO_INITDB_ROOT_PASSWORD=admin123
ENV MONGO_INITDB_DATABASE=botcrud

# Copy initialization script
COPY mongo-init.js /docker-entrypoint-initdb.d/

# Expose MongoDB port
EXPOSE 27017

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD mongosh --eval "db.adminCommand('ping')" || exit 1
