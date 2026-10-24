// 監聽工具列擴充功能圖示點擊事件
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_TIMER_PANEL" });
  }
});