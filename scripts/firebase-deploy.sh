#!/usr/bin/env bash
# Firebase CLI を使って Firestore ルールとホスティング等をデプロイするスクリプト
# 使い方:
# 1) Firebase CLI をインストール: npm install -g firebase-tools
# 2) firebase login
# 3) firebase use --add (または --project <PROJECT_ID> を指定)
# 4) ./scripts/firebase-deploy.sh <PROJECT_ID>

set -euo pipefail
PROJECT_ID=${1:-}
if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 <FIREBASE_PROJECT_ID>"
  exit 1
fi

# デフォルトでは firestore.rules をデプロイ
if ! command -v firebase >/dev/null 2>&1; then
  echo "firebase CLI not found. Install with: npm install -g firebase-tools"
  exit 1
fi

echo "Deploying Firestore rules to project: $PROJECT_ID"
firebase deploy --project "$PROJECT_ID" --only firestore:rules

echo "Done"
