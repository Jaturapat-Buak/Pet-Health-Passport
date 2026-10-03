# Pet Health Passport

Pet Health Passport is a full-stack web application for keeping a pet's health information in one organized, shareable place. Authentication and owner-managed pet profiles are implemented.

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

The PostgreSQL initialization scripts define `users`, `pets`, `vaccination_records`, `medical_records`, `allergy_records`, `medication_records`, `appointments`, `weight_records`, `documents`, and `reminders`.

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
```

Registration always creates an `owner` account. The `/me` endpoint requires a bearer token. Pet routes are restricted to owners and only return or change pets owned by the authenticated account. Deleting a pet also deletes its related records through database foreign keys.

## Run locally

1. Copy the root `.env.example` to `.env` and set a strong `JWT_SECRET` for Docker Compose.
2. Start PostgreSQL with `docker compose up -d postgres`.
3. Copy `backend/.env.example` to `backend/.env` and set the same database credentials and `JWT_SECRET`. In one terminal, run `npm ci` then `npm run dev` from `backend`.
4. In another terminal, run `npm ci` then `npm run dev` from `frontend`.
5. Open `http://localhost:5173`.

## Run with Docker

```sh
docker compose up --build
```

Copy `.env.example` to `.env` and replace `JWT_SECRET` with a long random value before starting. Open `http://localhost:5173`. Docker initializes the schema and seed data only when its PostgreSQL volume is first created.

On Windows, you can also double-click `open-project.bat` from the project folder. It creates missing env files, fixes an unsafe local `JWT_SECRET`, starts Docker Compose, and opens the app when it is ready.

## Jenkins CI/CD pipeline

`Jenkinsfile` has stages for checkout, dependency installation, backend tests, frontend build, Docker build, Docker Compose deployment, and an API health check. The Jenkins agent needs Docker and Docker Compose available.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@example.com` | `password123` |
| Vet | `vet@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |

## Demo data

The first database seed creates Milo, an orange domestic shorthair cat, with a rabies vaccination, a food allergy, a medical visit, a follow-up appointment, and a weight record.

## Project layout

```text
frontend/  React application
backend/   Express API
database/  PostgreSQL schema and demo seed data
```

## Next milestone

Add vaccination and medical records to each pet profile.
