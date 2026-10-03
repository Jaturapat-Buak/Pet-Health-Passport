# Pet Health Passport - Collaboration Brief

## ภาพรวมโปรเจกต์

Pet Health Passport คือเว็บแอปสำหรับจัดเก็บและจัดการข้อมูลสุขภาพของสัตว์เลี้ยงแบบรวมศูนย์ เป้าหมายคือช่วยให้เจ้าของสัตว์เลี้ยงไม่ต้องเก็บข้อมูลกระจัดกระจายตามกระดาษ รูปในมือถือ แชต หรือใบเสร็จจากคลินิก แต่สามารถเปิดดูประวัติสำคัญของสัตว์เลี้ยงแต่ละตัวได้จากระบบเดียว

โปรเจกต์นี้เป็น full-stack web application สำหรับงาน DevTools / mini project โดยเน้นให้เห็นการทำงานครบตั้งแต่ frontend, backend, database, Docker Compose, seed data, test และ Jenkins pipeline

## ปัญหาที่โปรเจกต์แก้

เจ้าของสัตว์เลี้ยงมักมีข้อมูลสุขภาพหลายชนิด เช่น วัคซีน ประวัติรักษา อาการแพ้ ยา นัดหมาย น้ำหนัก และเอกสารสุขภาพ ข้อมูลเหล่านี้มักอยู่คนละที่ ทำให้เวลาพาไปหาหมอ หรือต้องเช็กวันฉีดวัคซีนครั้งต่อไป อาจหาไม่เจอหรือจำไม่ได้

Pet Health Passport แก้ปัญหานี้ด้วยการทำระบบที่ให้เจ้าของสัตว์เลี้ยงสร้างโปรไฟล์สัตว์เลี้ยง และค่อย ๆ เพิ่มข้อมูลสุขภาพที่เกี่ยวข้องลงไปในรูปแบบที่เป็นระบบ

## กลุ่มผู้ใช้

| Role | หน้าที่หลัก |
| --- | --- |
| Pet Owner | สมัครสมาชิก, เข้าสู่ระบบ, จัดการสัตว์เลี้ยงของตัวเอง, เพิ่มข้อมูลสุขภาพ |
| Veterinarian / Clinic Staff | ดูข้อมูลสุขภาพที่เจ้าของแชร์ และเพิ่มประวัติการรักษาในอนาคต |
| Admin | ดูภาพรวมระบบ จัดการผู้ใช้ และตรวจสอบข้อมูลในอนาคต |

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
| --- | --- |
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | PostgreSQL 16 |
| Authentication | JWT, bcrypt |
| DevOps | Docker, Docker Compose |
| CI/CD | Jenkins |

โครงสร้างการทำงานหลัก:

```text
Browser -> React/Vite or Nginx -> Express API -> PostgreSQL
```

## สิ่งที่ทำเสร็จแล้ว

### 1. Project Setup

- สร้างโครงสร้างโปรเจกต์แยก `frontend`, `backend`, และ `database`
- เพิ่ม Dockerfile สำหรับ frontend และ backend
- เพิ่ม `docker-compose.yml` สำหรับรัน frontend, backend และ PostgreSQL พร้อมกัน
- เพิ่ม `Jenkinsfile` สำหรับ pipeline เบื้องต้น
- เพิ่ม README และไฟล์เปิดโปรเจกต์บน Windows

### 2. Database

สร้าง schema ของตารางหลักไว้แล้ว:

- `users`
- `pets`
- `vaccination_records`
- `medical_records`
- `allergy_records`
- `medication_records`
- `appointments`
- `weight_records`
- `documents`
- `reminders`

มี seed data สำหรับ demo accounts และสัตว์เลี้ยงตัวอย่างชื่อ Milo

### 3. Authentication

- Register
- Login
- Logout ฝั่ง frontend
- JWT authentication
- Role-based route protection
- API สำหรับดู current user

### 4. Pet Profile Management

เจ้าของสัตว์เลี้ยงสามารถ:

- ดูรายการสัตว์เลี้ยงของตัวเอง
- เพิ่มสัตว์เลี้ยง
- ดูรายละเอียดสัตว์เลี้ยง
- แก้ไขข้อมูลสัตว์เลี้ยง
- ลบสัตว์เลี้ยง

ระบบ backend จำกัดข้อมูลด้วย `owner_id` เพื่อให้ owner เห็นและแก้ไขได้เฉพาะสัตว์เลี้ยงของตัวเอง

### 5. Developer Experience

- มี `open-project.bat` สำหรับเปิดโปรเจกต์บน Windows
- มี `.env.example` สำหรับตั้งค่า environment
- มี backend tests
- frontend build ผ่าน
- Docker Compose สามารถรันระบบเต็มได้

## บัญชีสำหรับทดสอบ

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@example.com` | `password123` |
| Vet | `vet@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |

## วิธีเปิดโปรเจกต์

ทางง่ายสุดบน Windows:

```text
ดับเบิลคลิก open-project.bat
```

หรือเปิดผ่าน Docker:

```sh
docker compose up --build
```

จากนั้นเข้าเว็บ:

```text
http://localhost:5173
```

ถ้ารันครั้งแรกต้องมีไฟล์ `.env` ที่ root และ `backend/.env` โดยสามารถดูตัวอย่างจาก `.env.example` และ `backend/.env.example`

## งานถัดไปที่ควรทำ

### Phase 4: Health Records

เพิ่มระบบข้อมูลสุขภาพในหน้า pet detail:

- Vaccination records
- Medical records
- Allergy records
- Medication records
- Weight records
- Health documents

แนะนำให้เริ่มจาก vaccination records และ medical records ก่อน เพราะเป็น core feature ของระบบ health passport

### Phase 5: Appointments and Reminders

- เพิ่ม appointment CRUD
- แสดง upcoming appointments
- สร้าง reminders จากวันสำคัญ เช่น วันนัดหมาย วันวัคซีนครั้งต่อไป วัน follow-up
- เพิ่ม mark as read สำหรับ reminders

### Phase 6: Dashboard

- Owner dashboard แสดงจำนวนสัตว์เลี้ยง ข้อมูลล่าสุด และ reminder สำคัญ
- Admin dashboard แสดงจำนวน users, pets, vaccination records, appointments และ activity ล่าสุด

## แนวทางแบ่งงานในทีม

### Frontend

- ทำหน้า UI สำหรับ vaccination และ medical records
- ทำ component เช่น table, form, timeline, empty state และ loading state
- เชื่อม API ผ่าน Axios
- ปรับ dashboard ให้แสดงข้อมูลจริง

### Backend

- เพิ่ม route และ validation สำหรับ health records
- ตรวจสิทธิ์ owner ทุก endpoint
- เขียน test สำหรับกรณี owner isolation
- เพิ่ม endpoint dashboard summary

### Database

- ตรวจ schema ว่ารองรับ field ที่ต้องใช้ครบ
- เพิ่ม seed data สำหรับ vaccination, medical records, appointments และ reminders
- เพิ่ม index ถ้าจำเป็น

### DevOps / Documentation

- ดูแล Docker Compose และ Jenkinsfile
- อัปเดต README เมื่อเพิ่ม feature
- เตรียม demo flow และ screenshot สำหรับส่งงาน

## API ที่มีตอนนี้

```text
GET  /api/health
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET    /api/pets
POST   /api/pets
GET    /api/pets/:id
PUT    /api/pets/:id
DELETE /api/pets/:id
```

## API ที่ควรเพิ่มต่อ

```text
GET    /api/pets/:petId/vaccinations
POST   /api/pets/:petId/vaccinations
PUT    /api/vaccinations/:id
DELETE /api/vaccinations/:id

GET    /api/pets/:petId/medical-records
POST   /api/pets/:petId/medical-records
PUT    /api/medical-records/:id
DELETE /api/medical-records/:id

GET    /api/appointments
POST   /api/appointments
PATCH  /api/appointments/:id/status

GET    /api/reminders
PATCH  /api/reminders/:id/read
```

## Demo Flow ที่ใช้เล่าโปรเจกต์

```text
1. Login ด้วย owner@example.com
2. เปิด dashboard ของ owner
3. เข้า pet list แล้วเลือก Milo
4. แสดงข้อมูลพื้นฐานของ Milo
5. เพิ่ม vaccination record หรือ medical record
6. เพิ่ม appointment สำหรับ follow-up
7. แสดง reminder บน dashboard
8. Login ด้วย admin เพื่อดูภาพรวมระบบ
```

## Scope สำหรับเวอร์ชันแรก

ควรโฟกัสให้ระบบใช้งาน demo ได้ครบตาม flow ก่อน:

- Authentication
- Pet profile CRUD
- Vaccination records
- Medical records
- Appointment
- Reminder
- Dashboard
- Docker Compose
- Jenkinsfile

ฟีเจอร์ที่ยังไม่จำเป็นในเวอร์ชันแรก:

- ระบบจ่ายเงิน
- เชื่อมโรงพยาบาลจริง
- AI diagnosis
- Mobile app
- Real-time chat

## หมายเหตุสำหรับคนที่จะทำต่อ

- อย่า commit ไฟล์ `.env` จริง เพราะมีค่า secret
- ถ้า backend start ไม่ขึ้น ให้เช็ก `JWT_SECRET` ใน `.env` ว่ายาวอย่างน้อย 32 ตัวอักษรและไม่ใช่ค่า placeholder
- ถ้า login ไม่ได้ ให้เช็กว่า PostgreSQL container ถูกสร้างพร้อม seed data แล้วหรือยัง
- ถ้าแก้ database seed หลังจาก volume ถูกสร้างแล้ว อาจต้องลบ volume เดิมก่อน seed ใหม่
- หลังเพิ่ม feature ควรรัน `npm test` ใน `backend` และ `npm run build` ใน `frontend`
