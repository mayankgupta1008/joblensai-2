#!/bin/bash
set -e

echo "Starting Cloud Toolbox..."

# Calculate paths accurately
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_DIR="$( cd "$DIR/../../.." && pwd )"
KUBE_DIR="$DIR/.kube"

# Ensure the completely isolated local .kube directory exists
mkdir -p "$KUBE_DIR"

# Build the Docker image automatically if it doesn't exist yet
if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q '^joblensai-toolbox:v2$'; then
    echo "Building joblensai-toolbox Docker image..."
    docker build -t joblensai-toolbox:v2 "$DIR"
fi

# We define what commands the container will run from arguments
CMD="$@"
if [ -z "$CMD" ]; then
    CMD="bash"
fi

# Run the container in interactive mode and map the strict variables
docker run --rm -it \
  --dns 8.8.8.8 \
  --dns 8.8.4.4 \
  -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
  -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
  -e AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-ap-south-1}" \
  -v "${WORKSPACE_DIR}:/workspace" \
  -v "${KUBE_DIR}:/root/.kube" \
  -w /workspace \
  joblensai-toolbox:v2 $CMD
