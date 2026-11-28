# Central Visual Contract v1

สถานะ: **Phase 1 draft · contract only · ยังไม่เริ่มแก้ CSS/runtime**  
Baseline: `a227435`  
Rebuild branch: `feat/central-visual-system-rebuild`  
วันที่: 2026-11-28

เอกสารนี้กำหนดภาษาภาพกลางของ BB STORE ก่อนเริ่มย้ายโค้ดจริง จุดประสงค์คือให้ทุกห้องใช้ visual system เดียวกันจากค่ากลาง โดยไม่เปลี่ยน business logic, source-of-truth, database workflow หรือ Mobile Inbox

---

## 1. หลักการที่ล็อกไว้

1. **Dark Base เป็นโครงสร้าง ไม่ใช่ Theme สี** — พื้นฐานของเว็บต้องมืด คุม contrast และ hierarchy เหมือนกันทุกห้อง
2. **Accent Theme เป็น identity เท่านั้น** — Crimson, Amber, Moss, Violet, Cyan เปลี่ยน accent, border, glow, button, selected และ status ที่เกี่ยวข้อง ไม่ย้อม canvas หรือ card ทั้งใบ
3. **Background เป็นบรรยากาศชั้นหลังสุด** — space/animated atmosphere ต้องมองเห็นใน canvas และ gutter แต่ห้ามกลบข้อมูลและห้ามถูก surface ทึบปิดจนหาย
4. **Card Style เป็นวัสดุ** — คุม opacity, blur, radius, density และ shadow ของ card ไม่ใช่เลือกสี theme ใหม่
5. **Frame เป็นขอบ** — คุมเส้นขอบ/กรอบ/ornament เท่านั้น ไม่เปลี่ยน layout หรือ business content
6. **State สีเป็น semantic** — success/warning/danger/info ไม่ผูกกับ accent profile แบบสุ่ม
7. **ทุกค่าต้องไหลผ่าน token กลาง** — ห้ามสร้าง CSS override ชุดใหม่เพื่อแก้เฉพาะหน้า
8. **Preview ใช้ renderer เดียวกับของจริง** — Secret Gallery ต้องแสดง Card Shell/Panel Shell ตัวเดียวกับห้องปฏิบัติการจริง
9. **Mobile Inbox เป็น protected root** — ไม่ให้ desktop visual contract ทับโดย selector กว้าง
10. **Appearance แยกจาก business** — Draft/Preview/Apply/Reset แตะเฉพาะ appearance selections และ catalog ที่เกี่ยวข้อง

---

## 2. Layer order กลาง

ทุก desktop room ที่อยู่ใน scope ต้องอ่าน visual layer ตามลำดับนี้:

```text
L0  App Canvas / viewport
L1  Background Atmosphere
L2  Dark Base + Gutter
L3  Room Surface / page wrapper
L4  Panel Shell
L5  Card Material
L6  Frame / border treatment
L7  Accent identity
L8  Semantic state
L9  Content / controls / interaction feedback
```

กติกาสำคัญ:

- L1 อยู่หลัง content เสมอ และใช้ opacity/overlay ที่อ่านค่าได้จาก token
- L2 เป็นสีดำหรือ dark base กลาง ไม่ใช้ accent gradient เป็นพื้นหลัก
- L3–L5 ต้องเป็น dark/translucent surface ที่ยังเห็น L1 บางส่วนได้
- L6–L8 เป็นชั้นเน้นสายตา ใช้เท่าที่จำเป็น ไม่เติม glow ทุกจุด
- ไม่มี room-specific layer ใดข้ามลำดับนี้โดยไม่มีเหตุผลใน contract

---

## 3. Token contract

ค่าตัวเลขด้านล่างเป็น semantic baseline สำหรับ implementation ชุดแรก ไม่ใช่ค่าที่หน้าใดจะ hard-code เอง การปรับภายหลังให้ปรับที่ profile/token source กลาง

### 3.1 Canvas และ background

| Token | หน้าที่ | Default semantics |
|---|---|---|
| `--app-canvas` | สีฐาน viewport | ดำเกือบสนิทสำหรับพื้นที่ที่ไม่มี atmosphere |
| `--app-background` | background layer หลัก | สี/ภาพ/space profile ที่เลือก |
| `--app-background-opacity` | ความชัดของ atmosphere | ต่ำพอให้ข้อความและ card ชัด |
| `--app-background-overlay` | overlay ช่วย readability | dark neutral ไม่ใช่ accent |
| `--app-gutter` | ช่องว่างระหว่าง panel/card | `--app-canvas` หรือ background กลาง |
| `--app-gutter-opacity` | ระดับการเห็น background ใน gutter | ใช้กับ atmosphere เท่านั้น |
| `--app-content-max-width` | ความกว้าง content กลาง | ไม่ให้แต่ละห้องกำหนด visual width เองโดยไม่มีเหตุผล |

**ห้าม:** ใช้ `--accent-*` เป็นค่า default ของ canvas, gutter หรือ page background

### 3.2 Dark Base และ room surface

| Token | หน้าที่ | Default semantics |
|---|---|---|
| `--dark-base-0` | deep canvas | ดำสนิท/ดำอมกรม |
| `--dark-base-1` | room wrapper | dark neutral |
| `--dark-base-2` | elevated room surface | dark neutral ที่แยกจาก canvas เล็กน้อย |
| `--room-surface` | พื้นผิว room | dark translucent |
| `--room-surface-muted` | พื้นผิวรอง/empty region | dark กว่า room surface |
| `--room-surface-raised` | surface ยกขึ้น | ใช้กับ detail/inspector |
| `--room-overlay` | overlay เฉพาะ room | neutral เท่านั้น |

### 3.3 Card material

| Token | หน้าที่ | Default semantics |
|---|---|---|
| `--card-surface` | card หลัก | dark translucent ไม่ใช่สี accent |
| `--card-surface-raised` | card ที่ selected/ยกขึ้น | dark translucent สว่างขึ้นเล็กน้อย |
| `--card-surface-muted` | card รอง/disabled | dark และ contrast ต่ำลง |
| `--card-border` | border ปกติ | neutral หรือ accent ที่ลดความเข้ม |
| `--card-border-strong` | border active/selected | accent identity |
| `--card-opacity` | opacity ของ material | มาจาก Card Style profile |
| `--card-blur` | backdrop blur | มาจาก Card Style profile |
| `--card-shadow` | depth shadow | neutral dark เป็นหลัก |
| `--card-radius` | มุม card | มาจาก Card Style profile |
| `--card-padding` | inner spacing | มาจาก density/spacing profile |

กติกา: Card ต้องยังแยกตัวจาก background ได้ แต่ background ต้องไม่หายเพราะ card ทึบเต็มใบ

### 3.4 Panel และ frame

| Token | หน้าที่ | Default semantics |
|---|---|---|
| `--panel-surface` | panel ใหญ่ | dark translucent หนักกว่า card เล็กน้อย |
| `--panel-border` | border panel | neutral/accent ต่ำ |
| `--panel-radius` | radius panel | scale เดียวกับ card |
| `--panel-padding` | padding panel | spacing scale กลาง |
| `--frame-color` | สี frame/ornament | accent หรือ neutral ตาม Frame profile |
| `--frame-opacity` | ความเข้ม frame | ต่ำกว่าข้อความหลัก |
| `--frame-width` | ความหนา frame | บางเป็น default |
| `--frame-glow` | glow frame | ปิด/ต่ำเป็น default |

Frame ห้ามเปลี่ยน background, card opacity, layout หรือข้อมูล

### 3.5 Accent และ semantic state

| Token | หน้าที่ |
|---|---|
| `--accent-primary` | identity หลักของ profile |
| `--accent-secondary` | identity รอง/gradient จุดเล็ก |
| `--accent-soft` | selected/hover background แบบโปร่ง |
| `--accent-contrast` | สีข้อความบน accent |
| `--accent-glow` | glow ที่ควบคุมได้ |
| `--state-success` | สำเร็จ/พร้อมส่ง |
| `--state-warning` | รอตรวจ/มีความเสี่ยง |
| `--state-danger` | ผิดพลาด/ส่งไม่ได้ |
| `--state-info` | ข้อมูล/กำลังทำงาน |
| `--state-neutral` | inactive/ไม่ระบุสถานะ |

Semantic state ต้องไม่ถูกแทนด้วย accent เพียงเพราะ profile เปลี่ยนสี

### 3.6 Typography

| Token | หน้าที่ |
|---|---|
| `--text-primary` | เนื้อหาหลัก/ตัวเลขสำคัญ |
| `--text-secondary` | label และคำอธิบาย |
| `--text-muted` | metadata/empty hint |
| `--text-on-accent` | ข้อความบน button/accent surface |
| `--text-link` | ลิงก์/interactive text |
| `--font-display` | heading/room identity |
| `--font-body` | เนื้อหาและข้อมูล |
| `--font-mono` | order ID, tracking, technical value |
| `--text-xs` ถึง `--text-3xl` | type scale กลาง |
| `--line-height-tight`, `--line-height-normal` | line-height กลาง |

Typography ไม่ควรเปลี่ยนเมื่อสลับ Accent Theme เว้นแต่ Style profile ระบุไว้ชัดเจน

### 3.7 Controls และ interaction

| Token | หน้าที่ |
|---|---|
| `--control-surface` | input/select/button base |
| `--control-surface-hover` | hover surface |
| `--control-surface-active` | pressed/active surface |
| `--control-border` | control border |
| `--control-focus` | focus ring |
| `--control-disabled` | disabled surface/text |
| `--control-radius` | control radius |
| `--control-height-sm`, `--control-height-md`, `--control-height-lg` | ขนาด control |

กติกา interaction:

- hover: เพิ่ม contrast เล็กน้อย ไม่กระพริบหรือเปลี่ยนพื้นทั้งหน้า
- focus: ต้องเห็นชัดด้วย `--control-focus` และต้องใช้ keyboard ได้
- selected: ใช้ accent border/soft fill ไม่ใช้สีทึบกลบ card
- disabled: ลด opacity และห้ามใช้สีเดียวกับ danger
- loading: ใช้ state info/neutral และไม่ทำ layout กระโดด
- error: ใช้ state danger พร้อมข้อความ ไม่พึ่งสีอย่างเดียว

---

## 4. Spacing, radius และ density

### Spacing scale

```text
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

### Radius scale

```text
--radius-none: 0px
--radius-sm: 6px
--radius-md: 10px
--radius-lg: 14px
--radius-xl: 18px
--radius-pill: 999px
```

ค่า default สำหรับ operational desktop:

- card: `--radius-lg`
- panel: `--radius-xl`
- input/button: `--radius-md`
- badge/status: `--radius-pill`
- frame: ใช้ radius ของ surface ที่ครอบอยู่ ไม่สร้าง radius ใหม่ลอย ๆ

### Card density profiles

- `balanced`: padding/spacing กลาง อ่านง่าย เป็น default
- `glass`: opacity/blur เด่นขึ้น แต่ยังคง dark base
- `dense`: padding ต่ำลงสำหรับ ops/table-heavy room
- `solid`: opacity สูงขึ้นสำหรับจุดที่ต้องการ readability แต่ยังไม่เป็นสี accent เต็มใบ

---

## 5. Profile responsibilities

### Dark Base System

ควบคุม canvas, gutter, room surface, text contrast, default shadow และ base typography ทุกห้องร่วมกัน

### Accent Theme

ควบคุมเฉพาะ `--accent-*`, border active, focus ring, selected state, button emphasis และ accent status mapping ที่ได้รับอนุญาต

ชุดเริ่มต้น:

- Crimson
- Amber
- Moss
- Violet
- Cyan

### Background / Atmosphere

ควบคุมภาพ/animation/gradient ชั้น L1, opacity, overlay และ reduced-motion fallback ต้องไม่สร้าง card style หรือเปลี่ยน text contrast โดยตรง

### Card Style

ควบคุม material: opacity, blur, shadow, radius, padding และ density เท่านั้น ไม่กำหนด theme hue ใหม่

### Frame

ควบคุม border width, ornament, line style, frame opacity และ glow เท่านั้น ไม่เปลี่ยน layout หรือ surface fill

### Motion

ควบคุม background drift, subtle pulse, transition duration/easing และ loading motion ต้องมี reduced-motion mode

---

## 6. Scope และ fallback

ลำดับค่าที่ใช้จริง:

```text
Room Applied
  → Global Applied
    → Default Dark Base + Default Accent + Default Card Material
```

Draft จะอยู่เหนือ Applied เฉพาะใน Preview renderer:

```text
Room Draft / Global Draft
  → Room Applied / Global Applied
    → Default
```

กติกา:

- Draft ห้ามเขียนลง appearance table จนกด Apply
- Apply Room เปลี่ยนเฉพาะ room scope
- Apply Global เปลี่ยน global scope และ room ที่ไม่มี override
- Reset Room ล้าง room selection เพื่อกลับ fallback
- Restore Global คืน global baseline
- Restore All ล้างเฉพาะ appearance selections/catalog references ที่ได้รับอนุญาต
- ห้ามมี fallback ไป business table หรือเปลี่ยน query/action ใด ๆ

### Scope marker ที่ต้องใช้ใน implementation

Desktop visual roots ต้องมี explicit scope เช่น:

```text
[data-visual-scope="desktop-app"]
[data-visual-room="orders"]
[data-visual-surface="canvas|room|panel|card|control"]
```

Mobile Inbox ต้องอยู่นอก desktop scope หรือมี explicit protected marker และห้ามใช้ global selector ที่จับ `body`, `[data-slot="card"]` หรือ `.card` แบบไร้ขอบเขตกับ mobile

---

## 7. Component contract

### Global Canvas

รับผิดชอบ L0–L2 เท่านั้น: viewport, atmosphere, dark base และ gutter

### Room Shell

รับผิดชอบ room surface, page spacing, max-width และ responsive container

### Panel Shell

รับผิดชอบ section/panel surface, border, padding, radius และ header slot

### Card Shell

รับผิดชอบ card material, frame hook, selected/hover/disabled state และ content slots

### Section Header

ใช้ typography hierarchy เดียวกัน มี title, eyebrow, description และ action slot

### Button / Input / Select / Badge

ใช้ control token และ state semantic กลาง ห้ามกำหนดสี accent แบบ hard-coded รายหน้า

### Table / List / Detail

แบ่ง surface เป็น header/body/row/selected/empty/loading/error ด้วย token เดียวกัน และต้องไม่ทำให้ข้อมูลหรือ sorting/filter logic เปลี่ยน

---

## 8. Accessibility และ motion

- ข้อความหลักต้องมี contrast กับ card surface ตามมาตรฐานที่ตรวจได้
- สถานะต้องมี icon/label/ข้อความร่วมกับสีเมื่อเป็นไปได้
- `:focus-visible` ต้องเห็นชัด
- `prefers-reduced-motion: reduce` ต้องปิด/ลด background motion, glow pulse และ transition ที่ไม่จำเป็น
- ไม่มี animation ที่ทำให้ข้อมูล operational อ่านยากหรือ layout สั่น
- ไม่ใช้ glow เป็นตัวบอกสถานะเพียงอย่างเดียว

---

## 9. Acceptance tests ก่อนเริ่ม Phase 2

1. เปลี่ยน Accent Crimson → Amber แล้ว canvas, gutter และ card material ไม่ถูกย้อมตาม
2. เปลี่ยน Accent Amber → Moss แล้ว base/surface hierarchy คงเดิม
3. เปลี่ยน Background แล้ว gutter/space เปลี่ยน แต่ข้อมูลยังอ่านได้
4. เปลี่ยน Card Style แล้ว card จริงใช้ opacity/blur/radius/density ใหม่
5. เปลี่ยน Frame แล้วเปลี่ยนเฉพาะกรอบ/ขอบ
6. Draft/Preview ไม่เปลี่ยน Applied state จนกด Apply
7. Reset Room กลับ Global/Default ตาม fallback
8. Restore Global/All ไม่แตะ business data
9. Secret Gallery preview ใช้ Card Shell เดียวกับ operational room
10. Mobile Inbox ไม่ถูก desktop selector ทับ
11. ไม่มี token ใดมีความหมายซ้ำกับ token อื่นโดยไม่ประกาศ alias
12. Build, typecheck, `git diff --check` และ visual smoke test ผ่าน

---

## 10. Implementation gate

ยัง **ห้าม** ทำสิ่งต่อไปนี้จนกว่า contract นี้จะได้รับการตรวจ:

- แก้ `index.css`
- สร้าง/เปลี่ยน `GlobalThemeRuntime`
- เปลี่ยน `appearance-runtime`
- ลบ legacy CSS
- เปลี่ยน selector ของ Mobile Inbox
- ย้าย room ใดเข้า visual wrapper จริง

หลัง contract ผ่าน จุดเริ่ม Phase 2 คือสร้าง token/profile source ที่ไม่มีผลต่อ runtime เดิมก่อน แล้วจึงทำ adapter/renderer กลางแบบ rollback ได้
