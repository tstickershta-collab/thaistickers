# ThaiStickers — คู่มือนำเว็บขึ้นโฮสติ้ง

เว็บใหม่มีสินค้า 5 หมวด หน้าเตรียมบรีฟงาน และหลังบ้านจัดการรูป 6 ตำแหน่ง
ยังไม่มีระบบรับชำระเงินหรือรับออเดอร์อัตโนมัติ ลูกค้าติดต่อผ่าน Facebook และโทรศัพท์

## Render Free — ทดลองก่อน (ค่าเริ่มต้น)

render.yaml ตั้ง plan: free ไม่มีดิสก์หรือบริการเสียเงิน และให้ Render สร้าง ADMIN_PASSWORD
ใช้ RENDER_EXTERNAL_URL อัตโนมัติ ไม่จำเป็นต้องรู้ URL ก่อน deploy
หน้าเว็บ รูปเริ่มต้น และการสร้างบรีฟใช้งานได้ หลังบ้านปิดการอัปโหลดเพื่อไม่ให้บันทึกรูปลงดิสก์ชั่วคราว
ดู ADMIN_PASSWORD ใน Environment ของ Render โดยไม่ส่งรหัสผ่านในแชต
หากสร้าง Web Service ด้วยตนเองให้ตั้ง ADMIN_PASSWORD เป็นรหัสสุ่มอย่างน้อย 16 ตัว
เมื่อเพิ่ม custom domain ตั้ง SITE_ORIGIN ให้ตรง URL ที่ใช้งานจริง

## Render แบบมีดิสก์ถาวร — สำหรับหลังบ้านอัปโหลดรูป

ใช้ render-paid.yaml แทน render.yaml เฉพาะเมื่อยืนยันค่าใช้จ่ายแล้ว


1. นำ source เข้า Git repository ส่วนตัวที่บัญชี Render เข้าถึงได้
2. สร้าง Web Service จาก repository หรือ Blueprint ด้วย render.yaml ตรวจค่าใช้จ่ายก่อนสมัครแพ็กเกจ
3. ใช้ Node 22+, Build `npm run build`, Start `npm start`
4. ตั้ง ADMIN_PASSWORD เป็นรหัสผ่านสุ่มอย่างน้อย 16 ตัว ผ่านเมนู Environment ของโฮสติ้ง
5. ตั้ง SITE_ORIGIN ให้ตรง URL ที่ใช้งานจริง เช่น https://ชื่อโปรเจกต์.onrender.com ระหว่างทดสอบ
6. เชื่อม Persistent Disk ที่ /var/data และตั้ง DATA_DIR=/var/data/thaistickers
7. เปิด /admin แล้วใช้ชื่อผู้ใช้ admin กับรหัสผ่านที่ตั้งไว้
8. ทดสอบอัปโหลดรูป รีสตาร์ทหรือ deploy อีกครั้ง แล้วตรวจว่ารูปยังอยู่
9. เพิ่ม custom domain thaistickers.com ในโฮสติ้ง ทำตาม DNS ที่โฮสติ้งแสดง รอ HTTPS พร้อม แล้วเปลี่ยน SITE_ORIGIN เป็น https://thaistickers.com
10. เลือกชื่อหลักระหว่าง www และไม่มี www แล้วตั้ง redirect ให้ไปชื่อหลัก

## Railway

ใช้ build/start เดียวกัน ตั้ง Environment ตาม .env.example และแนบ Volume ตั้ง DATA_DIR ให้ตรง mount path
มี railway.json สำหรับคำสั่ง build/start และ health check แล้ว ค่าแพ็กเกจและการใช้งานคิดแยกตามผู้ให้บริการ

## รูปและการสำรอง

เก็บรูปอัปโหลดใน DATA_DIR ภายนอก checkout เก็บประวัติรูปก่อนเปลี่ยนหรือคืนค่าใน history/ ด้วย
การเก็บประวัติไม่แทน backup: ตั้งสำรอง persistent disk/volume ไปอีกที่ตามความเหมาะสม
ห้ามใช้ filesystem ชั่วคราวของเครื่องเป็นที่เก็บถาวร
รูปเริ่มต้นใน assets/ มาจากเพจ Facebook ที่เจ้าของให้ใช้; อีก 3 หมวดยังเป็นภาพประกอบ

## Vercel

ยังไม่ควรใช้ adapter นี้บน Vercel โดยตรง เพราะใช้ Node server ที่รันต่อเนื่องและ persistent disk
หากเลือก Vercel ต้องเปลี่ยนเป็น serverless adapter และใช้ object storage ภายนอกสำหรับรูป

## ก่อนเปิดใช้จริง

ยืนยันชื่อแบรนด์ เบอร์ติดต่อ รายละเอียดสินค้า วัสดุ และราคา รวมถึงเปลี่ยนภาพประกอบที่ยังเหลือ
ยังไม่ได้เชื่อมโดเมน thaistickers.com หรือสร้างบัญชีโฮสติ้งให้ผู้ใช้
