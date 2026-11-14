# 🍬 CandyCash: Smart Personal Money & Expense Logging System (`v2.0 Final — 12 Golden Features & Double-Check Edition`)
**การออกแบบระบบบันทึกรายรับ-รายจ่ายส่วนตัว สำหรับวิชา CPE 334 (Deliverable 1: Parts A–F — 80 คะแนน)**

---

## ✨ สรุปภาพรวมระบบ `CandyCash`: เรียงลำดับ 12 ฟีเจอร์ตาม Sprint (`F-01` ถึง `F-12`) ไม่ข้ามเลข

- **ชื่อโปรเจกต์ (Project Name):** **CandyCash**
- **รูปแบบของระบบ:** เว็บสมุดจดบันทึกรายรับ-รายจ่ายส่วนตัวอัจฉริยะ (ไม่ได้ผูกกับธนาคารจริง แต่ให้ผู้ใช้สร้างโฟลเดอร์จำลองเพื่อจดบันทึกและบริหารเงินด้วยตนเอง)
- **การแบ่งบทบาท (`USER` vs `ADMIN`):**
  1. **`USER` (Personal Account Owner):** จัดการโฟลเดอร์บันทึกเงินส่วนตัว จดรายรับ-รายจ่าย ย้ายรายการข้ามโฟลเดอร์ (`Move`) ยกเลิกรายการลงถังขยะ (`Cancel`) และกู้คืนรายการ (`Restore`) ได้ด้วยตัวเองผ่านระบบยืนยัน 2 ชั้น (**Double-Check**) โดยไม่ต้องพิมพ์เหตุผลและไม่ต้องรอ Admin
  2. **`ADMIN` (System & Catalog Administrator):** ดูแลหมวดหมู่มาตรฐานกลางของระบบ (`System Categories`), สร้างสูตรจัดงบแนะนำ (`Starter Budget Templates`), และช่วยปลดล็อกงวดบัญชีเมื่อผู้ใช้ร้องขอ โดยถูกกั้นสิทธิ์ `403 FORBIDDEN` ไม่ให้เปิดดูโฟลเดอร์หรือรายการเงินส่วนตัวของ `USER` เด็ดขาด (100% Privacy)

---

## 📋 ตารางรวม 12 ฟีเจอร์ (`F-01` – `F-12`) เรียงตามลำดับ Sprint 1 &rarr; Sprint 2 &rarr; Sprint 3

### 🟢 Sprint 1 (`F-01` ถึง `F-06` — 6 ฟีเจอร์หลัก = 6 Issues & 6 Feature PRs สลับกันทำคนละข้อ)
| Issue & PR | Feature ID | Feature Name | รายละเอียดการทำงาน | ผู้ทำ (Author) | ผู้ตรวจ PR (Reviewer) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Issue #1 / PR #1** | **`F-01`** | **Authentication & Role-Based Session Guard** | ระบบ Login/Logout ด้วย `HttpOnly` Cookie, ตรวจสอบตัวตนปัจจุบัน (`GET /api/auth/me`) และกั้นสิทธิ์ระหว่าง `USER` กับ `ADMIN` | **คนที่ 1 (หัวหน้า GitHub)** | คนที่ 2 |
| **Issue #2 / PR #2** | **`F-02`** | **Custom Expense Folders / Wallets & Archive Guard** | `USER` สร้างโฟลเดอร์บันทึกเงินส่วนตัว (เลือกสี/ไอคอนได้), ดูยอดรวมสุทธิ และเก็บโฟลเดอร์เข้ากรุ (`Archive`) แบบ Double-Check | **คนที่ 2** | คนที่ 1 |
| **Issue #3 / PR #3** | **`F-03`** | **Atomic Income & Expense Transaction Logging** | `USER` จดบันทึกรายรับ (`INCOME`) และรายจ่าย (`EXPENSE`) ผ่านฟอร์มมาตรฐาน พร้อมตรวจสอบประเภทหมวดหมู่และบล็อกยอดเงินติดลบ (`422`) แบบ Atomic | **คนที่ 1 (หัวหน้า GitHub)** | คนที่ 2 |
| **Issue #4 / PR #4** | **`F-04`** | **Self-Service Double-Check Move & Cancel Transaction** | `USER` กดยกเลิกรายการ (`Cancel`) หรือย้ายรายการข้ามโฟลเดอร์ (`Move`) ด้วยตัวเองผ่านหน้าต่าง Double-Check สรุปยอดเงินก่อน-หลัง (`confirmed: true`) | **คนที่ 2** | คนที่ 1 |
| **Issue #5 / PR #5** | **`F-05`** | **Trash History & Double-Check Restore** | ถังขยะแสดงรายการที่ยกเลิกไปแล้ว (`CANCELED`) เพื่อให้ `USER` กดกู้คืน (`Restore`) กลับมาเป็น `POSTED` แบบ Double-Check พร้อมเช็กยอดเงินไม่ให้ติดลบ | **คนที่ 1 (หัวหน้า GitHub)** | คนที่ 2 |
| **Issue #6 / PR #6** | **`F-06`** | **Daily Safe-to-Spend, Search/Filter & Admin Catalog/Templates** | คำนวณงบที่ใช้ได้ในวันนี้ (`Daily Safe-to-Spend`), กราฟสัดส่วนรายจ่าย, ช่องค้นหา/กรองรายการ; และฝั่ง `ADMIN` จัดการหมวดหมู่กลาง & สูตรจัดงบแนะนำ | **คนที่ 2** | คนที่ 1 |
| **Release PR #7** | **`Release`** | **Sprint 1 Release (`staging -> main`)** | รัน Automated Tests ครบทั้ง `TEST-01..12` บน `staging` แล้วเปิด PR รวมเข้า `main` พร้อมติดป้าย Tag `v1.0.0-sprint1` | **คนที่ 1 (หัวหน้า GitHub)** | คนที่ 2 |

### 🟡 Sprint 2 (`F-07` ถึง `F-09` — 3 ฟีเจอร์ขยายด้านงบรายหมวดหมู่ โอนเงิน และกระปุกออมเงิน)
| Feature ID | Feature Name | รายละเอียดการทำงาน | Related Requirements |
| :--- | :--- | :--- | :--- |
| **`F-07`** | **Category Budget Envelopes & Double-Check Over-Budget Alert** | ตั้งงบรายหมวดหมู่ย่อย แสดงแถบสีสถานะ (เขียว/เหลือง/แดง) และแจ้งเตือนแบบ Double-Check เมื่อรายจ่ายทะลุงบหมวดหมู่ | `FR-07` |
| **`F-08`** | **Atomic Inter-Wallet Transfer** | โอนเงินข้ามระหว่างโฟลเดอร์ 2 ใบของตัวเองแบบ Atomic (หักต้นทางและบวกปลายทางพร้อมกัน) โดยไม่นับรวมเป็นรายจ่ายสิ้นเปลือง | `FR-08, BR-07` |
| **`F-09`** | **Savings Goal Jars & Target Predictor** | สร้างกระปุกออมเงินตามเป้าหมาย จัดสรรเงินเข้ากระปุกออม และคำนวณวันที่คาดว่าจะเก็บเงินครบเป้าหมาย | `FR-09, BR-07` |

### 🔵 Sprint 3 (`F-10` ถึง `F-12` — 3 ฟีเจอร์สมบูรณ์ด้านบิลประจำเดือน กราฟวิเคราะห์ และปิดงวดบัญชี)
| Feature ID | Feature Name | รายละเอียดการทำงาน | Related Requirements |
| :--- | :--- | :--- | :--- |
| **`F-10`** | **Recurring Bills & Monthly Due Reminder** | ตั้งรายการบิลประจำเดือนและค่าสมาชิก พร้อมระบบแจ้งเตือนเมื่อใกล้ถึงวันครบกำหนดชำระ | `FR-10` |
| **`F-11`** | **Financial Analytics Dashboard & CSV Export** | แดชบอร์ดกราฟวิเคราะห์กระแสเงินสดรายเดือน/รายวัน เปรียบเทียบเดือนก่อนหน้า และส่งออกรายการเดินบัญชีเป็นไฟล์ CSV | `FR-11, NFR-04` |
| **`F-12`** | **Fiscal Month-End Closing Lock & Admin Unlock** | ล็อกงวดบัญชีสิ้นเดือน (`CLOSED`) กันการเผลอแก้ไขรายการย้อนหลัง พร้อมระบบขอให้ `ADMIN` ช่วยปลดล็อกเมื่อกดล็อกผิดพลาด | `FR-12, BR-08, NFR-05` |

---

## 🛡️ กฎธุรกิจหลักและการอุดช่องโหว่ทั้ง 6 จุด (`BR-01` – `BR-08`) เรียงตาม Sprint

1. **`BR-01` (Monetary Precision & Category Match — Sprint 1):** `amount > 0.00`, `initial_balance >= 0.00`, และ `transaction.type` ต้องตรงกับ `category.type` เสมอ (`422 CATEGORY_TYPE_MISMATCH`)
2. **`BR-02` (No Folder Overdraft & Atomic Concurrency Guard — Sprint 1):** ห้ามบันทึกรายจ่ายเกิน `current_balance` ของโฟลเดอร์ (`422 INSUFFICIENT_WALLET_BALANCE`) และใช้ Atomic Conditional Row Update ป้องกัน Race Condition
3. **`BR-03` (Bidirectional RBAC & Strict Privacy Isolation — Sprint 1):** `USER` เห็นเฉพาะโฟลเดอร์ของตนเอง; `ADMIN` ห้ามเปิดดูโฟลเดอร์หรือรายการเงินส่วนตัวของ `USER` (`403 FORBIDDEN`); และ `USER` ห้ามเรียก API สร้างหมวดหมู่กลางหรือสูตรจัดงบของ `ADMIN` (`403 FORBIDDEN`)
4. **`BR-04` (Double-Check Move Transaction Two-Way Balance Sufficiency — Sprint 1):**
   - การย้ายรายการข้ามโฟลเดอร์ (`POST /api/transactions/:id/move`) ต้องส่ง `confirmed: true` (`400 CONFIRMATION_REQUIRED`)
   - ย้าย `EXPENSE` (`A -> B`): ต้องเช็ก `B.current_balance >= amount` (`422 INSUFFICIENT_TARGET_BALANCE`) แล้วคืนเงินให้ A พร้อมหักเงินจาก B แบบ Atomic
   - ย้าย `INCOME` (`A -> B`): ต้องเช็ก `A.current_balance >= amount` (`422 INSUFFICIENT_SOURCE_BALANCE`) แล้วหักเงินจาก A พร้อมบวกเงินเข้า B แบบ Atomic
5. **`BR-05` (Double-Check Cancel & Trash Restore Balance Integrity — Sprint 1):**
   - การยกเลิก (`POSTED -> CANCELED`) และการกู้คืน (`CANCELED -> POSTED`) ต้องส่ง `confirmed: true` และห้ามกดซ้ำในสถานะเดิม (`409 INVALID_TRANSACTION_STATE`)
   - ยกเลิก `INCOME`: โฟลเดอร์ต้องมียอดคงเหลือ `>= amount` ให้หักออกโดยไม่ติดลบ (`422 INSUFFICIENT_BALANCE_TO_CANCEL`)
   - กู้คืน (`Restore`) `EXPENSE` จากถังขยะ: โฟลเดอร์ต้องมียอดคงเหลือ `>= amount` ให้หักใหม่โดยไม่ติดลบ (`422 INSUFFICIENT_BALANCE_TO_RESTORE`)
6. **`BR-06` (Double-Check Folder Archive Protection — Sprint 1):** โฟลเดอร์ที่มีธุรกรรมค้างอยู่ห้ามลบแบบ Hard Delete ต้องใช้การเก็บเข้ากรุ (`Archive`) แบบ Double-Check หรือย้ายธุรกรรมออกก่อน
7. **`BR-07` (Savings & Transfer Separation — Sprint 2):** การโอนเงินข้ามโฟลเดอร์ (`F-08`) และการหยอดกระปุกออมเงิน (`F-09`) ไม่นับรวมเป็นรายจ่ายสิ้นเปลือง (`EXPENSE`)
8. **`BR-08` (Closed Fiscal Period Immutability — Sprint 3):** ห้ามเพิ่ม ย้าย ยกเลิก หรือกู้คืนธุรกรรมในเดือนที่ปิดงวดบัญชี (`CLOSED`) แล้ว (`422 PERIOD_CLOSED`)
