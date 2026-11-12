const values = {
  upcoming: 'กำลังจะมาถึง', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิกแล้ว', active: 'กำลังใช้',
  low: 'น้อย', medium: 'ปานกลาง', high: 'มาก', critical: 'รุนแรงมาก',
  vaccination_certificate: 'ใบรับรองการฉีดวัคซีน', medical_certificate: 'ใบรับรองแพทย์',
  lab_result: 'ผลตรวจทางห้องปฏิบัติการ', prescription: 'ใบสั่งยา', insurance: 'ประกันสุขภาพ', other: 'อื่น ๆ',
  Male: 'เพศผู้', Female: 'เพศเมีย', Other: 'อื่น ๆ',
  owner: 'เจ้าของสัตว์เลี้ยง', vet: 'สัตวแพทย์', admin: 'ผู้ดูแลระบบ',
  pet: 'สัตว์เลี้ยง', appointment: 'นัดหมาย', medical: 'การรักษา', vaccination: 'วัคซีน', weight: 'น้ำหนัก',
  Cat: 'แมว', Dog: 'สุนัข', cat: 'แมว', dog: 'สุนัข', Bird: 'นก', Rabbit: 'กระต่าย', Fish: 'ปลา'
};
export const thaiValue = (value) => values[value] ?? value;
export function formatThaiDate(value) {
  if (!value) return 'ยังไม่ระบุ';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? 'ยังไม่ระบุ' : new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

const errors = {
  'Invalid email or password': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'Email and password are required': 'กรุณากรอกอีเมลและรหัสผ่าน',
  'Email is already registered': 'อีเมลนี้ถูกใช้งานแล้ว',
  'Enter a name, valid email, and password of 8 to 72 bytes': 'กรุณากรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 8 ตัวอักษร (ไม่เกิน 72 ไบต์)',
  'Enter valid user details and a password of 8 to 72 bytes': 'กรุณากรอกข้อมูลผู้ใช้และรหัสผ่านอย่างน้อย 8 ตัวอักษร (ไม่เกิน 72 ไบต์)',
  'Enter valid user details': 'กรุณากรอกข้อมูลผู้ใช้ให้ถูกต้อง',
  'Enter valid pet details': 'กรุณากรอกข้อมูลสัตว์เลี้ยงให้ถูกต้อง',
  'Choose a pet owner': 'กรุณาเลือกเจ้าของสัตว์เลี้ยง',
  'Choose an owner account': 'กรุณาเลือกบัญชีเจ้าของสัตว์เลี้ยง',
  'Choose a valid owner': 'กรุณาเลือกเจ้าของสัตว์เลี้ยงให้ถูกต้อง',
  'Microchip ID is already in use': 'หมายเลขไมโครชิปนี้ถูกใช้งานแล้ว',
  'Pet not found': 'ไม่พบสัตว์เลี้ยง', 'User not found': 'ไม่พบผู้ใช้',
  'Enter valid record details': 'กรุณากรอกข้อมูลประวัติให้ถูกต้อง',
  'Record not found': 'ไม่พบประวัติ', 'Record type not found': 'ไม่พบประเภทประวัติ',
  'Enter valid appointment details': 'กรุณากรอกข้อมูลนัดหมายให้ถูกต้อง',
  'Choose a valid appointment status': 'กรุณาเลือกสถานะนัดหมายที่ถูกต้อง',
  'Appointment not found': 'ไม่พบนัดหมาย', 'Appointment or pet not found': 'ไม่พบนัดหมายหรือสัตว์เลี้ยง',
  'Enter a valid veterinarian email': 'กรุณากรอกอีเมลสัตวแพทย์ให้ถูกต้อง',
  'Pet or veterinarian not found, or access already granted': 'ไม่พบสัตว์เลี้ยงหรือสัตวแพทย์ หรือมีสิทธิ์ดูแลอยู่แล้ว',
  'Access not found': 'ไม่พบสิทธิ์การดูแล', 'Reminder not found': 'ไม่พบรายการแจ้งเตือน',
  'Document not found': 'ไม่พบเอกสาร', 'File not found': 'ไม่พบไฟล์', 'Photo not found': 'ไม่พบรูปภาพ',
  'Authentication required': 'กรุณาเข้าสู่ระบบ', 'Insufficient permissions': 'คุณไม่มีสิทธิ์ดำเนินการนี้',
  'Invalid or expired token': 'การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  'Account no longer exists': 'ไม่พบบัญชีนี้ในระบบ',
  'File exceeds 10 MB': 'ไฟล์ต้องมีขนาดไม่เกิน 10 MB', 'Invalid upload': 'ไฟล์ที่อัปโหลดไม่ถูกต้อง',
  'Add a title, document type and PDF, PNG or JPEG file (up to 10 MB)': 'กรุณาระบุชื่อ ประเภทเอกสาร และไฟล์ PDF, PNG หรือ JPEG ขนาดไม่เกิน 10 MB',
  'Internal server error': 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง'
};
export function thaiError(message) {
  if (typeof message !== 'string') return 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง';
  if (/[\u0E00-\u0E7F]/.test(message)) return message;
  if (errors[message]) return errors[message];
  if (message.startsWith('Invalid ')) return 'ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่';
  return errors[message] ?? 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง';
}
