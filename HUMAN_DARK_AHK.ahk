; ===================================================================
; 🚀 BLACK FOREVER v99 - [รุ่นรื้อรีเจค + F11 เปิดค้างโชว์หน้าจอ]
; ===================================================================
#SingleInstance Force
DetectHiddenWindows True  ; สั่งให้สมองกลมองเห็นหน้าต่างหลังบ้านที่แอบซ่อนอยู่ทั้งหมด
#Requires AutoHotkey v2.0
; ==============================================================================
; 🚀 โซนจัดระเบียบตัวแปรมหาเทพ (คลีนระบบ ห้ามทับซ้อน)
; ==============================================================================
global OrderArray := [], MainGui, MainEdit, EditBox, StatusBox, StatusText
global BaseText := "", ProductListText := "", TotalCOD := 0, CurrentProd := ""
global CurrentStore := "ยังไม่ได้เลือกค่าย"
global CODPrices := [200,220,230,240,250,260,300,350,400,440,460,480,700,720,960,1200]
global DARK_SIDE_MARKETING := "DARK SIDE MARKETING"
global Var_Phone := ""
global CurrentOrderID := ""
; --- ฐานข้อมูลราคา (อ้างอิงตาม Google Sheet ของจารย์) ---
global ProductData := Map(
    "VESS_GREEN_BLACK",       {name: "VESS_GREEN_BLACK", price: 250, emo: "🟢🖤"},
    "SEVIOS_GREEN",           {name: "SEVIOS_GREEN", price: 220, emo: "🟢"},
    "ROYAL_GREEN",            {name: "ROYAL_GREEN", price: 230, emo: "🟢"},
    "MILANO_GREEN",           {name: "MILANO_GREEN", price: 250, emo: "🟢"},
    "VESS_GREEN_SLIMS",       {name: "VESS_GREEN_SLIMS", price: 230, emo: "🟢"},
    "VESS_GREEN",             {name: "VESS_GREEN", price: 260, emo: "🟢"},
    "VOXX_GREEN",             {name: "VOXX_GREEN", price: 300, emo: "🟢"},
    "MOND_GREEN",             {name: "MOND_GREEN", price: 240, emo: "🟢"},
    "CAVALLO_GREEN",          {name: "CAVALLO_GREEN", price: 250, emo: "🟢"},
  
    "VESS_RED",               {name: "VESS_RED", price: 260, emo: "🔴"},
    "SEVIOS_RED",             {name: "SEVIOS_RED", price: 200, emo: "🔴"},
    "ROYAL_RED",              {name: "ROYAL_RED", price: 230, emo: "🔴"},
    "CAVALO_RED",             {name: "CAVALO_RED", price: 230 , emo: "🔴"},
    "SIERRA_RED",             {name: "SIERRA_RED", price: 220, emo: "🔴"},
    "MOND_GOLD",              {name: "MOND_GOLD", price: 230, emo: "🟡"},
    "VESS_GOLD",              {name: "VESS_GOLD", price: 230, emo: "🔴"},
    "PLATINUM_BLACK",         {name: "PLATINUM_BLACK", price: 250, emo: "⚫"},
    "MILANO_KINGS",           {name: "MILANO_KINGS", price: 250, emo: "🔴"},
    "VESS_GOLD",              {name: "VESS_GOLD",price: 230,emo: "🟡"},                                       
                                            
    "OS_WATERMELON",          {name: "OS_WATERMELON", price: 350, emo: "🍉"},
    "OS_PINEAPPLE",           {name: "OS_PINEAPPLE", price: 350, emo: "🍍"},
    "OS_BLUEBERRY",           {name: "OS_BLUEBERRY", price: 350, emo: "🍇"},
    "OS_MANGO",               {name: "OS_MANGO", price: 350, emo: "🥭"},
    "OS_STRAWBERRY",          {name: "OS_STRAWBERRY", price: 350, emo:"🍓"},
    "🟣CAVALLO_TWIN_X_BALL(คาวาโล่ม่วง) 1 คอต",{name: "🟣CAVALLO_TWIN_X_BALL(คาวาโล่ม่วง) 1 คอต ", price: 350, emo: "🟣"},  
    "VESS_CRUSH_MINT.X.MANGO",{name: "VESS_CRUSH_MINT.X.MANGO ", price: 350, emo: "🥭"},             
    "VESS_CRUSH_MINT.X.GRAPE",{name: "VESS_CRUSH_MINT.X.GRAPE", price: 350, emo: "🍇"},
    "VESS_MINT_COOL",         {name: "VESS_MINT_COOL", price: 300, emo: "❄"},
)
; ==============================================================================
; 🚀 โซนเปิดตัวแปรมหาเทพ (ห้ามประกาศซ้ำเด็ดขาด คลีน 100%)
; ==============================================================================
; ==============================================================================
; PART 1: GLOBAL COLOR CONFIGURATION (โซนตั้งค่าสีมหาเทพ - จารย์ปรับเล่นตรงนี้ได้เลย)
; ==============================================================================
; 💡 เทคนิค: ใส่รหัส Hex สีที่ต้องการตรงๆ โดยไม่ต้องใส่เครื่องหมาย # (เช่น ขาว=FFFFFF, ดำ=000000)
DARK_SIDE_MARKETING := {text: "DARK SIDE", w: 120, h: 30, bg: "1A162B", fg: "00FFFF", font: "s11 c00FFFF", center: true, border: true}
; --- สีของกล่องแก้ไข/หน้าจอหลัก ---
Screen_Bg    := "100B1E"   ; สีพื้นหลังหน้าต่างใหญ่ (ม่วงอวกาศเนบิวลา)
Text_Main    := "b5ff6f"   ; สีตัวหนังสือทั่วไป
Box_Bg       := "1A162B"   ; สีพื้นหลังของ 3 หน้าจอคู่ขนาน

; --- กลุ่มปุ่มค่ายสตรีมเมอร์ ---
Store_BtnBg  := "FF007F"   ; สีพื้นหลังปุ่มเลือกค่าย
Store_BtnFg  := "ffe605"   ; สีตัวหนังสือปุ่มเลือกค่าย

; --- กลุ่มปุ่มควบคุมหลัก F10 / F9 ---
F10_BtnBg    := "FF007F"   ; สีพื้นหลังปุ่ม F10 (ชมพูมาเจนต้าดุดัน)
F10_BtnFg    := "ffe605"    ; สีตัวหนังสือ F10
F9_BtnBg     := "8a2be2"   ; สีพื้นหลังปุ่ม F9 (ม่วงนีออนลุ่มลึก)
F9_BtnFg     := "00ff00"   ; สีตัวหนังสือ F9

; --- กลุ่มสินค้าสายเขียว ---
Green_BtnBg  := "8a2be2"   ; สีพื้นหลังสายเขียว
Green_BtnFg  := "00ff00"   ; สีตัวหนังสือสายเขียว (เขียวนีออนเรืองแสง)🟢VESS_GREEN_SLIMS

; --- กลุ่มสินค้าสายแดง ---
Red_BtnBg    := "FF007F"   ; สีพื้นหลังสายแดง
Red_BtnFg    := "ffe605"         ; สีตัวหนังสือสายแดง (แดงสดเด่นชัด)

; --- กลุ่มสินค้า PREMIUM / FRUIT ---
Fruit_BtnBg  := "8a2be2"   ; พื้นหลังสายผลไม้
Fruit_BtnFg  := "00ff00"   ; สีตัวหนังสือสายผลไม้ (ม่วงกล้วยไม้)

; --- กลุ่มปุ่มยิงแก้ COD ---
Cod_BtnBg    := "1A162B"   ; สีพื้นหลังปุ่ม COD
Cod_BtnFg    := "00FFFF"   ; สีตัวหนังสือฟ้าไอซ์บลูเรืองแสง

Combo_BtnBg  := "1A162B"   ; สีพื้นหลังปุ่มคอมโบ (ม่วงดาร์กกลืนกับกล่อง Edit)
Combo_BtnFg  := "00FFFF"   ; สีตัวหนังสือปุ่มคอมโบ (ย้อมฟ้าไซเบอร์เรืองแสงดุดัน!)


; ==============================================================================
; PART 2: INITIALIZATION & WINDOW SETUP (โซนเปิดตัวแปรและสร้างหน้าต่างควบคุม)
; ==============================================================================
global OrderArray := [], MainGui, MainEdit, EditBox, StatusBox, StatusText, CurrentStore := "ยังไม่ได้เลือกค่าย"

MainGui := Gui("+AlwaysOnTop -MaximizeBox", "🛸 แผงพ่นออเดอร์มหาเทพ V2 - บอสป้องจัดให้")
MainGui.BackColor := Screen_Bg
MainGui.SetFont("s11 c" . Text_Main, "Segoe UI")

; --- 📦 3 หน้าจอคู่ขนาน เรียงหน้ากระดานระดับ Zero-Error ---
MainEdit  := MainGui.Add("Edit", "xm y10 w390 h400 ReadOnly -WantReturn -Tabstop Background" . Box_Bg . " cE0B0FF")
EditBox   := MainGui.Add("Edit", "x+10 w390 h400 Background" . Box_Bg . " c" . Text_Main)
StatusBox := MainGui.Add("Edit", "x+10 w390 h400 ReadOnly -WantReturn -Tabstop Background" . Box_Bg . " cff7c02 Center")

; --- 📝 แถวตัวหนังสือสถานะด้านล่างจอ ---
StatusText := MainGui.Add("Text", "xm y+10 w500 h25 c00fff2", "ออเดอร์ในหลุม: 1 รายการ")

; ==============================================================================
; PART 3: TOP CONTROL BUTTONS (เทหลุมดำ F10 / ล้างกระดาน F9 / ตัวคูณคอมโบ)
; ==============================================================================
; - ปุ่มเทหลุมดำแบบ Text-Border ซ่อนขอบระบบ
btnDump  := MainGui.Add("Text", "xm y+15 w120 h30 Background" . F10_BtnBg . " c" . F10_BtnFg . " Center +0x200 Border", "เทหลุมดำ F10")
btnDump.OnEvent("Click", DumpAll)

; - ปุ่มล้างกระดานแบบ Text-Border
btnClean := MainGui.Add("Text", "x+10 w120 h30 Background" . F9_BtnBg . " c" . F9_BtnFg . " Center +0x200 Border", "ล้างกระดาน F9")
btnClean.OnEvent("Click", CleanAll)

ComboWidths := [70, 70, 70, 70, 70, 70, 70,70]
ComboLabels := ["x1", "x2", "x3", "x4", "x5", "x6", "x10"]
for index, label in ComboLabels {
    pos := (index == 1) ? "x+20 w" . ComboWidths[index] : "x+5 w" . ComboWidths[index]
    ; ⚡ สับแจสายพาน: ดึงค่าตัวแปรคุมสีด้านบน ยัดระบบ Text +0x200 Border คลีนขอบระบบหายวับ
    btn := MainGui.Add("Text", pos . " h30 Background" . Combo_BtnBg . " c" . Combo_BtnFg . " Center +0x200 Border", label)
    btn.OnEvent("Click", MultiplyProduct)
}

;; ==============================================================================
; PART 4: STREAMER STORES (เวอร์ชันคัดเนื้อเปลี่ยนเป็นกล่อง Text นีออนดาร์กไซด์)
; ==============================================================================
MainGui.Add("Text", "xm y+15 cff7300", "🏢 เลือกค่ายมือสังหารออเดอร์:")

; ⚡ สับสายแจตรงนี้: เปลี่ยนเป็น Text +0x200 Border เพื่อล้างขอบขาวระบบวินโดวส์ให้เนียนกริบเหมือนหน้าเว็บ

MainGui.Add("Text", "x+10 w120 h35 Background" . Store_BtnBg . " c" . Store_BtnFg . " Center +0x200 Border", "💗เจ๊บี BB").OnEvent("Click", SelectStore)
MainGui.Add("Text", "x+10 w120 h35 Background" . Store_BtnBg . " c" . Store_BtnFg . " Center +0x200 Border", "🅱🅱ร้าน:เจ๊บี ").OnEvent("Click", SelectStore)

MainGui.Add("Text", "x+10 w120 h35 Background" . Store_BtnBg . " c" . Store_BtnFg . " Center +0x200 Border", "🤠ร้าน:ลุงสิงโต").OnEvent("Click", SelectStore)
MainGui.Add("Text", "x+10 w120 h35 Background" . Store_BtnBg . " c" . Store_BtnFg . " Center +0x200 Border", "🎯St_Singto").OnEvent("Click", SelectStore)





; ==============================================================================
; 🍏 [ ลูปอัตโนมัติ - สายเขียว ]
; ==============================================================================
MainGui.Add("Text", "xm y+15 c1eff00", "🍏 [ สายเขียว ] :")
GreenKeys := ["VESS_GREEN_BLACK", "SEVIOS_GREEN","ROYAL_GREEN", "VESS_GREEN_SLIMS", "MILANO_GREEN", "VOXX_GREEN",  "MOND_GREEN",
"CAVALLO_GREEN"]
for key in GreenKeys {
    prod := ProductData[key]
    btn  := MainGui.Add("Text", (A_Index == 1 ? "xm y+5" : "x+10") . " w140 h32 Background" . Green_BtnBg . " c" . Green_BtnFg . " Center +0x200 Border", prod.name)
    btn.productName := key
    btn.OnEvent("Click", SelectProduct)
}

; ==============================================================================
; 🍎 [ ลูปอัตโนมัติ - สายแดง ]
; ==============================================================================
MainGui.Add("Text", "xm y+10 cff0037", "🍎 [ สายแดง ] :")
RedKeys := ["VESS_RED", "SEVIOS_RED", "ROYAL_RED", "CAVALO_RED","SIERRA_RED","VESS_GOLD", "MOND_GOLD", "CAVALO_RED"]
for key in RedKeys {
    prod := ProductData[key]
    btn  := MainGui.Add("Text", (A_Index == 1 ? "xm y+5" : "x+10") . " w140 h32 Background" . Red_BtnBg . " c" . Red_BtnFg . " Center +0x200 Border", prod.name)
    btn.productName := key
    btn.OnEvent("Click", SelectProduct)
}

; ==============================================================================
; 🍇 [ ลูปอัตโนมัติ - PREMIUM / FRUIT ]
; ==============================================================================
MainGui.Add("Text", "xm y+10 ca200ff", "🍇 [ PREMIUM / FRUIT ] :")
FruitKeys := ["OS_WATERMELON", "OS_PINEAPPLE", "OS_BLUEBERRY", "OS_MANGO",  "OS_STRAWBERRY"  ,"VESS_MINT_COOL",   "VESS_CRUSH_MINT.X.GRAPE",   "🟣CAVALLO_TWIN_X_BALL(คาวาโล่ม่วง) 1 คอต"]
for key in FruitKeys {
    prod := ProductData[key]
    btn  := MainGui.Add("Text", (A_Index == 1 ? "xm y+5" : "x+10") . " w140 h32 Background" . Fruit_BtnBg . " c" . Fruit_BtnFg . " Center +0x200 Border", prod.emo . " " . prod.name)
    btn.productName := key
    btn.OnEvent("Click", SelectProduct)
}

; ==============================================================================
; 💰 ปุ่มยิงแก้ COD (ระบบอัตโนมัติ คุมโทนไซเบอร์พังค์เต็มสูบ)
; ==============================================================================
MainGui.Add("Text", "xm y+15 cffd900", "💰 ยิงแก้ COD :")
for price in CODPrices {
    ; ⚡ ปิดฉากความขาวของปุ่มตัวเลข ยัดปลั๊กอินสีฟ้าอมตะ Cod_BtnBg และ Cod_BtnFg ลงกล่อง Text เรืองแสง
    btn := MainGui.Add("Text", (A_Index == 1 ? "xm y+5" : "x+4") . " w48 h32 Background" . Cod_BtnBg . " c" . Cod_BtnFg . " Center +0x200 Border", price)
    btn.codValue := price
    btn.OnEvent("Click", SelectCOD)
      
}

; --- แสดงหน้างานบอร์ดล่างสุด ---
StatusText := MainGui.Add("Text", "xm y+15 w820 cff3292", "ออเดอร์ในหลุมดำ: 0 รายการ")
MainGui.Show()
; --- วางต่อท้ายบรรทัด MainGui.Show() ของเดิมได้เลยครับจารย์ ---
MainGui.Show()

; ⚡ โค้ดมหาเทพ: จิ้มที่อื่นปุ๊บ ย่อหน้าต่างหลบฉากลงทาสก์บาร์ทันที!
OnMessage(0x0006, WM_ACTIVATE)

WM_ACTIVATE(wParam, lParam, msg, hwnd) {
    global MainGui
    ; wParam == 0 แปลว่าหน้าต่างหลุมดำหลุดโฟกัส (จารย์แอบไปจิ้มแอปอื่น/คลิกที่อื่น)
    if (wParam == 0) {
        try MainGui.Minimize() ; สั่งย่อหน้าต่างหลบลงล่างทันที
    }
}
; ==============================================================================
; PART 5: SYSTEM FUNCTIONS (ฟังก์ชันทำงานหน้างาน ชี้ขาดข้อมูลจริง)
; ==============================================================================
SelectStore(btn, *) {
    global CurrentStore
    CurrentStore := btn.Text  ; ส่งต่อความจริงจากปุ่มหน้าบ้านทันที
    UpdateLiveClock()         
     try SoundPlay("C:\AHK_MASTER\เสียง\freesound_community-sci-fi-reverse-1-proceesed-97689 (1).mp3          ")
}
; ===================================================================
; ⚙️ [ฟังก์ชันการทำงาน - ระบบประกอบบิลสด ไร้รีเจคกวนใจ]
; ===================================================================

F11::
{
    ; ประกาศ global ที่เดียวไว้บรรทัดแรกของฟังก์ชันตามระบบเดิมของบอส
    global BaseText, ProductListText, TotalCOD, CurrentProd , Var_Phone, MainEdit, StatusText, CurrentStore,CurrentOrderID
    A_Clipboard := ""
    Send("^c")
    if !ClipWait(0.5)
    {
        return
       
    }
    
    ; --- ดึงข้อมูลดิบจากแรมคอมพิวเตอร์เข้ามาก่อน ---
    RawChatText := Trim(A_Clipboard, " `t`r`n")
    
    ; 👤 [PART 1: INTEL SCAN SORTING] ระบบสแกนเจาะจงเนื้อหา ล้างเบอร์หลอนแยกท่อนเป๊ะ
    Var_Name := "", Var_Address := "", Var_Phone := ""

 


    ; 1. สกัดเบอร์โทรเฉพาะบรรทัดที่มีโครงสร้างเบอร์ 9-10 หลักจริงๆ (ไม่เอาไปปนกับรหัสไปรษณีย์)
    Loop Parse, RawChatText, "`n", "`r" {
        LineText := RegExReplace(A_LoopField, "\D", "")
        if RegExMatch(LineText, "(0|66)[0-9]{8,9}$", &RegPhone) {
            Var_Phone := RegPhone[0]
            if (SubStr(Var_Phone, 1, 2) = "66") {
                Var_Phone := "0" . SubStr(Var_Phone, 3)
            }
            while (SubStr(Var_Phone, 1, 2) = "00") {
                Var_Phone := SubStr(Var_Phone, 2)
            }
            break
        }
    }

    ; 2. ลบเบอร์โทรออกจากข้อความดิบ เพื่อให้เหลือชื่อและที่อยู่สำหรับ CleanedBase
    ; ใช้ RegEx ลบเบอร์โทรทิ้งไม่ว่าจะอยู่หน้าหรือหลัง
    CleanedBase := RegExReplace(RawChatText, "0[0-9]{9}", "")
    CleanedBase := Trim(CleanedBase, "`t`r`n ")
    
    ; 2. ล้างคำสั่งระบบหรือสัญลักษณ์ขยะออกเพื่อคัดแยกโครงสร้าง
    CleanChat := RegExReplace(RawChatText, "i)(เพื่อความรวดเร็ว|ชื่อ-ที่อยู่:|เบอร์โทร:|รับข้อมูลปุ๊บ|จองคิวจัดส่ง|✅|📱|📍|👤)", "")
    CleanChat := Trim(CleanChat, " `t`r`n")
 
    ; 2. ลบเบอร์โทรออกจากข้อความดิบ เพื่อให้เหลือแค่ชื่อและที่อยู่สำหรับ CleanedBase
    CleanedBase := RegExReplace(RawChatText, "0[0-9]{9}", "")
    ; 3. วนลูปอ่านข้อมูลแยกแยะตามคีย์เวิร์ดจริง (ไม่สนลำดับบรรทัดก่อนหลัง)
    Loop Parse, CleanChat, "`n", "`r" {
        Line := Trim(A_LoopField)
        if (Line = "")
            continue
            
        ; ถ้าบรรทัดนี้คือเบอร์โทรศัพท์หลัก ให้ข้ามไปเลย ไม่เอามาใส่ชื่อหรือที่อยู่
        LineDigitsOnly := RegExReplace(Line, "\D", "")
        if (Var_Phone != "" and (LineDigitsOnly = Var_Phone or InStr(Line, Var_Phone)))
            continue
            
        ; เคลียร์เบอร์โทรส่วนเกินออกจากบรรทัดข้อความ
        CleanLine := RegExReplace(Line, "[0-9\-]{9,12}", "")
        CleanLine := Trim(RegExReplace(CleanLine, "i)(เบอร์โทร|เบอร์โทรศัพท์|โทร|เบอร์|:|\s)", ""))
        ; 3. จัดระเบียบช่องว่างหรือบรรทัดว่างส่วนเกินให้เรียบร้อย


        ; ตรวจสอบคีย์เวิร์ดชี้ขาดว่าเป็นที่อยู่หรือไม่
        isAddressKeyword := RegExMatch(Line, "i)(หมู่|ม\.|ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.|เลขที่|บ้านเลขที่|ห้อง|ชั้น|พาร์ท|ซอย|ถนน|ถ\.)")
        ; ดักจับรหัสไปรษณีย์โดดๆ (ตัวเลข 5 หลัก) ให้ปัดไปอยู่ท่อนที่อยู่
        isZipCode := RegExMatch(Line, "^\d{5}$")
        ; ดักจับบ้านเลขที่นำหน้า (เช่น 304 ม.5 หรือ 55/1)
        isHouseNum := RegExMatch(Line, "^\d+(\/\d+)?\s+(ม|หมู่)")
        
        if (isAddressKeyword or isZipCode or isHouseNum) {
            ; ✂️ สับเครื่องหมายจุลภาคให้กลายเป็นการเว้นบรรทัดใหม่ทันที
            LineSplit := StrReplace(Line, ",", "`r`n")
            if (Var_Address = "")
                Var_Address := LineSplit
            else
                Var_Address := Var_Address . "`r`n" . LineSplit
        } else {
            ; ถ้าไม่มีคีย์เวิร์ดที่อยู่ และไม่ใช้เบอร์โทร ให้ล็อกเป็นชื่อลูกค้า
            if (CleanLine != "") {
                if (Var_Name = "")
                    Var_Name := Line
                else
                    Var_Address := Var_Address . "`r`n" . Line ; กรณีชื่อยาวหรือพิมพ์ที่อยู่ปนมาแบบไม่มีคีย์เวิร์ด
            }
        }
    }
    
    ; 4. ถอนวิญญาณเบอร์ขยะออกจากช่องที่อยู่อีกชั้นเพื่อความชัวร์
    if (Var_Phone != "") {
        Var_Address := RegExReplace(Var_Address, "i)(เบอร์โทร|เบอร์โทรศัพท์|โทร|เบอร์)?[\s\-\:]*[0-9\-]{9,12}", "")
    }
    
    ; 5. ล้างบรรทัดว่างส่วนเกินในช่องที่อยู่ให้กระชับสบายตา
    CleanedAddress := ""
    Loop Parse, Var_Address, "`n", "`r" {
        TrimmedLine := Trim(A_LoopField, " `t,`r`n")
        if (TrimmedLine != "" and TrimmedLine != "T" and TrimmedLine != "T." and TrimmedLine != "ต" and TrimmedLine != "ต." and TrimmedLine != ".") {
            if (CleanedAddress = "")
                CleanedAddress := TrimmedLine
            else
                CleanedAddress := CleanedAddress . "`r`n" . TrimmedLine
        }
    }
    Var_Address := CleanedAddress
   
    ; 🎯 ประกอบร่างสร้างฟอร์แมตมหาเทพ: ชื่อ (บรรทัด 1) -> เบอร์ (บรรทัด 2) -> ที่อยู่สับแยกบรรทัดไร้คอมม่า (บรรทัด 3)
    BaseText := Var_Name "`r`n" Var_Phone "`r`n" Var_Address
    
    ; ระบบจัดการค่าเริ่มต้นของบอส ปล่อยทำงานตามปกติ
    ProductListText := ""
    TotalCOD := 0
    CurrentProd := ""
    
    ; เรียกฟังก์ชันคำนวณและแสดงผลดั้งเดิมของบอส
    BuildAndRefreshOrder()
    MainGui.Show()
}

; --- เลือกสินค้า: ใส่ชื่อสินค้าตัวแปรตรง ๆ + บวกยอดเงินสด ๆ ---
SelectProduct(btn, *) {
    global ProductData, CurrentProd, ProductListText, TotalCOD
    if (BaseText == "")
        return
          try SoundPlay("C:\AHK_MASTER\เสียง\rescopicsound-ui-designed-hit-modern-interface-impact-sweetener-02-230488 (1).mp3")
    CurrentProd := ProductData[btn.productName]
    
    if !InStr(ProductListText, CurrentProd.name) {
        ProductListText .= " " . CurrentProd.emo . " " . CurrentProd.name . "  1 คอต.`n"
        TotalCOD += CurrentProd.price
    }
    
    BuildAndRefreshOrder()
}

; --- ปุ่มคูณคอมโบ (x1 - x10): ล้างรายการเดิมของตัวนี้ทิ้ง แล้วใส่ยอดคูณใหม่เข้าไปสด ๆ ---
MultiplyProduct(btn, *) {
    global CurrentProd, ProductListText, TotalCOD, StatusText
    if (BaseText == "" || CurrentProd == "")
        return
        try SoundPlay("C:\AHK_MASTER\เสียง\dragon-studio-futuristic-transition-390304.mp3")
    Multiplier := Number(RegExReplace(btn.Text, "i)x", "")) 
    newProductList := ""
    tempTotal := 0
    
    Loop Parse, ProductListText, "`n", "`r" {
        if (A_LoopField == "")
            continue
            
        if InStr(A_LoopField, CurrentProd.name) {
            newProductList .= " " . CurrentProd.emo . " " . CurrentProd.name . "  " . Multiplier . " คอต.`n"
            tempTotal += (CurrentProd.price * Multiplier)
        } else {
            newProductList .= A_LoopField . "`n"
            for key, prod in ProductData {
                if InStr(A_LoopField, prod.name) {
                    qty := 1
                    if RegExMatch(A_LoopField, "(\d+)\s*คอต\.", &match)
                        qty := Number(match[1])
                    tempTotal += (prod.price * qty)
                    break
                }
            }
        }
    }
    
    ProductListText := newProductList
    TotalCOD := tempTotal
    
    BuildAndRefreshOrder()
    StatusText.Value := "คอมโบ " . btn.Text . " สำเร็จ! | ยอดรวม COD: " . TotalCOD

}

; --- ปุ่มยิงแก้ราคา COD มือเอง ---
SelectCOD(btn, *) {
    global TotalCOD
    if (BaseText != "") {
        TotalCOD := btn.codValue
        BuildAndRefreshOrder()
     try SoundPlay("C:\AHK_MASTER\เสียง\rescopicsound-ui-designed-hit-modern-interface-impact-sweetener-02-230488 (1).mp3")
    }
}

; --- สมองกลหลัก: จับชิ้นส่วนทั้งหมดมารวมร่างใส่ฟอร์แมต แล้วพ่นออกหน้าจอ ---
BuildAndRefreshOrder() {
    global OrderArray, BaseText, ProductListText, TotalCOD
    global CurrentStore, MainEdit, StatusText, Var_Phone, CurrentOrderID

    if (BaseText == "") {
        MainEdit.Value := ""
        StatusText.Value := "ออเดอร์ในหลุมดำ: 0 รายการ"
        return
    }

    ; สร้างเลขออเดอร์ครั้งแรกเท่านั้น
    ; เพื่อให้เลขไม่เปลี่ยนทุกครั้งที่กดเลือกสินค้า หรือแก้ COD
    if (CurrentOrderID == "") {
        CurrentOrderID := "ORD-" . FormatTime(, "ddMMyy-HHmmss")
    }

    CurrentDate := FormatTime(, "dd/MM/yyyy")
    CurrentTime := FormatTime(, "HH:mm")



; =========================================================================
; 🦁 AHK v2 CLEAN CODE BLOCK FORMATTER (ZERO-SYNTAX ERROR)
; =========================================================================
; 🛠️ เจนวันและเวลาปัจจุบัน (AHK v2 Format)
CurrentDate := FormatTime(, "dd/MM/yyyy")
CurrentTime := FormatTime(, "HH:mm")
; =================================================================
; 👑 AUTO-GENERATED ORDER SUMMARY ENGINE (AHK V2 MODULAR ENGINE)
; =================================================================

       FormattedText := "🍁[สรุปรายการสั่งซื้อ]`n"
        . "━━━━━━━━━━━━━━━━━━━━`n"
        . "⏰ " . CurrentDate . " " . CurrentTime . " น.`n"
        . "🆔 เลขออเดอร์: " . CurrentOrderID . "`n"
        . "📣 เพจ: " . CurrentStore . "`n"
        . "💰 COD: " . TotalCOD . " บาท`n"
        . "━━━━━━━━━━━━━━━━━━━━`n`n"
        . BaseText . "`n`n"
        . "━━━━━━━━━━━━━━━━━━━━`n"
        . "📦 รายการสินค้า:`n"
        . ProductListText
        . "━━━━━━━━━━━━━━━━━━━━"


; 2. ส่งค่าเข้า GUI Controls และ Array พร้อมใช้งาน
MainEdit.Value := FormattedText 
EditBox.Value := FormattedText
OrderArray := [FormattedText]
   
    
    StatusText.Value := "ออเดอร์ในหลุม: " . OrderArray.Length . " รายการ"
    UpdateLiveClock()
}
global OrderArray, TotalCOD, PricePerItem := 0
; --- F10: เทหลุมดำส่งงาน ---
; --- ฟังก์ชันสำหรับ F9 / ปุ่มล้างกระดาน (ปรับแก้หัวฟังก์ชัน) ---
ClearAll(btn := "", *) {
    global OrderArray := [], TotalCOD := 0, MainEdit, StatusText, CurrentStore, Var_Phone

    OrderArray := []
    TotalCOD := 0
    CurrentStore := "" ; ล้างค่าค่ายส่งทิ้งเป็นว่างเปล่าเพื่อรอเช็กออเดอร์ถัดไป
    Var_Phone := "" ; ล้างค่าเบอร์โทรทิ้งเป็นว่างเปล่า

    MainEdit.Value := ""
    StatusText.Value := "ออเดอร์ในหลุมดำ: 0 รายการ"
    
    try {
        SoundPlay("C:\AHK_MASTER\เสียง\soundshelfstudio-ui-drop-error-521939.mp3")
    }
    
    ToolTip("ล้างกระดานเรียบร้อยแล้ว! พร้อมรบต่อ!")
    SetTimer(() => ToolTip(), -2000)
       MainGui.Hide() 

}

F10:: ; เทหลุมดำส่งงาน (แยกรางดึงค่าจากจอกลาง EditBox อัตโนมัติ) ---
DumpAll(btn := "", *) {
    global OrderArray, TotalCOD, CurrentStore, StatusText, MainEdit, EditBox
    global BaseText, ProductListText, CurrentProd, Var_Phone
      try SoundPlay("C:\AHK_MASTER\เสียง\47313572-sci-fi-sfx15-350844.mp3")
    ; 🚨 ดักแก่ลืมเลือกค่ายส่ง
    if (CurrentStore == "" || CurrentStore == "ยังไม่ได้เลือกค่าย") {
        StatusText.Value := "❌ ERROR: จารย์ลืมเลือกค่ายส่ง!!! กรุณากดเลือกค่ายก่อน"
        MsgBox("อย่าเพิ่งรีบครับจารย์! ลืมเลือกค่ายส่ง เช็กด่วนครับ!", "เตือนสติอินเลเซอร์", "Icon! T2")
        return
    }
    
    ; 🌟 ดึงจากจอกลาง (EditBox) ที่จารย์พิมพ์แก้สดๆ หน้างานเอาไปก๊อปปี้
    LatestText := EditBox.Value
    
    if (LatestText != "") {
        A_Clipboard := LatestText ; สั่งก๊อปปี้ลง Clipboard ทันที
        
     ;  try {
     ;   try SoundPlay("C:\AHK_MASTER\เสียง\47313572-sci-fi-sfx15-350844.mp3")
    ;   }
        
        ToolTip("พ่นออเดอร์เรียบร้อย!") 
        SetTimer(() => ToolTip(), -2000) 
        
        ; 🌟 ล้างประวัติเพื่อเตรียมรับบิลถัดไป
        BaseText := ""
        ProductListText := ""
        CurrentProd := ""
        OrderArray := []
        Var_Phone := ""
        
        ; 🌟 สั่งเคลียร์ตัวหนังสือในกล่องให้โล่งสะอาด (แต่กล่องไม่หาย!)
        MainEdit.Value := ""
        EditBox.Value := ""
        StatusText.Value := "ออเดอร์ในหลุม: 0 รายการ"
        
        ; อัปเดตนาฬิกาขวาบนให้กลับมาสแตนด์บาย
        UpdateLiveClock()
        
    } else {
        ToolTip("ไม่มีออเดอร์ในหลุมกลางครับ!")
        SetTimer(() => ToolTip(), -2000)
    }
}
F2::
{
    Send("^v") ; 📋 สั่งให้กด Ctrl + V เพื่อวางข้อมูลลงไปก่อนทันที
    Sleep(50)  ; ⏱️ พักเบรกให้ระบบจำค่าข้อมูล 0.05 วินาที (กันบอทยิงไวเกินจนข้อความแหว่ง)
    Send("{Enter}") ; 🚀 ค่อยสั่งกด Enter เพื่อยิงส่งข้อความปิดจ็อบ
    try {
        SoundPlay("C:\AHK_MASTER\เสียง\11223.mp3")
    }
}


F9::CleanAll()
; --- ล้างกระดาน (เวอร์ชันคลีนหมดจดทุกหน้าจอ) ---
CleanAll(*) {
    global BaseText, ProductListText, TotalCOD, CurrentProd, OrderArray, CurrentStore
    global MainEdit, EditBox, StatusText ; 🌟 ดึงมาเคลียร์ให้ครบทุกกล่อง
    try SoundPlay("C:\AHK_MASTER\เสียง\ksjsbwuil-ui-beep-4-513914.mp3")
    BaseText := ""
    ProductListText := ""
    TotalCOD := 0
    CurrentProd := ""
    OrderArray := []
    
    ; 🌟 สั่งกวาดขยะตัวหนังสือออกให้หมดทั้ง 2 จอ
    MainEdit.Value := ""
    EditBox.Value := " "
    StatusText.Value := "ออเดอร์ในหลุม: 0 รายการ"
    
    ; เซ็ตค่ายเริ่มต้นใหม่
    CurrentStore := "ยังไม่ได้เลือกค่าย"
    
    ; อัปเดตสเตตัสนาฬิกา
    UpdateLiveClock()
}
; --- F12: รีโหลดระบบกรณีฉุกเฉิน ---
F12:: {
    try SoundPlay("C:\AHK_MASTER\เสียง\25541.mp3")
    
    ; ⚡ ยัด 2 บรรทัดนี้เพิ่มเข้าไปก่อนรีโหลด
    Sleep(500)                      ; ปล่อยให้เสียงไซไฟดังสั้นๆ แป๊บนึง (ปรับตัวเลขได้ตามชอบ)

    
    Reload()
}

UpdateLiveClock() {
    global StatusBox, CurrentStore
    
    LiveTime := A_DD . "/" . A_MM . "/" . SubStr(A_YYYY, 3, 2) . "  |  " . A_Hour . ":" . A_Min . ":" . A_Sec . " น."
    
    if (CurrentStore == "" || CurrentStore == "ยังไม่ได้เลือกค่าย") {
        StatusBox.Value := "`n`n⏰ " . LiveTime 
                        . "`n`n`n`n⚠️ ⚠️ ⚠️`n`n"
                        . "ยังไม่ได้เลือกค่ายสตรีม!!!`n"
                        . "กรุณากดเลือกค่ายด้านล่างก่อนครับ"
    } else {
        StatusBox.Value := "`n`n⏰ " . LiveTime 
                        . "`n`n`n`n✅ ล็อกค่ายสำเร็จ`n`n"
                        . "กำลังใช้งานค่าย: " . CurrentStore 
                        . "`n`nพร้อมพ่นออเดอร์ [F10]"
    }
}


^Esc::ExitApp     ; กด Ctrl + Esc = ปิดสคริปต์หลุมดำทันที (เวลาสคริปต์หลอนกดอะไรไม่ได้)
+!R::Reload       ; กด Shift + Alt + R = สั่งรีโหลดรันโค้ดใหม่ทันทีหลังจากเซฟ
; =========================================================
; ระบบหลุมดำสลับโหมดด้วยปุ่ม PgDn (สำหรับ AHK v2)
; กด PgDn 1 ครั้ง = เปิดโหมด ENG (ปล่อยของพ่นสคริปต์)
; กด PgDn อีกครั้ง = เปิดโหมด THAI (พิมพ์เลขปกติ)
; =========================================================
global IsScriptMode := false ; เริ่มต้นให้เป็นโหมดพิมพ์เลขปกติก่อน

PgDn:: {
    global IsScriptMode := !IsScriptMode ; สลับสถานะเปิด/ปิด
    if (IsScriptMode) {
          try SoundPlay("C:\AHK_MASTER\เสียง\rescopicsound-sci-fi-weapon-recharge-reload-plasma-01-233845.mp3   ")
    } else {
       try SoundPlay("C:\AHK_MASTER\เสียง\ksjsbwuil-ui-beep-4-513914.mp3")
    }
}

; --- ฟังก์ชันตรวจสอบภาษา ENG ---
IsKeyboardENG() {
    Local activeWin := WinExist("A")
    If !activeWin
        Return False
    Local threadID := DllCall("GetWindowThreadProcessId", "Ptr", activeWin, "Ptr", 0, "UInt")
    Local layoutID := DllCall("GetKeyboardLayout", "UInt", threadID, "Ptr")
    Return ((layoutID & 0xFFFF) == 0x0409)
}

; --- ฟังก์ชันพ่นข้อความ (เวอร์ชันเซฟตี้ + มีระบบข้ามเสียงถ้าพังเพื่อไม่ให้ตัวโปรแกรมดับ) ---
; --- ฟังก์ชันพ่นข้อความ (เวอร์ชันคุมความเสถียร ดักจังหวะหน่วง) ---
SendProductText(ProductCode) {
    A_Clipboard := ""                     ; 1. ล้างคิวคลิปบอร์ดก่อน
    A_Clipboard := ProductCode            ; 2. ยัดรหัสสินค้าเข้าไป
   
    if ClipWait(0.5) {                     ; 3. รอดาต้าเข้าคลิปบอร์ดเสร็จชัวร์ๆ
        Sleep(50)                         ; 🌟 เพิ่มหน่วงก่อนกดวาง (เพื่อให้คลิปบอร์ดพร้อม 100%)
        Send("^v")                        ; 4. สั่งวางข้อมูล
        Sleep(150)                        ; 🌟 เพิ่มหน่วงหลังกดวาง (ให้วินโดวส์ดึงดาต้าไปใช้เสร็จก่อนล้างท่อ)
    }
   
    try {
        SoundPlay("C:\AHK_MASTER\เสียง\-1-86845.mp3")
    }
   
    A_Clipboard := ""                     ; 5. ล้างท่อป้องกันค้าง
}

; --- [ หมวดที่ 1: กลุ่มปุ่มฟังก์ชัน F1 - F7 (รวม F5 ตัวใหม่แล้ว) ] ---
$F1::SendProductText("🍉OS_WATERMELON")
$F3::SendProductText("🟢SEVIOS_GREEN")
$F4::SendProductText("🟢ROYAL_GREEN")
$F5::SendProductText("🟢VESS_GREEN_SLIMS")  ; <--- เพิ่ม F5 สำหรับพ่นรหัสตัวที่เสนอขายล่าสุดแล้วครับจารย์!
$F6::SendProductText("💚🎱VESS_GREEN_BLACK")
$F7::SendProductText("🍁🎱ปิดท้าย")

;; --- [ กลุ่มแผง Numpad ขวา: โหมดปล่อยของ / โหมดพิมพ์เลขปกติ ] ---

$Numpad1:: {
    if (IsScriptMode) {
        SendProductText("🍓OS_STRAWBERRY")
    } else {
        Send("{Numpad1}")
    }
}

$Numpad2:: {
    if (IsScriptMode) {
        SendProductText("🍇OS_BLUEBERRY")
    } else {
        Send("{Numpad2}")
    }
}

$Numpad3:: {
    if (IsScriptMode) {
        SendProductText("🍉OS_WATERMELON")
    } else {
        Send("{Numpad3}")
    }
}

$Numpad4:: {
    if (IsScriptMode) {
        SendProductText("🥭 OS_MANGO")
    } else {
        Send("{Numpad4}")
    }
}

$Numpad5:: {
    if (IsScriptMode) {
        SendProductText("🍍OS_PINEAPPLE")
    } else {
        Send("{Numpad5}")
    }
}

$Numpad6:: {
    if (IsScriptMode) {
        SendProductText("⭐รีวิวล่าสุด")
    } else {
        Send("{Numpad6}")
    }
}

$Numpad7:: {
    if (IsScriptMode) {
        SendProductText("✅ส่งฟรี!")
    } else {
        Send("{Numpad7}")
    }
}

$Numpad8:: {
    if (IsScriptMode) {
     SendProductText("รอรับของชัวร์ๆ")
    } else {
        Send("{Numpad8}")
    }
}

$Numpad9:: {
    if (IsScriptMode) {
        SendProductText("📦**บริการพิเศษจากทางร้าน**")
    } else {
        Send("{Numpad9}") ; แก้ไขจากเลข 8 เดิม ให้พิมพ์เลข 9 ตรงตัวแล้วครับจารย์
    }
}

$Numpad0:: {
    if (IsScriptMode) {
        SendProductText("`📸เพื่อรักษาสิทธิ์ของพี่ลูกค้า")
    } else {
        Send("{Numpad0}")
    }
}

; ===================================================================
; [คลังแสงขยาย] เล่นเสียงเอฟเฟกต์ไซไฟแยกตามประเภทอาวุธทำลายล้าง!
; ===================================================================
; --- เอาตัวแปรไว้บนสุดของสคริปต์ (อยู่นอกฟังก์ชัน) ---
is_running := false

; --- ปุ่มเปิดปิด ---
PgUp::
{
    global is_running := !is_running
    if (is_running) {
        ToolTip("ระบบทำงานแล้ว (ON)", 10, 10)
    } else {
        ToolTip("ระบบหยุดทำงาน (OFF)", 10, 10)
    }
    SetTimer () => ToolTip(), -1000
 try SoundPlay("C:\AHK_MASTER\เสียง\rescopicsound-sci-fi-weapon-recharge-reload-plasma-01-233845.mp3   ")
      try SoundPlay("C:\AHK_MASTER\เสียง\ksjsbwuil-ui-beep-4-513914.mp3")
}
#HotIf (is_running)
; --- ปุ่ม Numpad แบบเช็คเงื่อนไขข้างใน ---
$NumpadDiv:: {
    global is_running
    if (is_running) {
        ; ใช้เครื่องหมายคำพูดครอบข้อความทั้งหมด และใช้ `n เพื่อขึ้นบรรทัดใหม่
        text := "* ╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳ *`n`n"
        text .= "✅ ส่งฟรี! มีบริการเก็บเงินปลายทาง`n"
        text .= "✅ แกะเช็คสินค้าก่อนจ่ายเงินได้ มั่นใจได้เลยว่าของถึงมือชัวร์! 📦`n"
        text .= "✅ ส่งไวมาก สินค้าจะถึงภายใน 2-3 วันนับจากวันส่ง 🍁 `n"
        text .= "✅ สินค้าไม่ตรงปก มีปัญหา ยินดีเคลมเต็มจำนวน❤🎱`n`n"
        text .= "* ╳╳╳╳╳⚡FLASH EXPRESS ╳╳╳╳╳ *"
        
        SendProductText(text)
                    Sleep(200)
        Send("{Enter}") ; สั่งส่งข้อความ
    }
}


$NumpadMult:: {
    global is_running
    if (is_running) {
        text := "◤◢◤◢◤◢◤◢◤◢◤🚚💨◢◤◢◤◢◤◢◤◢◤◢" . "`n`n"
        text .= "รอรับของชัวร์ๆ ไม่เกิน 2-3 วันนับจากวันส่งครับพี่" . "`n"
        text .= "เดี๋ยวของถึงหน้าบ้านแล้ว จะมีเจ้าหน้าที่โทรหาพี่อีกทีนะครับ! 🙏" . "`n"
        text .= "📦แกะเช็กของหน้าบ้านได้เลย สบายใจได้ครับพี่! 🛡✨" . "`n`n"
        text .= "◤◢◤◢◤◢◤[⚡FLASH EXPRESS]◢◤◢◤◢◤◢"
        
        SendProductText(text)
        Sleep(200)
        Send("{Enter}") ; ส่งข้อความทันที
    }
}
$NumpadAdd:: {
global is_running
    if (is_running) {
        text := "╔════════════════════╗ " . "`n"
        text .= "ขอบคุณที่อุดหนุนครับ! ล็อคคิวจัดส่งเรียบร้อย 🦁✨" . "`n"
        text .= "╚════════════════════╝" . "`n`n"
        text .= " 🧡 🚛 เก็บปลายทาง แกะเช็คของก่อนจ่ายเงินได้ครับ" . "`n"
        text .= " แล้วมาอุดหนุนกันใหม่นะพี่! 🍊" . "`n"
        text .= " 🔗 กดตรงนี้ : https://lin.ee/v4PO9Dd " . "`n"
        text .= "🟢 แอดไลน์ : @913rlabf " . "`n`n"
        text .= "━━━━━━ ❖ ── ✦ ── ❖ ━━━━━━" . "`n"
        text .= "📸 รบกวนถ่ายวิดีโอตอนแกะกล่องพัสดุไว้ด้วยนะครับ " . "`n"
        text .= "หากสินค้ามีปัญหา ทางร้านยินดีเคลมให้ทันทีครับ ขอบคุณครับ 🙏" . "`n"
        text .= "━━━━━━ ❖ ── ✦ ── ❖ ━━━━━━"
        
        SendProductText(text)
        Sleep(200)
        Send("{Enter}") ; สั่งส่งข้อความ
               try SoundPlay("C:\AHK_MASTER\เสียง\ksjsbwuil-ui-beep-4-513914.mp3")
    }
}
$NumpadDot:: {
    ; ตรวจสอบว่ามีหน้าต่าง LINE ไหม
    if WinExist("ahk_exe LINE.exe") {
        ; บังคับแสดงหน้าต่างขึ้นมา โดยไม่แตะเมาส์
        WinShow("ahk_exe LINE.exe")
        WinActivate("ahk_exe LINE.exe")
    } else {
        MsgBox("LINE ยังไม่เปิดครับจารย์!")
    }
}
#HotIf
; ===============================================================================
; ## F8: HOTKEY มัดมือชก V4.9 - ฟอร์แมต 🍁🎱 + เส้น ⋯⋯⋯
; ## เรียง: หัว > เส้น > สินค้า > ยอดรวม > เส้น > ขอที่อยู่
; ===============================================================================


F8:: {
    global OrderArray, BaseText, ProductListText, TotalCOD, CurrentStore, MainEdit, StatusText, EditBox, MainGui, CurrentProd
SoundPlay("C:\AHK_MASTER\เสียง\47313572-sci-fi-sfx16-350847.mp3")
    if (BaseText == "") {
        BaseText := "ลูกค้าใหม่"
        ProductListText := ""
        TotalCOD := 0
        CurrentProd := ""
    }

    DisplayCOD := (TotalCOD == "" || TotalCOD == 0)? "0" : TotalCOD

    FormattedText.= "📦รายการสินค้า:"
    if (ProductListText!= "") {
        FormattedText.= ProductListText
    } else {
        FormattedText.= "`n"
    }

FormattedText := "จัดให้ตามนี้เลยครับพี่! 🍁🎱`n`n"
    FormattedText .= ProductListText

    FormattedText .= "💰 รวมส่ง [" . DisplayCOD . ".-]`n"
    FormattedText .= "◦◦◦⊱✿✧･ﾟ*🌸*･ﾟ✧⊱✿◦◦◦`🍁🎱ปิดท้ายn`n"

    FormattedText .= "สบายใจได้เลยครับ...`n"
    FormattedText .= "พี่แกะเช็กของก่อนจ่ายเงินได้ชัวร์! 🛡`n`n"

    FormattedText .= "รีบเลยนะครับผมได้ล๊อคใว้ให้ก่อน จะหมดแล้ว ⬇️`n`n"

    FormattedText .= "❚❙❘❘❙❚❚❙❘❘❙❚❚❙❘❘❙❚❚❙❘❘❙❚❚❙❘❘❙❚❚❙❘❘❙❚`n"
    FormattedText .= "✦ 🏷️  𝐍𝐀𝐌𝐄 :: `n"
    FormattedText .= "✦ 📞 𝐏𝐇𝐎𝐍𝐄 (ขอเบอร์ชัดๆ น้าพี่) :: `n"
    FormattedText .= "✦ 📍 𝐀𝐃𝐃𝐑𝐄𝐒𝐒 :: `n"
    FormattedText .= "❚❙❘❘❙❚❚❙❘❘❙❚❚❙❘❘❙❚❚❙❘❘❙❚❚❙❘❘❙❚❚❙❘❘❙❚`n`n"

    FormattedText .= "ส่งข้อมูลปุ๊บ ระบบจะรีบบันทึกเข้าคลังจัดคิว`n"
    FormattedText .= "เตรียมสับคิวแพ็กออกด่วนให้พี่ทันทีครับ! 🌪🔥"

    MainEdit.Value := FormattedText
    EditBox.Value := FormattedText
    MainGui.Show()
    StatusText.Value := "ออเดอร์ในหลุม: มีสินค้าแล้ว | 🍁🎱 พร้อมยิง"
    SoundBeep 1500, 50
}