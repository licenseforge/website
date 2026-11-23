#!/bin/sh
# Copies what the site serves into _site/ (Cloudflare Pages build command;
# README → Hosting). Everything else in the repository stays unpublished.
set -eu
cd "$(dirname "$0")/.."
rm -rf _site
mkdir _site
cp -R index.html 404.html _headers _redirects assets licenseforge _site/
