# Local Kubernetes with kind

This optional deployment runs beside Docker Compose on the same laptop. It uses a single-node kind cluster, Traefik Ingress, PostgreSQL, the Express API, and the React frontend. The application is available at `http://localhost:8081`; Jenkins remains at `http://localhost:8080` and the Compose frontend at `http://localhost:5173`.

## First deployment

1. Install and start Docker Desktop. Install `kubectl` (Docker Desktop can provide it). Leave Docker Desktop's built-in Kubernetes disabled; kind creates its own cluster.
2. Create the root `.env` from `.env.example` if needed. Set a strong `JWT_SECRET` and PostgreSQL password. Do not commit the file.
3. In PowerShell at the repository root, run `./open-kubernetes.ps1`. The script downloads a checksum-verified kind binary into ignored `.tools/` if kind is not installed, creates the cluster, builds images, and deploys all workloads. First creation can take several minutes.
4. Open `http://localhost:8081`. The script checks `http://localhost:8081/api/health` before reporting success.

The script selects `kind-pet-health-passport` explicitly for its commands. Creating a new cluster may also make it the current `kubectl` context; use `kubectl config use-context <previous-context>` to switch back. Configuration lives in `k8s/`. The base `kustomization.yaml` excludes backend/frontend Deployments because the scripts apply them with unique image tags. PostgreSQL and uploads (documents and pet photos) use PVCs in the kind node. They are separate from the Compose volumes. Back up and migrate data deliberately if you need to bring existing users or files across.

## Inspect and operate

```powershell
kubectl --context kind-pet-health-passport -n pet-health-passport get pods,svc,ingress,pvc
kubectl --context kind-pet-health-passport -n pet-health-passport logs deployment/backend --tail=100
kubectl --context kind-pet-health-passport -n pet-health-passport rollout status deployment/backend
kubectl --context kind-pet-health-passport -n pet-health-passport rollout history deployment/backend
kubectl --context kind-pet-health-passport -n pet-health-passport rollout undo deployment/backend
kubectl --context kind-pet-health-passport -n pet-health-passport rollout restart deployment/backend
kubectl --context kind-pet-health-passport -n pet-health-passport scale deployment/frontend --replicas=2
kubectl --context kind-pet-health-passport -n pet-health-passport scale deployment/frontend --replicas=1
```

Run `./open-kubernetes.ps1` again to rebuild and roll out a new backend/frontend image tag. If Docker Desktop is running but the existing kind node stopped, the script restarts that node and waits for its API before deployment; it does not recreate the cluster. The PostgreSQL image is rebuilt too, but its data remains on its PVC. Backend and frontend use one replica by default. The backend's local `uploads` PVC holds private documents and pet photos; do not scale the backend above one replica without replacing it with shared storage. A kind cluster is for local development, not production availability.

## Jenkins deployment

1. Start this cluster once with `./open-kubernetes.ps1` on the laptop that hosts Jenkins and Docker Desktop.
2. Rebuild the project Jenkins container with `./open-jenkins.ps1` so it has `kind` and `kubectl`.
3. Ensure the Jenkins Pipeline job uses the current committed `Jenkinsfile` from SCM and has the `pet-health-passport-env` Secret file credential. Run **Build with Parameters** and choose `DEPLOY_TARGET=kind`.

The pipeline tests and builds first, then loads tagged images into the existing kind cluster and waits for all rollouts and the public health check. The default `compose` target remains unchanged. Jenkins reads the credential file, not the developer checkout's `.env`. The Jenkins container joins the kind Docker network for API access. This setup assumes the bundled local Jenkins container; a remote Jenkins agent needs its own Docker/kind/kubectl access and networking.

## Cleanup

`./.tools/kind.exe delete cluster --name pet-health-passport` (or `kind delete cluster --name pet-health-passport` if kind is on PATH) permanently removes this local cluster and its Kubernetes database and upload volumes. Back up data first. It does not remove Docker Compose volumes. The downloaded `.tools/` binary may be removed separately if no longer needed.
