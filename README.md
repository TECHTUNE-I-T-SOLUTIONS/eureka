# 📚 Eureka - Your Personal AI Study Assistant

<div align="center">

![Eureka Logo](./public/Eureka-01.png)

**Transform your learning journey with AI-powered study materials management and intelligent tutoring**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org)

</div>

## 🎯 Overview

Eureka is a cutting-edge AI study assistant that helps students efficiently manage, understand, and master their study materials. Upload documents, get AI-powered summaries, explore content through intelligent conversations, and receive push notifications when your notes are ready.

### ✨ Key Features

- 📄 **Multi-format Upload**: Support for `.txt`, `.md`, and `.pdf` files
- 🤖 **AI Summarization**: Instant summaries powered by Gemini 2.0 Flash with internet search
- 💬 **Intelligent Chat**: Ask questions about your notes with context-aware responses
- 📱 **Push Notifications**: Real-time alerts when documents are processed
- 🎨 **Beautiful UI**: Modern, responsive design with dark mode support
- 🔐 **Secure Authentication**: Supabase Auth with social login support
- 📊 **Real-time Updates**: Live status changes without page refresh
- 🧠 **Personalized Explanations**: Adjust AI responses to your learning level
- 🌍 **Full-Stack**: Server-side rendering, API routes, and real-time subscriptions

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **pnpm** (recommended) or npm
- **Supabase Account** (free tier works)
- **Google Generative AI Key** (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TECHTUNE-I-T-SOLUTIONS/eureka.git
   cd eureka
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Google Generative AI
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   
   # Push Notifications (optional)
   PUSH_NOTIFICATIONS_SUBJECT=mailto:your-email@example.com
   PUSH_NOTIFICATIONS_PUBLIC_KEY=your_vapid_public_key
   PUSH_NOTIFICATIONS_PRIVATE_KEY=your_vapid_private_key
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
   ```

4. **Set up Database**
   - Create a new Supabase project
   - Run migrations in SQL Editor:
     ```sql
     -- Copy contents from scripts/001_init.sql
     -- Then run scripts/002_add_triggers.sql
     -- Then run scripts/003_fix_push_subscriptions.sql
     ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### Uploading Notes

1. Click **"Upload Note"** on the Notes page
2. Choose from:
   - **Type/Paste**: Directly enter or paste text
   - **Upload File**: Drag & drop or browse `.txt`, `.md`, or `.pdf` files
3. Add a title and click **"Create Note"**
4. Watch the status change from `Pending` → `Processing` → `Completed` in real-time

### Chatting with AI

1. Go to **Dashboard** → **Notes**
2. Click on any completed note
3. Click **"Chat about this"** or navigate to the Chat section
4. Ask questions about your note content
5. Eureka provides personalized answers based on your learning level

### Customizing Your Experience

1. Go to **Settings**
2. Adjust:
   - **Explanation Level**: Choose between Beginner, Intermediate, or Advanced
   - **Push Notifications**: Enable browser notifications for processing updates
   - **Email Notifications**: Get email alerts (coming soon)

## 🏗️ Architecture

### Tech Stack

- **Frontend**:
  - Next.js 16 with React 19
  - TypeScript for type safety
  - Tailwind CSS + shadcn/ui components
  - Real-time Supabase subscriptions

- **Backend**:
  - Next.js API Routes
  - Google Generative AI SDK
  - Web Push API for notifications
  - Supabase PostgreSQL

- **Services**:
  - **Supabase**: Database, authentication, real-time subscriptions
  - **Google Gemini 2.0 Flash**: AI models for summaries and chat
  - **Web Push**: Browser push notifications

### Database Schema

```
user_settings (linked to auth.users)
├── display_name
├── explain_level (beginner/intermediate/advanced)
├── push_enabled
└── email_notifications

notes
├── title
├── raw_text
├── summary
├── status (pending/processing/completed/error)
└── uploaded_via (text/file/paste)

chunks (text segments for context)
├── note_id (FK)
├── chunk_text
├── chunk_hash
└── embedding (for future vector search)

chats
├── user_id (FK)
├── note_id (FK, optional)
└── title

chat_messages
├── chat_id (FK)
├── sender (user/assistant)
└── content

notifications
├── user_id (FK)
├── type
├── title & message
└── payload

push_subscriptions
├── user_id (FK)
├── endpoint (device-specific)
├── p256dh & auth (encryption keys)
└── created_at
```

## 🔄 Real-Time Features

### Live Status Updates
- Upload a note and watch the status badge update in real-time
- No page refresh needed—Supabase Realtime handles everything
- Toast notifications confirm when processing completes

### Push Notifications
1. Enable in Settings
2. Grant browser permission
3. Receive notifications when notes finish processing

### Chat Context Awareness
- Retrieves relevant chunks from your notes
- Provides contextual, accurate answers
- Maintains conversation history

## 🛠️ Development

### Project Structure

```
eureka/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── notes/
│   │   └── notifications/
│   ├── auth/
│   ├── dashboard/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── chat/
│   ├── notes/
│   ├── settings/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── supabase/
│   ├── utils/
│   └── types.ts
├── public/
│   ├── Eureka-01.png
│   ├── sw.js (service worker)
│   └── pdf.worker.min.mjs
└── scripts/
    └── *.sql (database migrations)
```

### Running Tests

```bash
pnpm lint
```

### Building for Production

```bash
pnpm build
pnpm start
```

## 📝 Environment Variables

See `.env.example` for all required variables.

### Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GEMINI_API_KEY`

### Optional (Push Notifications)
- `PUSH_NOTIFICATIONS_SUBJECT`
- `PUSH_NOTIFICATIONS_PUBLIC_KEY`
- `PUSH_NOTIFICATIONS_PRIVATE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

## 🔐 Security

- ✅ Row-Level Security (RLS) on all database tables
- ✅ Authentication required for all API endpoints
- ✅ HTTPS only in production
- ✅ API keys never exposed in client code
- ✅ User data isolation at database level
- ✅ Secure service worker for push notifications

## 🚧 Known Limitations

- Push notifications require HTTPS in production
- PDF text extraction works best with text-based PDFs
- Large files (>10MB) may take longer to process
- Embedding storage ready but vector search not yet implemented

## 🔮 Roadmap

- [ ] Vector search for semantic note discovery
- [ ] Study groups and collaborative notes
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Spaced repetition system
- [ ] Export notes as PDF/markdown
- [ ] AI-generated practice questions
- [ ] Audio notes support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Backend as a Service
- [Google Generative AI](https://ai.google.dev) - AI models
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Sonner](https://sonner.emilkowal.ski) - Toast notifications

## 💬 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact:
- **Email**: techtune.it.solutions@gmail.com
- **GitHub Issues**: [Eureka Issues](https://github.com/TECHTUNE-I-T-SOLUTIONS/eureka/issues)

---

<div align="center">

**Built by [TechTune IT Solutions](https://github.com/TECHTUNE-I-T-SOLUTIONS)**

*Making education more accessible, one note at a time*

</div>
