# Meowify — QR-based Cat Identification System

Meowify is an admin-controlled system designed for managing cat records and generating QR tags for identification.

## 🚀 Project Overview

* **Admin Dashboard**: Internal team members can create, edit, and manage cat records.
* **Public Pet Pages**: Each cat has a unique public URL accessible via QR code.
* **QR Generation**: Automatically generate and download QR codes for each cat profile.

## ⚙️ Tech Stack

* **Frontend**: React + Vite
* **UI**: shadcn/ui + Radix UI + Tailwind CSS
* **Backend**: Firebase Firestore (Database) + Firebase Auth (Admin Authentication)
* **Storage**: Cloudinary (Image uploads)

## 🛠️ Getting Started

### Prerequisites
* Node.js (v18+)
* npm

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see `.env.example`)

### Development
Run the development server:
```bash
npm run dev
```

### Build
Build for production:
```bash
npm run build
```

## 🔐 Security
* Dashboard routes are protected and require admin authentication.
* Public pet pages (`/pet/:id`) are accessible to everyone without login.
