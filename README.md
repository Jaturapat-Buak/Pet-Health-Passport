# Pet Health Passport

Pet Health Passport is a full-stack web application for keeping a pet's health information in one organized place. Authentication, pet profiles, health records, appointments, reminders, and owner/admin dashboards are implemented.

## Project overview

Pet owners will manage pet profiles, vaccinations, medical history, allergies, medications, appointments, weight history, documents, and reminders. The planned roles are `owner`, `vet`, and `admin`.

## Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express, PostgreSQL driver, bcrypt, JSON Web Tokens
- Database: PostgreSQL 16
- DevOps: Docker Compose and Jenkins

## System architecture

```text
React/Vite or Nginx frontend -> Express API -> PostgreSQL
```

In Docker, Nginx proxies `/api` requests to the backend service. The browser keeps the JWT in session storage and sends it as a bearer token. Signing out clears the browser token; tokens also expire after 12 hours.

## Database design

The PostgreSQL initialization scripts define `users`, `pets`, `pet_vet_access`, `vaccination_records`, `medical_records`, `allergy_records`, `medication_records`, `appointments`, `weight_records`, `documents`, and `reminders`.

## API endpoints

The initial API exposes:

```text
GET /api/health
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
GET /api/pets
POST /api/pets
GET /api/pets/:id
PUT /api/pets/:id
DELETE /api/pets/:id
GET/POST /api/pets/:petId/:type
GET/PUT/DELETE /api/:type/:id
GET /api/documents/:id/file
GET/POST /api/appointments
GET/PUT/DELETE /api/appointments/:id
PATCH /api/appointments/:id/status
GET /api/reminders
PATCH /api/reminders/:id/read
GET /api/dashboard/owner
GET /api/dashboard/admin
GET/POST /api/pets/:id/vets
DELETE /api/pets/:id/vets/:vetId
GET /api/vet/pets
GET /api/vet/pets/:id
GET /api/vet/pets/:id/:type
POST /api/vet/pets/:id/medical-records
GET /api/vet/documents/:id/file
```

Registration always creates an `owner` account. The `/me` endpoint requires a bearer token. Pet routes are restricted to owners and only return or change pets owned by the authenticated account. Deleting a pet also deletes its related records through database foreign keys.

Health record `:type` is one of `vaccinations`, `medical-records`, `allergies`, `medications`, or `weights`. The list and create routes also support `documents`; documents accept multipart form data with `title`, `document_type`, and a PDF, PNG, or JPEG `file` (up to 10 MB). Documents can be deleted at `/api/documents/:id`. Document downloads require an owner token. Docker stores uploaded files in the `uploads_data` volume.

Owners can create, edit, cancel, complete, and delete appointments for their own pets. `/api/appointments?view=upcoming` returns future appointments still marked upcoming. The reminders page derives in-app alerts for appointments, vaccinations, medication end dates, and medical follow-ups within the next 30 days. Read state is stored in the existing `reminders` table; changing an event date creates a new unread reminder. The app does not send email or push notifications.

The owner dashboard shows account-scoped counts, upcoming care, unread reminders, recent health records, active medications, and a per-pet weight chart (latest 12 entries). The admin dashboard shows system-wide counts, recent users and pets, and recent pet activity. Owners can share an individual pet with an existing vet account by email and revoke access at any time. Vets can view shared profiles, health records, and documents, and add medical visits. Vet access never permits editing or deleting existing records. The API checks access for every request.

## Run locally

1. Copy the root `.env.example` to `.env` and set a strong `JWT_SECRET` for Docker Compose.
2. Start PostgreSQL with `docker compose up -d postgres`.
3. Copy `backend/.env.example` to `backend/.env` and set the same database credentials and `JWT_SECRET`. In one terminal, run `npm ci` then `npm run dev` from `backend`.
4. In another terminal, run `npm ci` then `npm run dev` from `frontend`.
5. Open `http://localhost:5173`.

## Run with Docker

```sh
docker compose up --build -d --wait --wait-timeout 120
```

Copy `.env.example` to `.env` and replace `JWT_SECRET` with a long random value before starting. Compose waits until PostgreSQL, the API, and the frontend proxy are healthy. Open `http://localhost:5173`. Docker initializes the schema and seed data only when its PostgreSQL volume is first created.

The backend creates the `pet_vet_access` table and adds medical-record author tracking at startup for existing PostgreSQL volumes. No volume reset is needed for this update.

On Windows, you can also double-click `open-project.bat` from the project folder. It creates missing env files, fixes an unsafe local `JWT_SECRET`, starts Docker Compose, and opens the app when it is ready.

## Jenkins CI/CD pipeline

`Jenkinsfile` has stages for checkout, dependency installation, backend tests, frontend build, Docker build, Docker Compose deployment, and an API health check. It supports Windows and Unix agents, reads Compose settings from a Jenkins Secret file credential, and waits for healthy services before finishing. The `githubPush()` trigger is ready; a public Jenkins URL and job are required to activate the GitHub webhook. See [Jenkins setup](docs/JENKINS_SETUP.md) for the job, credential, and webhook steps.

To run Jenkins locally with Docker:

```powershell
.\open-jenkins.ps1
```

This starts Jenkins at `http://localhost:8080` with Node.js, npm, Docker CLI, Docker Compose, and the required Jenkins plugins. Use the printed initial admin password, create the `pet-health-passport-env` Secret file credential from your local `.env`, then create the Pipeline job from this repository.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@example.com` | `password123` |
| Vet | `vet@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |

## Demo data

The first database seed creates Milo, an orange domestic shorthair cat, with a rabies vaccination, a food allergy, a medical visit, a follow-up appointment, and a weight record. It also shares Milo with the demo vet account. Care dates are relative to the day the database is initialized, so a fresh demo has an upcoming appointment and reminder. Existing PostgreSQL volumes are not reseeded automatically.

## Project layout

```text
frontend/  React application
backend/   Express API
database/  PostgreSQL schema and demo seed data
```

## Final preparation

The owner-to-admin demo flow was verified on 5 October 2026. See the [final report](docs/FINAL_REPORT.md), [live demo and video guide](docs/DEMO_GUIDE.md), and [presentation slides](docs/Pet-Health-Passport-Presentation.pptx). The local Jenkins build #1 passed. The demo video still needs to be recorded; the Phase 7 GitHub webhook still needs a public Jenkins URL to activate.
