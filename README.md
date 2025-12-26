# M&M Minimart Inventory System

A high-performance, modern store inventory management system built with React, Gemini AI, and Electron. Designed for M&M Minimart to handle both AI-powered visual scanning and traditional hardware laser scanning.

## 🚀 Features

- **AI Universal Scanner**: Uses Google Gemini 3 Flash to identify products and extract barcodes directly from images.
- **Hardware Laser Support**: Global keyboard listeners for HID barcode scanners with instant action "toasts".
- **Real-time Analytics**: Visual dashboards for stock levels, category distribution, and transaction volume.
- **Philippine Peso Support**: Fully localized currency for the PH market.
- **Windows Desktop Ready**: Pre-configured with Electron and `electron-builder` to generate a standalone `.exe`.
- **Low Stock Alerts**: Automatic tracking and highlighting of items that need restocking.

## 🛠️ Tech Stack

- **Frontend**: React (ESM), Tailwind CSS, Lucide Icons.
- **AI**: Google GenAI SDK (Gemini 2.5/3).
- **Charts**: Recharts.
- **Desktop**: Electron.

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mm-minimart.git
   cd mm-minimart
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   The application requires a `process.env.API_KEY` for the Gemini AI features. If running locally via Electron, ensure your environment variables are set.

4. **Start in Development**
   ```bash
   npm start
   ```

## 🏗️ Building for Windows

To generate a portable Windows executable (.exe):
```bash
npm run build:win
```
The output will be located in the `dist-electron/` directory.

## 📄 License
MIT
