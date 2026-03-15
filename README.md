# DICAS 益成金屬工廠儀表板

即時工廠管理儀表板，串接 Notion API。

## 功能

- 📊 KPI 儀表板（工單、良率、外包、庫存）
- 👤 人員任務追蹤
- 📦 零件庫存水位
- 🚚 外包排程追蹤
- ⚠️ 異常紀錄
- 📈 良率圖表

## 部署

### Vercel（推薦）

```bash
# 1. 安裝 Vercel CLI
npm install -g vercel

# 2. 登入
vercel login

# 3. 部署
cd dicas-dashboard
vercel

# 4. 設定環境變數
vercel env add NOTION_KEY
# 輸入你的 Notion Integration Token

# 5. 正式上線
vercel --prod
```

### 本地測試

```bash
cd dicas-dashboard
npm install
NOTION_KEY=你的API金鑰 npm start
# 瀏覽 http://localhost:3000
```

## Notion 資料庫

請先建立以下資料庫（參考系統 Prompt）：

- DB-01 品牌 brands
- DB-04 零件主檔 parts_master
- DB-07 外部工廠 suppliers
- DB-10 生產工單 production_orders
- DB-12 外包排程追蹤 outsource_tracking
- DB-14 異常紀錄 issues

## 技術

- Frontend: Vanilla HTML/CSS/JS + Chart.js
- Backend: Vercel Serverless API
- Data: Notion API
