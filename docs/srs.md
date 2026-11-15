# Part A: Software Requirements Specification (SRS) and Product Scope (`docs/srs.md`)
**Product Name:** CandyCash — Smart Personal Money & Expense Logging System (`v2.0 Final`)  
**Theme:** Personal Money and Expense Logging System (CPE 334 Deliverable 1)

## 1. Stakeholder Problem & Chosen Context
เว็บหรือแอปจดบันทึกรายรับ-รายจ่ายทั่วไปมักมีแค่ฟอร์มกรอกข้อมูลธรรมดาที่ยอมให้คีย์รายจ่ายจนยอดเงินติดลบ เวลาจดผิดโฟลเดอร์ก็ต้องลบแล้วพิมพ์ใหม่ทั้งหมด เวลาเผลอกดลบรายการทิ้งก็กู้คืนไม่ได้ และไม่ช่วยคำนวณว่าจากงบที่เหลือในเดือนนี้ "วันนี้ยังใช้เงินได้อีกกี่บาท"

**CandyCash** คือเว็บสมุดจดบันทึกรายรับ-รายจ่ายส่วนตัวอัจฉริยะ (ไม่ได้ผูกกับธนาคารจริง แต่ให้ผู้ใช้สร้างโฟลเดอร์จำลองเพื่อจดบันทึกและบริหารเงินด้วยตนเอง) ที่มีเกราะป้องกันยอดเงินติดลบ ระบบยืนยัน 2 ชั้น (**Double-Check**) เวลาจะยกเลิกหรือย้ายรายการข้ามโฟลเดอร์ ถังขยะสำหรับกู้คืนรายการที่ยกเลิก ตัวคำนวณงบใช้จ่ายรายวันอัตโนมัติ (**Daily Safe-to-Spend**) และมี `ADMIN` คอยอำนวยความสะดวกเรื่องหมวดหมู่กลางและสูตรจัดงบมาตรฐาน

## 2. Actors and Responsibilities
| Actor / Role | Role Code | Responsibilities |
| :--- | :--- | :--- |
| **Personal Account Owner** | `USER` | สร้างโฟลเดอร์/กระเป๋าบันทึกเงินส่วนตัว (เลือกสีและไอคอนได้), จดบันทึกรายรับ-รายจ่ายผ่านฟอร์มมาตรฐานพร้อมระบุหมวดหมู่และบันทึกช่วยจำ, ยกเลิกรายการหรือย้ายรายการข้ามโฟลเดอร์ด้วยตนเองผ่านระบบ **Double-Check**, กู้คืนรายการที่ยกเลิกจากถังขยะ, ตั้งงบรายเดือนหรือเลือกใช้สูตรจัดงบแนะนำเพื่อดูยอดที่ใช้ได้ต่อวัน, ตั้งกระปุกออมเงิน และดูรายงานสรุปผล |
| **System & Catalog Administrator** | `ADMIN` | สร้างและจัดการหมวดหมู่มาตรฐานกลางของระบบ (`System Categories`), สร้างและอัปเดต **สูตรจัดงบแนะนำ (`Starter Budget Templates`)** เพื่ออำนวยความสะดวกให้ `USER` นำไปใช้งาน และช่วยเหลือจัดการปลดล็อกบัญชี/งวดบัญชีเมื่อ `USER` แจ้งปัญหาเข้ามา โดยไม่มีสิทธิ์เข้าถึงโฟลเดอร์หรือรายการเงินส่วนตัวของ `USER` |

## 3. Functional Requirements (`FR-01 .. FR-12` — เรียงลำดับตาม Sprint 1 &rarr; Sprint 2 &rarr; Sprint 3)
| ID | Requirement Description (Observable Behavior) | Planned Sprint |
| :--- | :--- | :--- |
| **FR-01** | **Authentication & Session Identity:** ผู้ใช้สามารถ Login ด้วย Email/Password, ตรวจสอบตัวตนและ Role ปัจจุบัน (`GET /api/auth/me` คืนค่า `USER` หรือ `ADMIN`) และ Logout เพื่อล้าง Session Cookie ได้ | Sprint 1 |
| **FR-02** | **Custom Expense Folders / Wallets:** `USER` สามารถสร้างโฟลเดอร์บันทึกเงินส่วนตัว (ระบุชื่อ, ประเภท, สี, ไอคอน และยอดเงินตั้งต้น `>= 0`), ดูยอดคงเหลือแต่ละโฟลเดอร์และยอดรวมสุทธิ รวมถึงกดเก็บโฟลเดอร์เข้ากรุ (`Archive`) แบบ Double-Check ได้ | Sprint 1 |
| **FR-03** | **Atomic Income & Expense Transaction Logging:** `USER` บันทึกรายรับ-รายจ่ายลงโฟลเดอร์ผ่านฟอร์มมาตรฐาน (ระบุหมวดหมู่ จำนวนเงิน วันที่ และบันทึกช่วยจำ) โดยระบบตรวจสอบประเภทหมวดหมู่และปรับยอด `current_balance` ทันทีแบบ Atomic | Sprint 1 |
| **FR-04** | **Self-Service Double-Check Move & Cancel Transaction:** `USER` สามารถกดยกเลิกรายการ (`Cancel`) หรือย้ายรายการไปอีกโฟลเดอร์ (`Move`) ได้ด้วยตนเองผ่านขั้นตอน Double-Check (แสดงยอดเงินก่อน-หลัง และส่ง `confirmed: true`) โดยไม่ต้องพิมพ์เหตุผลและไม่ต้องรอ Admin | Sprint 1 |
| **FR-05** | **Trash History & Double-Check Restore:** รายการที่ถูกยกเลิก (`CANCELED`) จะแสดงในแท็บถังขยะ (Trash History) โดย `USER` สามารถกดกู้คืน (`Restore`) แบบ Double-Check เพื่อนำรายการกลับมาคิดเงินตามเดิมได้ | Sprint 1 |
| **FR-06** | **Daily Safe-to-Spend, Search/Filter & Admin Catalog/Templates:** `USER` ตั้งงบรวมประจำเดือน (หรือเลือกใช้สูตรจัดงบจาก `ADMIN`) เพื่อดูตัวเลข *"งบที่ใช้ได้ในวันนี้ (`Daily Safe-to-Spend`)"*, กราฟสัดส่วนรายจ่าย และตัวกรองค้นหา; ส่วน `ADMIN` จัดการหมวดหมู่กลางและสูตรจัดงบแนะนำได้ | Sprint 1 |
| **FR-07** | **Category Budget Envelopes & Over-Budget Guardrail:** `USER` ซอยงบรายเดือนแยกตามหมวดหมู่ย่อย พร้อมแถบสีสถานะ (เขียว/เหลือง/แดง) และการเตือนแบบ Double-Check เมื่อรายจ่ายทะลุงบ | Sprint 2 |
| **FR-08** | **Atomic Inter-Wallet Transfer:** `USER` โอนเงินข้ามระหว่างโฟลเดอร์ 2 ใบของตนเองโดยหักต้นทางและบวกปลายทางพร้อมกันแบบ Atomic | Sprint 2 |
| **FR-09** | **Savings Goal Jars, PIN-Locked Spending Folders & Batch Archive:** `USER` สร้างกระปุกออมเงินตามเป้าหมาย, จัดสรรเงินเข้ากระปุก (`SAVINGS_ALLOCATION`), ดูจำนวนวันที่คาดว่าจะออมครบเป้า, เปิดระบบล็อกโฟลเดอร์ด้วยรหัส PIN เพื่อป้องกันการเผลอนำเงินเก็บไปใช้จ่าย และสามารถเลือกหลายโฟลเดอร์พร้อมกันเพื่อจัดเก็บเข้ากรุ (`Batch Archive`) พร้อมหน้าต่าง Double-Check ทวนรายการ | Sprint 2 |
| **FR-10** | **Recurring Bills & Monthly Due Reminder:** `USER` ตั้งรายการบิลประจำเดือน (เช่น ค่าหอ, ค่าไฟ, อินเทอร์เน็ต) เพื่อรับการแจ้งเตือนเมื่อใกล้ถึงวันครบกำหนดชำระ | Sprint 3 |
| **FR-11** | **Financial Analytics Dashboard & CSV Export:** แสดงกราฟสรุป Cashflow รายเดือน/รายวัน เปรียบเทียบเดือนก่อนหน้า และส่งออกรายการเดินบัญชีเป็นไฟล์ CSV | Sprint 3 |
| **FR-12** | **Fiscal Month-End Lock & Admin Unlock Recovery:** `USER` สั่งล็อกงวดบัญชีสิ้นเดือน (`CLOSED`) เพื่อกันการเผลอแก้ข้อมูลเดือนเก่า และสามารถส่งคำขอให้ `ADMIN` ช่วยปลดล็อกเมื่อเผลอกดล็อกผิดได้ | Sprint 3 |

## 4. Business Rules (`BR-01 .. BR-08` — เรียงลำดับตาม Sprint 1 &rarr; Sprint 2 &rarr; Sprint 3)
| ID | Business Rule Definition & Validation Enforcement | Planned Sprint |
| :--- | :--- | :--- |
| **BR-01** | **Monetary Precision, Initial Balance & Category Type Match:** `amount > 0.00` (ทศนิยมไม่เกิน 2 ตำแหน่ง); `initial_balance >= 0.00`; และ `transaction.type` ต้องตรงกับ `category.type` เสมอ (`422 CATEGORY_TYPE_MISMATCH`) | Sprint 1 |
| **BR-02** | **No Folder Overdraft & Atomic Concurrency Rule:** ห้ามบันทึกรายจ่าย (`EXPENSE`) ที่มากกว่า `current_balance` ของโฟลเดอร์ (`422 INSUFFICIENT_WALLET_BALANCE`) และใช้ Atomic Conditional Row Update ป้องกัน Race Condition | Sprint 1 |
| **BR-03** | **Bidirectional Role & Strict Personal Privacy Isolation:** `USER` เข้าถึงและแก้ไขได้เฉพาะโฟลเดอร์และรายการของตนเองเท่านั้น (`403 FORBIDDEN`); `ADMIN` ห้ามเปิดดูโฟลเดอร์หรือรายการรายรับ-รายจ่ายส่วนตัวของ `USER` เด็ดขาด (`403 FORBIDDEN`); และ `USER` ห้ามเรียก API จัดการหมวดหมู่กลางหรือสูตรจัดงบของ `ADMIN` (`403 FORBIDDEN`) | Sprint 1 |
| **BR-04** | **Double-Check Move Transaction Two-Way Balance Sufficiency:** การย้ายรายการข้ามโฟลเดอร์ (`POST /api/transactions/:id/move`) ต้องส่ง `confirmed: true` (`400 CONFIRMATION_REQUIRED`), โฟลเดอร์ต้นทางและปลายทางต้องเป็นคนละใบกันและเป็นของ `USER` คนเดียวกัน: ถ้าย้าย `EXPENSE` (`A -> B`) ต้องเช็ก `B.current_balance >= amount` (`422 INSUFFICIENT_TARGET_BALANCE`); ถ้าย้าย `INCOME` (`A -> B`) ต้องเช็ก `A.current_balance >= amount` (`422 INSUFFICIENT_SOURCE_BALANCE`) | Sprint 1 |
| **BR-05** | **Double-Check Cancel & Trash Restore Balance Integrity:** การยกเลิก (`POSTED -> CANCELED`) และการกู้คืน (`CANCELED -> POSTED`) ต้องส่ง `confirmed: true` และห้ามกดซ้ำในสถานะเดิม (`409`); ยกเลิก `INCOME` ต้องมี `current_balance >= amount` (`422 INSUFFICIENT_BALANCE_TO_CANCEL`); กู้คืน (`Restore`) `EXPENSE` จากถังขยะต้องมี `current_balance >= amount` (`422 INSUFFICIENT_BALANCE_TO_RESTORE`) | Sprint 1 |
| **BR-06** | **Double-Check Folder Archive Protection:** โฟลเดอร์ที่มีธุรกรรมอยู่ข้างในห้ามลบออกจากฐานข้อมูลโดยตรง แต่ต้องใช้การเก็บเข้ากรุ (`Archive`) แบบ Double-Check หรือย้ายรายการออกก่อน | Sprint 1 |
| **BR-07** | **Savings Allocation Separation & Distinct Transfer Rule:** การโอนเงินข้ามโฟลเดอร์ (`F-08`) และการหยอดกระปุกออมเงิน (`F-09`) ไม่นับรวมเป็นรายจ่ายสิ้นเปลือง (`EXPENSE`) ในกราฟค่าใช้จ่ายรายเดือน | Sprint 2 |
| **BR-08** | **Closed Fiscal Period Immutability:** ห้ามเพิ่ม ย้าย ยกเลิก หรือกู้คืนธุรกรรมในเดือนที่ถูกสั่งปิดงวดบัญชี (`CLOSED`) แล้ว (`422 PERIOD_CLOSED`) | Sprint 3 |
| **BR-09** | **Folder PIN Spending Lock Guard:** โฟลเดอร์ที่เปิดระบบล็อก (`is_locked: true`) จะบล็อกการทำรายการรายจ่าย (`EXPENSE`) และการโอนออก (`TRANSFER_OUT`) จนกว่าจะใส่รหัส PIN ยืนยันถูกต้อง (`403 FOLDER_LOCKED_PIN_REQUIRED`) เพื่อป้องกัน impulsive spending | Sprint 2 |
| **BR-10** | **Multi-Select Folder Batch Archive & Double-Check Itemized Guard:** เมื่อผู้ใช้เปิดโหมดเลือกหลายโฟลเดอร์พร้อมกันเพื่อจัดเก็บเข้ากรุ (`Batch Archive`) ระบบต้องมีหน้าต่าง Double-Check แจกแจงรายชื่อโฟลเดอร์ที่เลือก (Itemized Summary) และยอดเงินคงเหลือรวมที่เกี่ยวข้อง โดยต้องส่ง `confirmed: true` เพื่อยืนยันการจัดเก็บ และสามารถกู้คืนกลับมาได้เสมอ (`Reversible Archive Guard`) | Sprint 2 |

## 5. Non-Functional Requirements (`NFR-01 .. NFR-05` — เรียงลำดับตาม Sprint)
| ID | Category | Measurable Target | Verification Method | Planned Sprint |
| :--- | :--- | :--- | :--- | :--- |
| **NFR-01** | Security & RBAC | `100%` ของ Protected Endpoints ปฏิเสธคำขอที่ไม่มี Token (`401`) และคำขอที่ละเมิด Role/Ownership ด้วย `403` โดยไม่หลุดข้อมูลโฟลเดอร์ส่วนตัวของ `USER` | API Integration Tests (`TEST-02, 04, 11, 12`) | Sprint 1 |
| **NFR-02** | Data Integrity & ACID | `0` Balance Drift: การบันทึกธุรกรรม, ย้ายโฟลเดอร์ (`Move`), ยกเลิก (`Cancel`), และกู้คืน (`Restore`) ปรับยอดภายใน ACID Transaction เดียวกัน (`DECIMAL(12,2)`) | Integration & Concurrency Tests (`TEST-05..10`) | Sprint 1 |
| **NFR-03** | Credential Security | รหัสผ่าน Hash ด้วย `bcrypt` (cost >= 10) และส่ง Session JWT ผ่าน `HttpOnly; SameSite=Lax` Cookie เท่านั้น | DB Seed Check & Auth Test (`TEST-01`) | Sprint 1 |
| **NFR-04** | Performance | API ดึงรายการเดินบัญชีและสรุปยอดแดชบอร์ดตอบสนอง `p95 < 300ms` สำหรับข้อมูล 1,000 รายการ | Automated API Benchmark | Sprint 3 |
| **NFR-05** | Portability & Config | `0` hardcoded secrets ใน Git และพร้อมบรรจุลง Docker Container เพื่อขึ้น Google Cloud Run ใน Lab 5 | Secret Scan & Docker Build Check | Sprint 3 |
