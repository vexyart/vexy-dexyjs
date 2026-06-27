#!/usr/bin/env bash
# this_file: publish.sh
# Bump the git-tag version, sync it into package.json, build, and publish to npm.
# Version is derived from git tags by gitnextver; the latest tag (minus the "v"
# prefix) becomes the npm version, so build/publish must run after the bump.
set -euo pipefail
cd "$(dirname "$0")"

echo "== staging files for git =="
git add .

echo "== gitnextver (create next semver git tag) =="
uvx gitnextver

echo "== push to git repository =="
git push origin main --tags

echo "== sync package.json to git tag version =="
VERSION=$(git describe --tags --abbrev=0 | sed 's/^v//')
echo "version: $VERSION"
npm version "$VERSION" --no-git-tag-version --allow-same-version

echo "== npm build =="
npm run build

echo "== npm publish =="
npm publish --access public

echo "== publish complete =="
