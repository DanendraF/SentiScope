# SentiScope - AI-Powered Sentiment Analysis Platform

A modern, production-ready sentiment analysis platform built with Next.js 14, featuring a clean SaaS-style dashboard inspired by Brand24.

## Features

### Landing Page
- Modern hero section with gradient text effects
- Feature cards highlighting key capabilities
- How It Works section with step-by-step guide
- Pricing section with three tiers
- Fully responsive design
- Dark mode support

### Dashboard
- Clean, intuitive sidebar navigation
- Top bar with search, notifications, and user menu
- Overview statistics cards
- Quick action shortcuts
- Recent activity feed

### Sentiment Analyzer
- **Multiple Input Methods:**
  - Text/Keywords input
  - CSV file upload
  - Image upload with drag & drop

- **Rich Results Display:**
  - Sentiment summary cards (Positive, Negative, Neutral)
  - Interactive charts:
    - Pie chart for sentiment distribution
    - Line chart for sentiment trends
    - Bar chart for keyword analysis
  - Detailed data table with sentiment labels
  - AI-generated insights summary
  - PDF report download button

### Reports & History
- View all generated reports
- Track analysis history
- Download past analyses
- Filter and search functionality

### Settings
- Profile management
- Notification preferences
- API key management
- Account settings

### Authentication
- Beautiful login/register pages
- Social authentication UI (Google, GitHub)
- Form validation
- Loading states

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Charts:** Recharts
- **Icons:** Lucide React
- **Theme:** next-themes (Dark mode support)
- **TypeScript:** Full type safety

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/app
  /page.tsx                 → Landing page
  /login                    → Login page
  /register                 → Register page
  /dashboard
    /page.tsx               → Dashboard overview
    /analyze/page.tsx       → Sentiment analyzer
    /reports/page.tsx       → Reports list
    /history/page.tsx       → Analysis history
    /settings/page.tsx      → Settings page
    /layout.tsx             → Dashboard layout

/components
  /ui                       → shadcn/ui components
  /charts                   → Chart components
  navbar.tsx                → Landing page navbar
  dashboard-sidebar.tsx     → Dashboard sidebar
  dashboard-topbar.tsx      → Dashboard top bar
  theme-provider.tsx        → Theme provider
  loading-skeleton.tsx      → Loading skeletons
```

## Key Features

### Dark Mode
The application supports system-wide dark mode with a toggle button in the navigation bar.

### Responsive Design
Fully responsive layout that works seamlessly on mobile, tablet, and desktop devices.

### Loading States
Smooth loading animations and skeleton screens for better user experience.

### Interactive Charts
Beautiful, interactive charts using Recharts library for data visualization.

### Modern UI/UX
Clean, professional design with smooth animations and transitions.

## Build for Production

```bash
npm run build
```

## Next Steps (Backend Integration)

The frontend is ready to be connected to a backend API. Key integration points:

1. **Authentication:** Connect login/register to your auth service
2. **Sentiment Analysis:** Integrate with AI/ML sentiment analysis API
3. **Data Storage:** Connect to database for storing analyses
4. **File Upload:** Implement file processing for CSV and images
5. **PDF Generation:** Add server-side PDF report generation

## Environment Variables

Create a `.env.local` file for environment variables:

```env
NEXT_PUBLIC_API_URL=your_api_url
```

## License

Danendra Farrel Adriansyah
