#!/bin/bash

#######################################################################
# AWS ECR Setup Script for GitHub Actions CI/CD
#
# This script sets up:
# 1. OIDC provider (for GitHub Actions authentication - no stored secrets)
# 2. IAM role with ECR push permissions
# 3. ECR repositories for each microservice
#
# Prerequisites:
# - AWS CLI installed and configured with admin privileges
#
# Usage: ./scripts/setup-aws-ecr.sh
#######################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

#######################################################################
# STEP 1: Check and install prerequisites
#######################################################################
install_aws_cli() {
    print_info "Installing AWS CLI..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install awscli
        else
            print_info "Installing via pkg (Homebrew not found)..."
            curl -s "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "/tmp/AWSCLIV2.pkg"
            sudo installer -pkg /tmp/AWSCLIV2.pkg -target /
            rm -f /tmp/AWSCLIV2.pkg
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
        unzip -q /tmp/awscliv2.zip -d /tmp
        sudo /tmp/aws/install
        rm -rf /tmp/awscliv2.zip /tmp/aws
    else
        print_error "Unsupported OS: $OSTYPE"
        print_info "Install manually: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi

    # Verify installation
    if command -v aws &> /dev/null; then
        print_success "AWS CLI installed successfully"
    else
        print_error "AWS CLI installation failed"
        exit 1
    fi
}

check_prerequisites() {
    print_header "Step 1: Checking Prerequisites"

    # Check AWS CLI - install if missing
    if ! command -v aws &> /dev/null; then
        print_warning "AWS CLI not found"
        read -p "Install AWS CLI now? (Y/n): " install_aws
        if [[ "$install_aws" != "n" && "$install_aws" != "N" ]]; then
            install_aws_cli
        else
            print_error "AWS CLI is required"
            exit 1
        fi
    else
        print_success "AWS CLI installed ($(aws --version | cut -d' ' -f1))"
    fi

    # Check AWS credentials configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured or invalid"
        echo "  Run 'aws configure' or check your .envrc file"
        exit 1
    fi

    # Get account info
    ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
    CURRENT_ARN=$(aws sts get-caller-identity --query 'Arn' --output text)

    print_success "AWS credentials valid"
    print_info "Account ID: $ACCOUNT_ID"
    print_info "Identity: $CURRENT_ARN"

    # Warn if using root
    if [[ "$CURRENT_ARN" == *":root"* ]]; then
        echo ""
        print_warning "WARNING: You are using the ROOT account!"
        print_warning "Best practice: Use an IAM user with admin privileges instead."
        echo ""
        read -p "Continue anyway? (y/N): " confirm
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            exit 1
        fi
    fi
}

#######################################################################
# STEP 2: Gather user input
#######################################################################
gather_input() {
    print_header "Step 2: Configuration"

    # AWS Region
    read -p "AWS Region [ap-south-1]: " input
    AWS_REGION=${input:-ap-south-1}

    # GitHub repository
    read -p "GitHub Repository (format: owner/repo): " GITHUB_REPO
    if [[ -z "$GITHUB_REPO" ]]; then
        print_error "GitHub repository is required"
        exit 1
    fi

    # Image prefix for ECR repos
    read -p "ECR image prefix [joblensai]: " input
    IMAGE_PREFIX=${input:-joblensai}

    # IAM role name
    read -p "IAM Role name [github-actions-ecr]: " input
    ROLE_NAME=${input:-github-actions-ecr}

    # Services
    read -p "Services (comma-separated) [auth,backend,payment,notification,agent-service,web]: " input
    SERVICES_INPUT=${input:-auth,backend,payment,notification,agent-service,web}
    IFS=',' read -ra SERVICES <<< "$SERVICES_INPUT"

    # Confirm
    echo ""
    echo "Configuration:"
    echo "  AWS Region:    $AWS_REGION"
    echo "  GitHub Repo:   $GITHUB_REPO"
    echo "  Image Prefix:  $IMAGE_PREFIX"
    echo "  IAM Role:      $ROLE_NAME"
    echo "  Services:      ${SERVICES[*]}"
    echo ""

    read -p "Proceed? (y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        exit 0
    fi
}

#######################################################################
# STEP 3: Create OIDC Provider
#######################################################################
create_oidc_provider() {
    print_header "Step 3: Creating OIDC Provider"

    OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

    # Check if exists
    if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$OIDC_ARN" &> /dev/null; then
        print_warning "OIDC provider already exists - skipping"
        return
    fi

    # GitHub's OIDC thumbprint
    THUMBPRINT="6938fd4d98bab03faadb97b34396831e3780aea1"

    aws iam create-open-id-connect-provider \
        --url "https://token.actions.githubusercontent.com" \
        --client-id-list "sts.amazonaws.com" \
        --thumbprint-list "$THUMBPRINT"

    print_success "Created OIDC provider for GitHub Actions"
}

#######################################################################
# STEP 4: Create IAM Role
#######################################################################
create_iam_role() {
    print_header "Step 4: Creating IAM Role"

    # Check if role exists
    if aws iam get-role --role-name "$ROLE_NAME" &> /dev/null; then
        print_warning "Role $ROLE_NAME already exists"
        read -p "Delete and recreate? (y/N): " recreate

        if [[ "$recreate" == "y" || "$recreate" == "Y" ]]; then
            # Delete inline policies
            for policy in $(aws iam list-role-policies --role-name "$ROLE_NAME" --query 'PolicyNames[]' --output text); do
                aws iam delete-role-policy --role-name "$ROLE_NAME" --policy-name "$policy"
            done
            # Delete attached policies
            for policy in $(aws iam list-attached-role-policies --role-name "$ROLE_NAME" --query 'AttachedPolicies[].PolicyArn' --output text); do
                aws iam detach-role-policy --role-name "$ROLE_NAME" --policy-arn "$policy"
            done
            aws iam delete-role --role-name "$ROLE_NAME"
            print_success "Deleted existing role"
        else
            return
        fi
    fi

    # Create trust policy file
    cat > /tmp/trust-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": "repo:${GITHUB_REPO}:*"
                }
            }
        }
    ]
}
EOF

    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "GitHub Actions role for pushing to ECR"

    print_success "Created IAM role: $ROLE_NAME"

    # Create ECR policy file
    cat > /tmp/ecr-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "ecr:GetAuthorizationToken",
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage"
            ],
            "Resource": "arn:aws:ecr:${AWS_REGION}:${ACCOUNT_ID}:repository/${IMAGE_PREFIX}-*"
        }
    ]
}
EOF

    aws iam put-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-name "ecr-push-policy" \
        --policy-document file:///tmp/ecr-policy.json

    print_success "Attached ECR push policy"

    # Cleanup temp files
    rm -f /tmp/trust-policy.json /tmp/ecr-policy.json
}

#######################################################################
# STEP 5: Create ECR Repositories
#######################################################################
create_ecr_repos() {
    print_header "Step 5: Creating ECR Repositories"

    for service in "${SERVICES[@]}"; do
        REPO_NAME="${IMAGE_PREFIX}-${service}"

        if aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$AWS_REGION" &> /dev/null; then
            print_warning "$REPO_NAME already exists - skipping"
            continue
        fi

        aws ecr create-repository \
            --repository-name "$REPO_NAME" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true

        print_success "Created: $REPO_NAME"

        # Set lifecycle policy (keep last 10 images)
        aws ecr put-lifecycle-policy \
            --repository-name "$REPO_NAME" \
            --region "$AWS_REGION" \
            --lifecycle-policy-text '{
                "rules": [{
                    "rulePriority": 1,
                    "description": "Keep last 10 images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 10
                    },
                    "action": {"type": "expire"}
                }]
            }' &> /dev/null

        print_info "Set lifecycle policy (keep last 10)"
    done
}

#######################################################################
# STEP 6: Print Summary
#######################################################################
print_summary() {
    print_header "Setup Complete!"

    ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

    echo "ECR Registry:  $ECR_REGISTRY"
    echo "IAM Role ARN:  $ROLE_ARN"
    echo ""
    echo "Repositories created:"
    for service in "${SERVICES[@]}"; do
        echo "  - ${IMAGE_PREFIX}-${service}"
    done

    print_header "Next Steps: Update .github/workflows/ci.yaml"

    cat <<EOF
1. Replace env section:

   env:
     AWS_REGION: ${AWS_REGION}
     ECR_REGISTRY: ${ECR_REGISTRY}
     IMAGE_PREFIX: ${IMAGE_PREFIX}

2. Update permissions:

   permissions:
     contents: read
     id-token: write

3. In push-images job, add these steps BEFORE docker build:

   - name: Configure AWS credentials
     uses: aws-actions/configure-aws-credentials@v4
     with:
       role-to-assume: ${ROLE_ARN}
       aws-region: ${AWS_REGION}

   - name: Login to Amazon ECR
     uses: aws-actions/amazon-ecr-login@v2

4. Update image tags:

   tags: |
     \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_PREFIX }}-\${{ matrix.service.name }}:latest
     \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_PREFIX }}-\${{ matrix.service.name }}:\${{ github.sha }}

EOF

    print_success "Done! Run 'git push' to trigger CI and test ECR push."
}

#######################################################################
# Main
#######################################################################
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║         AWS ECR Setup for GitHub Actions                      ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"

    check_prerequisites
    gather_input
    create_oidc_provider
    create_iam_role
    create_ecr_repos
    print_summary
}

main "$@"
