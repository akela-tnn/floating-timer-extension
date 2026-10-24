# Floating Timer Extension (網頁浮動倒數計時器)

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?style=flat-square)

一個輕量、高自訂性且獨立於各分頁的 Chrome 擴充功能。能在任何網頁（包括 YouTube 播放中）的正中央顯示高對比、不遮擋操作的浮動倒數計時器，並支援經典計時器嗶嗶鬧鈴。

---

## ✨ 核心特色 (Features)

- **無干擾點擊穿透 (Click-Through)**：中央倒數數字具備 `pointer-events: none;`，看影片或點擊網頁底層按鈕完全不卡手。
- **隨開即用控制面板 (On-Demand UI)**：平時完全不干擾畫面，點擊 Chrome 工具列圖示即可召喚/關閉面板，亦提供 `✕` 按鈕隨時收起。
- **分頁獨立運作 (Tab-Isolated)**：計時器狀態儲存於單一分頁中，不同分頁可獨立計時、互不干擾。
- **高對比視覺 (High Visibility)**：內建多層深色陰影外框，在純黑、純白或高動態影片背景下皆清晰易讀。
- **自訂外觀**：
  - 字體大小：50px 至 300px 動態滑桿調整。
  - 色彩切換：精選 5 款高辨識度淺色系（白色、淡黃、嫩綠、天空藍、粉紅）。
- **四短聲計時器鬧鈴 (Web Audio API)**：
  - 零外部音效檔案依賴，使用瀏覽器原生合成音。
  - 倒數結束時播放市面廚房計時器經典的四短嗶聲（嗶嗶嗶嗶），每秒重複循環。
  - 支援 **0% ~ 100% 音量調整滑桿**，並具備 60 秒自動停止與手動靜音按鈕。

---

## 📁 檔案結構 (Project Structure)

```text
floating-timer-extension/
├── manifest.json       # 擴充功能設定檔 (Manifest V3)
├── background.js       # 背景服務腳本 (監聽工具列圖示點擊)
├── content.js          # 注入頁面的主要計時邏輯與音效合成
├── styles.css          # 毛玻璃控制面板與中央數字樣式
└── README.md           # 專案說明文件

安裝方式 (Installation)
本專案無需經過繁複的編譯（Build）流程，純原生 JavaScript 即可執行：
直接下載專案的 ZIP 檔並解壓縮
載入至 Chrome：
打開 Google Chrome 瀏覽器，在網址列輸入 chrome://extensions/ 並按下 Enter。
開啟右上角的「開發人員模式 (Developer mode)」開關。
點選左上角「載入未封裝項目 (Load unpacked)」。
選擇本專案的根目錄資料夾。
釘選外掛：
點擊 Chrome 右上角的「拼圖圖示（擴充功能）」清單，找到「網頁浮動倒數計時器」並點擊釘選（Pin）圖示，以方便隨時點擊喚出面板。

使用指南 (How to Use)
開啟任何網頁（例如：YouTube、線上文章或工作系統）。
點擊瀏覽器工具列上的倒數計時器圖示，右上角即會彈出半透明控制面板。
設定參數：
輸入欲倒數的 時 / 分 / 秒（預設為 5 分鐘）。
透過滑桿調整中央字體大小與鬧鈴音量大小。
點選色塊以自訂中央數字顏色。
操作倒數：
點擊 「開始」：中央浮現大字體倒數，背後網頁可正常滾動與點擊。
點擊 「暫停」/「停止」：隨時暫停或清除重設時間。
點擊標題列右上角的 ✕：關閉右上角面板（倒數與鬧鈴仍會在背景正常運作）。
鬧鈴響起：
時間到時會播放四短聲嗶嗶鬧鈴，並在控制面板浮現紅色的 「🔔 停止鬧鈴」 按鈕，點擊即可停止發聲（亦會在 60 秒後自動停止）。
