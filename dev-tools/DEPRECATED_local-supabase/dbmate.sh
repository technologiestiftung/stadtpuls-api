#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

function main() {

  docker run --rm -it --network=host ghcr.io/amacneil/dbmate:1.12.1
}

main "$@"
