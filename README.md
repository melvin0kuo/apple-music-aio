# Apple Music NZXT Kraken 水冷螢幕顯示小工具 (Apple Music Now Playing Widget for NZXT Kraken AIO)

[English Version Below](#english-version)

這是一個專為 **NZXT Kraken / Elite** 等水冷 LCD 螢幕量身打造的本地伺服器與高質感 Apple Music 播放資訊顯示網頁小工具，讓您的水冷螢幕能動態顯示目前播放的歌曲、歌手與動態極光光暈特效。

---

## 繁體中文說明

### 特色功能

- **流體極光背景特效 (Liquid Aurora Background)**：背景由 3 個隨機漂移的多彩流體色球（Blobs）組成，並在播放音樂時動態融和，產生極具未來感且平滑的動態極光光暈。
- **動態漸層光暈 (Rotating Album Glow)**：專輯封面外圍環繞著動態霓虹漸層光圈，播放時會旋轉並伴隨慢速呼吸淡入淡出。
- **Apple Music 原生質感**：採用深色玻璃擬態（Glassmorphism）卡片設計、細緻陰影與現代 Outfit 幾何字型。
- **60FPS 流暢進度條**：利用瀏覽器補幀，進度條移動如絲般順滑，告別每秒一跳的卡頓感。
- **智慧跑馬燈**：當歌名或歌手字數超出螢幕寬度時，會自動啟用無縫滾動的 CSS 跑馬燈。
- **水冷圓形螢幕自動適配**：自動偵測 NZXT CAM 的 `?kraken=1` 參數，自動縮減安全佈局邊界，確保進度條和文字在圓形螢幕下 100% 完整顯示，絕不被圓形邊界裁切。
- **待機時鐘看板 (Standby Clock)**：無音樂播放或關閉播放器時，畫面會自動淡入切換為簡約的數字鎖屏時鐘與日期。
- **零組態免 API 金鑰**：使用 Windows 原生 System Media Transport Controls (SMTC) API，不需任何 Apple Music 開發者帳號、Token 或登入流程。

### 安裝與啟動

#### 1. 安裝環境與套件
請確保您的 Windows 已安裝 Python，然後打開終端機（PowerShell）安裝 Windows 系統控制綁定庫：
```bash
pip install winsdk
```

#### 2. 啟動伺服器
進入專案資料夾並執行：
```bash
python server.py
```
伺服器將在本地啟動並監聽 `http://127.0.0.1:48942`。

#### 3. 套用至 NZXT CAM
1. 開啟 **NZXT CAM** 軟體。
2. 前往 **照明 (Lighting) -> LCD Display**。
3. 切換模式為 **Web Integration (網頁整合)**。
4. 輸入網址：
   ```text
   http://127.0.0.1:48942
   ```
5. 點擊 **套用 (Apply)** 即可！

#### 4. 設定開機無彈窗自動啟動
本專案已附帶開機啟動設定腳本。只需執行：
```bash
python setup_startup.py
```
這將自動在您的 Windows 啟動資料夾中建立一個捷徑，開機時會使用 `pythonw.exe` **在背景靜默啟動，完全不會跳出黑色的命令提示字元 (CMD) 視窗**。

- **如何取消**：按下 `Win + R` 鍵，輸入 `shell:startup` 並 Enter，刪除其中的 `AppleMusicAIO` 捷徑檔案即可。

---

# Apple Music Now Playing Widget for NZXT Kraken AIO

A highly polished web widget and local server custom-tailored for **NZXT Kraken / Elite** AIO liquid cooler LCD displays to show what's currently playing on Apple Music (via Windows Store App or iTunes) with dynamic liquid aurora and glowing ambient effects.

### Features

- **Liquid Aurora Background**: The background features 3 randomly drifting, colorful fluid blobs that blend organically to generate a futuristic, smooth animated aura.
- **Rotating Album Glow**: An ambient neon gradient aura surrounds the album cover, rotating and pulsing with a breathing animation during active playback.
- **Apple Music Aesthetics**: Dark glassmorphic cover card layout with modern geometric typography (Outfit font).
- **60FPS Progress Bar**: Smoothly interpolates track position for continuous fluid animation instead of standard 1-second ticks.
- **Auto-Scrolling Marquee**: Dynamically scrolls long song titles and artist names when text exceeds boundaries.
- **AIO Circular Screen Optimized**: Automatically detects NZXT CAM's query parameters and tightens layout paddings to fit perfectly within circular screens without clipping.
- **Standby Dashboard Clock**: Automatically fades into a beautiful lock-screen digital clock when no music is active.
- **Zero-Config Windows Integration**: Directly queries native Windows Runtime APIs (SMTC) to fetch media metadata. No API keys, developer accounts, or logins required.

### Setup & Running

1. **Install Dependencies**:
   ```bash
   pip install winsdk
   ```
2. **Run Server**:
   ```bash
   python server.py
   ```
3. **NZXT CAM Setup**: Apply `http://127.0.0.1:48942` under Lighting -> LCD -> Web Integration.
4. **Set Up Windows Startup**: Run `python setup_startup.py` to create a silent windowless shortcut in your Windows Startup directory.
