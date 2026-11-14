# Part B1: Feature Inventory — CandyCash 12 Golden Features (`docs/features.md`)

> **หมายเหตุการจัดเรียง:** ฟีเจอร์ทั้งหมดเรียงลำดับตามหมายเลข `F-01` ถึง `F-12` แยกตาม Sprint อย่างชัดเจน (Sprint 1: `F-01..F-06`, Sprint 2: `F-07..F-09`, Sprint 3: `F-10..F-12`) ไม่มีการข้าม Sprint ไปมา

| Feature ID | Feature Name | Short Description | Related Requirements | Dependencies | Planned Sprint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | **Authentication & Role-Based Session Guard** | ระบบ Login/Logout ด้วย `HttpOnly` Cookie, ตรวจสอบตัวตนปัจจุบัน และกั้นสิทธิ์ระหว่าง `USER` กับ `ADMIN` | FR-01, BR-03, NFR-01, NFR-03 | None | **Sprint 1** |
| **F-02** | **Custom Expense Folders / Wallets & Archive Guard** | `USER` สร้างโฟลเดอร์บันทึกเงิน (เลือกสี/ไอคอนได้), ดูยอดรวมสุทธิ และเก็บโฟลเดอร์เข้ากรุ (`Archive`) แบบ Double-Check | FR-02, BR-01, BR-03, BR-06 | F-01 | **Sprint 1** |
| **F-03** | **Atomic Income & Expense Transaction Logging** | `USER` จดบันทึกรายรับ-รายจ่ายแบบ Atomic ผ่านฟอร์มมาตรฐาน พร้อมเช็กประเภทหมวดหมู่และบล็อกยอดเงินติดลบ (`422`) | FR-03, BR-01, BR-02, NFR-02 | F-01, F-02 | **Sprint 1** |
| **F-04** | **Self-Service Double-Check Move & Cancel Transaction** | `USER` กดยกเลิกรายการ (`Cancel`) หรือย้ายรายการข้ามโฟลเดอร์ (`Move`) ด้วยตัวเองผ่านหน้าต่าง Double-Check สรุปยอดก่อน-หลัง | FR-04, BR-04, BR-05, NFR-02 | F-02, F-03 | **Sprint 1** |
| **F-05** | **Trash History & Double-Check Restore** | ถังขยะแสดงรายการที่ยกเลิกไปแล้ว เพื่อให้ `USER` กดกู้คืน (`Restore`) แบบ Double-Check พร้อมเช็กยอดเงินไม่ให้ติดลบ | FR-05, BR-05, NFR-02 | F-03, F-04 | **Sprint 1** |
| **F-06** | **Daily Safe-to-Spend, Search/Filter & Admin Catalog/Templates** | คำนวณงบที่ใช้ได้ในวันนี้, กราฟสัดส่วนรายจ่าย, ช่องค้นหา/กรองรายการ; และฝั่ง `ADMIN` จัดการหมวดหมู่กลาง & สูตรจัดงบแนะนำ | FR-06, BR-03, NFR-01 | F-01..F-03 | **Sprint 1** |
| **F-07** | **Category Budget Envelopes & Double-Check Over-Budget Alert** | ตั้งงบรายหมวดหมู่ย่อย แสดงแถบสีสถานะ (เขียว/เหลือง/แดง) และเตือนแบบ Double-Check เมื่อรายจ่ายทะลุงบ | FR-07 | F-03, F-06 | **Sprint 2** |
| **F-08** | **Atomic Inter-Wallet Transfer** | โอนเงินข้ามระหว่างโฟลเดอร์ 2 ใบของตัวเองแบบ Atomic โดยไม่นับรวมเป็นรายจ่ายสิ้นเปลือง | FR-08, BR-07 | F-02, F-03 | **Sprint 2** |
| **F-09** | **Savings Goal Jars & PIN-Locked Spending Folders** | สร้างกระปุกออมเงินตามเป้าหมาย, ระบบล็อกโฟลเดอร์ป้องกันการใช้จ่ายด้วย PIN และคำนวณวันที่จะเก็บเงินครบเป้า | FR-09, BR-07, BR-09 | F-02, F-08 | **Sprint 2** |
| **F-10** | **Recurring Bills & Monthly Due Reminder** | ตั้งรายการบิลประจำเดือนและค่าสมาชิก พร้อมระบบแจ้งเตือนเมื่อใกล้ถึงวันครบกำหนดชำระ | FR-10 | F-03 | **Sprint 3** |
| **F-11** | **Financial Analytics Dashboard & CSV Export** | แดชบอร์ดกราฟวิเคราะห์รายเดือน/รายวัน เปรียบเทียบเดือนก่อนหน้า และส่งออกไฟล์ Excel/CSV | FR-11, NFR-04 | F-03, F-07 | **Sprint 3** |
| **F-12** | **Fiscal Month-End Closing Lock & Admin Unlock** | ล็อกงวดบัญชีสิ้นเดือน (`CLOSED`) กันการเผลอแก้รายการย้อนหลัง พร้อมระบบขอ `ADMIN` ปลดล็อกเมื่อกดผิด | FR-12, BR-08, NFR-05 | F-03..F-06 | **Sprint 3** |
