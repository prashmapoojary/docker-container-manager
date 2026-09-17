#!/usr/bin/env bash
# ==============================================================================
# Portfolio Demo Reset Script
# Automatically cleans up visitor-created containers and restores sample containers.
#
# Recommended Cron Setup (runs every 3 hours):
# 0 */3 * * * /path/to/docker-container-manager/scripts/reset-demo.sh >> /var/log/demo-reset.log 2>&1
# ==============================================================================

set -euo pipefail

echo "========================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting portfolio demo reset..."
echo "========================================================"

# Core management containers that must NEVER be killed
CORE_CONTAINERS=("portainer-backend" "portainer-frontend" "cadvisor" "prometheus" "grafana")

# Safe demo containers to reset/respawn for portfolio visitors
DEMO_CONTAINERS=("demo-nginx" "demo-redis")

# 1. Stop and remove any non-core, non-demo containers created by visitors
echo ">>> Checking for visitor containers to clean up..."
ALL_CONTAINERS=$(docker ps -a --format '{{.Names}}')

for container in $ALL_CONTAINERS; do
    IS_CORE=false
    for core in "${CORE_CONTAINERS[@]}"; do
        if [[ "$container" == "$core" ]]; then
            IS_CORE=true
            break
        fi
    done

    IS_DEMO=false
    for demo in "${DEMO_CONTAINERS[@]}"; do
        if [[ "$container" == "$demo" ]]; then
            IS_DEMO=true
            break
        fi
    done

    # If it's not a core service and not a standard demo, remove it
    if [ "$IS_CORE" = false ] && [ "$IS_DEMO" = false ]; then
        echo "Removing visitor-created container: $container"
        docker rm -f "$container" || true
    fi
done

# 2. Reset standard demo containers so they are always in fresh running state
echo ">>> Resetting standard demo containers..."

# Demo Nginx
if docker ps -a --format '{{.Names}}' | grep -Eq '^demo-nginx$'; then
    echo "Restarting demo-nginx..."
    docker restart demo-nginx || (docker rm -f demo-nginx && docker run -d --name demo-nginx -p 8082:80 nginx:alpine)
else
    echo "Launching fresh demo-nginx..."
    docker run -d --name demo-nginx -p 8082:80 nginx:alpine
fi

# Demo Redis
if docker ps -a --format '{{.Names}}' | grep -Eq '^demo-redis$'; then
    echo "Restarting demo-redis..."
    docker restart demo-redis || (docker rm -f demo-redis && docker run -d --name demo-redis redis:alpine)
else
    echo "Launching fresh demo-redis..."
    docker run -d --name demo-redis redis:alpine
fi

# 3. Clean up dangling images to save VPS disk space
echo ">>> Cleaning up dangling images and stopped containers..."
docker container prune -f
docker image prune -af --filter "until=24h"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Reset complete! Demo state is fresh."
