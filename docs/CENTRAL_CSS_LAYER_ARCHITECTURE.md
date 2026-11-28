# Central CSS Layer Architecture v1

สถานะ: **opt-in layer · Phase 3/4 foundation**  
ไฟล์ implementation: `client/src/styles/central-visual-system.css`

## Layer order

```text
central-visual.tokens
→ central-visual.structure
→ central-visual.components
→ central-visual.states
→ central-visual.motion
```

### `central-visual.tokens`

เก็บ fallback tokens ของ Dark Base, Background, Room, Panel, Card Material, Accent, State, Typography, Controls, Spacing, Radius, Frame และ Motion

Runtime profile จาก `GlobalThemeRuntime` สามารถเขียนค่าที่เลือกทับ fallback บน `.global-theme-runtime` ได้

### `central-visual.structure`

กำหนด Canvas, Room, Panel และ gutter โดยใช้ explicit markers:

```html
<div data-visual-scope="desktop-app">
  <section data-visual-surface="canvas">
    <section data-visual-surface="room">
      <section data-visual-surface="panel">
```

### `central-visual.components`

มี class contract แบบ opt-in เท่านั้น:

```text
.central-visual-card
.central-visual-section-header
.central-visual-eyebrow
.central-visual-control
.central-visual-button
```

ยังไม่ target:

```text
.neon-card
.project-room-card
[data-slot="card"]
```

เพราะ selector เหล่านั้นยังมี consumer เดิมจำนวนมากและต้อง migrate ห้องทีละห้อง

### `central-visual.states`

ควบคุม hover, focus-visible และ semantic state ผ่าน:

```html
<span data-visual-state="success">
<span data-visual-state="warning">
<span data-visual-state="danger">
<span data-visual-state="info">
```

### `central-visual.motion`

มี reduced-motion guard ระดับ desktop scope โดยปิด animation/transition ที่ไม่จำเป็นเมื่อผู้ใช้เลือก `prefers-reduced-motion: reduce`

## Scope rules

- Desktop ใช้ `[data-visual-scope="desktop-app"]`
- Mobile Inbox ใช้ `[data-visual-scope="mobile-inbox"]`
- ทุก selector ใหม่ต้องอยู่ใต้ desktop scope หรือเป็น class opt-in
- ห้ามใช้ `body`, `html`, `.card`, `[data-slot="card"]` แบบ global เพื่อย้าย visual system
- Mobile Inbox ต้องไม่รับ central desktop styles; มี explicit revert guard สำหรับ central classes

## Migration rules

1. เพิ่ม class/marker ใหม่ก่อน
2. ย้าย component/room หนึ่งกลุ่ม
3. ถ่าย screenshot และตรวจ state
4. ตรวจว่า query/action/data output ไม่เปลี่ยน
5. เมื่อไม่มี consumer ของ legacy selector ในห้องนั้นแล้วจึงลบ selector เดิมเฉพาะจุด
6. ห้ามลบ legacy stylesheet ทั้งไฟล์จนทุก route ผ่าน checklist

## Current state

- CSS layer ถูก import ใน `main.tsx`
- layer เป็น opt-in และไม่ target legacy selectors
- Dashboard canvas มี `data-visual-surface="canvas"`
- runtime มี `data-visual-scope="desktop-app|mobile-inbox"`
- token runtime ถูกล้างเมื่อเปลี่ยนเข้า Mobile Inbox
- ยังไม่มีการย้าย card/page จริงเข้าชุดใหม่ทั้งเว็บ
