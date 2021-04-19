#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
GITHUB_REPOSITORY="technologiestiftung/next-iot-hub-api"
GITHUB_REF="latest"
PUSHIT=FALSE

print_usage() {
  printf "\n\nUsage:------------------------------\n"
  printf "Usage: %s -t yourtag -s stage\n" "${0}"
  printf "       If -t flag is not specified it will use '%s'\n" $GITHUB_REF
  printf "       If -p flag is not specified it will not push to the remote '%s'\n\n\n" $PUSHIT

}
while getopts 'pt:s:' flag; do
  case "${flag}" in
  t) GITHUB_REF="${OPTARG}" ;;
  *)
    print_usage
    exit 1
    ;;
  esac
done

# echo "${GITHUB_REPOSITORY}"
# echo "${GITHUB_REF}"
# echo "${SUFFIX}"
# echo "${STAGE}"

echo "Your image will be build with this repository/tag: '${GITHUB_REPOSITORY}:${GITHUB_REF}'"
if [[ $PUSHIT == TRUE ]]; then
  echo "Your image wil be pushed to the docker registry"
fi
read -p "Are you sure?(y/N) " -n 1 -r
echo # (optional) move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "abort!"
  print_usage
  exit 1
fi

docker build --tag "${GITHUB_REPOSITORY}:${GITHUB_REF}" .
if [[ $PUSHIT == TRUE ]]; then
  docker push "${GITHUB_REPOSITORY}-${SUFFIX}:${GITHUB_REF}"
fi
