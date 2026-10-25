# คู่มือศึกษาและนำเสนอ Pet Health Passport

เอกสารนี้อธิบายระบบตามโค้ดใน repository ณ 25 ตุลาคม 2026 หลังรวม UI/สิทธิ์บทบาทเวอร์ชันใหม่ ใช้เตรียมเดโม อธิบายสถาปัตยกรรม และตอบคำถามหลังนำเสนอ โดยแยกความสามารถที่มีจริงออกจากแนวคิดใน `PROJECT_PLAN.md` ข้อมูลจำนวนผู้ใช้/สัตว์เลี้ยงและสถานะเซิร์ฟเวอร์ในวันนำเสนออาจเปลี่ยนได้ ต้องตรวจสดก่อนเริ่ม

## 1. สรุปโครงการใน 30 วินาที

Pet Health Passport เป็นเว็บแอปเก็บข้อมูลสุขภาพสัตว์เลี้ยงในที่เดียว เจ้าของจัดการโปรไฟล์ รูป ประวัติวัคซีน การรักษา อาการแพ้ ยา น้ำหนัก และเอกสาร พร้อมดูนัดหมาย/แจ้งเตือน สัตวแพทย์ค้นหาและรับสัตว์เข้าดูแล จัดนัด และเพิ่มบันทึกการรักษาได้ ส่วนผู้ดูแลระบบจัดการผู้ใช้ สิทธิ์ สัตว์เลี้ยง และดูภาพรวม โครงการมี Docker Compose, Jenkins และตัวเลือก Kubernetes แบบ local สำหรับสาธิตการ build/deploy

**ประโยคหลักสำหรับนำเสนอ:** "เจ้าของเห็นสุขภาพสัตว์เลี้ยงในที่เดียว สัตวแพทย์จัดการการดูแลและนัดหมายตามสิทธิ์ ส่วนผู้ดูแลระบบดูแลบัญชีและข้อมูลภาพรวม"

## 2. ขอบเขตและสถานะ

| เรื่อง | สถานะจริง |
| --- | --- |
| ฟีเจอร์ owner, vet, admin รวมการจัดการผู้ใช้/การดูแล | มีในเว็บและ API; UI/role policy ใหม่ผ่านการทดสอบของเพื่อนเมื่อ 23 ตุลาคม 2026 |
| Docker Compose และ Jenkins target `compose` | เคยผ่าน Jenkins build #1 ตามรายงานวันที่ 5 ตุลาคม 2026 |
| Kubernetes local ด้วย kind | Deploy UI/backend ที่รวมล่าสุดและตรวจหน้าเว็บ/API สำเร็จวันที่ 25 ตุลาคม 2026; PostgreSQL/uploads PVC เดิมยัง Bound |
| Jenkins target `kind` | มีโค้ดและทดสอบสคริปต์จากคอนเทนเนอร์แล้ว แต่ยังไม่มีหลักฐานว่า Pipeline job จริงรัน target นี้สำเร็จ |
| GitHub push webhook | เตรียม trigger ใน Jenkinsfile แต่ยังต้องมี Jenkins URL สาธารณะและตั้งค่า webhook |
| วิดีโอเดโม | ยังไม่ได้บันทึกตามเอกสารเดิม |

การทดสอบข้างต้นเป็นผล ณ วันที่ระบุ ไม่ใช่การรับรองว่า Docker, Jenkins หรือ Kubernetes กำลังทำงานอยู่ในขณะที่เปิดเอกสารนี้ ตรวจสถานะสดตามหัวข้อ 12 ก่อนนำเสนอ. Backend tests ล่าสุดผ่าน 9 รายการ โดย integration test ที่ต้องมีฐานข้อมูลทดสอบแยกถูกข้าม; frontend production build ผ่านใน Docker

## 3. ผู้ใช้และสิทธิ์

| ความสามารถ | Guest | Owner | Vet | Admin |
| --- | :---: | :---: | :---: | :---: |
| สมัครบัญชี owner / เข้าสู่ระบบ | ได้ | ได้ | ได้ | ได้ |
| ดูและแก้สัตว์เลี้ยงของตน | - | ได้ | - | ได้ทุกตัว |
| จัดการประวัติสุขภาพและเอกสารของตน | - | ได้ | - | ได้ทุกตัว |
| ดูนัดหมายที่เข้าถึงได้ | - | ได้ | ได้ | ได้ |
| สร้าง/แก้/เปลี่ยนสถานะนัดหมาย | - | - | เฉพาะสัตว์ในความดูแล | ได้ทุกตัว |
| ดูและทำเครื่องหมายแจ้งเตือนว่าอ่านแล้ว | - | ได้ | - | - |
| ดูรายชื่อ vet ที่ดูแลสัตว์ของตน | - | ได้ | - | ได้ |
| ค้นหา/รับสัตว์เข้าดูแลและยุติการดูแล | - | - | ได้ด้วยตนเอง | จัดสิทธิ์ให้/ถอนให้ vet ได้ |
| ดูประวัติ/ดาวน์โหลดเอกสารของสัตว์ในความดูแล | - | - | ได้ | ได้ทุกตัว |
| เพิ่มบันทึกการรักษาให้สัตว์ในความดูแล | - | - | ได้ | จัดการประวัติได้ทุกตัว |
| ดูสถิติรวมและกิจกรรมล่าสุด | - | - | - | ได้ |
| สร้าง/แก้ role/ลบผู้ใช้ | - | - | - | ได้ (ยกเว้นลบ/ลดสิทธิ์ตัวเอง) |

การสมัครจากหน้าเว็บสร้างบัญชี `owner` เท่านั้น บัญชี `vet` และ `admin` ในการเดโมมาจาก seed data หรือให้ admin สร้างผ่านหน้า Users. การซ่อนเมนูใน frontend เป็นเรื่องความสะดวก แต่การบังคับสิทธิ์จริงอยู่ที่ API ซึ่งตรวจ JWT, role และขอบเขตความเป็นเจ้าของ/การดูแลในฐานข้อมูลทุกครั้ง

## 4. ภาพรวมสถาปัตยกรรมและการไหลของข้อมูล

```text
Browser (React + React Router + Axios)
  | /api + Bearer JWT
  v
Vite proxy (development) / Nginx (Compose) / Traefik Ingress (kind)
  | /api
  v
Express API (auth + validation + role/owner/care checks)
  | SQL แบบ parameterized       | รูปสัตว์ + ไฟล์เอกสาร
  v                            v
PostgreSQL                    uploads volume/PVC
```

1. React เลือกหน้าตาม URL และบทบาทผู้ใช้ผ่าน `ProtectedRoute`.
2. หลัง login/register API ส่งข้อมูลผู้ใช้กับ JWT ที่มีอายุ 12 ชั่วโมง Browser เก็บ token ใน `sessionStorage` (ปิด session แล้วหาย ไม่ใช่ cookie หรือ localStorage).
3. Axios ส่ง `Authorization: Bearer <token>` กับคำขอ `/api` ทุกครั้ง; เมื่อเจอ `401` จะลบ token และให้กลับหน้า login.
4. Express ตรวจลายเซ็นและวันหมดอายุของ JWT แล้วอ่านบัญชีล่าสุดจากตาราง `users` ก่อนตรวจ role. จากนั้น route ที่เกี่ยวกับสัตว์เลี้ยงตรวจ owner, แถวใน `pet_vet_access` หรือสิทธิ์ admin เพิ่มอีกชั้น.
5. PostgreSQL เก็บข้อมูลเชิงโครงสร้าง ส่วนรูปสัตว์และไฟล์เอกสารเก็บเป็นไฟล์ใน volume/PVC โดยฐานข้อมูลเก็บ URL/metadata.
6. หน้าแดชบอร์ดและแจ้งเตือนเรียก API ที่ query ข้อมูลจริง ไม่ได้ฝังตัวเลขตัวอย่างใน frontend.

ไฟล์อ้างอิง: [App routes](../frontend/src/App.jsx), [AuthContext](../frontend/src/auth/AuthContext.jsx), [API client](../frontend/src/api/client.js), [Express app](../backend/src/app.js), [auth middleware](../backend/src/middlewares/auth.js)

## 5. ทุกหน้าจอและเครื่องมือบนเว็บ

### 5.1 ส่วนกลาง: navigation และ session

- เส้นทาง `/` ไม่ใช่ landing page แยก; ระบบส่งต่อไป `/dashboard` และหากยังไม่ล็อกอินจะไป `/login`.
- แถบบนแสดงชื่อแอป, เมนูตาม role, ชื่อผู้ใช้ และปุ่มออกจากระบบ. Owner เห็น Dashboard, Pets, Appointments, Reminders; vet เห็น Dashboard, Pets in Your Care, Appointments; admin เห็น Dashboard, Users, Pets, Appointments. UI ใช้หัวข้อภาษาอังกฤษกับ label/ข้อความไทย และแสดงวันที่แบบไทย พ.ศ.
- หน้าข้อมูลมีสถานะ loading/empty/error ตามแต่ละหน้า ข้อผิดพลาดจาก API บางฟอร์มแสดงเหนือปุ่มบันทึก.
- บัญชีคนละ role เข้า URL ของอีก role ไม่ได้; frontend ส่งกลับหน้าแรกของ role นั้น และ API ปฏิเสธคำขอที่ไม่มีสิทธิ์ด้วย `403`.

### 5.2 `/login` และ `/register`

| หน้า/ปุ่ม | หน้าที่และผลลัพธ์ |
| --- | --- |
| Login: Email, Password, **Sign in** | ส่ง `POST /api/auth/login`; ถ้าถูกต้องเก็บ JWT แล้วไป dashboard ตาม role; ถ้าผิดแจ้งข้อผิดพลาด |
| **Create an account** บนหน้า login | เปิด `/register` |
| Register: Name, Email, Password, **Create account** | ส่ง `POST /api/auth/register`; ตรวจชื่อ/อีเมลและรหัสผ่านอย่างน้อย 8 ตัวอักษรฝั่งฟอร์ม; API ตรวจเพิ่ม รวมสูงสุด 72 bytes และอีเมลซ้ำ; บัญชีใหม่เป็น owner |
| **Sign in** บนหน้า register | กลับ `/login` |
| **Sign out** บนแถบบน | ลบ token ฝั่ง browser แล้วกลับ `/login`; token เดิมยังคงใช้ได้จนหมดอายุถ้าเคยถูกคัดลอก เพราะยังไม่มี server-side revocation |

รหัสผ่านถูก hash ด้วย bcrypt (cost 12) ก่อนเก็บใน `users.password_hash`; API ไม่ส่ง hash กลับ browser. JWT ใช้ HS256, `JWT_SECRET` ต้องเป็นค่าเฉพาะและยาวอย่างน้อย 32 bytes ใน production. **Jenkins login เป็นบัญชีของ Jenkins แยกจากบัญชี admin ของเว็บ**

### 5.3 Owner: `/dashboard`

- การ์ดตัวเลข: **Your pets**, **Upcoming visits**, **Vaccines due in 30 days**, **Active medications**. ตัวเลขบางรายการเป็นลิงก์ไปหน้าที่เกี่ยวข้อง.
- **Upcoming reminders:** แสดงแจ้งเตือนที่ยังไม่อ่านสูงสุด 5 รายการ พร้อมลิงก์ไปนัดหมายหรือสัตว์เลี้ยง.
- **Upcoming appointments:** นัดที่ยังเป็น `upcoming` และเวลาไม่ผ่านไปแล้ว สูงสุด 5 รายการ; เปิดหน้ารายการเพื่อตรวจรายละเอียดได้ แต่ owner แก้นัดไม่ได้.
- **Vaccinations due soon:** วัคซีนครบกำหนดภายใน 30 วัน สูงสุด 5 รายการ.
- **Active medications:** ยาที่ status เป็น `active` สูงสุด 5 รายการ; การนับ active ไม่ได้บังคับว่าต้องอยู่ระหว่าง start/end date.
- **Recent health records:** วัคซีน การรักษา และน้ำหนักล่าสุดรวมกันสูงสุด 8 รายการ.
- **Weight history:** เลือกสัตว์ที่มีข้อมูลน้ำหนักเพื่อดูกราฟเส้น; API ส่งข้อมูลล่าสุดไม่เกิน 12 จุดต่อสัตว์; กด **Open health passport** ไปหน้าโปรไฟล์.
- **Your pets:** แสดงไม่เกิน 3 ตัวแรกและลิงก์ไปทั้งหมด. ถ้ายังไม่มีสัตว์ มีปุ่ม **Add pet**.

### 5.4 Owner: `/pets`, `/pets/new`, `/pets/:id/edit`

- `/pets` แสดงรายการสัตว์ของเจ้าของที่ล็อกอินเท่านั้น แต่ละการ์ดเปิดรายละเอียด; **Add pet** เปิดฟอร์มใหม่.
- ฟอร์มสัตว์เลี้ยงรับชื่อและ species (บังคับ), breed, gender, วันเกิด, สี, น้ำหนัก, microchip ID, รูปสัตว์ และ medical notes. เลือกไฟล์ JPG/PNG/WebP ไม่เกิน 5 MB แล้วเห็นตัวอย่างก่อนบันทึก; ใช้ **นำรูปออก** เพื่อลบรูปเดิม.
- **Create pet/Save changes** ส่งข้อมูลและรูปแบบ multipart แล้วไปหน้ารายละเอียด. API ปฏิเสธวันเกิดอนาคต, น้ำหนักไม่เป็นบวก/เกินช่วง, microchip ID ที่ซ้ำ และไฟล์รูปที่ไม่ผ่านการตรวจชนิด/ขนาด.
- Admin ใช้หน้าเดียวกันจัดการสัตว์ทุกตัว และเลือก/เปลี่ยนเจ้าของจากบัญชี owner ได้.
- **Back to pets/Back to profile** ย้อนกลับโดยไม่บันทึก.

### 5.5 Owner: `/pets/:id` (Health Passport)

- หัวหน้าแสดงภาพ ชื่อ species/breed และ **Edit profile**; เฉพาะ admin มีปุ่ม **สร้างนัดหมาย** โดยเลือกสัตว์ตัวนี้ไว้.
- **Details** แสดง species, breed, gender, birth date, color, weight, microchip ID. **Medical notes** เป็นโน้ตทั่วไปของโปรไฟล์ ไม่ใช่รายการ medical visit.
- **Health records** มี 6 แท็บ: Vaccinations, Medical visits, Allergies, Medications, Weight history, Documents. เปลี่ยนแท็บแล้วโหลดข้อมูลของประเภทนั้น; มีปุ่ม Retry เมื่อโหลดไม่สำเร็จ.
- Owner ใช้ **Add record**, **Edit** (ยกเว้นเอกสาร), **Delete** ได้ในแท็บที่เลือก. การลบมีหน้าต่างยืนยัน; ลบแล้วกู้ผ่าน UI ไม่ได้.
- แท็บ Documents ใช้ **Download** เพื่อดาวน์โหลดผ่าน API ที่ตรวจสิทธิ์ ไม่ใช่เปิด URL ไฟล์สาธารณะ. เอกสารเพิ่ม/ดาวน์โหลด/ลบได้ แต่ยังไม่มีฟอร์มแก้ไขเอกสารเดิม.
- **Veterinarian access:** Owner เห็นรายชื่อสัตวแพทย์ที่กำลังดูแลแบบอ่านอย่างเดียว; admin สามารถเพิ่ม/ถอนสิทธิ์ให้ vet โดยใช้อีเมล. Vet เองรับหรือยุติการดูแลจากหน้า vet ได้.
- **Delete profile:** ต้องยืนยันอีกครั้ง; ลบสัตว์และข้อมูลที่อ้างถึงผ่าน foreign key cascade และลบไฟล์เอกสารกับรูปที่แนบไว้ด้วย ใช้ระวังในเดโม.

#### รายละเอียดแต่ละแท็บประวัติสุขภาพ

| แท็บ | สิ่งที่กรอก/แสดง | ผลต่อระบบอื่น |
| --- | --- | --- |
| Vaccinations | ชื่อวัคซีนและวันที่รับ (บังคับ), วันครบกำหนดครั้งถัดไป, คลินิก, vet, หมายเหตุ, Certificate URL | วันครบกำหนดใน 30 วันสร้างรายการ reminder และมีผลต่อ owner dashboard. Certificate URL เป็นลิงก์ภายนอก; ไฟล์จริงให้ใช้ Documents |
| Medical visits | วันที่ตรวจ (บังคับ), คลินิก, vet, อาการ, diagnosis, treatment, medication ในบันทึก, follow-up date, หมายเหตุ | follow-up date ใน 30 วันสร้าง reminder; รายการล่าสุดอยู่ dashboard. ช่อง medication ใน visit ไม่ใช่รายการยาในแท็บ Medications |
| Allergies | ประเภทและสารก่อแพ้ (บังคับ), reaction, severity `low/medium/high/critical`, หมายเหตุ | แสดงใน passport; ขณะนี้ไม่มี alert badge อัตโนมัติจาก severity |
| Medications | ชื่อยา (บังคับ), dose, frequency, วันเริ่ม/สิ้นสุด, คำแนะนำ, ผู้สั่ง, status `active/completed/cancelled` | รายการ `active` อยู่ dashboard; end date ของรายการ active ภายใน 30 วันสร้าง reminder |
| Weight history | น้ำหนัก (บังคับ, มากกว่า 0), วันที่ชั่ง (บังคับ), หมายเหตุ | ใช้สร้างกราฟน้ำหนักใน owner dashboard; การแก้ profile weight ไม่เพิ่มจุดกราฟอัตโนมัติ |
| Documents | ชื่อ, ประเภท (ใบรับรองวัคซีน/แพทย์, ผลแล็บ, ใบสั่งยา, ประกัน, อื่น ๆ), ไฟล์ PDF/PNG/JPEG สูงสุด 10 MB | API ตรวจชนิดจากเนื้อไฟล์จริงก่อนบันทึก; metadata ลง PostgreSQL ไฟล์ลง volume/PVC |

API ตรวจความสัมพันธ์ของวันที่: วัคซีนครั้งถัดไปต้องไม่ก่อนวันที่รับ, follow-up ต้องไม่ก่อนวันที่ตรวจ, วันสิ้นสุดยาต้องไม่ก่อนวันเริ่ม ชนิดข้อมูลและขอบเขตตัวเลขถูกตรวจซ้ำที่ backend ไม่พึ่ง validation ของ browser อย่างเดียว

### 5.6 นัดหมาย: `/appointments`, `/appointments/new`, `/appointments/:id/edit`

- หน้า **Appointments** มีสวิตช์ **Upcoming** (สถานะ upcoming และเวลายังไม่ผ่าน) กับ **All appointments** (รวมอดีต/completed/cancelled).
- Owner เห็นนัดของสัตว์ตนเองแบบอ่านอย่างเดียว ไม่มีปุ่มสร้าง/แก้/เปลี่ยนสถานะ/ลบ.
- Vet สร้างและจัดการนัดได้เฉพาะสัตว์ที่กำลังดูแล; admin จัดการได้ทุกตัว. **New appointment** เปิดฟอร์มเลือกสัตว์ วันที่และเวลา purpose (บังคับ), clinic และ notes. Browser แปลงเวลาท้องถิ่นเป็น ISO/UTC ก่อนส่ง; backend เก็บ `TIMESTAMPTZ`.
- **Edit** เปลี่ยนข้อมูลนัด; dropdown **Status** เปลี่ยนระหว่าง `upcoming`, `completed`, `cancelled`. นัด completed/cancelled หายจาก Upcoming แต่ยังอยู่ All appointments.
- **Delete** มีหน้าต่างยืนยัน. การยกเลิกด้วย status `cancelled` ต่างจากการลบรายการทิ้ง.

### 5.7 Owner: `/reminders`

- ระบบค้นหาเหตุการณ์ในช่วง 30 วันข้างหน้า 4 แหล่ง: นัดหมาย `upcoming`, วัคซีน `next_due_date`, ยา `active` ที่มี `end_date`, และการรักษาที่มี `follow_up_date`.
- รายการแสดงวัน ชื่อ ข้อความ ลิงก์ไปนัด/สัตว์ และ **Mark read**. ตัวนับ unread อยู่ด้านบน.
- Reminder ถูก **คำนวณเมื่อเรียก API** จากข้อมูลต้นทาง ไม่ใช่ตั้ง cron ส่งข้อความล่วงหน้า ตาราง `reminders` เก็บสถานะ `is_read` ของเหตุการณ์ที่ถูกอ่าน.
- ID ของ reminder ขึ้นกับชนิดเหตุการณ์ + ID ต้นทาง + วัน/เวลา; หากเปลี่ยนวันที่เหตุการณ์จะกลายเป็น reminder ใหม่และกลับมาเป็นยังไม่อ่าน. ถ้าเหตุการณ์พ้น 30 วัน/ถูกลบ/เปลี่ยนเป็น cancelled ก็ไม่แสดงในรายการปัจจุบัน.
- ไม่มีอีเมล, LINE, push notification หรือการแจ้งเตือนนอกแอป.

### 5.8 Vet: `/vet/dashboard`, `/vet/pets`, `/vet/pets/:id`

- Dashboard แสดงสัตว์ที่กำลังดูแลและทางไปหน้ารายการ; หน้ารายการมี **Pet Directory & Appointments** สำหรับค้นหาชื่อสัตว์ ชื่อเจ้าของ หรือชนิดสัตว์ แบบแบ่งหน้าละ 20 รายการ.
- ปุ่ม **รับเข้าดูแล** สร้างสิทธิ์ใน `pet_vet_access`; **รับดูแลและนัดหมาย** รับเคสแล้วเปิดฟอร์มนัดทันที. สัตว์ที่รับแล้วเปิดประวัติหรือสร้างนัดได้ และ vet ยุติการดูแลของตนได้.
- หน้า health passport ของ vet แสดงโปรไฟล์และ 6 แท็บประวัติ. Vet อ่าน/ดาวน์โหลดเอกสารและเพิ่ม Medical visits ได้ แต่แก้/ลบประวัติเดิมหรือโปรไฟล์สัตว์ไม่ได้.
- เมื่อเพิ่ม medical visit ระบบบันทึก `created_by` เป็นบัญชี vet และเติมชื่อ vet จากบัญชีถ้าไม่ได้กรอก. การอ่านประวัติ รูป ไฟล์ และการจัดการนัดตรวจสิทธิ์การดูแลที่ API; เมื่อสิทธิ์ถูกถอน การเข้าถึงครั้งถัดไปถูกปฏิเสธ.

### 5.9 Admin: `/admin/dashboard`, `/admin/users`, `/pets`, `/appointments`

- การ์ดตัวเลขรวมทุกบัญชี: Users, Pets, Vaccinations, Appointments.
- รายการล่าสุด: ผู้ใช้ 5 คน, สัตว์ 5 ตัว, กิจกรรม 8 รายการ (สร้างสัตว์, วัคซีน, medical visit, นัดหมาย).
- **Users:** ค้นหาบัญชี, เพิ่มผู้ใช้ (ชื่อ อีเมล รหัสผ่าน role), แก้ชื่อ/อีเมล/role และลบผู้ใช้. Admin ลบหรือลดสิทธิ์ admin ของตัวเองไม่ได้.
- **Pets:** ดูและแก้สัตว์ทุกตัว, ระบุ/เปลี่ยน owner, จัดการข้อมูลสุขภาพและสิทธิ์ vet. **Appointments:** สร้าง/แก้/เปลี่ยนสถานะ/ลบนัดทุกตัว.
- ตัวเลข appointment บน dashboard คือจำนวนรายการทั้งหมด ไม่ใช่เฉพาะ upcoming.

## 6. API ที่สำคัญ

Base path คือ `/api`; รายละเอียดอยู่ใน [routes ของ backend](../backend/src/app.js). คำขอที่ต้อง login ใช้ Bearer JWT. API ตอบ JSON และใช้ status ที่สื่อความหมาย: `400` ข้อมูลไม่ถูกต้อง, `401` ไม่ล็อกอิน/token ใช้ไม่ได้, `403` role ไม่พอ, `404` ไม่พบหรือไม่มีสิทธิ์เข้าถึงรายการ, `409` ข้อมูลซ้ำบางกรณี, `413` ไฟล์เกิน 10 MB, `500` ข้อผิดพลาดภายใน, `503` ฐานข้อมูลไม่พร้อมใน health check

| กลุ่ม | Endpoint และหน้าที่ |
| --- | --- |
| Health | `GET /health` ตรวจ API + DB; เส้นทางเต็มคือ `/api/health` |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Pets | `GET/POST /pets`, `GET/PUT/DELETE /pets/:id` |
| Vet access | `GET/POST /pets/:id/vets`, `DELETE /pets/:id/vets/:vetId` (POST/DELETE สำหรับ admin); vet ใช้ `POST/DELETE /vet/pets/:id/access` กับสิทธิ์ตนเอง |
| Health records | `GET/POST /pets/:petId/:resource`, `GET/PUT/DELETE /:resource/:id` สำหรับ `vaccinations`, `medical-records`, `allergies`, `medications`, `weights` |
| Documents | `GET/POST /pets/:petId/documents`, `GET /documents/:id/file`, `DELETE /documents/:id` |
| Pet photos | `GET /pet-photos/:id` คืนไฟล์ภาพหลังตรวจ JWT และสิทธิ์เข้าถึงสัตว์; อัปโหลด/ลบรูปผ่าน `POST/PUT /pets` |
| Appointments | `GET/POST /appointments`, `GET/PUT/DELETE /appointments/:id`, `PATCH /appointments/:id/status`; list ใช้ `?view=upcoming` หรือ `?view=all` |
| Reminders | `GET /reminders`, `PATCH /reminders/:id/read` |
| Dashboards | `GET /dashboard/owner`, `GET /dashboard/admin` |
| Vet | `GET /vet/available-pets`, `GET /vet/pets`, `GET /vet/pets/:id`, `GET /vet/pets/:id/:resource`, `POST /vet/pets/:id/medical-records`, `GET /vet/documents/:id/file` |
| Admin users | `GET/POST /admin/users`, `PUT/DELETE /admin/users/:id` |

ตัวอย่างการทำงานเมื่อ vet กด **รับเข้าดูแล**: frontend เรียก `POST /api/vet/pets/:id/access` -> API ตรวจ JWT และ role vet -> SQL เพิ่มแถว `(pet_id, vet_id)` ใน `pet_vet_access` -> หน้าเว็บแสดงสถานะอยู่ในความดูแลและเปิดทางไปประวัติ/นัดหมาย. Admin จัดสิทธิ์ผ่าน endpoint `/pets/:id/vets` ได้เช่นกัน

## 7. โครงสร้างข้อมูลและกฎธุรกิจ

| ตาราง | เก็บอะไร | ความสัมพันธ์สำคัญ |
| --- | --- | --- |
| `users` | ชื่อ อีเมล hash รหัสผ่าน role | owner/vet/admin; อีเมลไม่ซ้ำ |
| `pets` | โปรไฟล์สัตว์ | `owner_id -> users`; microchip ID ไม่ซ้ำ |
| `pet_vet_access` | สิทธิ์ vet ต่อสัตว์หนึ่งตัว | composite key `(pet_id, vet_id)` กันแชร์ซ้ำ |
| `vaccination_records` | วัคซีนและวันครบกำหนด | ผูก `pet_id` |
| `medical_records` | การตรวจรักษาและ follow-up | ผูก `pet_id`; `created_by` ระบุผู้สร้างเมื่อ vet เพิ่ม |
| `allergy_records` | อาการแพ้และระดับรุนแรง | ผูก `pet_id` |
| `medication_records` | ยาและสถานะ | ผูก `pet_id` |
| `appointments` | นัดและสถานะ | ผูกทั้ง `pet_id` และ `owner_id` |
| `weight_records` | จุดข้อมูลน้ำหนักตามวัน | ผูก `pet_id` |
| `documents` | metadata ของไฟล์ | ผูก `pet_id`; `file_url` ชี้ endpoint ที่ต้อง auth |
| `reminders` | สถานะอ่านของเหตุการณ์ | ผูก user/pet; เนื้อหารายการปัจจุบันคำนวณจากตารางต้นทาง |

ตารางและ enum หลักสร้างจาก [database/init.sql](../database/init.sql). ฐานข้อมูลใหม่โหลด [seed.sql](../database/seed.sql) ครั้งแรกเมื่อ volume ยังว่าง; volume เดิมไม่ถูก reseed อัตโนมัติ. Backend รัน [migration](../backend/src/config/migrate.js) ตอนเริ่มเพื่อเพิ่มส่วน `pet_vet_access`/`created_by` ในฐานข้อมูลเก่าโดยไม่ต้องลบ volume. Foreign key หลายตารางใช้ `ON DELETE CASCADE` เมื่อสัตว์ถูกลบ; backend ต้องลบไฟล์เอกสารและรูปจาก storage แยก. รูปเก็บ path ใน `pets.image_url` ไม่ได้เก็บ bytes ในฐานข้อมูล

## 8. เครื่องมือพัฒนาและ deploy: ใช้อะไร ทำหน้าที่อะไร

| เครื่องมือ | หน้าที่ในโครงการ | ไฟล์/คำสั่งหลัก |
| --- | --- | --- |
| Git/GitHub | เก็บเวอร์ชันโค้ด; Jenkins job แบบ SCM checkout branch ที่กำหนด | `git status`, commit/push; webhook ยังไม่เปิดใช้จริง |
| Node.js + npm | รัน API และจัดการ package ตาม lockfile; ใช้ `npm ci` ใน CI | `backend/package.json`, `frontend/package.json` |
| React + React Router | สร้างหน้า UI และ routing ตาม role | `frontend/src/App.jsx` |
| Axios | เรียก `/api`, ใส่ Bearer token, จัดการ 401 | `frontend/src/api/client.js` |
| Vite | dev server และ build frontend | `npm run dev`, `npm run build` ใน `frontend/` |
| Recharts | แสดงกราฟน้ำหนัก owner | `frontend/src/components/WeightChart.jsx` |
| Express | รับ HTTP, แยก routes, ตรวจสิทธิ์/ข้อมูล | `backend/src/app.js`, `backend/src/routes/` |
| PostgreSQL + `pg` | จัดเก็บข้อมูลสัมพันธ์ด้วย SQL parameterized | `database/init.sql`, `backend/src/config/database.js` |
| bcrypt/JWT | hash รหัสผ่านและระบุตัวตน | `backend/src/routes/auth.routes.js` |
| Multer | รับเอกสาร multipart สูงสุด 10 MB และรูปสัตว์สูงสุด 5 MB | `backend/src/routes/health-records.routes.js`, `backend/src/routes/pets.routes.js` |
| Docker Compose | รัน frontend, backend, PostgreSQL พร้อม volume และ health check บนเครื่องเดียว | `docker-compose.yml`; เว็บ `http://localhost:5173` |
| Nginx | เสิร์ฟไฟล์ React build, ส่ง `/api` ไป backend ใน Compose | `frontend/nginx.conf` |
| Jenkins | pipeline checkout -> `npm ci` -> test -> frontend build -> build image -> deploy -> health check | `Jenkinsfile`; UI `http://localhost:8080` เมื่อรันอยู่ |
| kind + kubectl + Traefik | Kubernetes แบบ local; kind สร้าง cluster, kubectl apply/ดูสถานะ, Traefik แยก `/api` กับ `/` | `open-kubernetes.ps1`, `k8s/`; เว็บ `http://localhost:8081` เมื่อรันอยู่ |

### Docker Compose เทียบกับ Kubernetes

| ประเด็น | Compose | Kubernetes local (kind) |
| --- | --- | --- |
| จุดเข้าเว็บ | `localhost:5173` ผ่าน Nginx | `localhost:8081` ผ่าน kind port mapping -> Traefik Ingress |
| สถานะบริการ | Compose healthchecks/dependencies | Kubernetes startup/readiness/liveness probes และ rollouts |
| ฐานข้อมูล/ไฟล์ | Docker named volumes `postgres_data`, `uploads_data` | PVC ของ PostgreSQL และ uploads ใน kind node |
| Secret/config | `.env` ส่งให้ Compose | Kubernetes Secret จาก env file และ ConfigMap |
| image update | `docker compose up --build` | build, `kind load docker-image`, apply Deployment tag ใหม่ |
| ข้อมูลร่วมกันไหม | ไม่ | **ไม่**: สองชุดข้อมูลแยกกัน ไม่มี auto migration |

Kubernetes นี้เป็นคลัสเตอร์หนึ่ง node บน laptop เพื่อศึกษา ไม่ใช่ production HA. Backend ใช้ uploads PVC แบบ local จึงไม่ควร scale backend เกิน 1 replica โดยไม่มี shared storage. Frontend ทดลอง scale ได้. ห้ามลบ kind cluster หากยังไม่ได้สำรองฐานข้อมูล/ไฟล์ เพราะ PVC ใน cluster จะหายไปด้วย

### Jenkins pipeline ทำงานอย่างไร

1. Jenkins checkout โค้ดจาก repository ตาม job ที่ตั้งค่า; **ไฟล์ที่ยังไม่ commit/push จะไม่เข้า job แบบ SCM**.
2. `npm ci` backend/frontend, รัน backend tests และ build frontend.
3. ตัวแปร `DEPLOY_TARGET` ค่าเริ่มต้นคือ `compose`: build image, `docker compose up -d`, ตรวจ health จาก backend container.
4. ถ้าเลือก `kind`: build image tag ตามหมายเลข build, load เข้า cluster, apply Secret/manifest/Deployment, รอ rollout และตรวจ `localhost:8081/api/health`.
5. ค่าใน Jenkins credential ชนิด **Secret file** ID `pet-health-passport-env` ถูกส่งให้ deploy; ไม่ควรพิมพ์ค่าลง console หรือ commit `.env`.
6. `githubPush()` คือการเตรียม trigger; GitHub จะส่งถึง Jenkins ได้ก็ต่อเมื่อ Jenkins มี HTTPS URL สาธารณะและตั้ง webhook แล้ว. การกด Build Now/Build with Parameters ใช้ได้โดยไม่ต้องมี webhook.

คู่มือเฉพาะ: [Jenkins setup](JENKINS_SETUP.md), [Kubernetes setup](KUBERNETES_SETUP.md), [Final report](FINAL_REPORT.md)

## 9. ความปลอดภัยและข้อควรระวังที่ตอบคำถามได้

- **แยกข้อมูล owner:** SQL จำกัดด้วย `owner_id`; ไม่ใช่รับ owner ID จาก browser แล้วเชื่อทันที. Vet ใช้ `pet_vet_access` แยกจาก owner.
- **JWT:** 12 ชั่วโมง, HS256, ตรวจ account ใน DB ทุก request; `sessionStorage` ลดการค้างข้าม browser session แต่ยังต้องระวัง XSS. Logout ตอนนี้ลบ token ฝั่ง browser ไม่ได้ revoke token กลางทาง.
- **รหัสผ่าน:** เก็บ bcrypt hash ไม่เก็บ plaintext; seed/demo password มีไว้เฉพาะ local demo และต้องเปลี่ยนก่อนเปิด public.
- **SQL:** ใช้ parameter binding สำหรับค่าจากผู้ใช้. ชื่อตารางที่ต่อใน query เลือกจาก allowlist ของชนิด record ไม่ได้ต่อ string ตาม input ตรง ๆ.
- **ไฟล์:** เอกสาร PDF/PNG/JPEG สูงสุด 10 MB และรูปสัตว์ JPG/PNG/WebP สูงสุด 5 MB ตรวจชนิดไฟล์ก่อนบันทึกใน uploads volume/PVC. การอ่านทั้งเอกสารและรูปผ่าน endpoint ที่ตรวจสิทธิ์; Certificate URL ของวัคซีนยังเป็นลิงก์ภายนอก.
- **Secret:** `.env` ถูก ignore ใน Git; Jenkins เก็บใน Credentials; K8s สร้าง Secret จากไฟล์ local. Kubernetes Secret เป็นกลไกจัดการค่า config ไม่ใช่ระบบ encryption/secret management ระดับ production โดยตัวมันเอง.
- **CORS:** backend กำหนด origin ตาม environment; local Compose และ kind ใช้ origin คนละพอร์ต.
- **การลบ:** UI ขอ confirm ก่อนลบสัตว์/record/นัด; DB cascade ช่วยลบแถวที่ผูกกัน แต่ต้องสำรองข้อมูลหากต้องการกู้คืน.

## 10. สิ่งที่ยังไม่มี: ห้ามเผลอพูดว่าทำแล้ว

- ยังไม่มี QR code, public/shareable passport link, health status badge ที่คำนวณอัตโนมัติ, ระบบ email/LINE/push, calendar view, แอปมือถือ หรือเชื่อมระบบคลินิกจริง. มีการค้นหาสัตว์ใน vet directory และผู้ใช้ใน admin แล้ว แต่ยังไม่ใช่ search/filter ทุกข้อมูล.
- Vet ยังแก้/ลบบันทึกสุขภาพเดิมหรือเพิ่มชนิด record อื่นนอกจาก medical visit ไม่ได้; การจัดนัดหมายทำได้แล้ว.
- Certificate URL ใน vaccination เป็นลิงก์ ไม่ใช่ document upload; รูปสัตว์อัปโหลดไฟล์ได้แล้ว.
- คลัสเตอร์ kind และ Compose เป็น local demo ไม่ใช่ระบบ production ที่มี TLS, backup/restore อัตโนมัติ, shared object storage หรือหลาย node.
- ข้อมูล/บัญชี demo ไม่ควรเปิดสู่สาธารณะ. หากต้องใช้จริงต้องทบทวนความปลอดภัย สิทธิ์เข้าถึงไฟล์ การสำรองข้อมูล และการจัดการ secret เพิ่ม.

## 11. สคริปต์เดโมสำหรับพรีเซนต์ 5-7 นาที

| เวลา | ทำอะไรบนจอ | ประเด็นที่พูด |
| --- | --- | --- |
| 0:00 | เปิด login และเข้าสู่ระบบ owner | 3 role; สมัครใหม่ได้เฉพาะ owner; JWT ป้องกันหน้าที่ต้อง login |
| 0:40 | เปิด Owner dashboard | ตัวเลข, นัด, แจ้งเตือน, กราฟมาจาก DB จริง |
| 1:25 | เปิด Pets -> Milo -> สลับ 6 แท็บ | Passport รวมข้อมูลสุขภาพหลายชนิดในตัวเดียว |
| 2:20 | เพิ่ม medical visit พร้อม follow-up date | บันทึกแล้วเกิดข้อมูลสำหรับ reminder ใน 30 วัน |
| 3:00 | เปิด Appointments ใน owner | เจ้าของเห็นนัดของสัตว์ตนเอง แต่เปลี่ยนเองไม่ได้ |
| 3:40 | Reminders -> Mark read | Reminder คำนวณจากวันใน record และเก็บสถานะอ่าน |
| 4:20 | ดู Veterinarian access -> login vet -> ค้นหาและรับสัตว์เข้าดูแล -> สร้างนัด | Vet รับเคสเองได้และจัดนัดเฉพาะสัตว์ที่ดูแล; ยังแก้ประวัติเดิมไม่ได้ |
| 5:20 | login admin -> dashboard -> Users | เห็นสถิติรวมและจัดการบัญชี/role ได้; อย่าแก้บัญชีจริงระหว่างเดโม |
| 6:00 | แสดง Jenkins stages และ/หรือ `kubectl get pods` | เชื่อมโค้ด -> test/build -> deploy -> health check; ย้ำผลจริงที่แสดงบนจอ |

ใช้ข้อมูล demo จาก [README](../README.md) และ [DEMO_GUIDE](DEMO_GUIDE.md) แต่ตรวจวันนัดก่อนโชว์: seed ใช้วันสัมพันธ์กับวันที่สร้างฐานข้อมูลครั้งแรก ส่วน volume เก่าคงข้อมูลและวันที่เดิมอยู่. หลีกเลี่ยงโชว์ `.env`, Jenkins credentials หรือข้อมูลส่วนตัว. ถ้า demo บน kind ข้อมูลอาจไม่เหมือน Compose เพราะเป็นคนละฐานข้อมูล

## 12. เช็กลิสต์ก่อนเปิดสไลด์/แชร์หน้าจอ

```powershell
# ใน root ของโปรเจกต์ ตรวจไฟล์ที่ยังไม่ commit
git status --short

# ตรวจ Compose (ถ้าจะโชว์ Compose)
docker compose ps

# ตรวจ kind (ถ้าจะโชว์ Kubernetes)
kubectl --context kind-pet-health-passport -n pet-health-passport get pods,svc,ingress,pvc

# ตรวจ API ตามวิธี deploy ที่เลือก
curl.exe http://localhost:5173/api/health
curl.exe http://localhost:8081/api/health
```

ใช้ URL ที่กำลังรันจริงเท่านั้น: frontend Compose `http://localhost:5173`, kind `http://localhost:8081`, Jenkins `http://localhost:8080`. ผล `GET /api/health` ที่ดีมี `status: ok` และ `database: connected`. ตรวจ Jenkins build number/result ใน UI ก่อนอ้างว่า CI ผ่านล่าสุด; ผล Jenkins วันที่ 5 ตุลาคมเป็นหลักฐานย้อนหลัง ส่วน kind ตรวจใหม่วันที่ 25 ตุลาคม

## 13. คำถามที่อาจถูกถาม พร้อมคำตอบสั้น

**Q: ทำไมต้องมี 3 role?**  
A: Owner จัดการข้อมูลสัตว์และดูนัดของตัวเอง, vet รับสัตว์เข้าดูแลแล้วจัดนัด/เพิ่มการรักษา, admin จัดการบัญชีและข้อมูลทุกตัว แต่ละ role จำกัดทั้งเมนูและ API

**Q: ถ้าเดา pet ID ของคนอื่นได้ จะอ่านข้อมูลได้ไหม?**  
A: ไม่ได้ route ของ owner query พร้อม `owner_id`; route ของ vet ตรวจแถว `pet_vet_access` และ role ก่อนอ่าน/เขียน

**Q: Vet เข้าถึงสัตว์ได้อย่างไร?**
A: Vet ค้นหาใน directory แล้วรับสัตว์เข้าดูแลด้วยบัญชีตนเอง; admin เพิ่มหรือถอนสิทธิ์ให้ vet ด้วยอีเมลได้. Owner เห็นรายชื่อผู้ดูแล แต่ไม่ได้อนุมัติ/ถอนจากหน้า owner. ระบบใช้ความสัมพันธ์ใน `pet_vet_access` ไม่ใช่ลิงก์ public

**Q: ทำไม reminder ไม่ต้องมี cron job?**  
A: หน้า Reminders คำนวณจากวันนัด วันวัคซีน วันสิ้นสุดยา และวัน follow-up เมื่อเรียก API; ตาราง reminder เก็บว่าอ่านแล้วหรือยัง จึงไม่มีการส่งออกนอกแอป

**Q: ทำไมแก้วันแล้ว reminder กลับมาเป็นยังไม่อ่าน?**  
A: ID ของ reminder รวมวัน/เวลาของเหตุการณ์ วันใหม่คือเหตุการณ์ใหม่ สถานะอ่านเดิมจึงไม่ถูกนำมาใช้ผิดรายการ

**Q: น้ำหนักบนโปรไฟล์กับกราฟต่างกันอย่างไร?**  
A: `pets.weight` เป็นข้อมูลโปรไฟล์ปัจจุบัน; กราฟใช้จุดจาก `weight_records` ที่มีวันที่ชั่ง ต้องเพิ่ม record จึงเห็นแนวโน้ม

**Q: ไฟล์เอกสารเก็บใน DB ไหม?**  
A: DB เก็บ metadata/URL; bytes ของเอกสารและรูปสัตว์อยู่ใน uploads volume/PVC และอ่านผ่าน API ที่ตรวจสิทธิ์

**Q: ถ้าลบสัตว์จะเกิดอะไรขึ้น?**  
A: DB ลบแถวประวัติที่อ้างสัตว์ด้วย cascade และ backend ลบไฟล์เอกสาร/รูปที่เกี่ยวข้อง; ต้องยืนยันก่อนเพราะ UI กู้ไม่ได้

**Q: ทำไม JWT อยู่ใน sessionStorage?**  
A: เพื่อให้ session ไม่ค้างข้าม browser session และให้ Axios ใส่ token ใน header; ข้อจำกัดคือยังต้องป้องกัน XSS และไม่มี token revocation ก่อนหมดอายุ

**Q: JWT กับ bcrypt ทำหน้าที่เหมือนกันไหม?**  
A: ไม่เหมือนกัน bcrypt hash รหัสผ่านก่อนเก็บ/ตรวจ login; JWT เป็น token สำหรับพิสูจน์ตัวตนในคำขอหลัง login

**Q: ทำไมใช้ PostgreSQL?**  
A: ข้อมูลมีความสัมพันธ์ owner-pet-record และต้องใช้ foreign key, constraints, query สรุปผล/แจ้งเตือนที่สอดคล้องกัน

**Q: Jenkins กับ Docker ต่างกันอย่างไร?**  
A: Jenkins จัดลำดับงาน checkout/test/build/deploy; Docker แพ็กและรัน service เป็น container; Compose จัดหลาย container ให้ทำงานร่วมกัน

**Q: Kubernetes เพิ่มอะไรจาก Compose?**  
A: สาธิต Deployment/StatefulSet, Service, Ingress, PVC, probes และ rollout/scale บน local kind แต่ไม่ได้ทำให้โปรเจกต์เป็น production อัตโนมัติ

**Q: ทำไมข้อมูล Compose ไม่ขึ้นใน kind?**  
A: ใช้ Postgres/volume คนละชุด ต้อง backup/migrate แยก ไม่ควรลบ volume เดิมเพื่อแก้ปัญหานี้

**Q: ทำไมแก้ Jenkinsfile แล้ว Build Now ยังเห็น pipeline เก่า?**  
A: job แบบ Pipeline from SCM โหลดไฟล์จาก branch ใน GitHub ต้อง commit/push ก่อน Jenkins จึงเห็นไฟล์ใหม่

**Q: GitHub push ทำให้ Jenkins build เองหรือยัง?**  
A: ยังไม่ได้ยืนยัน webhook จริง เพราะ local Jenkins ที่ `localhost` รับ event จาก GitHub ภายนอกไม่ได้ ต้องมี URL สาธารณะและตั้ง webhook

**Q: โครงการเสร็จครบแผนหรือยัง?**  
A: ฟีเจอร์หลักรวม admin management ทำได้แล้ว แต่ QR/shareable passport, การแจ้งเตือนนอกแอป, webhook สาธารณะ และวิดีโอเดโมยังไม่ครบ; local deploy ต้องตรวจผลล่าสุดก่อนอ้างว่าพร้อม

## 14. จุดอ่านโค้ดต่อเมื่ออยากตอบเชิงลึก

1. [PROJECT_PLAN.md](../PROJECT_PLAN.md) และ [README.md](../README.md): เป้าหมายเดิมและวิธีรัน.
2. [frontend/src/App.jsx](../frontend/src/App.jsx): ทุกหน้าและ role gate.
3. [frontend/src/components/HealthRecords.jsx](../frontend/src/components/HealthRecords.jsx): ฟอร์ม/แท็บประวัติ.
4. [backend/src/routes/auth.routes.js](../backend/src/routes/auth.routes.js) และ [middlewares/auth.js](../backend/src/middlewares/auth.js): login/JWT/role.
5. [backend/src/routes/reminders.routes.js](../backend/src/routes/reminders.routes.js): อัลกอริทึม reminder.
6. [backend/src/routes/dashboard.routes.js](../backend/src/routes/dashboard.routes.js): สถิติและกราฟ.
7. [database/init.sql](../database/init.sql): ความสัมพันธ์และ constraints.
8. [Jenkinsfile](../Jenkinsfile), [docker-compose.yml](../docker-compose.yml), [k8s/](../k8s/): การส่งระบบขึ้นรัน.

เอกสารนี้ตั้งใจอธิบาย **พฤติกรรมของระบบที่มีจริง** หากพัฒนา feature ใหม่ ควรอัปเดตหัวข้อหน้าจอ/API/ข้อจำกัดและคำตอบ Q&A พร้อมกัน เพื่อไม่ให้สไลด์กับแอปขัดกัน

## 15. แก้ปัญหาเฉพาะหน้าระหว่างเดโม

| อาการ | ตรวจอะไรเป็นอันดับแรก |
| --- | --- |
| หน้าเว็บเปิดไม่ได้ | เช็กว่าใช้พอร์ตตรง deployment (`5173` Compose, `8081` kind), Docker Desktop พร้อม และ frontend container/Pod ยังรันอยู่ |
| หน้าเว็บเปิดได้แต่ข้อมูลโหลดไม่ได้ | เรียก `/api/health`; ถ้า API ตอบ `503` หรือ `database: unavailable` ให้ดู PostgreSQL และ backend logs; ถ้า `/api` ตอบ 404 ที่ kind ให้ดู Ingress/Traefik |
| Login ไม่ผ่าน | เช็กว่าเป็นบัญชีของ **แอป** ไม่ใช่ Jenkins; Compose กับ kind มีฐานข้อมูลคนละชุด; fresh seed กับ volume เดิมมีข้อมูลต่างกัน; อย่าแสดงรหัสผ่านจริงบนจอ |
| เข้า URL แล้วเด้งไปหน้าอื่น | เช็กว่าล็อกอิน role ใด, token หมดอายุหรือไม่ และ URL นั้นอนุญาต role นั้นไหม |
| Reminder หรือกราฟไม่ขึ้น | Reminder แสดงเฉพาะเหตุการณ์ใน 30 วันข้างหน้า; กราฟต้องมี `weight_records` ไม่ใช่เพียงค่า weight ใน pet profile; ตรวจข้อมูลในฐานข้อมูลชุดที่กำลังใช้ |
| เพิ่มไฟล์ไม่สำเร็จ | เอกสารต้องเป็น PDF/PNG/JPEG ไม่เกิน 10 MB; รูปสัตว์ต้องเป็น JPG/PNG/WebP ไม่เกิน 5 MB; ตรวจ uploads volume/PVC และสิทธิ์เขียน |
| Jenkins ไม่มีตัวเลือก `kind` | job แบบ SCM ยังโหลด `Jenkinsfile` เก่าหรือยังไม่ commit/push; ตรวจ branch และ build parameter ของ job |
| Jenkins build ล้มที่ Secret file | ตรวจ credential ID `pet-health-passport-env` และคีย์ใน env file; หลีกเลี่ยงคัดลอกค่าลง console |
| Pods พร้อมแต่ API ไม่ตอบ | ดู `kubectl get ingress,svc,pods`, Traefik logs และเส้นทาง `localhost:8081/api/health`; PostgreSQL PVC/Secret ก็ต้องพร้อม |

คำสั่งอ่าน log (ไม่แสดง Secret): `docker compose logs --tail=100 backend postgres` สำหรับ Compose หรือ `kubectl --context kind-pet-health-passport -n pet-health-passport logs deployment/backend --tail=100` สำหรับ kind. หากต้องแก้ในวันพรีเซนต์ ให้ทำกับข้อมูลเดโมเท่านั้นและอย่าลบ volume/cluster เพื่อแก้ปัญหาแบบเร่งด่วน เพราะข้อมูลจะหาย
