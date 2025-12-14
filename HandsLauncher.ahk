; ============================================================
; Hands Protocol Floating Launcher - v1.3
; ============================================================
; A tiny always-on-top icon that provides quick access to
; the Hands Protocol input system from any Windows desktop.
;
; Features:
; - Draggable floating icon
; - Click to open/close popup (shows progress if running)
; - Successive windows maintain same position
; - Ctrl+Shift+H global hotkey
; - Follows across virtual desktops (pinned)
; ============================================================

#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

; ============ CONFIGURATION ============
global HANDS_SERVER := "http://localhost:5000"
global POPUP_WIDTH := A_ScreenWidth // 4
global POPUP_HEIGHT := A_ScreenHeight // 4
global ICON_SIZE := 48
global popupOpen := false
global lastPopupX := 0
global lastPopupY := 0
global hasActiveProcess := false  ; Track if something is running
global activePlanId := ""         ; Current plan being processed

; ============ CREATE FLOATING ICON ============
CreateFloatingIcon() {
    global iconGui, ICON_SIZE
    
    ; Draggable window
    iconGui := Gui("+AlwaysOnTop -Caption +ToolWindow")
    iconGui.BackColor := "C65D3B"  ; Rusty orange
    iconGui.MarginX := 0
    iconGui.MarginY := 0
    
    ; Use Text instead of Button - allows window dragging
    iconText := iconGui.Add("Text", "w" ICON_SIZE " h" ICON_SIZE " Center BackgroundTrans c1a237e", "🤲")  ; Deep blue
    iconText.SetFont("s28")
    
    ; Position: Bottom-right corner by default
    xPos := A_ScreenWidth - ICON_SIZE - 20
    yPos := A_ScreenHeight - ICON_SIZE - 60
    
    ; Set initial popup position near icon
    global lastPopupX := xPos - POPUP_WIDTH + 50
    global lastPopupY := yPos - POPUP_HEIGHT - 10
    if (lastPopupX < 0)
        lastPopupX := 10
    if (lastPopupY < 0)
        lastPopupY := 10
    
    iconGui.Show("x" xPos " y" yPos " w" ICON_SIZE " h" ICON_SIZE " NoActivate")
    
    ; Pin to all virtual desktops (Windows 10/11)
    PinToAllDesktops(iconGui.Hwnd)
    
    ; Left-click anywhere on icon GUI = toggle popup
    ; Drag anywhere on icon GUI = move it
    OnMessage(0x201, WM_LBUTTONDOWN)  ; Left button down
}

; ============ VIRTUAL DESKTOP PINNING ============
; Uses undocumented Windows API to pin window to all virtual desktops
PinToAllDesktops(hwnd) {
    try {
        ; Method 1: SetWindowDisplayAffinity (simple approach for always-visible)
        ; WDA_EXCLUDEFROMCAPTURE = 0x00000011 - this can interfere
        ; Instead, use the COM interface for Virtual Desktops
        
        ; For Windows 10/11, we use the IVirtualDesktopPinnedApps interface
        ; This is complex, so we use the simpler "set as tool window" trick
        ; combined with a timer to ensure visibility after desktop switch
        
        ; Re-show on desktop switch via timer
        SetTimer(EnsureIconVisible, 1000)
    }
}

; ============ ENSURE ICON VISIBLE ON ALL DESKTOPS ============
EnsureIconVisible() {
    global iconGui
    try {
        ; Re-show the icon to ensure it stays visible after desktop switches
        iconGui.Show("NoActivate")
    }
}

WM_LBUTTONDOWN(wParam, lParam, msg, hwnd) {
    global iconGui
    try {
        ; Check if click is on the icon GUI
        for ctrl in iconGui {
            if (hwnd = ctrl.Hwnd || hwnd = iconGui.Hwnd) {
                ; Start drag timer - if released quickly, it's a click
                SetTimer(CheckForClick, -200)
                PostMessage(0xA1, 2,,, iconGui.Hwnd)  ; Start drag
                return
            }
        }
    }
}

CheckForClick() {
    ; If mouse button is no longer held, it was a click not a drag
    if !GetKeyState("LButton", "P") {
        TogglePopup()
    }
}

; ============ TOGGLE POPUP (Click to open/close) ============
; If something is running, show progress window instead of input
TogglePopup() {
    global popupOpen, inputGui, reviewGui, progressGui, hasActiveProcess, activePlanId
    if (popupOpen) {
        try inputGui.Destroy()
        try reviewGui.Destroy()
        try progressGui.Destroy()
        popupOpen := false
    } else {
        ; If there's an active process, show the progress window
        if (hasActiveProcess && activePlanId != "") {
            ShowProgressPopup(activePlanId)
        } else {
            ShowInputPopup()
        }
    }
}

; ============ SAVE POPUP POSITION ============
SavePopupPosition(guiObj) {
    global lastPopupX, lastPopupY
    try {
        guiObj.GetPos(&x, &y)
        lastPopupX := x
        lastPopupY := y
    }
}

; ============ INPUT POPUP ============
ShowInputPopup() {
    global inputGui, inputText, POPUP_WIDTH, POPUP_HEIGHT, popupOpen, lastPopupX, lastPopupY, iconGui
    
    ; Close any existing popup
    try inputGui.Destroy()
    
    ; Get current icon position and calculate popup position relative to it
    try {
        iconGui.GetPos(&iconX, &iconY)
        lastPopupX := iconX - POPUP_WIDTH + 50
        lastPopupY := iconY - POPUP_HEIGHT - 10
        if (lastPopupX < 0)
            lastPopupX := 10
        if (lastPopupY < 0)
            lastPopupY := 10
    }
    
    inputGui := Gui("+AlwaysOnTop +Resize", "Hands Protocol - Quick Input")
    inputGui.BackColor := "0f0f23"
    inputGui.SetFont("s11 cWhite", "Segoe UI")
    inputGui.OnEvent("Close", (*) => (popupOpen := false))
    inputGui.OnEvent("Size", (*) => SavePopupPosition(inputGui))
    
    ; Title
    inputGui.Add("Text", "w" (POPUP_WIDTH - 40), "🤲 Paste LLM Output or Type Command:")
    
    ; Input area
    inputText := inputGui.Add("Edit", "w" (POPUP_WIDTH - 40) " h" (POPUP_HEIGHT - 120) " Multi WantReturn Background1a1a2e cWhite")
    
    ; Submit button
    submitBtn := inputGui.Add("Button", "w" (POPUP_WIDTH - 40) " h40 Default", "⚡ PARSE & REVIEW")
    submitBtn.OnEvent("Click", (*) => SubmitInput())
    
    inputGui.Show("x" lastPopupX " y" lastPopupY " w" POPUP_WIDTH " h" POPUP_HEIGHT)
    inputText.Focus()
    popupOpen := true
}

; ============ SUBMIT TO SERVER ============
SubmitInput() {
    global inputGui, inputText, HANDS_SERVER
    
    userInput := inputText.Value
    if (userInput = "") {
        MsgBox("Please enter something first!", "Hands Protocol", "Icon!")
        return
    }
    
    ; Save position before transitioning
    SavePopupPosition(inputGui)
    
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
    global inputGui, reviewGui, currentPlan, POPUP_WIDTH, POPUP_HEIGHT, lastPopupX, lastPopupY, popupOpen
    
    ; Save position and close input popup
    SavePopupPosition(inputGui)
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
    reviewGui.OnEvent("Close", (*) => (popupOpen := false))
    reviewGui.OnEvent("Size", (*) => SavePopupPosition(reviewGui))
    
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
    
    ; Ditch button (small hands logo = cancel/restart)
    reviewGui.SetFont("s10", "Segoe UI")
    reviewGui.Add("Text", "w" (POPUP_WIDTH - 80), "")  ; spacer
    ditchBtn := reviewGui.Add("Button", "w80 h30 x" (lastPopupX + POPUP_WIDTH - 100) " c1a237e", "🤲 Ditch?")
    ditchBtn.OnEvent("Click", (*) => DitchAndRestart())
    
    reviewGui.Show("x" lastPopupX " y" lastPopupY " w" POPUP_WIDTH " h" (POPUP_HEIGHT + 70))
}

; ============ DITCH AND RESTART ============
DitchAndRestart() {
    global reviewGui, popupOpen
    result := MsgBox("Ditch this diggity?`n`nThis will cancel the current review and start fresh.", "Hands Protocol", "YesNo Icon?")
    if (result = "Yes") {
        try reviewGui.Destroy()
        popupOpen := false
        ShowInputPopup()
    }
}

; ============ FIRE TO ANTIGRAVITY ============
FireToAntigravity(planId) {
    global reviewGui, currentPlan, HANDS_SERVER, lastPopupX, lastPopupY
    
    ; Save position
    SavePopupPosition(reviewGui)
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
    global reviewGui, progressGui, POPUP_WIDTH, POPUP_HEIGHT, lastPopupX, lastPopupY, popupOpen, spinnerText, currentPlanId, canCancel, hasActiveProcess, activePlanId
    
    ; Save position and close review popup
    SavePopupPosition(reviewGui)
    try reviewGui.Destroy()
    
    currentPlanId := planId
    activePlanId := planId       ; Track for click-to-show-progress
    hasActiveProcess := true     ; Mark as running
    canCancel := true  ; Can cancel until process starts
    
    progressGui := Gui("+AlwaysOnTop", "Hands Protocol - ⚡ QUEUED")
    progressGui.BackColor := "0f0f23"
    progressGui.MarginY := 5
    progressGui.OnEvent("Close", (*) => (SetTimer(SpinWaiting, 0), popupOpen := false))
    
    ; Compact header
    progressGui.SetFont("s12 cWhite Bold", "Segoe UI")
    progressGui.Add("Text", "w" (POPUP_WIDTH - 40) " Center c00ff00", "🔥 QUEUED")
    
    progressGui.SetFont("s9 c00ffaa")
    progressGui.Add("Text", "w" (POPUP_WIDTH - 40) " Center", planId)
    
    ; Spinning indicator (compact)
    progressGui.SetFont("s16 cffaa00")
    spinnerText := progressGui.Add("Text", "w" (POPUP_WIDTH - 40) " Center", "⏳ Waiting...")
    
    progressGui.SetFont("s9 cGray")
    progressGui.Add("Text", "w" (POPUP_WIDTH - 40) " Center", "Stays open until acknowledged")
    
    ; Button row: [Acknowledge] [Cancel] [🤲]
    progressGui.SetFont("s10", "Segoe UI")
    ackBtn := progressGui.Add("Button", "w" (POPUP_WIDTH // 2 - 30) " h35", "✅ Got It")
    ackBtn.OnEvent("Click", (*) => AcknowledgeProgress())
    
    cancelBtn := progressGui.Add("Button", "x+5 w70 h35", "⏸ Cancel")
    cancelBtn.OnEvent("Click", (*) => PauseThenCancel())
    
    ; Small hands button for NEW submission
    progressGui.SetFont("s14")
    newBtn := progressGui.Add("Button", "x+5 w35 h35 cC65D3B", "🤲")
    newBtn.OnEvent("Click", (*) => StartNewSubmission())
    
    progressGui.Show("x" lastPopupX " y" lastPopupY " w" POPUP_WIDTH " h" (POPUP_HEIGHT - 40))
    
    ; Start spinning animation
    SetTimer(SpinWaiting, 500)
}

; ============ PAUSE THEN CANCEL ============
PauseThenCancel() {
    global canCancel, progressGui, currentPlanId, popupOpen
    
    if (!canCancel) {
        MsgBox("Process already started - cannot cancel.", "Hands Protocol", "Icon!")
        return
    }
    
    ; Pause first
    SetTimer(SpinWaiting, 0)  ; Stop spinner
    progressGui.Title := "Hands Protocol - ⏸ PAUSED"
    
    ; Double-check prompt
    result := MsgBox("Execution paused.`n`nCancel this directive and delete from queue?`n`nPlan: " currentPlanId, "Cancel or Resume?", "YesNo Icon?")
    
    if (result = "Yes") {
        ; Delete from queue
        try FileDelete("C:\Y-OS\Y-IT_ENGINES\HANDS\queue\" currentPlanId ".json")
        try progressGui.Destroy()
        popupOpen := false
        hasActiveProcess := false  ; Clear active process
        activePlanId := ""
        MsgBox("Directive cancelled and removed from queue.", "Cancelled", "Iconi")
    } else {
        ; Resume
        progressGui.Title := "Hands Protocol - ⚡ QUEUED"
        SetTimer(SpinWaiting, 500)  ; Restart spinner
    }
}

; ============ SPINNER ANIMATION ============
SpinWaiting() {
    global spinnerText
    static spinState := 0
    spinChars := ["⏳", "⌛", "⏳", "⌛", "🔄", "🔄"]
    spinState := Mod(spinState + 1, spinChars.Length) + 1
    try spinnerText.Value := spinChars[spinState]
}

; ============ ACKNOWLEDGE PROGRESS ============
AcknowledgeProgress() {
    global progressGui, popupOpen, hasActiveProcess, activePlanId
    SetTimer(SpinWaiting, 0)  ; Stop spinner
    try progressGui.Destroy()
    popupOpen := false
    hasActiveProcess := false  ; Clear active process
    activePlanId := ""
}

; ============ START NEW SUBMISSION ============
; Note: This keeps hasActiveProcess TRUE - old task stays tracked
; New submission can be started while previous task is still running
StartNewSubmission() {
    global progressGui, popupOpen
    SetTimer(SpinWaiting, 0)  ; Stop spinner
    try progressGui.Destroy()
    popupOpen := false
    ShowInputPopup()
}

; ============ HOTKEY: ESC to close popups ============
#HotIf WinActive("ahk_class AutoHotkeyGUI")
Escape::
{
    global popupOpen
    try inputGui.Destroy()
    try reviewGui.Destroy()
    try progressGui.Destroy()
    popupOpen := false
}
#HotIf

; ============ STARTUP ============
CreateFloatingIcon()

; ============ GLOBAL HOTKEY: Ctrl+Shift+H to summon from ANY desktop ============
^+h::ShowInputPopup()  ; Ctrl+Shift+H opens input popup anywhere

; Tooltip on hover (optional)
OnMessage(0x200, WM_MOUSEMOVE)
WM_MOUSEMOVE(wParam, lParam, msg, hwnd) {
    static lastHwnd := 0
    if (hwnd != lastHwnd) {
        lastHwnd := hwnd
        try {
            if (hwnd = iconGui.Hwnd)
                ToolTip("Drag to move | Click to toggle")
            else
                ToolTip()
        }
    }
}
