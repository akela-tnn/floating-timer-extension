/**
 * 網頁浮動倒數計時器 - Content Script
 * 支援透過擴充功能圖示開啟/關閉，並提供面板關閉按鈕
 */

(function () {
  // 1. 防重複載入檢查
  if (window.__CHROME_TIMER_INJECTED__) return;
  window.__CHROME_TIMER_INJECTED__ = true;

  // 2. 狀態管理
  let remainingSeconds = 300;
  let initialTotalSeconds = 300;
  let timerInterval = null;
  let isRunning = false;
  let alarmInterval = null;
  let alarmTimeout = null;
  let audioCtx = null;

  const MAX_GAIN = 0.2 / 0.3;
  let currentVolumePercent = 30;

  const PALETTE = [
    { name: "白色", value: "#FFFFFF" },
    { name: "淡黃", value: "#FFF59D" },
    { name: "嫩綠", value: "#A5D6A7" },
    { name: "天空藍", value: "#90CAF9" },
    { name: "粉紅", value: "#F48FB1" }
  ];

  // 3. 建立 DOM 元素
  // 3.1 中央倒數顯示 Overlay
  const overlay = document.createElement("div");
  overlay.id = "chrome-timer-overlay";
  overlay.style.fontSize = "120px";
  overlay.style.color = "#FFFFFF";
  document.body.appendChild(overlay);

  // 3.2 右上角控制面板 (預設由 CSS 設為 display: none)
  const panel = document.createElement("div");
  panel.id = "chrome-timer-panel";
  panel.innerHTML = `
    <div class="chrome-timer-header">
      <span class="chrome-timer-title">⏱️ 倒數計時器</span>
      <div class="chrome-timer-header-actions">
        <button class="chrome-timer-btn-icon" id="ct-btn-toggle" title="收合/展開">−</button>
        <button class="chrome-timer-btn-icon chrome-timer-btn-close" id="ct-btn-close" title="關閉控制畫面">✕</button>
      </div>
    </div>
    <div class="chrome-timer-body">
      <!-- 時間設定 -->
      <div class="chrome-timer-row">
        <span class="chrome-timer-label">倒數時長</span>
        <div class="chrome-timer-inputs">
          <input type="number" id="ct-hours" class="chrome-timer-number-input" min="0" max="99" value="0" /> 時
          <input type="number" id="ct-minutes" class="chrome-timer-number-input" min="0" max="59" value="5" /> 分
          <input type="number" id="ct-seconds" class="chrome-timer-number-input" min="0" max="59" value="0" /> 秒
        </div>
      </div>

      <!-- 鬧鈴開關與音量滑桿 -->
      <div class="chrome-timer-row">
        <div class="chrome-timer-alarm-group">
          <label class="chrome-timer-alarm-toggle" style="cursor: pointer;">
            <input type="checkbox" id="ct-alarm-toggle" checked style="cursor: pointer;" />
            <span class="chrome-timer-label" style="cursor: pointer;">鬧鈴</span>
          </label>
          <div class="chrome-timer-volume-group">
            <span class="chrome-timer-label">🔔</span>
            <input type="range" id="ct-vol-slider" class="chrome-timer-volume-slider" min="0" max="100" value="30" />
            <span id="ct-vol-val" class="chrome-timer-value">30%</span>
          </div>
        </div>
      </div>

      <!-- 字體大小調整 -->
      <div class="chrome-timer-row">
        <span class="chrome-timer-label">字體大小</span>
        <div class="chrome-timer-slider-group">
          <input type="range" id="ct-font-slider" class="chrome-timer-slider" min="50" max="300" value="120" />
          <span id="ct-font-val" class="chrome-timer-value">120px</span>
        </div>
      </div>

      <!-- 淺色系色塊 -->
      <div class="chrome-timer-row">
        <span class="chrome-timer-label">數字色彩</span>
        <div class="chrome-timer-color-palette" id="ct-palette"></div>
      </div>

      <!-- 控制按鈕 -->
      <div class="chrome-timer-btn-grid">
        <button id="ct-btn-start" class="chrome-timer-btn chrome-timer-btn-primary">開始</button>
        <button id="ct-btn-pause" class="chrome-timer-btn">暫停</button>
        <button id="ct-btn-stop" class="chrome-timer-btn">停止</button>
      </div>

      <!-- 停止鬧鈴按鈕 -->
      <button id="ct-btn-silence" class="chrome-timer-btn-alert">🔔 停止鬧鈴</button>
    </div>
  `;
  document.body.appendChild(panel);

  // 4. 取得元素參照
  const btnToggle = panel.querySelector("#ct-btn-toggle");
  const btnClose = panel.querySelector("#ct-btn-close");
  const inputH = panel.querySelector("#ct-hours");
  const inputM = panel.querySelector("#ct-minutes");
  const inputS = panel.querySelector("#ct-seconds");
  const checkAlarm = panel.querySelector("#ct-alarm-toggle");
  const volSlider = panel.querySelector("#ct-vol-slider");
  const volValText = panel.querySelector("#ct-vol-val");
  const fontSlider = panel.querySelector("#ct-font-slider");
  const fontValText = panel.querySelector("#ct-font-val");
  const paletteContainer = panel.querySelector("#ct-palette");
  const btnStart = panel.querySelector("#ct-btn-start");
  const btnPause = panel.querySelector("#ct-btn-pause");
  const btnStop = panel.querySelector("#ct-btn-stop");
  const btnSilence = panel.querySelector("#ct-btn-silence");

  // 5. 初始化色塊調色盤
  PALETTE.forEach((color, index) => {
    const swatch = document.createElement("div");
    swatch.className = `chrome-timer-color-swatch ${index === 0 ? "active" : ""}`;
    swatch.style.backgroundColor = color.value;
    swatch.title = color.name;
    swatch.addEventListener("click", () => {
      panel.querySelectorAll(".chrome-timer-color-swatch").forEach(s => s.classList.remove("active"));
      swatch.classList.add("active");
      overlay.style.color = color.value;
    });
    paletteContainer.appendChild(swatch);
  });

  // 6. 工具函式
  function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, "0");

    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  }

  function updateOverlayDisplay() {
    overlay.textContent = formatTime(remainingSeconds);
  }

  // 7. Web Audio API：四短聲嗶嗶音效
  function playFourBeeps() {
    try {
      if (currentVolumePercent <= 0) return;

      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const targetGain = Math.max(0.001, (currentVolumePercent / 100) * MAX_GAIN);
      const now = audioCtx.currentTime;
      const beepDuration = 0.06;
      const beepInterval = 0.11;

      for (let i = 0; i < 4; i++) {
        const startTime = now + i * beepInterval;
        const stopTime = startTime + beepDuration;

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(2000, startTime);

        gainNode.gain.setValueAtTime(targetGain, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(startTime);
        osc.stop(stopTime);
      }
    } catch (e) {
      console.warn("[Chrome-Timer] 播放音效失敗:", e);
    }
  }

  function startAlarmSequence() {
    if (!checkAlarm.checked) return;

    btnSilence.style.display = "block";
    playFourBeeps();
    alarmInterval = setInterval(playFourBeeps, 1000);

    alarmTimeout = setTimeout(() => {
      stopAlarmSequence();
    }, 60000);
  }

  function stopAlarmSequence() {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
    if (alarmTimeout) {
      clearTimeout(alarmTimeout);
      alarmTimeout = null;
    }
    btnSilence.style.display = "none";
  }

  // 8. 倒數控制
  function startCountdown() {
    if (!isRunning && remainingSeconds === initialTotalSeconds) {
      const h = parseInt(inputH.value, 10) || 0;
      const m = parseInt(inputM.value, 10) || 0;
      const s = parseInt(inputS.value, 10) || 0;
      const total = h * 3600 + m * 60 + s;

      if (total <= 0) return;
      initialTotalSeconds = total;
      remainingSeconds = total;
    }

    if (remainingSeconds <= 0) return;

    stopAlarmSequence();
    overlay.style.display = "block";
    updateOverlayDisplay();
    isRunning = true;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds > 0) {
        updateOverlayDisplay();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        overlay.textContent = "時間到！";
        startAlarmSequence();
      }
    }, 1000);
  }

  function pauseCountdown() {
    if (isRunning) {
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
    }
  }

  function stopCountdown() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    stopAlarmSequence();

    overlay.style.display = "none";
    const h = parseInt(inputH.value, 10) || 0;
    const m = parseInt(inputM.value, 10) || 0;
    const s = parseInt(inputS.value, 10) || 0;
    remainingSeconds = h * 3600 + m * 60 + s;
    initialTotalSeconds = remainingSeconds;
  }

  // 9. 事件監聽
  btnStart.addEventListener("click", startCountdown);
  btnPause.addEventListener("click", pauseCountdown);
  btnStop.addEventListener("click", stopCountdown);
  btnSilence.addEventListener("click", stopAlarmSequence);

  // 關閉控制畫面按鈕 (隱藏面板，不影響中央倒數)
  btnClose.addEventListener("click", () => {
    panel.style.display = "none";
  });

  // 收合 / 展開面板內容
  btnToggle.addEventListener("click", () => {
    const isMinimized = panel.classList.toggle("chrome-timer-minimized");
    btnToggle.textContent = isMinimized ? "+" : "−";
  });

  // 音量與字體大小滑桿
  volSlider.addEventListener("input", (e) => {
    currentVolumePercent = parseInt(e.target.value, 10);
    volValText.textContent = `${currentVolumePercent}%`;
  });

  fontSlider.addEventListener("input", (e) => {
    const size = e.target.value;
    overlay.style.fontSize = `${size}px`;
    fontValText.textContent = `${size}px`;
  });

  [inputH, inputM, inputS].forEach(input => {
    input.addEventListener("change", () => {
      if (!isRunning) {
        const h = parseInt(inputH.value, 10) || 0;
        const m = parseInt(inputM.value, 10) || 0;
        const s = parseInt(inputS.value, 10) || 0;
        remainingSeconds = h * 3600 + m * 60 + s;
        initialTotalSeconds = remainingSeconds;
      }
    });
  });

  // 10. 監聽 background.js 發來的點擊圖示事件 (切換顯示/隱藏)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "TOGGLE_TIMER_PANEL") {
      const isVisible = panel.style.display === "block";
      panel.style.display = isVisible ? "none" : "block";
    }
  });
})();