#!/bin/sh
set -eu

if [ "$#" -ne 2 ] || [ ! -f "$1" ]; then
  echo 'Usage: deploy-kind.sh <Jenkins secret env file> <image tag>' >&2
  exit 1
fi

cluster_name=pet-health-passport
namespace=pet-health-passport
kubeconfig_file=$(mktemp)
trap 'rm -f "$kubeconfig_file"' EXIT

if ! kind get clusters | grep -Fxq "$cluster_name"; then
  echo 'The kind cluster is missing. Run open-kubernetes.ps1 on the laptop first.' >&2
  exit 1
fi

# Jenkins runs in Docker, so it needs the kind network and internal API address.
docker network connect kind "$(hostname)" 2>/dev/null || true
kind get kubeconfig --name "$cluster_name" --internal > "$kubeconfig_file"
export KUBECONFIG="$kubeconfig_file"

kind load docker-image --name "$cluster_name" \
  pet-health-passport-postgres:kind pet-health-passport-backend:kind pet-health-passport-frontend:kind \
  "pet-health-passport-backend:$2" "pet-health-passport-frontend:$2"

kubectl apply -f k8s/namespace.yaml
secret_yaml=$(kubectl -n "$namespace" create secret generic pet-health-passport-secrets \
  --from-env-file="$1" --dry-run=client -o yaml)
printf '%s\n' "$secret_yaml" | kubectl -n "$namespace" apply -f -

kubectl apply -k k8s
backend_yaml=$(kubectl set image -f k8s/backend-deployment.yaml \
  "backend=pet-health-passport-backend:$2" --local -o yaml)
frontend_yaml=$(kubectl set image -f k8s/frontend-deployment.yaml \
  "frontend=pet-health-passport-frontend:$2" --local -o yaml)
printf '%s\n' "$backend_yaml" | kubectl -n "$namespace" apply -f -
printf '%s\n' "$frontend_yaml" | kubectl -n "$namespace" apply -f -

for workload in statefulset/postgres deployment/backend deployment/frontend deployment/php-traefik; do
  kubectl -n "$namespace" rollout status "$workload" --timeout=240s
done

for attempt in $(seq 1 30); do
  if curl -fsS --max-time 5 http://host.docker.internal:8081/api/health | grep -q '"database":"connected"'; then
    echo 'Kubernetes API health check passed.'
    kubectl -n "$namespace" get pods
    exit 0
  fi
  sleep 2
done

echo 'Kubernetes API health check failed.' >&2
exit 1
