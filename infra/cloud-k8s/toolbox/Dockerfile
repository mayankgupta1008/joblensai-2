FROM alpine:3.19

# Install dependencies: AWS CLI, kubectl, and Helm
RUN apk add --no-cache bash curl tar gzip aws-cli jq openssl \
    && echo "Installing kubectl..." \
    && ARCH=$(uname -m) && if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; elif [ "$ARCH" = "x86_64" ]; then ARCH="amd64"; else ARCH="amd64"; fi \
    && curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/${ARCH}/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/local/bin/ \
    && echo "Installing Helm..." \
    && curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \
    && chmod 700 get_helm.sh \
    && bash ./get_helm.sh \
    && rm get_helm.sh

WORKDIR /workspace

# Use CMD instead of ENTRYPOINT so arguments are executed correctly
CMD ["/bin/bash"]
