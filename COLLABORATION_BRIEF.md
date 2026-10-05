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
| Veterinarian / Clinic Staff | ดูข้อมูลสุขภาพที่เจ้าของแชร์ และเพิ่มประวัติการรักษา |
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

### 5. Health Records

- เจ้าของสัตว์เพิ่ม แก้ไข และลบข้อมูลวัคซีน การรักษา อาการแพ้ ยา และน้ำหนักจากหน้า pet detail
- อัปโหลดเอกสาร PDF, PNG หรือ JPEG ขนาดไม่เกิน 10 MB และดาวน์โหลดได้หลังล็อกอิน
- API ตรวจ `owner_id` ทุกครั้งก่อนอ่านหรือแก้ไขข้อมูล และลบไฟล์เมื่อเอกสารหรือสัตว์เลี้ยงถูกลบ

### 6. Appointments and Reminders

- เจ้าของสัตว์สร้าง ดู แก้ไข ลบ และเปลี่ยนสถานะนัดหมายได้
- หน้า Appointments แสดงนัดหมายที่กำลังจะมาถึงหรือทั้งหมด
- หน้า Reminders แสดงเหตุการณ์ใน 30 วันข้างหน้าจากวันนัด วันวัคซีน วันสิ้นสุดยา และวันติดตามผล
- กดอ่านแจ้งเตือนแล้วสถานะถูกเก็บในฐานข้อมูล; ถ้าวันของเหตุการณ์เปลี่ยน ระบบจะถือเป็นแจ้งเตือนใหม่
- แจ้งเตือนอยู่ในแอปเท่านั้น ยังไม่มีอีเมลหรือ push notification

### 7. Developer Experience

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

## สถานะและงานถัดไป

### Phase 6: Dashboard (เสร็จแล้ว)

- Owner dashboard แสดงจำนวนสัตว์เลี้ยง นัดหมาย วัคซีน ยาที่ใช้อยู่ reminder ที่ยังไม่อ่าน ข้อมูลสุขภาพล่าสุด และกราฟน้ำหนักแยกตามสัตว์เลี้ยง
- Admin dashboard แสดงจำนวน users, pets, vaccination records, appointments และ activity ล่าสุด

### Phase 7: DevTools and Jenkins (เตรียมพร้อมแล้ว)

- Docker Compose มี health check ครบทั้ง PostgreSQL, backend และ frontend
- Jenkins pipeline รองรับ Windows/Linux, รัน test/build/deploy/health check และรับ `.env` จาก Jenkins Secret file
- เพิ่ม Jenkins local setup ผ่าน `docker-compose.jenkins.yml`, `jenkins/Dockerfile` และ `open-jenkins.ps1`
- เตรียม `githubPush()` และคู่มือ `docs/JENKINS_SETUP.md`; webhook จริงรอ Jenkins URL ที่ GitHub เข้าถึงได้

### Phase 8: Final Preparation (กำลังดำเนินการ)

- ทดสอบ demo flow ของ owner และ admin ผ่าน browser แล้ว รวมการเพิ่ม medical visit, appointment และการเกิด reminder
- ปรับ seed data ให้วันนัดและวันติดตามผลสัมพันธ์กับวันที่สร้างฐานข้อมูลใหม่
- เตรียมรายงาน `docs/FINAL_REPORT.md`, คู่มือเดโม `docs/DEMO_GUIDE.md` และสไลด์ `docs/Pet-Health-Passport-Presentation.pptx`
- ยังต้องบันทึกวิดีโอเดโมจริง; GitHub webhook ต้องมี public Jenkins URL

### Phase 9: Veterinarian shared access (เสร็จแล้ว)

- เจ้าของแชร์สัตว์เลี้ยงรายตัวให้บัญชี vet ด้วยอีเมล และเพิกถอนสิทธิ์ได้
- Vet เห็นเฉพาะสัตว์เลี้ยงที่ถูกแชร์ อ่านประวัติสุขภาพและเอกสารได้ และเพิ่ม medical visit ได้
- Backend ตรวจสิทธิ์ทุกครั้ง และเก็บ `created_by` ของ medical visit ที่ vet เพิ่ม
- Backend migration เพิ่มตารางและคอลัมน์ใหม่ให้ PostgreSQL volume เดิมโดยไม่ต้องลบข้อมูล

## แนวทางแบ่งงานในทีม

### Frontend

- ทดสอบ demo flow และปรับ UI จาก feedback

### Backend

- ดูแล dashboard summary endpoints และ role checks ระหว่างทดสอบระบบ

### Database

- ตรวจประสิทธิภาพ dashboard queries เมื่อข้อมูลเพิ่ม และเพิ่ม index ตามผลทดสอบ

### DevOps / Documentation

- เปิด Jenkins ด้วย `open-jenkins.ps1`, สร้าง credential `pet-health-passport-env`, แล้วสร้าง Pipeline job จาก GitHub repo
- ตั้ง GitHub webhook เมื่อมี public Jenkins URL
- ทดสอบ pipeline บน Jenkins จริง และเตรียม demo flow / screenshot สำหรับส่งงาน

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

GET/POST /api/pets/:petId/:type
GET/PUT/DELETE /api/:type/:id
GET    /api/documents/:id/file

GET/POST /api/appointments
GET/PUT/DELETE /api/appointments/:id
PATCH  /api/appointments/:id/status
GET    /api/reminders
PATCH  /api/reminders/:id/read
GET    /api/dashboard/owner
GET    /api/dashboard/admin
```

Health record `:type` รองรับ `vaccinations`, `medical-records`, `allergies`, `medications`, `weights`; การ list/create รองรับ `documents` ด้วย

## Demo Flow ที่ใช้เล่าโปรเจกต์

```text
1. Login ด้วย owner@example.com
2. เปิด dashboard ของ owner
3. เข้า pet list แล้วเลือก Milo
4. แสดงข้อมูลพื้นฐานของ Milo
5. เพิ่ม vaccination record หรือ medical record
6. เพิ่ม appointment สำหรับ follow-up
7. แสดง reminder ในหน้า Reminders
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
