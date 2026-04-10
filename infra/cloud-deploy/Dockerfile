FROM alpine:3.19

# Install dependencies: AWS CLI, Terraform
RUN apk add --no-cache bash curl tar gzip aws-cli jq openssl unzip \
    && echo "Installing Terraform..." \
    && ARCH=$(uname -m) && if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; elif [ "$ARCH" = "x86_64" ]; then ARCH="amd64"; else ARCH="amd64"; fi \
    && TF_VERSION="1.10.5" \
    && curl -LO "https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_linux_${ARCH}.zip" \
    && unzip terraform_${TF_VERSION}_linux_${ARCH}.zip \
    && mv terraform /usr/local/bin/ \
    && rm terraform_${TF_VERSION}_linux_${ARCH}.zip

WORKDIR /workspace

CMD ["/bin/bash"]
