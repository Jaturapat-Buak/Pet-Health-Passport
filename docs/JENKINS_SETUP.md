# Jenkins and GitHub Webhook Setup

Phase 7 uses the root `Jenkinsfile` and `docker-compose.yml`. The pipeline checks out `main`, installs dependencies, runs backend tests, builds the frontend and images, deploys with Compose, waits for healthy services, and checks the API from inside the backend container. It works on Windows and Unix agents.

## Jenkins prerequisites

- A Jenkins Pipeline job on an agent with Node.js 24, npm, Git, Docker CLI, Docker Compose v2, and access to the Docker daemon. The agent is the deployment host.
- Jenkins plugins: Pipeline, Git, GitHub, and Credentials Binding.
- Free host ports for the services (`5173`, `5000`, and `5432` by default). If another Compose stack already runs on that host, set `COMPOSE_PROJECT_NAME` in the secret env file to its existing project name to update it, or use different ports and a separate project name.
- A Jenkins URL reachable from GitHub over HTTPS for automatic webhook delivery. A local-only `localhost` URL cannot be used as the GitHub payload URL.

## Start local Jenkins with Docker

If Jenkins is not installed yet, start the project Jenkins container:

```powershell
.\open-jenkins.ps1
```

This starts Jenkins at `http://localhost:8080` with Node.js, npm, Docker CLI, Docker Compose, and the required Pipeline/Git/GitHub/Credentials Binding/Timestamper plugins. The compose file mounts the Docker socket so the pipeline can build images and run `docker compose` on the same Docker Desktop engine as the app.

Open `http://localhost:8080`, unlock Jenkins with the initial admin password printed by the script, and create an admin user. This setup is intended for local development and classroom/demo CI/CD. For production Jenkins, avoid running Jenkins as root and use a hardened agent with restricted Docker permissions.

## Configure the job

1. Push the repository and create a **Secret file** credential in Jenkins with ID `pet-health-passport-env`. Its contents should follow the root `.env.example`, with a unique `JWT_SECRET` of at least 32 bytes and a real PostgreSQL password. Keep the file in Jenkins Credentials, not in Git.
2. Create a regular **Pipeline** job. Under **Pipeline**, select **Pipeline script from SCM**, choose **Git**, set repository URL to `https://github.com/Jaturapat-Buak/Pet-Health-Passport.git`, branch specifier to `*/main`, and script path to `Jenkinsfile`. Add Git credentials if the repository is private.
3. Run **Build Now** once. This loads the Jenkinsfile and registers its `githubPush()` trigger. Check the pipeline stages and the output of `docker compose ps` in the Health Check stage.

The pipeline passes the Jenkins secret file to Compose using `--env-file`. If the PostgreSQL volume already exists, its database password must match the one used to initialize that volume. The `.env` file in a developer checkout is not used by Jenkins.

## Connect the webhook

1. Configure Jenkins' public base URL and GitHub plugin. Use the GitHub plugin's webhook URL, normally `<JENKINS_BASE_URL>/github-webhook/`.
2. In the repository's **Settings > Webhooks > Add webhook**, set that URL as **Payload URL**, choose `application/json`, select **Just the push event**, and keep the hook active. If a shared webhook secret is configured in Jenkins' GitHub plugin, enter the same secret in GitHub.
3. Check **Recent Deliveries** for the initial `ping` response. Push a commit to `main` and confirm that a new Jenkins build starts, passes Backend Test and Frontend Build, and ends with healthy Compose services.

The webhook is not active until a public Jenkins URL and job exist. GitHub does not accept `localhost` or `127.0.0.1` as webhook hosts.

References: [Jenkins GitHub plugin](https://plugins.jenkins.io/github/), [Jenkins Pipeline syntax](https://www.jenkins.io/doc/book/pipeline/syntax/), [GitHub webhook setup](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks), [GitHub webhook troubleshooting](https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/troubleshooting-webhooks).
