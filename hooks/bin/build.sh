#!/bin/bash

set -e

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install and use specific Yarn version if needed
# Uncomment and modify if you need a specific Yarn version
# npm install -g yarn@1.22.19
echo "Yarn version: $(yarn --version || npm install -g yarn && yarn --version)"

# Function to handle errors
handle_error() {
    echo "Error occurred in build script"
    echo "Exit code: $?"
    exit 1
}

trap 'handle_error' ERR

# Build PWA
# rm -f yarn.lock package-lock.json
# For node version < 20.
export NODE_OPTIONS=--openssl-legacy-provider

case "${ENVIRONMENT:-}" in
    production)
        echo "Using production configuration"
        cp env.prod .env
        # GraphQL access token from Bitbucket secured repository variable GRAPHQL_TOKEN_1.
        export ACCESS_TOKEN="${GRAPHQL_TOKEN_1:?GRAPHQL_TOKEN_1 repository variable is not set}"
        ;;
    staging)
        echo "Using staging configuration"
        cp env.staging .env
        # GraphQL access token from Bitbucket secured repository variable GRAPHQL_TOKEN_2.
        export ACCESS_TOKEN="${GRAPHQL_TOKEN_2:?GRAPHQL_TOKEN_2 repository variable is not set}"
        ;;
    staging2)
        echo "Using Staging 2 configuration"
        cp env.staging2 .env
        # GraphQL access token from Bitbucket secured repository variable GRAPHQL_TOKEN_3.
        export ACCESS_TOKEN="${GRAPHQL_TOKEN_3:?GRAPHQL_TOKEN_3 repository variable is not set}"
        ;;
    integration)
        echo "Using integration configuration"
        cp env.integration .env
        ;;
    *)
        echo "Invalid ENVIRONMENT: ${ENVIRONMENT:-<empty>}"
        echo "Expected one of: integration, staging, production"
        exit 1
        ;;
esac

yarn cache clean
yarn install --production=false --frozen-lockfile
echo yes | yarn build

# Verify build and prepare artifacts
if [ -d dist ]; then
    echo "PWA Studio build successful!"
    mkdir -p $BITBUCKET_CLONE_DIR/artifacts
    cp -R dist/* $BITBUCKET_CLONE_DIR/artifacts/
    exit 0
else
    echo "PWA Studio build failed!"
    exit 1
fi