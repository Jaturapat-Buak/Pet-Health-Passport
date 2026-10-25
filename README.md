# Pet Health Passport

Pet Health Passport is a full-stack web application for keeping a pet's health information in one organized place. Authentication, pet profiles with photo uploads, health records, appointments, reminders, and owner/vet/admin dashboards are implemented.

## Project overview

Pet owners manage their own pet profiles, vaccinations, medical history, allergies, medications, weight history, documents, and reminders. They can view appointments and veterinarian care status. Veterinarians manage care assignments and appointments for pets in their care. Admins manage users, roles, and system-wide pet data. The roles are `owner`, `vet`, and `admin`.

The interface uses TH Sarabun PSK, with English branding and page/section headings, Thai navigation, form labels, buttons, and messages, and Thai Buddhist Era date displays. Font files and their license are bundled under `frontend/public/fonts`.

## Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express, PostgreSQL driver, bcrypt, JSON Web Tokens
- Database: PostgreSQL 16
- DevOps: Docker Compose, Jenkins, and local Kubernetes (kind)

## System architecture

```text
React/Vite or Nginx frontend -> Express API -> PostgreSQL
```

In Docker, Nginx proxies `/api` requests to the backend service. The browser keeps the JWT in session storage and sends it as a bearer token. Signing out clears the browser token; tokens also expire after 12 hours.

## Database design

The PostgreSQL initialization scripts define `users`, `pets`, `pet_vet_access`, `vaccination_records`, `medical_records`, `allergy_records`, `medication_records`, `appointments`, `weight_records`, `documents`, and `reminders`.

## API endpoints

The API exposes:

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
GET /api/pet-photos/:id
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
GET /api/vet/available-pets
POST/DELETE /api/vet/pets/:id/access
GET /api/vet/pets/:id
GET /api/vet/pets/:id/:type
POST /api/vet/pets/:id/medical-records
GET /api/vet/documents/:id/file
GET/POST /api/admin/users
PUT/DELETE /api/admin/users/:id
```

Registration always creates an `owner` account. The `/me` endpoint requires a bearer token. Owners can only return or change their own pets; admins can manage all pets and choose an owner when creating or transferring a profile. Deleting a pet also deletes its related records through database foreign keys and removes its uploaded photo and document files.

Pet creation and updates accept JSON or multipart form data. The pet form uploads a JPG, PNG, or WebP `photo` up to 5 MB and previews it before saving. Updates preserve the current image when no new image is supplied; `remove_image=true` removes it. Uploaded photos require authentication and are visible only to the owner, an assigned veterinarian, or an admin. Docker stores photos in the persistent `uploads_data` volume.

Health record `:type` is one of `vaccinations`, `medical-records`, `allergies`, `medications`, or `weights`. The list and create routes also support `documents`; documents accept multipart form data with `title`, `document_type`, and a PDF, PNG, or JPEG `file` (up to 10 MB). Documents can be deleted at `/api/documents/:id`. Owners access their own documents and admins access all documents through the document endpoint; assigned vets use `/api/vet/documents/:id/file`. Docker stores uploaded files in the `uploads_data` volume.

Owners can view appointments for their own pets. Only veterinarians and admins can create, edit, cancel, complete, or delete appointments. Veterinarians are limited to pets currently in their care, while admins can manage all appointments. `/api/appointments?view=upcoming` returns accessible future appointments still marked upcoming. Appointment ownership always follows the pet owner.

The reminders page derives in-app alerts for appointments, vaccinations, medication end dates, and medical follow-ups within the next 30 days. Read state is stored in the existing `reminders` table; changing an event date creates a new unread reminder. The app does not send email or push notifications.

The owner dashboard shows account-scoped counts, upcoming care, unread reminders, recent health records, active medications, and a per-pet weight chart (latest 12 entries). Veterinarian access on the owner profile is a read-only status and list of assigned vets; owners cannot change care assignments through the UI or API.

The vet dashboard shows pets in the veterinarian's care. On `/vet/pets`, vets select pets from a directory searchable by pet name, owner name, or species, with 20 results per page. The directory exposes basic identification and care status; health records still require a care assignment. Vets can take a pet into care or choose take-care-and-schedule to open an appointment form with that pet selected. `/api/vet/available-pets` supports `search` and zero-based `page` parameters, plus an optional exact `ownerEmail` filter. Vets can end their own care assignment; this also revokes access to the pet's health records, documents, photos, and appointments. Admins can manage all assignments.

The admin dashboard shows system-wide counts, recent users and pets, and recent activity. Admins can manage all pet profiles, health records, documents, veterinarian access, and appointments through the resource screens. The Users screen (`/admin/users`) supports creating users, editing their name/email/phone/role, and deleting accounts and their associated pet data. An admin cannot delete or demote their own active account. Role changes are checked from the database on every API request; users can refresh the page to update the visible navigation. When an admin transfers a pet to another owner, appointments follow the new owner and previous veterinarian assignments and reminder read states are cleared. Veterinarians can view health records and documents and add medical visits; they cannot edit or delete existing health records.

The backend unit suite runs with `npm test`. The PostgreSQL role-policy integration test additionally runs when `ROLE_POLICY_DB` names a dedicated, initialized test database prefixed with `codex_role_test_`; it uses the host and credentials from `DATABASE_URL`. Do not point this test at a database containing real data.

## Run locally

1. Copy the root `.env.example` to `.env` and set a unique random `JWT_SECRET` of at least 32 bytes for Docker Compose. Do not keep the example secret.
2. Start PostgreSQL with `docker compose up -d postgres`.
3. Copy `backend/.env.example` to `backend/.env` and set the same database credentials and `JWT_SECRET`. In one terminal, run `npm ci` then `npm run dev` from `backend`.
4. In another terminal, run `npm ci` then `npm run dev` from `frontend`.
5. Open `http://localhost:5173`.

## Run with Docker

```sh
docker compose up --build -d --wait --wait-timeout 120
```

Copy `.env.example` to `.env` and replace `JWT_SECRET` with a unique random value of at least 32 bytes before starting. The backend rejects the example secret or a shorter value in production. Compose waits until PostgreSQL, the API, and the frontend proxy are healthy. Open `http://localhost:5173`. Docker initializes the schema and seed data only when its PostgreSQL volume is first created.

The backend creates the `pet_vet_access` table and adds medical-record author tracking at startup for existing PostgreSQL volumes. No volume reset is needed for this update.

On Windows, you can also double-click `open-project.bat` from the project folder. It creates missing env files, fixes an unsafe local `JWT_SECRET`, starts Docker Compose, and opens the app when it is ready.

## Jenkins CI/CD pipeline

`Jenkinsfile` has stages for checkout, dependency installation, backend tests, frontend build, Docker build, Docker Compose deployment, and an API health check. It supports Windows and Unix agents, reads Compose settings from a Jenkins Secret file credential, and waits for healthy services before finishing. The `githubPush()` trigger is ready; a public Jenkins URL and job are required to activate the GitHub webhook. See [Jenkins setup](docs/JENKINS_SETUP.md) for the job, credential, and webhook steps.

To run Jenkins locally with Docker:

```powershell
.\open-jenkins.ps1
```

This starts Jenkins at `http://localhost:8080` with Node.js, npm, Docker CLI, Docker Compose, and the required Jenkins plugins. Use the printed initial admin password, create the `pet-health-passport-env` Secret file credential from your local `.env`, then create the Pipeline job from this repository.

## Run with Kubernetes

On Windows with Docker Desktop and `kubectl`, run `./open-kubernetes.ps1` from PowerShell. It installs a checksum-verified local `kind` binary when needed, builds and loads the app images, creates a cluster, deploys PostgreSQL, the API, frontend, and Traefik, then checks the public API. Open `http://localhost:8081`. The cluster uses separate persistent volumes from Docker Compose; existing Compose database and uploads are **not** migrated automatically. See [Kubernetes setup](docs/KUBERNETES_SETUP.md) for prerequisites, Jenkins deployment, checks, and cleanup.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@example.com` | `password123` |
| Vet | `vet@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |

## Demo data

The first database seed creates Milo, an orange domestic shorthair cat, with a rabies vaccination, a food allergy, a medical visit, a follow-up appointment, and a weight record. It also assigns Milo to the demo vet account. Care dates are relative to the day the database is initialized, so a fresh demo has an upcoming appointment and reminder. Existing PostgreSQL volumes are not reseeded automatically.

## Project layout

```text
frontend/  React application
backend/   Express API
database/  PostgreSQL schema and demo seed data
```

## Final preparation

The latest local update was verified on 23 October 2026 with the backend unit suite, PostgreSQL role-policy integration tests, a frontend production build, and browser checks for the updated interface and veterinarian appointment flow.

The owner-to-admin demo flow was verified on 5 October 2026. See the [study and presentation guide](docs/PROJECT_STUDY_AND_PRESENTATION.md), [final report](docs/FINAL_REPORT.md), [live demo and video guide](docs/DEMO_GUIDE.md), and [presentation slides](docs/Pet-Health-Passport-Presentation.pptx). The local Jenkins build #1 passed. The demo video still needs to be recorded; the Phase 7 GitHub webhook still needs a public Jenkins URL to activate.
