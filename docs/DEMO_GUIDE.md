# Pet Health Passport: Presentation Demo Guide

## Before presenting

1. Start the application with `open-project.bat` or `docker compose up --build -d --wait --wait-timeout 240` after setting a unique RabbitMQ password in `.env`.
2. Open `http://localhost:5173` and confirm the login form loads.
3. Confirm Jenkins is available at `http://localhost:8080` if the CI/CD segment will be shown.
4. Use the seeded owner account `owner@example.com` / `password123`, vet account `vet@example.com` / `password123`, and admin account `admin@example.com` / `password123` only in this local demo environment.
5. Check Milo's upcoming appointment before starting. Existing Docker volumes retain earlier dates. Open the captured email inbox at `http://localhost:8025` for the RabbitMQ segment.

## Live story (about 5 minutes)

| Time | Action | What to explain |
| --- | --- | --- |
| 0:00 | Sign in as owner | Each owner sees only their pets. |
| 0:30 | Show owner dashboard | Counts, upcoming visits, reminders, recent records, and weight history are summarized here. |
| 1:15 | Open Pets, then Milo | The passport groups profile details and health records by type. Show vaccination and allergy tabs. |
| 2:00 | Add a medical visit | Use today's date, a short diagnosis such as `Follow-up review`, and a treatment note. Save and show the new row. |
| 2:45 | Open Reminders and enable appointment emails | In-app reminders remain separate; email is owner opt-in and off by default. |
| 3:15 | Sign in as vet, take Milo into care if needed, and create a near-term appointment | Only vet/admin can create appointments. Set a time within the next 24 hours for the local email demo. |
| 4:00 | Open Mailpit at `localhost:8025` | RabbitMQ worker delivered an appointment email to the local test inbox; it did not go to an external provider. |
| 4:30 | Sign in as admin | Show users, counts, and recent activity. |
| 5:00 | Show Jenkins and Compose health | Check the latest build, RabbitMQ, and notification-worker health; do not present historic build #1 as current proof. |

## Suggested narration

"Milo's owner keeps health information in one passport. A vet manages the appointment; the owner sees it in the app and can opt in to an email reminder. A separate worker sends that job through RabbitMQ to the local test inbox. Jenkins builds and deploys the services and checks both API and worker health."

## Video recording checklist

- Record the browser at a desktop size so navigation and record tabs remain visible.
- Keep the recording in the local demo environment; do not show `.env`, Jenkins credentials, or real user data.
- Capture the owner flow, the email preference, appointment, Mailpit inbox, admin dashboard, and the latest Jenkins result if available.
- Use the live story above as the shot list. The video itself still needs to be recorded on the presenter's machine.

## Vet access extension

1. Sign in as the owner and open Milo. The Veterinarian access section shows care status but does not grant or revoke access.
2. Sign in as the vet. Open Pets in Your Care and search the directory for Milo; take Milo into care if not already assigned.
3. Add a medical visit or create an appointment. End care from the vet view to demonstrate immediate revocation, then restore it only if needed for the next demo.

## Known boundaries to state during questions

- Admin user management is implemented. Vets can add medical visits and manage appointments for pets in their care, but cannot edit or delete existing health records.
- GitHub push triggering needs a public Jenkins URL and webhook. The local Jenkins build was started manually.
- In-app reminders cover multiple event types; RabbitMQ email covers appointments only and is captured by Mailpit locally. QR/shareable passport is optional future work.
