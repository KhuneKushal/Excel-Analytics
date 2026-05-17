# Excel Analytics

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?logo=typescript)

A powerful, entirely client-side Excel data analytics and business intelligence (BI) dashboard. 

**Update 2.0:** This repository represents the second major iteration of the Excel Analytics application. We have completely migrated our tech stack from **Angular to React** to deliver a more responsive, modular, and dynamic user experience. Along with the framework migration, a suite of advanced analytical capabilities has been introduced.

---

## ✨ Key Features

- **Automated Pivot Analysis:** Intelligent pivot engine that automatically detects categorical data and generates meaningful cross-tabulations without complex setup.
- **Business Intelligence Dashboard:** A customizable, interactive drag-and-drop dashboard for visualizing data relationships, performance metrics, and automated summaries.
- **Advanced Statistical Operations:** On-the-fly calculations for mean, median, mode, standard deviation, and variance across your dataset.
- **Optimized Report Downloads:** High-performance "whiteboard-style" PDF generation and optimized Excel exports, ensuring professional formatting and faster download speeds.
- **Smart Data Visualizations:** Integrated charts (Bar, Line, Pie, Scatter, etc.) with automatic best-fit chart type recommendations based on your selected column data types.
- **Instant Filtering & Computed Columns:** Filter massive datasets in real-time and create custom calculated columns using spreadsheet-like formulas.

## 🚀 Deployment

This application is optimized for edge deployment and is designed to be hosted on **Vercel**. 

Because it operates entirely on the client side without needing a backend server, it benefits immensely from Vercel's global CDN and edge caching, resulting in near-instant load times for users anywhere in the world.

## 🛠️ Tech Stack

- **Framework:** React 18
- **Language:** TypeScript
- **Styling:** Vanilla CSS (Modern, Responsive, Glassmorphism UI)
- **State Management:** Zustand
- **Build Tool:** Vite
- **Excel Parsing:** xlsx
- **PDF Generation:** jsPDF & html2canvas

## 💻 Local Development

To run this project locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KhuneKushal/Excel-Analytics.git
   cd Excel-Analytics
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local server URL provided by Vite (typically `http://localhost:5173`).
