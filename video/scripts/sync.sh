#!/bin/sh
# Copy the site into Remotion's public/site/ so the <iframe> loads it same-origin.
# SITE_DIR: folder holding the site's entry page and assets (default: the parent project root).
# For a built app, point it at the build output, e.g.  SITE_DIR=../dist npm run sync
set -e
cd "$(dirname "$0")/.."
SITE_DIR="${SITE_DIR:-..}"
case "$SITE_DIR" in /*) ;; *) SITE_DIR="$(cd "$SITE_DIR" && pwd)" ;; esac
rm -rf public/site
mkdir -p public/site
# copy everything except this video project, VCS data, dependencies and rendered videos
find "$SITE_DIR" -mindepth 1 -maxdepth 1 \
  ! -name video ! -name '.*' ! -name node_modules ! -name '*.mp4' \
  -exec cp -R {} public/site/ \;
echo "synced $SITE_DIR -> public/site/"
