# Pet Health Passport: Presentation Demo Guide

## Before presenting

1. Start the application with `open-project.bat` or `docker compose up --build -d --wait --wait-timeout 120`.
2. Open `http://localhost:5173` and confirm the login form loads.
3. Confirm Jenkins is available at `http://localhost:8080` if the CI/CD segment will be shown.
4. Use the seeded owner account `owner@example.com` / `password123`, vet account `vet@example.com` / `password123`, and admin account `admin@example.com` / `password123` only in this local demo environment.
5. Check Milo's upcoming appointment before starting. Fresh databases use an appointment five days after initialization. Existing Docker volumes retain their earlier dates and any records added during prior demos.

## Live story (about 5 minutes)

| Time | Action | What to explain |
| --- | --- | --- |
| 0:00 | Sign in as owner | Each owner sees only their pets. |
| 0:30 | Show owner dashboard | Counts, upcoming visits, reminders, recent records, and weight history are summarized here. |
| 1:15 | Open Pets, then Milo | The passport groups profile details and health records by type. Show vaccination and allergy tabs. |
| 2:00 | Add a medical visit | Use today's date, a short diagnosis such as `Follow-up review`, and a treatment note. Save and show the new row. |
| 2:45 | Select Schedule visit | Choose a date within the next 30 days, enter a purpose and clinic, and save. |
| 3:30 | Open Reminders | The new appointment appears automatically. Explain that reminders are in-app and generated from care dates. |
| 4:00 | Sign out, then sign in as admin | Show counts and recent activity, including the newly created visit and appointment. |
| 4:40 | Open Jenkins build #1 | Show successful test, build, deployment, and health-check stages. |

## Suggested narration

"Milo's owner keeps vaccination, allergy, treatment, and weight information in one passport. After a clinic visit, the owner records what happened and schedules the next checkup. The upcoming appointment appears in reminders without entering the same date twice. The admin view shows that activity across the system. Jenkins runs tests, builds the frontend and Docker images, deploys the services, and checks that the API is healthy."

## Video recording checklist

- Record the browser at a desktop size so navigation and record tabs remain visible.
- Keep the recording in the local demo environment; do not show `.env`, Jenkins credentials, or real user data.
- Capture the owner flow, the newly generated reminder, the admin dashboard, and Jenkins build #1.
- Use the live story above as the shot list. The video itself still needs to be recorded on the presenter's machine.

## Vet access extension

1. Sign in as the owner and open Milo. The fresh demo seed already shares Milo with `vet@example.com`; use the Veterinarian access section to review or restore that grant.
2. Sign out and sign in as the vet. Open Shared pets, then Milo, and review the existing health records.
3. Add a medical visit. Sign back in as the owner to see the visit, then remove veterinarian access.
4. Sign back in as the vet to confirm Milo no longer appears under Shared pets.

## Known boundaries to state during questions

- Admin user management is not implemented. Vets can add medical visits but cannot edit or delete existing records.
- GitHub push triggering needs a public Jenkins URL and webhook. The local Jenkins build was started manually.
- Reminders are in-app only. QR/shareable passport is optional future work.
