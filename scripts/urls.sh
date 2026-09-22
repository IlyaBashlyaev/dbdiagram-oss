#!/bin/sh
set -eu

get_port() {
  docker compose port "$1" "$2" 2>/dev/null | awk -F: '{print $NF}'
}

frontend_port=$(get_port frontend 80)
backend_port=$(get_port backend 8000)

echo "- Frontend: http://localhost:${frontend_port:-<not running>}"
echo "- Backend: http://localhost:${backend_port:-<not running>}"
