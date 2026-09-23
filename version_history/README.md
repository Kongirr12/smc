# 📖 เอกสารประวัติเวอร์ชันระบบ MHC Smart School (Version History)

ยินดีต้อนรับสู่โฟลเดอร์รวบรวมประวัติการปรับปรุงและการอัปเดตเวอร์ชันของระบบ **MHC Smart School (โรงเรียนมหาชัยพิทยาคาร)**  
จัดทำขึ้นเพื่อเป็นบันทึกการพัฒนา (Audit Trail & Changelog) ช่วยให้คณะทำงานและผู้ดูแลระบบสามารถตรวจสอบย้อนหลังได้ว่าในแต่ละเวอร์ชันมีการแก้ไข ปรับปรุง หรือเพิ่มฟีเจอร์ใดไปบ้าง รวมถึงไฟล์ที่ได้รับผลกระทบและขั้นตอนการ Deploy

---

## 📌 สารบัญเวอร์ชัน (Release Index)

| เวอร์ชัน | วันที่อัปเดต | หัวข้อการปรับปรุงหลัก | ไฟล์เอกสาร |
| :--- | :--- | :--- | :--- |
| **v2.4.0** | 23 ก.ย. 2569 | ระบบกำหนดและจัดการเลขที่นักเรียน (Roll Numbers), จัดเรียงเลขที่อัตโนมัติตามมาตรฐาน สพฐ./SGS, แก้ไขเลขที่รายห้อง และรองรับในระบบเช็คชื่อ/CSV | [v2.4.0-student-number-management.md](./v2.4.0-student-number-management.md) |
| **v2.3.0** | 23 ก.ย. 2569 | ระบบนำเข้า CSV อัจฉริยะ (แก้คำนำหน้าซ้ำ), ลบข้อมูลซ้ำ, ระบบลบนักเรียนทีละหลายคน (Batch Delete) และลบตามตัวกรอง (Filter Delete) | [v2.3.0-smart-csv-import-and-batch-delete.md](./v2.3.0-smart-csv-import-and-batch-delete.md) |
| **v2.2.0** | 22 ก.ย. 2569 | ระบบความปลอดภัย Session (Auto-logout เมื่อ Token หมดอายุ), ระบบเลือกนักเรียนหลายคน (Multi-Select) และเปลี่ยนห้องเรียนแบบกลุ่ม (Batch Transfer) | [v2.2.0-session-security-and-multiselect.md](./v2.2.0-session-security-and-multiselect.md) |
| **v2.1.0** | 22 ก.ย. 2569 | การปรับปรุงโครงสร้างรายวิชาเป็นระดับชั้น, ซิงค์ตารางสอนอัตโนมัติ และระบบบันทึกคะแนน ปพ.5 ซิงค์รายชื่อนักเรียน | [v2.1.0-academic-and-timetable-sync.md](./v2.1.0-academic-and-timetable-sync.md) |
| **v2.0.0** | กันยายน 2569 | ปรับปรุงประสิทธิภาพทั้งระบบ (Speed Optimization), รองรับ Client-side Caching, Stale-While-Revalidate และ Fast Session Cache | [CHANGELOG.md](../CHANGELOG.md) |

---

## 🚀 ขั้นตอนการนำโค้ดขึ้นระบบ (Deployment Guide)

เนื่องจากระบบ **MHC Smart School** ทำงานร่วมกันระหว่าง **Frontend (GitHub Pages)** และ **Backend (Google Apps Script)** เมื่อมีการแก้ไขโค้ดต้องดำเนินการดังนี้:

### 1. ฝั่ง Frontend (GitHub Pages)
- เมื่อ Commit และ Push โค้ดขึ้น Branch `main` บน GitHub เรียบร้อยแล้ว ระบบ GitHub Actions / Pages จะอัปเดตหน้าเว็บให้อัตโนมัติภายใน 1-2 นาที
- หากเปิดหน้าเว็บแล้วยังเห็นหน้าตาเดิม ให้กด **Ctrl + F5** (Windows) หรือ **Cmd + Shift + R** (Mac) เพื่อล้าง Hard Cache ของเบราว์เซอร์

### 2. ฝั่ง Backend (Google Apps Script - `code.gs`)
หากเวอร์ชันนั้นมีการแก้ไขไฟล์ `code.gs` จะต้องนำโค้ดไปวางใน Google Apps Script Editor และ Deploy ใหม่ดังนี้:
1. เปิด Google Sheet ฐานข้อมูลของโรงเรียน -> ไปที่เมนู **ส่วนขยาย (Extensions)** -> **Apps Script**
2. คัดลอกโค้ดทั้งหมดจากไฟล์ `code.gs` ไปวางแทนที่โค้ดเดิมในโปรเจกต์
3. กดปุ่ม **บันทึก (Save / ไอคอนแผ่นดิสก์)**
4. คลิกปุ่มสีน้ำเงิน **ทำให้ใช้งานได้ (Deploy)** มุมบนขวา -> เลือก **จัดการการทำให้ใช้งานได้ (Manage deployments)**
5. คลิกไอคอน **ดินสอ (Edit)** ที่รายการ Web App ที่ใช้งานอยู่
6. ในช่อง **เวอร์ชัน (Version)** ให้เลือก **เวอร์ชันใหม่ (New version)**
7. ใส่คำอธิบาย เช่น `Update v2.3.0 - Batch Delete & CSV Parser`
8. กดปุ่ม **ทำให้ใช้งานได้ (Deploy)**
9. ทดสอบใช้งานผ่านหน้าเว็บได้ทันที

---

## 🔒 มาตรฐานความปลอดภัยและข้อกำหนด (Safety & Permissions)
- ทุก API ฝั่ง Backend ที่มีการแก้ไขหรือลบข้อมูล จะต้องผ่านการตรวจสอบสิทธิ์ `_requireAuth_(token, true)` และตรวจสอบ Role `admin` หรือ Permission `delete`
- ฟังก์ชันการลบข้อมูล (Delete) จะต้องดำเนินการยืนยันผ่าน Modal (SweetAlert2) ฝั่งผู้ใช้ พร้อมแสดงสรุปรายการที่จะถูกลบอย่างชัดเจน เพื่อป้องกันความผิดพลาดจากการกดโดยไม่ตั้งใจ
