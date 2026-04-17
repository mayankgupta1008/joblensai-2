#!/bin/bash
set -e

echo "Starting AWS/Terraform Toolbox..." >&2

# DIR = infra/cloud-deploy/scripts/
# WORKSPACE_DIR = repo root (3 levels up)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_DIR="$( cd "$DIR/../../.." && pwd )"

# Build the Docker image if it doesn't exist yet
if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q '^joblensai-toolbox:terraform$'; then
    echo "Building joblensai-toolbox:terraform Docker image..." >&2
    docker build -t joblensai-toolbox:terraform "$DIR/.." >&2
fi

# Default to bash if no command provided
if [ $# -eq 0 ]; then
    set -- bash
fi

# Re-exec with a real TTY if called from pnpm or any non-TTY context
if [ ! -t 0 ] || [ ! -t 1 ]; then
    echo "No TTY detected (called via pnpm?). Re-launching with TTY via script command..." >&2
    exec script -q /dev/null bash -c "\"$0\" $*"
fi

# Run the container:
#   --rm         → auto-remove container when done (no leftovers)
#   -it          → interactive terminal (TTY is guaranteed at this point)
#   -e AWS_*     → pass credentials from your shell env into the container
#                  credentials never stored on disk, only live in memory
#   -v workspace → mounts repo root so terraform files are accessible
#   -w /workspace → sets working directory inside container
#   "$@"         → pass all arguments as separate words (preserves quoting)
docker run --rm -it \
  --dns 8.8.8.8 \
  --dns 8.8.4.4 \
  -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
  -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
  -e AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-ap-south-1}" \
  -e PROJECT="${PROJECT:-joblensai}" \
  -v "${WORKSPACE_DIR}:/workspace" \
  -w /workspace \
  joblensai-toolbox:terraform "$@"