<div align="center">
  <img src="https://lh3.googleusercontent.com/d/19aXvolxpVK5GndtRSMFP6sEdl7oa5PzN" alt="MHC Smart School Logo" width="150" height="150">
  
  # MHC Smart School 🏫
  
  **ระบบสารสนเทศเพื่อการบริหารจัดการสถานศึกษาแบบครบวงจร**
  
  [![Frontend](https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-blue.svg)](https://kongirr12.github.io/smc/)
  [![Backend](https://img.shields.io/badge/Backend-Google%20Apps%20Script-green.svg)](https://developers.google.com/apps-script)
  [![Database](https://img.shields.io/badge/Database-Google%20Sheets-109D59.svg)](https://google.com/sheets)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

---

## 🌟 แนะนำระบบ (Introduction)
**MHC Smart School** เป็น Web Application ระบบบริหารจัดการโรงเรียนที่ออกแบบมาเพื่อ **โรงเรียนมหาชัยพิทยาคาร** โดยเฉพาะ โดดเด่นด้วยดีไซน์ที่ทันสมัย (Modern Premium UI) รองรับ Dark Mode และทำงานรวดเร็วด้วยสถาปัตยกรรมที่แยกส่วน Frontend ออกจาก Backend 

ระบบนี้ครอบคลุมการทำงานทุกภาคส่วนของโรงเรียน ตั้งแต่งานทะเบียน, งานวิชาการ, งานกิจการนักเรียน ไปจนถึงงานการเงิน และระบบสารบรรณอิเล็กทรอนิกส์ ช่วยให้คณะครูและผู้บริหารสามารถจัดการข้อมูลได้อย่างมีประสิทธิภาพในที่เดียว

---

## 🚀 ฟีเจอร์หลัก (Key Features)

### 👥 งานบริหารนักเรียนและบุคลากร
*   **ระบบข้อมูลนักเรียน (Students):** จัดการประวัติ, ที่อยู่, ข้อมูลผู้ปกครอง พร้อมระบบค้นหาแบบ Real-time
*   **ระบบจัดการห้องเรียน (Classrooms):** จัดครูที่ปรึกษา, เลื่อนชั้นเรียน, ย้ายห้อง
*   **ระบบบุคลากร (Personnel):** จัดการข้อมูลครู, เจ้าหน้าที่, พิมพ์ข้อมูลออกเป็นรายงาน
*   **บัตรนักเรียน (Student Cards):** สร้างและพิมพ์บัตรประจำตัวนักเรียนแบบ Batch พร้อม QR Code ในตัว

### 📅 ระบบเข้าเรียนและพฤติกรรม (Attendance & Behavior)
*   **เช็คชื่อเข้าเรียน (Attendance):** ระบบเช็คชื่อรายวิชา, รายวัน, และรายห้องเรียน
*   **สแกน QR Code (QR Scanner):** รองรับการเปิดกล้องสแกนบัตรนักเรียนเพื่อเช็คชื่อเข้าแถวได้ทันที
*   **บันทึกพฤติกรรม (Behavior):** ตัดคะแนนความประพฤติ, เพิ่มคะแนนจิตพิสัย และออกใบแจ้งเตือน

### 📚 งานวิชาการและทะเบียน (Academic & Registration)
*   **รายวิชาและเกรด (Subjects & Grades):** ตัดเกรดอัตโนมัติ, คำนวณเกรดเฉลี่ย (GPA)
*   **พิมพ์เอกสาร ปพ. (Transcripts):** สร้างเอกสาร ปพ.5 และ ปพ.6 อัตโนมัติจากฐานข้อมูล
*   **ระบบลงทะเบียน (Registration):** ลงทะเบียนเรียน, เลือกวิชาเลือก, กิจกรรมชุมนุม
*   **ตารางสอน (Schedule):** จัดการตารางสอนครูและตารางเรียนนักเรียน

### 💰 งานบริหารทั่วไป (Admin & Backoffice)
*   **สารบรรณอิเล็กทรอนิกส์ (E-Document):** รับ-ส่งหนังสือราชการ, ลงเลขรับอัตโนมัติ
*   **ระบบอนุมัติ (Approvals):** ขออนุมัติโครงการ, ลางาน พร้อมสถานะ Tracking
*   **งานการเงิน (Finance):** บันทึกรายรับ-รายจ่าย, พิมพ์ใบเสร็จรับเงิน
*   **ระบบงบประมาณ (Budget):** ติดตามการเบิกจ่ายโครงการตามแผนปฏิบัติการ
*   **ปฏิทินและข่าวสาร (Calendar):** ปฏิทินกิจกรรมโรงเรียน

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

*   **Frontend:** HTML5, Vanilla JavaScript (ES6+), CSS3 (Custom Design System, Premium Glassmorphism UI)
*   **Backend / API:** Google Apps Script (GAS)
*   **Database:** Google Sheets (ทำหน้าที่เป็น NoSQL Database เก็บข้อมูลระดับหมื่นบรรทัด)
*   **Hosting:** GitHub Pages (หน้าเว็บ) และ Google Servers (API)

---

## ⚡ วิธีการติดตั้งและใช้งาน (Installation)

เนื่องจากระบบถูกแยกส่วน Frontend และ Backend การติดตั้งจึงแบ่งเป็น 2 ส่วน:

**1. ฝั่ง Backend (Google Apps Script)**
1. สร้าง Google Sheet ใหม่ และเปิดเมนู `Extensions > Apps Script`
2. คัดลอกโค้ดจากไฟล์ `code.gs` ไปวาง
3. รันฟังก์ชัน `initializeSheets()` เพื่อสร้างโครงสร้างฐานข้อมูล
4. กด Deploy แบบ Web App (ตั้งค่า Execute as: User accessing the web app หรือ Me, Access: Anyone)
5. นำ URL ที่ได้ไปตั้งค่าใน Frontend

**2. ฝั่ง Frontend (GitHub Pages)**
1. Clone Repository นี้: `git clone https://github.com/Kongirr12/smc.git`
2. นำ Web App URL ของ Backend ไปตั้งค่าเชื่อมต่อในไฟล์ JavaScript
3. Commit และ Push ขึ้น GitHub
4. เปิดใช้งาน GitHub Pages ในหน้า Settings ของ Repository 

---

## 👨‍💻 ผู้พัฒนา
พัฒนาเพื่อโรงเรียนมหาชัยพิทยาคาร โดย **ครูก้องนที อุ่นเจริญ**


