**Prerequisites:**  Node.js

# 🧭 MACS Member Management (Updated)

A modern, fast, and scalable **member management system** built with **React, TypeScript, and Vite**.  
Includes smart features like PDF report generation, chart analytics, and Google Maps integration — all packed into a clean and responsive UI.

---

## 🚀 Tech Stack

| Category | Tools |
|-----------|-------|
| **Frontend** | React 19, TypeScript |
| **Build Tool** | Vite 6 |
| **UI & Icons** | Lucide React |
| **Charts** | Recharts 3.1.2 |
| **PDF Generation** | jsPDF, jsPDF-AutoTable |
| **Maps** | @react-google-maps/api |
| **Date Utilities** | date-fns |
| **AI Integration** | @google/genai |

---

## ⚙️ Installation

Clone the repository and install dependencies


1. Install dependencies:
   `npm install`
   `npm install i --save-dev @types/react-dom`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

# MACS Member Management System

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

A comprehensive member management system built with React, TypeScript, and Vite for managing customer relationships, gifts, policies, and analytics.

## 🚀 Features

- **Member Management**: Complete customer profile management with tier-based categorization
- **Gift Management**: Master gift list with tier-based gift mapping
- **Policy Management**: Insurance policy tracking and management
- **Analytics Dashboard**: Comprehensive reporting and analytics
- **Employee Management**: Staff management with role-based access
- **Document Hub**: Centralized document management
- **Task Management**: Task tracking and automation
- **WhatsApp Integration**: Automated communication workflows
- **Location Services**: Google Maps integration for location tracking

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Git**: For version control

### Recommended Versions
- Node.js: `18.17.0` or `20.x.x`
- npm: `9.8.1` or higher

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd macs-member-management-updated
```

### 2. Install Dependencies

#### Core Dependencies
```bash
npm install
```

#### Specific Package Versions (if needed)
```bash
# Charts and visualization
npm install recharts@3.1.2 --save

# React and TypeScript types
npm install --save-dev @types/react-dom@19.1.9

# Google AI integration
npm install @google/genai@1.9.0 --save

# Google Maps integration
npm install @react-google-maps/api@2.19.3 --save

# PDF generation
npm install jspdf@3.0.2 jspdf-autotable@5.0.2 --save

# Date utilities
npm install date-fns@4.1.0 --save

# Icons
npm install lucide-react@0.525.0 --save

# Routing
npm install react-router-dom@7.9.3 --save
```

#### Development Dependencies
```bash
# TypeScript and build tools
npm install --save-dev typescript@5.8.2
npm install --save-dev @vitejs/plugin-react@5.0.0
npm install --save-dev vite@6.2.0
npm install --save-dev @types/node@22.14.0
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:
```bash
cp .env.local.example .env.local
```

Add your API keys:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Important**: Replace `PLACEHOLDER_API_KEY` with your actual Gemini API key.

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📦 Package.json Overview

```json
{
  "name": "macs-member-management-updated",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 🏗️ Project Structure

```
macs-member-management-updated/
├── components/
│   ├── tabs/                 # Tab components for different sections
│   ├── ui/                   # Reusable UI components
│   └── *.tsx                 # Main application components
├── services/
│   ├── apiService.ts         # API service layer
│   ├── geminiService.ts      # Google Gemini AI integration
│   └── otherAiService.ts     # Additional AI services
├── .env.local                # Environment variables
├── App.tsx                   # Main application component
├── types.ts                  # TypeScript type definitions
├── constants.tsx             # Application constants
├── vite.config.ts           # Vite configuration
└── tsconfig.json            # TypeScript configuration
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 🌐 API Configuration

### Gemini AI Integration
The application uses Google's Gemini AI for various features. Ensure you have:
1. A valid Gemini API key
2. Proper API key configuration in `.env.local`

### Google Maps Integration
For location services, you may need to configure Google Maps API keys.

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

## 🛠️ Technology Stack

- **Frontend**: React 19.1.0, TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS (configured)
- **Charts**: Recharts 3.1.2
- **Icons**: Lucide React 0.525.0
- **PDF Generation**: jsPDF 3.0.2
- **Date Handling**: date-fns 4.1.0
- **AI Integration**: Google Gemini AI
- **Maps**: Google Maps API

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**: Change port in `vite.config.ts`
2. **API key errors**: Verify `.env.local` configuration
3. **Build failures**: Ensure all dependencies are installed correctly

### Getting Help

For technical support or questions, please contact the development team.

---

**Note**: This is a member management system designed for financial services. Ensure proper data security and compliance measures are in place before deployment.