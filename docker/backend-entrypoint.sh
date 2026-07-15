#!/bin/sh

set -eu

echo "Synchronizacja schematu bazy danych..."
node node_modules/prisma/build/index.js db push \
  --schema=libs/prisma-schema/prisma/schema.prisma \
  --skip-generate

echo "Uruchamianie backendu..."
exec node apps/backend/dist/main.js
