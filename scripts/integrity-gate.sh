#!/bin/bash
set -e
echo "🔒 INTEGRITY GATE"
echo "1️⃣  TypeScript..."
npx tsc --noEmit
echo "2️⃣  Lint..."
npm run lint
echo "3️⃣  Tests..."
npm run test
echo "✅ INTEGRITY GATE PASSED"
