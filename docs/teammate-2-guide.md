# Teammate & Peer Review Guide — CandyCash Sprint 1 (Deliverable 1)

เอกสารแนะนำแนวทางการทำงานร่วมกันและการตรวจทานโค้ด (Peer Review & Pair Collaboration Guide) สำหรับทีมพัฒนาโครงงาน CandyCash วิชา CPE 334

---

## 1. ข้อมูลสมาชิกในทีมและการแบ่งบทบาท

| ลำดับ | ชื่อผู้ใช้ GitHub | บทบาทหลักใน Sprint 1 | ความรับผิดชอบหลัก |
| :--- | :--- | :--- | :--- |
| **คนที่ 1** | `@natthakamol1130` | GitHub Lead / Full-Stack Developer | ดูแล Repository, จัดตั้ง Project Board, พัฒนา F-01, F-03, F-05 และเปิด Release PR |
| **คนที่ 2** | `@Suprawi5227` | Code Reviewer / Full-Stack Developer | ตรวจทานโค้ด (Peer Review), พัฒนา F-02, F-04, F-06 และอนุมัติ PR เพื่อผสานโค้ด |

---

## 2. ตารางสลับบทบาทการพัฒนาและตรวจทาน (Role Alternating Matrix)

เพื่อให้เป็นไปตามเกณฑ์การทำงานร่วมกันแบบ Pair Programming / Collaborative Development ทีมงานได้สลับบทบาทระหว่าง Author (ผู้พัฒนา) และ Reviewer (ผู้ตรวจทาน) ในแต่ละฟีเจอร์อย่างเคร่งครัด:

| Issue & PR | รหัสฟีเจอร์ | ชื่อฟีเจอร์ | ผู้พัฒนา (Author) | ผู้ตรวจทาน (Reviewer) | ผลการตรวจทาน |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Issue #1 / PR #2** | `F-01` | Authentication & Role-Based Session Guard | `@natthakamol1130` | `@Suprawi5227` | Approved & Merged |
| **Issue #3 / PR #4** | `F-02` | Custom Expense Folders & Archive Guard | `@Suprawi5227` | `@natthakamol1130` | Approved & Merged |
| **Issue #5 / PR #6** | `F-03` | Atomic Income & Expense Transaction Logging | `@natthakamol1130` | `@Suprawi5227` | Approved & Merged |
| **Issue #7 / PR #8** | `F-04` | Self-Service Double-Check Move & Cancel | `@Suprawi5227` | `@natthakamol1130` | Approved & Merged |
| **Issue #9 / PR #10** | `F-05` | Trash History & Double-Check Restore | `@natthakamol1130` | `@Suprawi5227` | Approved & Merged |
| **Issue #11 / PR #12** | `F-06` | Daily Safe-to-Spend & Admin Catalog | `@Suprawi5227` | `@natthakamol1130` | Approved & Merged |
| **Release PR** | `Sprint 1` | Sprint 1 Final Release (`staging` -> `main`) | `@natthakamol1130` | `@Suprawi5227` | Pending Teammate Merge |

---

## 3. เกณฑ์การตรวจทานโค้ด (Code Review Checklist)

ก่อนที่ Reviewer จะกด Approve และ Merge ในแต่ละ Pull Request ต้องตรวจสอบให้ผ่านเกณฑ์ทั้ง 5 ข้อดังนี้:

1. **TDD Lifecycle Compliance:**
   - ตรวจสอบว่ามี Commit ฝั่ง Red Phase (เขียน Unit/Integration Test ที่ยังไม่ผ่านก่อน)
   - ตรวจสอบว่ามี Commit ฝั่ง Green Phase (เขียน Implementation เพื่อให้การทดสอบผ่านครบ 100%)
2. **Business Rules & Data Integrity Guard:**
   - `BR-01`: ยอดเงินต้องมากกว่า 0 และประเภทธุรกรรมต้องตรงกับประเภทหมวดหมู่
   - `BR-02`: ห้ามบันทึกรายจ่ายเกินยอดคงเหลือในโฟลเดอร์ (Strict Zero Overdraft - HTTP 422)
   - `BR-03`: การแยกสิทธิ์สองทาง (Bidirectional RBAC) - USER ไม่สามารถเข้าถึงโฟลเดอร์ของผู้อื่น และ ADMIN ไม่สามารถดูโฟลเดอร์ส่วนตัวของ USER ได้ (HTTP 403 100% Privacy)
   - `BR-04, BR-05, BR-06`: การย้ายโฟลเดอร์ ยกเลิกรายการ กู้คืนจากถังขยะ และเก็บโฟลเดอร์เข้ากรุ ต้องมีกลไก Double-Check ยืนยันยอดก่อนดำเนินการ (`confirmed: true`)
3. **Automated Test Results:**
   - รันคำสั่ง `npm test` เพื่อตรวจสอบว่าผ่านครบทั้ง 52 การทดสอบในไฟล์ทดสอบ `tests/f01..f06`
4. **TypeScript Strictness:**
   - รันคำสั่ง `npx tsc --noEmit` เพื่อตรวจว่าไม่มีข้อผิดพลาดทางชนิดข้อมูล (0 error)
5. **UI & Accessibility Check:**
   - ตรวจสอบการแสดงผลทั้งโหมดสว่างและโหมดกลางคืน (Light / Dark Midnight Mode)
   - ฟอนต์ภาษาไทยแสดงผลคมชัด เรียบร้อย สระและวรรณยุกต์จัดวางอย่างถูกต้อง

---

## 4. ขั้นตอนการตรวจสอบและผสาน Release PR สำหรับคนที่ 2 (Reviewer)

เมื่อหัวหน้าทีม (@natthakamol1130) เปิด Release PR จาก `staging` ไปยัง `main`:

1. เปิดหน้า Pull Request บน GitHub
2. ไปที่แท็บ **Files changed** เพื่อตรวจทานความถูกต้องของการเปลี่ยนแปลงทั้งหมด
3. ตรวจสอบสถานะการทำงานของ CI / Automated Tests ให้แน่ใจว่าสถานะขึ้นสีเขียวผ่านทั้งหมด
4. ไปที่ปุ่ม **Review changes** แล้วเลือก **Approve** พร้อมระบุข้อความยืนยันการตรวจทาน
5. ทำการกดปุ่ม **Merge pull request** เข้าสู่สาขา `main`
6. ติดป้าย Release Tag `v1.0.0-sprint1` บนสาขา `main` เพื่อเสร็จสิ้นขั้นตอนการส่งงาน Deliverable 1
