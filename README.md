# ThaiStickers

เว็บไซต์สินค้า 5 หมวด พร้อมหลังบ้านจัดการรูปและแบบเตรียมบรีฟงาน

## ทดลองบน Render Free

เชื่อม repository แล้วเลือก Blueprint ใช้ render.yaml (plan: free)

หรือ New → Web Service → Node → Build: `npm run build` → Start: `npm start` → Free

ตั้ง ADMIN_PASSWORD เป็นรหัสสุ่มอย่างน้อย 16 ตัวใน Environment ไม่ต้องส่งรหัสผ่านให้ใคร

ใช้ URL จาก RENDER_EXTERNAL_URL อัตโนมัติ ถ้าเชื่อมโดเมนเองให้ตั้ง SITE_ORIGIN ให้ตรงกับโดเมน

Free ใช้ดูเว็บและรูปเริ่มต้นได้ อัปโหลดรูปจะปิดไว้จนกว่าจะมีพื้นที่เก็บถาวร

## ทดสอบ

Node.js 22 ขึ้นไป ไม่มี dependency เพิ่มเติม

```sh
npm run build
npm test
```

รายละเอียดดู [คู่มือติดตั้ง](DEPLOY-TH.md)
