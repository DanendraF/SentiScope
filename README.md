# SentiScope – AI Sentiment Analytics Platform

> Platform analisis sentimen berbasis AI (Hybrid: HuggingFace + OpenAI) untuk memonitor opini publik dari teks, CSV, dan gambar, kemudian menyajikannya dalam bentuk insight, chart, dan laporan PDF/Excel/CSV.

**🌐 Live Demo**: [https://sentiscope.vercel.app](https://sentiscope.vercel.app)

---

## ✨ Features

### 📊 Multi-Input Analysis
- **Text Analysis** - Analyze single or batch text inputs
- **Product Search** - Search and analyze product reviews from datasets
- **CSV Upload** - Upload and analyze CSV files with sentiment data
- **Image OCR** - Extract text from images and perform sentiment analysis

### 🤖 Hybrid AI Engine
- **HuggingFace IndoBERT** - Bulk sentiment classification (Indonesian language)
- **OpenAI GPT-4** - Deep insights, trends analysis, and recommendations
- **Dual Mode Analysis** - Choose between basic (HuggingFace only) or deep (HuggingFace + OpenAI)

### 📈 Advanced Analytics
- **Sentiment Distribution** - Pie charts and statistics
- **Trend Analysis** - Sentiment trends over time
- **Keyword Extraction** - Identify key topics and phrases
- **Interactive Chatbot** - Ask questions about your analysis results

### 📤 Export Capabilities
- **PDF Reports** - Professional analysis reports
- **Excel Export** - Detailed data in XLSX format
- **CSV Export** - Raw data export

### 💾 History & Tracking
- **Analysis History** - Save and revisit past analyses
- **Pagination** - Efficient browsing of large datasets
- **Filter & Search** - Find specific analyses quickly

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**:
  - [shadcn/ui](https://ui.shadcn.com/) - Accessible component library
  - [Radix UI](https://www.radix-ui.com/) - Headless UI primitives
- **Charts**:
  - [Recharts](https://recharts.org/) - Composable charting library
  - Custom visualization components
- **State Management**: React Hooks (useState, useEffect)
- **Forms**: React Hook Form + Zod validation
- **Markdown**: ReactMarkdown + remark-gfm
- **Export**:
  - jsPDF - PDF generation
  - xlsx - Excel export
  - PapaParse - CSV parsing
- **Deployment**: [Vercel](https://vercel.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) v18+
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: TypeScript
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **ORM**: Supabase Client SDK
- **File Upload**: Multer
- **Image Processing**:
  - [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR (Optical Character Recognition)
  - [Sharp](https://sharp.pixelplumbing.com/) - Image optimization
- **AI/ML Services**:
  - [HuggingFace Inference API](https://huggingface.co/docs/api-inference) - IndoBERT sentiment model
  - [OpenAI API](https://platform.openai.com/) - GPT-4 for deep insights
- **Data Processing**:
  - Axios - HTTP client
  - PapaParse - CSV parsing
- **Validation**: express-validator
- **Security**:
  - Helmet.js - HTTP headers security
  - CORS - Cross-origin resource sharing
- **Deployment**: [Render](https://render.com/)

### Database Schema
- **PostgreSQL** via Supabase
- **Tables**:
  - `users` - User accounts and authentication
  - `analyses` - Analysis metadata and results
  - `analysis_items` - Individual sentiment results
  - `chat_messages` - Chatbot conversation history

### AI Models
- **HuggingFace**: `mdhugol/indonesia-bert-sentiment-classification` (Indonesian sentiment analysis)
- **OpenAI**: GPT-4 (Deep insights and recommendations)
- **Dataset**: HuggingFace datasets (Indonesian e-commerce reviews)

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git & GitHub
- **Code Quality**: ESLint, TypeScript strict mode
- **API Testing**: Postman / Thunder Client

---

## 🧠 How It Works (Hybrid Pipeline)

1. **User Input** - Text, CSV, image, or product/keyword search
2. **Preprocessing** - Text extraction, cleaning, and normalization
3. **Sentiment Classification** - HuggingFace IndoBERT model analyzes each text
4. **Aggregation** - Calculate statistics, extract keywords, identify patterns
5. **AI Insights** (Optional) - OpenAI GPT-4 generates deep analysis and recommendations
6. **Visualization** - Interactive charts and tables
7. **Export** - Download as PDF, Excel, or CSV

---




