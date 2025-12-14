; ============================================================
; Hands Protocol Floating Launcher - v1.0
; ============================================================
; A tiny always-on-top icon that provides quick access to
; the Hands Protocol input system from any Windows desktop.
;
; Features:
; - Floating icon (dime-sized) that stays on top
; - Click to open 1/12th screen popup for input
; - Submit → Review → GO MOTHERFUCKER → Progress flow
; ============================================================

#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

; ============ CONFIGURATION ============
global HANDS_SERVER := "http://localhost:5000"
global POPUP_WIDTH := A_ScreenWidth // 12
global POPUP_HEIGHT := A_ScreenHeight // 6
global ICON_SIZE := 48

; ============ CREATE FLOATING ICON ============
CreateFloatingIcon() {
    global iconGui, ICON_SIZE
    
    iconGui := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20")
    iconGui.BackColor := "1a1a2e"
    iconGui.MarginX := 0
    iconGui.MarginY := 0
    
    ; Add a clickable button styled as the icon
    iconBtn := iconGui.Add("Button", "w" ICON_SIZE " h" ICON_SIZE " Default", "🤲")
    iconBtn.SetFont("s24")
    iconBtn.OnEvent("Click", (*) => ShowInputPopup())
    
    ; Position: Bottom-right corner by default
    xPos := A_ScreenWidth - ICON_SIZE - 20
    yPos := A_ScreenHeight - ICON_SIZE - 60
    
    iconGui.Show("x" xPos " y" yPos " w" ICON_SIZE " h" ICON_SIZE " NoActivate")
}

; ============ INPUT POPUP ============
ShowInputPopup() {
    global inputGui, inputText, POPUP_WIDTH, POPUP_HEIGHT
    
    ; Close any existing popup
    try inputGui.Destroy()
    
    inputGui := Gui("+AlwaysOnTop +Resize", "Hands Protocol - Quick Input")
    inputGui.BackColor := "0f0f23"
    inputGui.SetFont("s11 cWhite", "Segoe UI")
    
    ; Title
    inputGui.Add("Text", "w" (POPUP_WIDTH - 40), "🤲 Paste LLM Output or Type Command:")
    
    ; Input area
    inputText := inputGui.Add("Edit", "w" (POPUP_WIDTH - 40) " h" (POPUP_HEIGHT - 120) " Multi WantReturn Background1a1a2e cWhite")
    
    ; Submit button
    submitBtn := inputGui.Add("Button", "w" (POPUP_WIDTH - 40) " h40 Default", "⚡ PARSE & REVIEW")
    submitBtn.OnEvent("Click", (*) => SubmitInput())
    
    ; Position: Top-left corner
    inputGui.Show("x10 y10 w" POPUP_WIDTH " h" POPUP_HEIGHT)
    inputText.Focus()
}

; ============ SUBMIT TO SERVER ============
SubmitInput() {
    global inputGui, inputText, HANDS_SERVER
    
    userInput := inputText.Value
    if (userInput = "") {
        MsgBox("Please enter something first!", "Hands Protocol", "Icon!")
        return
    }
    
    ; Show loading state
    inputGui.Title := "Hands Protocol - 🔍 Parsing..."
    
    ; Call the server
    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        whr.Open("POST", HANDS_SERVER "/api/parse", false)
        whr.SetRequestHeader("Content-Type", "application/json")
        
        ; Escape the input for JSON
        escapedInput := StrReplace(userInput, "\", "\\")
        escapedInput := StrReplace(escapedInput, '"', '\"')
        escapedInput := StrReplace(escapedInput, "`n", "\n")
        escapedInput := StrReplace(escapedInput, "`r", "")
        
        body := '{"input": "' escapedInput '"}'
        whr.Send(body)
        
        if (whr.Status = 200) {
            response := whr.ResponseText
            ShowReviewPopup(response)
        } else {
            MsgBox("Server Error: " whr.Status "`n" whr.ResponseText, "Hands Protocol Error", "Icon!")
            inputGui.Title := "Hands Protocol - Quick Input"
        }
    } catch as e {
        MsgBox("Connection Error: " e.Message "`n`nIs the Hands server running?", "Hands Protocol Error", "Icon!")
        inputGui.Title := "Hands Protocol - Quick Input"
    }
}

; ============ REVIEW POPUP ============
ShowReviewPopup(jsonResponse) {
    global inputGui, reviewGui, currentPlan, POPUP_WIDTH, POPUP_HEIGHT
    
    ; Close input popup
    try inputGui.Destroy()
    
    ; Parse JSON (basic extraction)
    currentPlan := jsonResponse
    
    ; Extract key fields using regex
    RegExMatch(jsonResponse, '"originalCommand"\s*:\s*"([^"]*)"', &cmdMatch)
    RegExMatch(jsonResponse, '"overallRisk"\s*:\s*"([^"]*)"', &riskMatch)
    RegExMatch(jsonResponse, '"planId"\s*:\s*"([^"]*)"', &idMatch)
    RegExMatch(jsonResponse, '"templates"\s*:\s*\[([^\]]*)\]', &templatesMatch)
    
    command := cmdMatch ? cmdMatch[1] : "Unknown"
    risk := riskMatch ? riskMatch[1] : "unknown"
    planId := idMatch ? idMatch[1] : "plan_unknown"
    templates := templatesMatch ? templatesMatch[1] : "None"
    
    ; Color based on risk
    riskColor := "00ff00"
    if (risk = "caution")
        riskColor := "ffaa00"
    else if (risk = "danger")
        riskColor := "ff4444"
    
    reviewGui := Gui("+AlwaysOnTop +Resize", "Hands Protocol - 🛡️ REVIEW")
    reviewGui.BackColor := "0f0f23"
    reviewGui.SetFont("s11 cWhite", "Segoe UI")
    
    ; Command summary
    reviewGui.Add("Text", "w" (POPUP_WIDTH - 40), "📋 Command:")
    reviewGui.Add("Text", "w" (POPUP_WIDTH - 40) " c00ffaa", SubStr(command, 1, 100))
    
    ; Risk badge
    reviewGui.Add("Text", "w" (POPUP_WIDTH - 40), "⚠️ Risk Level:")
    reviewGui.SetFont("s14 Bold c" riskColor)
    reviewGui.Add("Text", "w" (POPUP_WIDTH - 40), StrUpper(risk))
    reviewGui.SetFont("s11 cWhite", "Segoe UI")
    
    ; Templates
    reviewGui.Add("Text", "w" (POPUP_WIDTH - 40), "📦 Templates: " templates)
    
    ; Plan ID
    reviewGui.Add("Text", "w" (POPUP_WIDTH - 40) " cGray", "ID: " planId)
    
    ; GO MOTHERFUCKER button
    reviewGui.SetFont("s14 Bold", "Segoe UI")
    goBtn := reviewGui.Add("Button", "w" (POPUP_WIDTH - 40) " h50", "🔥 GO MOTHERFUCKER")
    goBtn.OnEvent("Click", (*) => FireToAntigravity(planId))
    
    ; Cancel button
    reviewGui.SetFont("s10", "Segoe UI")
    cancelBtn := reviewGui.Add("Button", "w" (POPUP_WIDTH - 40) " h30", "❌ Cancel")
    cancelBtn.OnEvent("Click", (*) => reviewGui.Destroy())
    
    reviewGui.Show("x10 y10 w" POPUP_WIDTH " h" (POPUP_HEIGHT + 50))
}

; ============ FIRE TO ANTIGRAVITY ============
FireToAntigravity(planId) {
    global reviewGui, currentPlan, HANDS_SERVER
    
    reviewGui.Title := "Hands Protocol - 🔥 FIRING..."
    
    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        whr.Open("POST", HANDS_SERVER "/api/queue", false)
        whr.SetRequestHeader("Content-Type", "application/json")
        
        ; Send the full plan
        whr.Send(currentPlan)
        
        if (whr.Status = 200) {
            ShowProgressPopup(planId)
        } else {
            MsgBox("Queue Error: " whr.Status, "Hands Protocol Error", "Icon!")
            reviewGui.Title := "Hands Protocol - 🛡️ REVIEW"
        }
    } catch as e {
        MsgBox("Fire Error: " e.Message, "Hands Protocol Error", "Icon!")
        reviewGui.Title := "Hands Protocol - 🛡️ REVIEW"
    }
}

; ============ PROGRESS POPUP ============
ShowProgressPopup(planId) {
    global reviewGui, progressGui, POPUP_WIDTH, POPUP_HEIGHT
    
    ; Close review popup
    try reviewGui.Destroy()
    
    progressGui := Gui("+AlwaysOnTop", "Hands Protocol - ⚡ IN PROGRESS")
    progressGui.BackColor := "0f0f23"
    progressGui.SetFont("s12 cWhite", "Segoe UI")
    
    progressGui.Add("Text", "w" (POPUP_WIDTH - 40) " Center", "🔥 DIRECTIVE FIRED!")
    progressGui.SetFont("s10 c00ffaa")
    progressGui.Add("Text", "w" (POPUP_WIDTH - 40) " Center", planId)
    
    progressGui.SetFont("s11 cWhite")
    progressGui.Add("Text", "w" (POPUP_WIDTH - 40) " Center", "`n⏳ Antigravity is processing...`n`nCheck VS Code for execution progress.")
    
    ; Close button
    closeBtn := progressGui.Add("Button", "w" (POPUP_WIDTH - 40) " h40", "✅ Done")
    closeBtn.OnEvent("Click", (*) => progressGui.Destroy())
    
    progressGui.Show("x10 y10 w" POPUP_WIDTH " h" (POPUP_HEIGHT - 50))
    
    ; Auto-close after 5 seconds
    SetTimer(() => (try progressGui.Destroy()), -5000)
}

; ============ HOTKEY: ESC to close popups ============
#HotIf WinActive("ahk_class AutoHotkeyGUI")
Escape::
{
    try inputGui.Destroy()
    try reviewGui.Destroy()
    try progressGui.Destroy()
}
#HotIf

; ============ STARTUP ============
CreateFloatingIcon()

; Tooltip on hover (optional)
OnMessage(0x200, WM_MOUSEMOVE)
WM_MOUSEMOVE(wParam, lParam, msg, hwnd) {
    static lastHwnd := 0
    if (hwnd != lastHwnd) {
        lastHwnd := hwnd
        try {
            if (hwnd = iconGui.Hwnd)
                ToolTip("Click for Hands Protocol")
            else
                ToolTip()
        }
    }
}
