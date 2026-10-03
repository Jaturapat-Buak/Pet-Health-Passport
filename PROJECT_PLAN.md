# Pet Health Passport

## 1. Project Overview

**Project Name:** Pet Health Passport\
**Theme:** PetTech / DevTools Mini Project\
**Project Type:** Full-stack Web Application

Pet Health Passport is a digital health record management system for pets. The system allows pet owners to store and manage important health information for each pet, including vaccination records, medical history, allergies, medications, appointments, body weight records, and health documents.

The goal of this project is to help pet owners organize their pet's health information in one place and make it easier to track future health-related activities such as vaccination schedules, veterinary appointments, and medical follow-ups.

---

## 2. Problem Statement

Many pet owners keep their pet's health information in scattered places such as paper documents, chat messages, clinic receipts, photo galleries, or memory. This can cause problems when they need to visit a new veterinary clinic, check vaccination history, remember medication details, or track the pet's health condition over time.

Pet Health Passport solves this problem by providing a centralized digital platform where pet owners can manage each pet's health profile and important medical records in an organized way.

---

## 3. Objectives

The main objectives of this project are:

1. To create a digital health passport for pets.
2. To allow pet owners to manage multiple pet profiles.
3. To record vaccination history and upcoming vaccination dates.
4. To store medical records, allergies, medications, and documents.
5. To provide appointment and reminder features.
6. To create an admin dashboard for basic system management.
7. To demonstrate DevTools practices such as GitHub, Docker, Docker Compose, and Jenkins CI/CD pipeline.

---

## 4. Target Users

### 4.1 Pet Owner

Pet owners can register, log in, create pet profiles, and manage their pets' health records.

### 4.2 Veterinarian / Clinic Staff

Veterinarian or clinic staff can view pet health information shared by the owner and add medical records or appointment notes.

### 4.3 Admin

Admin can manage users, view system statistics, and monitor records in the system.

---

## 5. User Roles

| Role               | Description                                                                       |
| ------------------ | --------------------------------------------------------------------------------- |
| Guest              | Can view landing page and register/login                                          |
| Pet Owner          | Can manage pets, health records, vaccination records, appointments, and documents |
| Vet / Clinic Staff | Can view shared pet profiles and add medical notes                                |
| Admin              | Can manage users, view dashboard, and monitor system data                         |

---

## 6. Core Features

### 6.1 Authentication

- Register
- Login
- Logout
- JWT authentication
- Role-based access control

### 6.2 Pet Profile Management

Pet owners can create and manage pet profiles.

Each pet profile contains:

- Pet name
- Species
- Breed
- Gender
- Birth date
- Color
- Weight
- Microchip ID
- Medical notes
- Profile image

### 6.3 Vaccination Records

Users can add vaccination records for each pet.

Each vaccination record contains:

- Vaccine name
- Date received
- Next due date
- Clinic name
- Veterinarian name
- Notes
- Certificate image or document

### 6.4 Medical History

Users can record medical visits or treatment history.

Each medical record contains:

- Visit date
- Clinic name
- Veterinarian name
- Symptoms
- Diagnosis
- Treatment
- Medication
- Follow-up date
- Notes

### 6.5 Allergy Records

Users can record allergies for each pet.

Examples:

- Food allergy
- Drug allergy
- Environmental allergy
- Other allergy

Each allergy record contains:

- Allergy type
- Allergen name
- Reaction
- Severity
- Notes

### 6.6 Medication Records

Users can record medication information.

Each medication record contains:

- Medication name
- Dosage
- Frequency
- Start date
- End date
- Instruction
- Prescribed by
- Status

### 6.7 Appointment Management

Users can create upcoming appointments.

Each appointment contains:

- Pet
- Appointment date and time
- Clinic name
- Purpose
- Status
- Notes

Appointment statuses:

- Upcoming
- Completed
- Cancelled

### 6.8 Weight Tracking

Users can record pet weight over time.

Each weight record contains:

- Pet
- Weight
- Record date
- Notes

The system should display a simple weight history chart.

### 6.9 Health Documents

Users can upload important documents, such as:

- Vaccination certificate
- Medical certificate
- Lab result
- Prescription
- Insurance document
- Other files

### 6.10 Reminder System

The system should show reminders for:

- Upcoming vaccination
- Upcoming appointment
- Medication end date
- Follow-up visit

### 6.11 Pet Health Dashboard

The dashboard should show:

- Total number of pets
- Upcoming appointments
- Upcoming vaccinations
- Recent medical records
- Recent weight updates
- Health alert summary

### 6.12 Admin Dashboard

Admin can view:

- Total users
- Total pets
- Total vaccination records
- Total appointments
- Recent users
- Recent pet records

---

## 7. Optional Features

These features can be added if the core system is completed early.

### 7.1 Shareable Pet Passport

Pet owners can generate a shareable link or QR code for a pet profile.

The shared profile should show only selected information, such as:

- Pet name
- Species
- Breed
- Vaccination status
- Allergy warning
- Emergency contact

### 7.2 QR Code Health Passport

The system can generate a QR code for each pet. When scanned, it opens the pet's public health passport page.

### 7.3 Health Status Badge

The system can show simple badges such as:

- Vaccination up to date
- Vaccination due soon
- Has allergy warning
- Follow-up required

### 7.4 Search and Filter

Users can search or filter records by:

- Pet name
- Vaccine name
- Clinic name
- Record type
- Date range

---

## 8. Main User Flow

### 8.1 Pet Owner Flow

```text
Register / Login
↓
Create pet profile
↓
Add vaccination record
↓
Add medical history
↓
Add allergy or medication information
↓
Create appointment
↓
View dashboard and reminders
↓
Update records after clinic visit
```

### 8.2 Veterinarian / Clinic Staff Flow

```text
Login
↓
View shared pet profile
↓
Check vaccination and allergy information
↓
Add medical visit record
↓
Add follow-up appointment
```

### 8.3 Admin Flow

```text
Login as admin
↓
View dashboard
↓
Manage users
↓
Monitor system data
```

---

## 9. Demo Scenario

This is the recommended demo flow for presentation.

```text
1. Login as pet owner
2. Create a pet profile named "Milo"
3. Add Milo's vaccination record
4. Add allergy information
5. Create a veterinary appointment
6. Show dashboard reminder for upcoming appointment
7. Add medical visit record after appointment
8. Show Milo's complete health passport
9. Generate shareable health passport / QR code
10. Login as admin and show dashboard statistics
```

---

## 10. Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Chart.js or Recharts
- Tailwind CSS or Bootstrap

### Backend

- Node.js
- Express.js
- REST API
- JWT Authentication
- Bcrypt
- Multer for file upload

### Database

- PostgreSQL

### DevTools

- Git
- GitHub
- Docker
- Docker Compose
- Jenkins

### CI/CD

- Jenkins only

---

## 11. Recommended Project Structure

```text
pet-health-passport/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── owner/
│   │   │   ├── vet/
│   │   │   └── admin/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── uploads/
│   ├── package.json
│   └── Dockerfile
│
├── database/
│   ├── init.sql
│   └── seed.sql
│
├── docker-compose.yml
├── Jenkinsfile
├── README.md
├── PROJECT_PLAN.md
└── .env.example
```

---

## 12. Database Design

### 12.1 users

Stores user account information.

```text
id
name
email
password_hash
role
phone
created_at
updated_at
```

Roles:

```text
owner
vet
admin
```

---

### 12.2 pets

Stores pet profile information.

```text
id
owner_id
name
species
breed
gender
birth_date
color
weight
microchip_id
medical_notes
image_url
created_at
updated_at
```

---

### 12.3 vaccination_records

Stores vaccination history.

```text
id
pet_id
vaccine_name
date_received
next_due_date
clinic_name
vet_name
notes
document_url
created_at
updated_at
```

---

### 12.4 medical_records

Stores medical visit history.

```text
id
pet_id
visit_date
clinic_name
vet_name
symptoms
diagnosis
treatment
medication
follow_up_date
notes
created_at
updated_at
```

---

### 12.5 allergy_records

Stores allergy information.

```text
id
pet_id
allergy_type
allergen_name
reaction
severity
notes
created_at
updated_at
```

Severity examples:

```text
low
medium
high
critical
```

---

### 12.6 medication_records

Stores medication information.

```text
id
pet_id
medication_name
dosage
frequency
start_date
end_date
instruction
prescribed_by
status
created_at
updated_at
```

Status examples:

```text
active
completed
cancelled
```

---

### 12.7 appointments

Stores appointment information.

```text
id
pet_id
owner_id
appointment_date
clinic_name
purpose
status
notes
created_at
updated_at
```

Status examples:

```text
upcoming
completed
cancelled
```

---

### 12.8 weight_records

Stores pet weight history.

```text
id
pet_id
weight
record_date
notes
created_at
```

---

### 12.9 documents

Stores uploaded health documents.

```text
id
pet_id
document_type
title
file_url
uploaded_by
created_at
```

Document type examples:

```text
vaccination_certificate
medical_certificate
lab_result
prescription
insurance
other
```

---

### 12.10 reminders

Stores system reminder records.

```text
id
user_id
pet_id
title
message
reminder_date
type
is_read
created_at
```

Reminder type examples:

```text
vaccination
appointment
medication
follow_up
```

---

## 13. API Endpoints

### 13.1 Auth API

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

---

### 13.2 Pet API

```text
GET    /api/pets
POST   /api/pets
GET    /api/pets/:id
PUT    /api/pets/:id
DELETE /api/pets/:id
```

---

### 13.3 Vaccination API

```text
GET    /api/pets/:petId/vaccinations
POST   /api/pets/:petId/vaccinations
GET    /api/vaccinations/:id
PUT    /api/vaccinations/:id
DELETE /api/vaccinations/:id
```

---

### 13.4 Medical Record API

```text
GET    /api/pets/:petId/medical-records
POST   /api/pets/:petId/medical-records
GET    /api/medical-records/:id
PUT    /api/medical-records/:id
DELETE /api/medical-records/:id
```

---

### 13.5 Allergy API

```text
GET    /api/pets/:petId/allergies
POST   /api/pets/:petId/allergies
PUT    /api/allergies/:id
DELETE /api/allergies/:id
```

---

### 13.6 Medication API

```text
GET    /api/pets/:petId/medications
POST   /api/pets/:petId/medications
PUT    /api/medications/:id
DELETE /api/medications/:id
```

---

### 13.7 Appointment API

```text
GET    /api/appointments
POST   /api/appointments
GET    /api/appointments/:id
PUT    /api/appointments/:id
PATCH  /api/appointments/:id/status
DELETE /api/appointments/:id
```

---

### 13.8 Weight API

```text
GET    /api/pets/:petId/weights
POST   /api/pets/:petId/weights
DELETE /api/weights/:id
```

---

### 13.9 Document API

```text
GET    /api/pets/:petId/documents
POST   /api/pets/:petId/documents
DELETE /api/documents/:id
```

---

### 13.10 Dashboard API

```text
GET /api/dashboard/owner
GET /api/dashboard/admin
```

---

### 13.11 Reminder API

```text
GET   /api/reminders
PATCH /api/reminders/:id/read
```

---

## 14. Frontend Pages

### 14.1 Public Pages

```text
/
/login
/register
```

### 14.2 Owner Pages

```text
/dashboard
/pets
/pets/new
/pets/:id
/pets/:id/edit
/pets/:id/vaccinations
/pets/:id/medical-records
/pets/:id/allergies
/pets/:id/medications
/pets/:id/weights
/pets/:id/documents
/appointments
/appointments/new
/reminders
```

### 14.3 Vet Pages

```text
/vet/dashboard
/vet/shared-passport/:shareId
/vet/medical-records/new
```

### 14.4 Admin Pages

```text
/admin/dashboard
/admin/users
/admin/pets
/admin/records
```

---

## 15. UI Components

Recommended reusable components:

```text
Navbar
Sidebar
ProtectedRoute
RoleRoute
PetCard
PetForm
VaccinationTable
MedicalRecordTimeline
AllergyAlertCard
MedicationCard
AppointmentCalendar
ReminderCard
WeightChart
DocumentUpload
DashboardStatCard
ConfirmModal
LoadingSpinner
```

---

## 16. Reminder Logic

The system should automatically create reminders from important dates.

### 16.1 Vaccination Reminder

If a vaccination record has `next_due_date`, create a reminder before the due date.

Example:

```text
Vaccine: Rabies
Next due date: 2026-12-20
Reminder: Rabies vaccine for Milo is due soon.
```

### 16.2 Appointment Reminder

If an appointment is created, show it in the upcoming appointment list.

Example:

```text
Appointment: Health checkup
Date: 2026-11-05
Reminder: Milo has a health checkup appointment soon.
```

### 16.3 Medication Reminder

If medication has an end date, show reminder near the end date.

Example:

```text
Medication: Antibiotic
End date: 2026-10-15
Reminder: Milo's antibiotic schedule is ending soon.
```

---

## 17. Health Status Logic

The system can show simple health status badges.

### Badge Examples

```text
Vaccination Up to Date
Vaccination Due Soon
Allergy Warning
Medication Active
Follow-up Required
```

### Suggested Rule

```text
If next_due_date is within 30 days:
    Show "Vaccination Due Soon"

If pet has high or critical allergy:
    Show "Allergy Warning"

If medication status is active:
    Show "Medication Active"

If medical record has follow_up_date:
    Show "Follow-up Required"
```

---

## 18. Docker Requirements

The project should support Docker Compose.

Required services:

```text
frontend
backend
postgres
```

Optional services:

```text
pgadmin
jenkins
```

Example services:

```text
frontend: React + Vite
backend: Express API
postgres: PostgreSQL database
jenkins: CI/CD automation server
```

---

## 19. Jenkins CI/CD Plan

This project uses **Jenkins** as the required CI/CD tool.

### 19.1 Jenkins Pipeline Goals

The Jenkins pipeline should automate the process of checking, building, and preparing the application for deployment.

Recommended pipeline steps:

```text
1. Checkout source code from GitHub
2. Install backend dependencies
3. Install frontend dependencies
4. Run backend tests
5. Build frontend
6. Build Docker images
7. Run Docker Compose
8. Verify that services are running
```

### 19.2 Jenkins Workflow

```text
Developer
↓
Push code to GitHub
↓
GitHub Webhook triggers Jenkins
↓
Jenkins runs pipeline
↓
Install dependencies
↓
Run tests
↓
Build frontend
↓
Build Docker images
↓
Deploy using Docker Compose
↓
Pet Health Passport is running
```

### 19.3 Jenkinsfile Requirements

The repository must include a `Jenkinsfile` at the root of the project.

The Jenkinsfile should include these stages:

```text
Checkout
Install Backend Dependencies
Install Frontend Dependencies
Backend Test
Frontend Build
Docker Build
Docker Compose Deploy
Health Check
```

---

## 20. README Requirements

The README file should include:

```text
# Pet Health Passport

## Project Overview
## Problem Statement
## Features
## Tech Stack
## System Architecture
## Database Design
## API Endpoints
## How to Run Locally
## How to Run with Docker
## Jenkins CI/CD Pipeline
## Demo Accounts
## Demo Flow
## Screenshots
## Team Members
```

---

## 21. Demo Accounts

Create seed users for testing.

### Owner Account

```text
Email: owner@example.com
Password: password123
Role: owner
```

### Vet Account

```text
Email: vet@example.com
Password: password123
Role: vet
```

### Admin Account

```text
Email: admin@example.com
Password: password123
Role: admin
```

---

## 22. Seed Data

Recommended seed data:

### Pet

```text
Name: Milo
Species: Cat
Breed: Domestic Shorthair
Gender: Male
Color: Orange
Weight: 4.5 kg
```

### Vaccination

```text
Vaccine Name: Rabies Vaccine
Date Received: 2026-01-15
Next Due Date: 2027-01-15
Clinic Name: Happy Pet Clinic
```

### Allergy

```text
Allergy Type: Food
Allergen Name: Chicken
Reaction: Vomiting and skin irritation
Severity: Medium
```

### Medical Record

```text
Visit Date: 2026-09-20
Symptoms: Loss of appetite
Diagnosis: Mild stomach irritation
Treatment: Medication and diet control
Follow-up Date: 2026-10-05
```

### Appointment

```text
Appointment Date: 2026-10-10
Clinic Name: Happy Pet Clinic
Purpose: Follow-up checkup
Status: Upcoming
```

---

## 23. Development Plan

### Phase 1: Project Setup

```text
- Create project structure
- Set up frontend with React + Vite
- Set up backend with Express
- Set up PostgreSQL database
- Create Docker Compose
- Create README
```

### Phase 2: Authentication

```text
- Register
- Login
- JWT middleware
- Role middleware
- Protected routes
```

### Phase 3: Pet Profile

```text
- Create pet
- View pet list
- View pet detail
- Edit pet
- Delete pet
```

### Phase 4: Health Records

```text
- Vaccination records
- Medical records
- Allergy records
- Medication records
- Weight records
- Health documents
```

### Phase 5: Appointment and Reminder

```text
- Create appointment
- View appointment list
- Update appointment status
- Generate reminders from dates
- Mark reminder as read
```

### Phase 6: Dashboard

```text
- Owner dashboard
- Admin dashboard
- Recent records
- Upcoming reminders
- Weight chart
```

### Phase 7: DevTools and Jenkins

```text
- Dockerfile for frontend
- Dockerfile for backend
- docker-compose.yml
- Jenkinsfile
- Jenkins pipeline stages
- GitHub webhook for Jenkins trigger
```

### Phase 8: Final Preparation

```text
- Add seed data
- Test demo flow
- Fix UI
- Prepare report
- Prepare slides
- Record demo video
```

---

## 24. Suggested Codex Prompt

Use this prompt to start the project in Codex.

```text
Create a full-stack web application named "Pet Health Passport".

Theme: PetTech / DevTools Mini Project.

Goal:
Build a digital health passport system for pets. Pet owners can manage pet profiles, vaccination records, medical history, allergies, medications, appointments, weight history, documents, and reminders.

Tech stack:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Authentication: JWT
- Password hashing: bcrypt
- File upload: Multer
- DevTools: Docker and Docker Compose
- CI/CD: Jenkins only

Roles:
- owner
- vet
- admin

Core features:
1. Register and login
2. Role-based authentication
3. Pet profile CRUD
4. Vaccination record CRUD
5. Medical history CRUD
6. Allergy record CRUD
7. Medication record CRUD
8. Appointment management
9. Weight tracking with chart
10. Health document upload
11. Reminder system for upcoming vaccination, appointment, medication, and follow-up
12. Owner dashboard
13. Admin dashboard
14. Docker Compose setup
15. Jenkinsfile for CI/CD pipeline
16. Seed data and demo accounts

Please generate:
- project folder structure
- database schema
- backend API routes
- frontend pages
- reusable UI components
- docker-compose.yml
- Dockerfiles
- Jenkinsfile
- README.md
- seed data for demo
```

---

## 25. Codex Task Prompts

Use these prompts one by one instead of asking Codex to build everything at once.

### Prompt 1: Initial Setup

```text
Set up the initial full-stack project structure for Pet Health Passport using React + Vite for frontend, Express for backend, and PostgreSQL for database. Add Docker Compose, Jenkinsfile, and README. Do not implement all features yet. Make sure each service can run.
```

### Prompt 2: Database Schema

```text
Create PostgreSQL schema for users, pets, vaccination_records, medical_records, allergy_records, medication_records, appointments, weight_records, documents, and reminders. Add seed data for demo accounts and one sample pet.
```

### Prompt 3: Authentication

```text
Implement JWT authentication in Express with register, login, get current user, password hashing using bcrypt, auth middleware, and role middleware.
```

### Prompt 4: Pet Profile

```text
Implement backend CRUD APIs and frontend pages for pet profile management. Users should be able to create, view, edit, and delete their own pets.
```

### Prompt 5: Vaccination and Medical Records

```text
Implement vaccination records and medical records for each pet. Add backend APIs and frontend pages. Show records on the pet detail page.
```

### Prompt 6: Allergies and Medications

```text
Implement allergy records and medication records. Show allergy warnings on the pet detail page and active medications in the dashboard.
```

### Prompt 7: Appointments and Reminders

```text
Implement appointment management and reminder system. Generate reminders for upcoming vaccination dates, appointments, medication end dates, and follow-up dates.
```

### Prompt 8: Weight Chart and Documents

```text
Implement weight tracking with a simple chart and health document upload using Multer local storage.
```

### Prompt 9: Dashboard

```text
Create owner dashboard and admin dashboard. Owner dashboard should show pets, reminders, upcoming appointments, and recent records. Admin dashboard should show total users, pets, vaccinations, appointments, and recent activity.
```

### Prompt 10: Docker and Jenkins

```text
Add Dockerfiles for frontend and backend, docker-compose.yml for frontend, backend, PostgreSQL, and Jenkins. Add a Jenkinsfile that checks out the repository, installs dependencies, runs backend tests, builds the frontend, builds Docker images, deploys with Docker Compose, and performs a health check.
```

---

## 26. Jenkinsfile Draft

```groovy
pipeline {
  agent any

  environment {
    PROJECT_NAME = 'pet-health-passport'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Backend Dependencies') {
      steps {
        dir('backend') {
          sh 'npm install'
        }
      }
    }

    stage('Install Frontend Dependencies') {
      steps {
        dir('frontend') {
          sh 'npm install'
        }
      }
    }

    stage('Backend Test') {
      steps {
        dir('backend') {
          sh 'npm test || echo "No backend tests configured yet"'
        }
      }
    }

    stage('Frontend Build') {
      steps {
        dir('frontend') {
          sh 'npm run build'
        }
      }
    }

    stage('Docker Build') {
      steps {
        sh 'docker compose build'
      }
    }

    stage('Docker Compose Deploy') {
      steps {
        sh 'docker compose up -d'
      }
    }

    stage('Health Check') {
      steps {
        sh 'docker compose ps'
      }
    }
  }

  post {
    success {
      echo 'Pet Health Passport pipeline completed successfully.'
    }

    failure {
      echo 'Pet Health Passport pipeline failed.'
    }
  }
}
```

---

## 27. Presentation Focus

The presentation should focus on:

```text
1. Problem of scattered pet health records
2. Pet Health Passport concept
3. User roles
4. Main features
5. System architecture
6. Database design
7. Demo flow
8. Docker and Jenkins workflow
9. Summary
```

Recommended demo story:

```text
Milo is a cat with vaccination history and food allergy.
The owner logs in, opens Milo's health passport, checks vaccination status, adds a new medical visit, creates a follow-up appointment, and sees reminders on the dashboard.
```

---

## 28. Future Improvements

Possible future improvements:

```text
- QR code health passport
- Clinic account verification
- Email notification
- LINE notification
- Cloud file storage
- Mobile application
- Smart collar integration
- AI-based health trend analysis
```

---

## 29. Project Scope Summary

### Must Have

```text
- Authentication
- Pet profiles
- Vaccination records
- Medical records
- Allergy records
- Appointment management
- Reminder dashboard
- Admin dashboard
- Docker Compose
- Jenkinsfile
```

### Should Have

```text
- Medication records
- Weight chart
- Document upload
- Search and filter
- Jenkins pipeline health check
```

### Could Have

```text
- QR code health passport
- Shareable pet profile
- Vet account
- GitHub webhook trigger for Jenkins
```

### Won't Have in First Version

```text
- Real online payment
- Real hospital system integration
- Real AI diagnosis
- Real-time chat
- Mobile app
- GitHub Actions
```
