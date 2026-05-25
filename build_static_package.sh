#!/bin/bash

set -e
set -x

# This script builds a static package for hosting pxt-ev3 editor.
# The URL path can be given as argument if not at root of site.
URL=$(echo $1 | sed 's|/+$||' | sed '/^\//! s|^|/|')

PXT=$(which pxt || echo node_modules/pxt/pxt)
if ! [ -e $PXT ]
then npm install pxt
fi

# Run pxt site generator
$PXT staticpkg --locs-src translations --route "$URL"
OUTDIR=built/packaged$URL

# Copy static document files
mkdir -p $OUTDIR/docs/static
cp -R docs/static/. $OUTDIR/docs/static/

# Patch cdnUrl
find "$OUTDIR" -type f \( -name '*.html' -o -name '*.json' -o -name '*.webmanifest' \) -print0 | while IFS= read -r -d '' f
do
    sed -i 's#@cdnUrl@/blob/[a-z0-9]*/#$URL/docs/#g' "$f" || true
    sed -i 's#@cdnUrl@#$URL#g' "$f" || true
done

# Add custom .js and .css overrides
cp -R static-files/* built/packaged/pxt-ev3/beta/
for file in $OUTDIR/*.html
do sed -i '/<\/head>/e cat static-files/ev3-community.html' $file
done


