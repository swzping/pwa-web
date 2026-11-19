#!/bin/bash
set -euo pipefail

#############################################
# Required environment variables
#############################################
: "${ENVIRONMENT:?ENVIRONMENT is required (staging2|staging|integration|production)}"
: "${MAGENTO_REPO:?MAGENTO_REPO is required}"
: "${REPO_ACCESS_TOKEN:?REPO_ACCESS_TOKEN is required}"
: "${DEFAULT_REVIEWERS:?DEFAULT_REVIEWERS is required (JSON)}"

#############################################
# Validate environment
#############################################
case "$ENVIRONMENT" in
    staging2|staging|integration|production) ;;
    *)
        echo "Invalid ENVIRONMENT: $ENVIRONMENT"
        exit 1
        ;;
esac

#############################################
# Constants
#############################################
TARGET_BRANCH="$ENVIRONMENT"
TIMESTAMP="$(date +%s)"
NEW_BRANCH_NAME="feature/pwa-studio-update-${ENVIRONMENT}-${TIMESTAMP}"
BOT_EMAIL="6tec7vm3dbfen75hz705u0u1pkhuoh@bots.bitbucket.org"
BOT_NAME="Auto Deployer"
PWA_DIST_PATH="pwa/dist"
ARTIFACTS_PATH="../artifacts"
BUILD_MARKER_FILE="${PWA_DIST_PATH}/.build-timestamp"
URL=${BITBUCKET_GIT_HTTP_ORIGIN}"/commits/"${BITBUCKET_COMMIT}
#############################################
# Clone Magento repository
#############################################
echo "Cloning Magento repository (branch: $TARGET_BRANCH)..."

git clone \
    --branch="$TARGET_BRANCH" \
    "https://x-token-auth:${REPO_ACCESS_TOKEN}@bitbucket.org/${MAGENTO_REPO}" \
    magento

cd magento

git config user.email "$BOT_EMAIL"
git config user.name "$BOT_NAME"

#############################################
# Validate artifacts
#############################################
if [ ! -d "$ARTIFACTS_PATH" ]; then
    echo "Artifacts directory not found: $ARTIFACTS_PATH"
    exit 1
fi

#############################################
# Replace PWA dist artifacts
#############################################
echo "Updating PWA dist artifacts..."

rm -rf "$PWA_DIST_PATH"
mkdir -p "$PWA_DIST_PATH"
cp -R "${ARTIFACTS_PATH}/." "$PWA_DIST_PATH/"

# Force a deterministic diff (optional but useful)
echo "$TIMESTAMP" > "$BUILD_MARKER_FILE"

#############################################
# Detect changes
#############################################
git add "$PWA_DIST_PATH"

if git diff --cached --quiet; then
    echo "No changes detected. Skipping PR creation."
    exit 0
fi

#############################################
# Create branch, commit, push
#############################################
git checkout -b "$NEW_BRANCH_NAME"

LAST_COMMIT="$(git rev-parse HEAD)"
SHORT_COMMIT="${LAST_COMMIT:0:7}"

PR_TITLE="[$ENVIRONMENT] Update Guardian PWA Studio build (${SHORT_COMMIT})"
PR_DESCRIPTION="Automated PR for ID Guardian PWA ${ENVIRONMENT}. Related Commit ${URL}"
git commit -m "$PR_TITLE"
git push origin "$NEW_BRANCH_NAME"

#############################################
# Create Pull Request
#############################################
echo "Creating pull request..."
# Convert comma-separated reviewers to JSON array
REVIEWERS_JSON="[${DEFAULT_REVIEWERS}]";

curl -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${REPO_ACCESS_TOKEN}" \
    https://api.bitbucket.org/2.0/repositories/${MAGENTO_REPO}/pullrequests \
    -d "{
    \"title\": \"$PR_TITLE\",
    \"description\": \"$PR_DESCRIPTION\",
    \"source\": {
        \"branch\": {
        \"name\": \"$NEW_BRANCH_NAME\"
        }
    },
    \"destination\": {
        \"branch\": {
        \"name\": \"$TARGET_BRANCH\"
        }
    },
    \"close_source_branch\": true,
    \"reviewers\": ${REVIEWERS_JSON}
    }"
echo "Pull request created successfully!"