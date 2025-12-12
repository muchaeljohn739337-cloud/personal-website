#!/bin/bash
# Script to remove secrets from CREDENTIALS_CONFIGURED.md in git history

if [ -f "CREDENTIALS_CONFIGURED.md" ]; then
  sed -i.bak \
    -e "s/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/[REDACTED - stored in environment variables]/g" \
    -e "s/564a33d58a7f42a10c2855685faa9b2882aa0a3b9f9d689cca03defaf7b6e8d0/[REDACTED - stored in environment variables]/g" \
    -e "s/7af2d3b780aa8ecc442f4167338a04b08739b1b5/[REDACTED - stored in environment variables]/g" \
    -e "s/7zRuIE4avlyj780IJ9tGsRzw/[REDACTED - stored in environment variables]/g" \
    -e "s/f3b71344d3be11f0bc0e8e1527e99f8e/[REDACTED - stored in environment variables]/g" \
    CREDENTIALS_CONFIGURED.md
  git add CREDENTIALS_CONFIGURED.md
  rm -f CREDENTIALS_CONFIGURED.md.bak
fi
