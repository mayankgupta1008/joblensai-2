#!/bin/bash
# ============================================================
# Seed Vault with Development Secrets
# Reads from existing .env files in the project
# ============================================================

set -e

VAULT_ADDR="http://127.0.0.1:8200"
VAULT_TOKEN="root"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "🔐 Seeding Vault with secrets from .env files..."

# ─────────────────────────────────────────────────────────────
# Safe function to load .env files (filters out problematic lines)
# ─────────────────────────────────────────────────────────────
load_env_file() {
    local file="$1"
    if [ -f "$file" ]; then
        # Only load lines that are valid KEY=value (no special chars like %)
        while IFS='=' read -r key value; do
            # Skip comments, empty lines, and lines with problematic characters
            [[ "$key" =~ ^[[:space:]]*# ]] && continue
            [[ -z "$key" ]] && continue
            [[ "$value" =~ [\(\)] ]] && continue
            # Remove leading/trailing whitespace from key
            key=$(echo "$key" | xargs)
            [[ -z "$key" ]] && continue
            # Export the variable
            export "$key=$value" 2>/dev/null || true
        done < "$file"
    fi
}

# Load all .env files safely
load_env_file "$PROJECT_ROOT/.env"
load_env_file "$PROJECT_ROOT/apps/auth/.env"
load_env_file "$PROJECT_ROOT/apps/payment/.env"
load_env_file "$PROJECT_ROOT/apps/agent-service/.env"
load_env_file "$PROJECT_ROOT/apps/notification/.env"
load_env_file "$PROJECT_ROOT/apps/backend/.env"
load_env_file "$PROJECT_ROOT/packages/shared/.env"

# ─────────────────────────────────────────────────────────────
# Set defaults for any missing values
# ─────────────────────────────────────────────────────────────
MONGO_INITDB_ROOT_USERNAME="${MONGO_INITDB_ROOT_USERNAME:-root}"
MONGO_INITDB_ROOT_PASSWORD="${MONGO_INITDB_ROOT_PASSWORD:-root1234}"
MONGODB_URI="${MONGODB_URI:-mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongodb:27017/joblensai?authSource=admin}"
REDIS_URL="${REDIS_URL:-redis://redis:6379}"
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-root1234}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-root1234}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-${MINIO_ROOT_USER}}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-${MINIO_ROOT_PASSWORD}}"
S3_BUCKET="${S3_BUCKET:-joblensai}"
KAFKA_BROKERS="${KAFKA_BROKERS:-kafka:9092}"

# Auth defaults
JWT_PRIVATE_KEY_BASE64="${JWT_PRIVATE_KEY_BASE64:-}"
JWT_PUBLIC_KEY_BASE64="${JWT_PUBLIC_KEY_BASE64:-}"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-test-client-id.apps.googleusercontent.com}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-test-client-secret}"

# Payment defaults
RAZORPAY_KEY_ID="${RAZORPAY_KEY_ID:-rzp_test_placeholder}"
RAZORPAY_KEY_SECRET="${RAZORPAY_KEY_SECRET:-placeholder_secret}"
RAZORPAY_WEBHOOK_SECRET="${RAZORPAY_WEBHOOK_SECRET:-placeholder_webhook_secret}"

# Agent defaults
OPENAI_API_KEY="${OPENAI_API_KEY:-sk-placeholder-for-local-dev}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-sk-ant-placeholder-for-local-dev}"

# Notification defaults
EMAIL_SERVICE="${EMAIL_SERVICE:-gmail}"
EMAIL_USERNAME="${EMAIL_USERNAME:-test@example.com}"
EMAIL_PASSWORD="${EMAIL_PASSWORD:-placeholder}"
RESEND_API_KEY="${RESEND_API_KEY:-re_placeholder}"

# Wait for Vault to be ready
echo "Waiting for Vault to be ready..."
until curl -s "${VAULT_ADDR}/v1/sys/health" > /dev/null 2>&1; do
    echo "  Vault not ready, waiting..."
    sleep 2
done
echo "✓ Vault is ready"

# Enable KV secrets engine v2
curl -s --header "X-Vault-Token: ${VAULT_TOKEN}" \
    --request POST \
    --data '{"type":"kv","options":{"version":"2"}}' \
    "${VAULT_ADDR}/v1/sys/mounts/secret" 2>/dev/null || true

# ─────────────────────────────────────────────────────────────
# Seed Infrastructure Secrets
# ─────────────────────────────────────────────────────────────
echo "📦 Seeding infrastructure secrets..."
curl -s --header "X-Vault-Token: ${VAULT_TOKEN}" \
    --request POST \
    --data "{
        \"data\": {
            \"MONGO_INITDB_ROOT_USERNAME\": \"${MONGO_INITDB_ROOT_USERNAME}\",
            \"MONGO_INITDB_ROOT_PASSWORD\": \"${MONGO_INITDB_ROOT_PASSWORD}\",
            \"MONGODB_URI\": \"${MONGODB_URI}\",
            \"REDIS_URL\": \"${REDIS_URL}\",
            \"REDIS_HOST\": \"${REDIS_HOST}\",
            \"REDIS_PORT\": \"${REDIS_PORT}\",
            \"MINIO_ROOT_USER\": \"${MINIO_ROOT_USER}\",
            \"MINIO_ROOT_PASSWORD\": \"${MINIO_ROOT_PASSWORD}\",
            \"MINIO_ENDPOINT\": \"${MINIO_ENDPOINT}\",
            \"AWS_ACCESS_KEY_ID\": \"${AWS_ACCESS_KEY_ID}\",
            \"AWS_SECRET_ACCESS_KEY\": \"${AWS_SECRET_ACCESS_KEY}\",
            \"S3_BUCKET\": \"${S3_BUCKET}\",
            \"KAFKA_BROKERS\": \"${KAFKA_BROKERS}\"
        }
    }" \
    "${VAULT_ADDR}/v1/secret/data/joblensai/infrastructure"

# ─────────────────────────────────────────────────────────────
# Seed Auth Secrets
# ─────────────────────────────────────────────────────────────
echo "🔑 Seeding auth secrets..."
curl -s --header "X-Vault-Token: ${VAULT_TOKEN}" \
    --request POST \
    --data "{
        \"data\": {
            \"JWT_PRIVATE_KEY_BASE64\": \"${JWT_PRIVATE_KEY_BASE64}\",
            \"JWT_PUBLIC_KEY_BASE64\": \"${JWT_PUBLIC_KEY_BASE64}\",
            \"GOOGLE_CLIENT_ID\": \"${GOOGLE_CLIENT_ID}\",
            \"GOOGLE_CLIENT_SECRET\": \"${GOOGLE_CLIENT_SECRET}\"
        }
    }" \
    "${VAULT_ADDR}/v1/secret/data/joblensai/auth"

# ─────────────────────────────────────────────────────────────
# Seed Payment Secrets
# ─────────────────────────────────────────────────────────────
echo "💳 Seeding payment secrets..."
curl -s --header "X-Vault-Token: ${VAULT_TOKEN}" \
    --request POST \
    --data "{
        \"data\": {
            \"RAZORPAY_KEY_ID\": \"${RAZORPAY_KEY_ID}\",
            \"RAZORPAY_KEY_SECRET\": \"${RAZORPAY_KEY_SECRET}\",
            \"RAZORPAY_WEBHOOK_SECRET\": \"${RAZORPAY_WEBHOOK_SECRET}\"
        }
    }" \
    "${VAULT_ADDR}/v1/secret/data/joblensai/payment"

# ─────────────────────────────────────────────────────────────
# Seed Agent Secrets
# ─────────────────────────────────────────────────────────────
echo "🤖 Seeding agent secrets..."
curl -s --header "X-Vault-Token: ${VAULT_TOKEN}" \
    --request POST \
    --data "{
        \"data\": {
            \"OPENAI_API_KEY\": \"${OPENAI_API_KEY}\",
            \"ANTHROPIC_API_KEY\": \"${ANTHROPIC_API_KEY}\"
        }
    }" \
    "${VAULT_ADDR}/v1/secret/data/joblensai/agent"

# ─────────────────────────────────────────────────────────────
# Seed Notification Secrets
# ─────────────────────────────────────────────────────────────
echo "📧 Seeding notification secrets..."
curl -s --header "X-Vault-Token: ${VAULT_TOKEN}" \
    --request POST \
    --data "{
        \"data\": {
            \"EMAIL_SERVICE\": \"${EMAIL_SERVICE}\",
            \"EMAIL_USERNAME\": \"${EMAIL_USERNAME}\",
            \"EMAIL_PASSWORD\": \"${EMAIL_PASSWORD}\",
            \"RESEND_API_KEY\": \"${RESEND_API_KEY}\"
        }
    }" \
    "${VAULT_ADDR}/v1/secret/data/joblensai/notification"

echo ""
echo "✅ Vault seeded from .env files!"
echo "   Secrets sourced from:"
echo "   - .env (infrastructure)"
echo "   - apps/*/.env (services)"
