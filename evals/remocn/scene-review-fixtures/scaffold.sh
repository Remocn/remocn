#!/usr/bin/env bash
# Puts the prepared stills and storyboard into the run's workspace.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p review
cp "$here"/resources/* review/
