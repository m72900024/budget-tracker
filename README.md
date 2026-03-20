# 💰 計畫經費追蹤系統

學校計畫經費管理工具，支援預算編列、核銷追蹤、廠商管理、報表匯出。

## 🌐 線上使用

- **線上版（需網路）**：[https://m72900024.github.io/budget-tracker/](https://m72900024.github.io/budget-tracker/)
- **離線版（單檔）**：[https://m72900024.github.io/budget-tracker/offline.html](https://m72900024.github.io/budget-tracker/offline.html)

## 📥 下載離線版

[點此下載 offline.html](https://github.com/m72900024/budget-tracker/raw/main/offline.html) → 存到電腦，雙擊即開。

## ✨ 功能特色

- 📋 **計畫管理** — 新增/編輯/刪除計畫，設定年度與結案期限
- 💰 **經費類別** — 自訂預算類別，支援拖曳排序
- 🧾 **核銷追蹤** — 記錄每筆核銷（金額、廠商、日期、收據編號、狀態）
- 🏪 **廠商管理** — 統一管理常用廠商
- 📊 **儀表板** — 圓餅圖總覽、年度篩選、搜尋（防抖優化）
- 📋 **模板** — 4 套預設模板快速建立計畫
- 🌙 **深色模式** — 護眼切換
- 🖨️ **列印** — 一鍵列印報表
- 📤 **匯出入** — CSV / JSON 雙格式匯出匯入，支援取代/合併模式
- 📦 **自動備份** — 每日自動備份，保留 7 天，一鍵還原
- ♿ **無障礙** — ARIA 標籤、dialog 角色、螢幕閱讀器友善
- 📱 **RWD** — 手機平板桌機皆可用，觸控優化

## 📁 檔案結構

```
budget-tracker/
├── index.html          # 線上版（模組化，需網路載入 Firebase）
├── offline.html        # 離線版（單檔完整版，雙擊即開）
├── css/
│   └── style.css       # 樣式
└── js/
    ├── config.js       # 設定（Firebase 等）
    ├── app.js          # 應用初始化
    ├── auth.js         # 登入驗證
    ├── db.js           # 資料庫操作
    ├── dashboard.js    # 儀表板
    ├── detail.js       # 計畫詳情
    ├── vendor.js       # 廠商管理
    ├── template.js     # 模板系統
    └── export.js       # 匯出入
```

## 🛠️ 技術

- HTML / CSS / JavaScript（純前端，無框架）
- [Tailwind CSS](https://tailwindcss.com/)（CDN）
- Canvas API（圓餅圖）
- localStorage（離線版資料儲存）
- Firebase Firestore + Google Auth（線上版）

---

## 📝 改版日誌

### v2.1.0（2026-03-20）
**🔒 安全修復 + A11Y 無障礙 + UX 改進**

**安全修復：**
- ✅ XSS 防護 — 所有使用者輸入套用 `escapeHtml()` 過濾
- ✅ `uid()` 改用 `crypto.randomUUID()`（更安全的 ID 生成）
- ✅ Blob URL 記憶體洩漏修復（匯出後自動釋放）

**Bug 修復：**
- ✅ 金額 $0 驗證修正（不再被拒絕）
- ✅ CSV 匯出引號跳脫修正（模組版）
- ✅ 日期時區修正（deadline 不再差一天）
- ✅ `dark:bg-gray-750` 修正為 `dark:bg-gray-700`
- ✅ Tailwind CDN 離線 fallback（斷網仍可用）

**模組版功能對齊：**
- ✅ 自動備份機制（每日一份，保留 7 天，📦 按鈕管理還原）
- ✅ CSV 匯入功能
- ✅ JSON/CSV 匯入支援「取代」或「合併」模式

**A11Y 無障礙：**
- ✅ 所有按鈕加 `aria-label`（螢幕閱讀器友善）
- ✅ Modal 加 `role="dialog"` + `aria-modal="true"`
- ✅ 表單 `<label>` 與 `<input>` 正確關聯（`for`/`id`）
- ✅ 進度條加 `role="progressbar"`
- ✅ Toast 加 `aria-live="polite"`

**UX 改進：**
- ✅ 手機 header 新增「⋯ 更多」下拉選單（減少按鈕擠壓）
- ✅ 搜尋加 300ms debounce（不再每按一鍵重繪）
- ✅ 核銷操作按鈕觸控區域加大（44px 最小觸控目標）

### v2.0.0（2026-03-17）
**🔄 離線版發佈 + 模組化重構**

- ✅ 新增 `offline.html` — 單檔離線版，59KB，雙擊即開
- ✅ 完全移除 Firebase 依賴（離線版）
- ✅ CSV 匯出/匯入功能（UTF-8 BOM，Excel 相容）
- ✅ JSON 匯出/匯入功能
- ✅ 無資料時圓餅圖自動隱藏，版面更乾淨
- ✅ 資料存 localStorage，關掉重開資料還在

### v1.1.0（2026-03-16）
**🏗️ 模組化重構 + Firebase 整合**

- ✅ 822 行單檔 → 11 檔模組化架構（1,257 行）
- ✅ Firebase Firestore 雲端儲存
- ✅ Google 帳號登入
- ✅ 舊資料自動遷移（localStorage → Firestore）

### v1.0.0（2026-03-15）
**🎉 初始版本**

- ✅ 計畫 CRUD（新增/編輯/刪除）
- ✅ 經費類別管理 + 拖曳排序
- ✅ 核銷紀錄 CRUD + 複製功能
- ✅ 廠商管理
- ✅ 4 套預設模板
- ✅ 圓餅圖儀表板 + 年度篩選 + 搜尋
- ✅ 深色模式
- ✅ Toast 通知
- ✅ 列印功能
- ✅ RWD 響應式設計

---

## 📄 授權

MIT License
