# MediCareBook - Frontend Client Portal

Modern, responsive web application for the **MediCareBook** clinical appointment reservation platform built with **React 18**, **Vite**, and **Tailwind CSS**.

---

## 💻 Features
* **Role-Specific Dashboards**:
  * 🧑‍⚕️ **Patient Portal**: Explore doctor directories, filter across 12 clinical specialties, reserve appointment slots, and manage booking history.
  * 🩺 **Doctor Portal**: Manage clinical practice profile, consultation fee, working hours, and review appointment requests.
  * 🛡️ **Admin Portal**: Audit doctor approval queues, instant doctor onboarding with specialty selection, user account directory, and master appointment ledger.
* **🤖 MediCareBook AI Assistant**:
  * Clinical symptom-to-specialty guidance.
  * Live database lookup of available practitioners with fees and schedule hours.
  * Platform navigation and policy FAQs.
* **Input Validation & UX**: Real-time per-field error highlights, responsive Tailwind layout, and authenticated JWT session management.

---

## 🛠️ Technology Stack
* **Framework**: React 18
* **Build Engine**: Vite
* **Styling**: Tailwind CSS, PostCSS, Autoprefixer
* **HTTP Client**: Axios (with Bearer Token authorization interceptor)
* **Containerization**: Docker & Nginx

---

## 🚀 Getting Started

### Prerequisites
* **Node.js 18+** (`node -v`)
* **npm** or **yarn**

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
The application will launch on **`http://localhost:5173`**.

### Production Build
```bash
npm run build
```
The compiled, minified bundle will be generated in `dist/`.

---

## ⚙️ Configuration
By default, the client communicates with the backend running on `http://localhost:8000`. To customize the API target, configure `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```
