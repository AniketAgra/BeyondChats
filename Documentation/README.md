# 📚 EduLearn Documentation Index

Welcome to the comprehensive documentation for EduLearn - your AI-powered learning platform.

---

## 🗂️ Documentation Structure

### 📘 Overview & Guides

Essential documents to understand and set up EduLearn:

| Document | Description | For |
|----------|-------------|-----|
| [01_Introduction](./overview/01_Introduction.md) | What is EduLearn, key features, use cases, and learning philosophy | Everyone |
| [02_System_Architecture](./overview/02_System_Architecture.md) | Technical architecture, data flow, and system design | Developers, Architects |
| [03_Developer_Guide](./overview/03_Developer_Guide.md) | Setup instructions, environment configuration, development workflow | Developers |
| [04_Deployment_Guide](./overview/04_Deployment_Guide.md) | Production deployment on Vercel, Render, AWS | DevOps, Developers |

---

### 📄 Page-Level Documentation

Detailed documentation for each major feature/page:

| Page | File | Description |
|------|------|-------------|
| **Dashboard** | [page_dashboard.md](./pages/page_dashboard.md) | Analytics dashboard with performance tracking, charts, and AI recommendations |
| **PDF Viewer** | [page_pdf_viewer.md](./pages/page_pdf_viewer.md) | PDF rendering, AI chat integration, notes, and YouTube suggestions |
| **Quiz Engine** | Coming soon | Quiz generation, taking quizzes, scoring, and reattempts |
| **AI PDF Buddy** | Coming soon | Context-aware AI assistant for PDF-specific questions |
| **AI Study Buddy** | Coming soon | RAG-powered personalized tutoring across all materials |
| **Authentication** | Coming soon | Signup, login, JWT tokens, and session management |
| **Notes System** | Coming soon | Text and audio note-taking linked to PDFs |
| **Library** | Coming soon | PDF upload, organization, and management |

---

### 🌐 API Documentation

Complete REST API and WebSocket reference:

| Document | Description |
|----------|-------------|
| [api_endpoints.md](./api/api_endpoints.md) | All REST API endpoints with request/response examples |
| WebSocket Events | Coming soon - Real-time chat events and Socket.IO integration |

**Covered Endpoints:**
- Authentication (`/api/auth/*`)
- PDF Management (`/api/pdf/*`)
- Quiz System (`/api/quiz/*`)
- Analytics (`/api/analytics/*`)
- Chat (`/api/chat/*`)
- Notes (`/api/notes/*`)
- AI Study Buddy (`/api/aibuddy/*`)

---

### 🔧 Service Integrations

External service documentation:

| Service | File | Description |
|---------|------|-------------|
| **Supabase Storage** | [service_supabase.md](./services/service_supabase.md) | PDF file storage, signed URLs, bucket configuration |
| **Pinecone** | Coming soon | Vector database for RAG, embeddings, namespaces |
| **AI Integration** | Coming soon | Gemini & OpenAI setup, prompt engineering, streaming |
| **Authentication** | Coming soon | JWT implementation, refresh tokens, security |
| **Quiz Tracker** | Coming soon | Performance tracking, topic analysis, weak areas |

---

### 🛠️ Technical Documentation

System-level technical details:

| Document | Description |
|----------|-------------|
| [tech_stack.md](./technical/tech_stack.md) | Complete list of technologies, libraries, frameworks, and tools |
| Data Flow | Coming soon - How data moves through the system |
| Performance Optimization | Coming soon - Caching, lazy loading, optimization strategies |
| Environment Variables | Coming soon - All env vars explained with examples |
| UX Design Principles | Coming soon - How we made EduLearn intuitive and easy to use |

---

## 🚀 Quick Start Guide

**New to EduLearn?** Follow this path:

1. **Understand the System**
   - Read [01_Introduction](./overview/01_Introduction.md)
   - Review [02_System_Architecture](./overview/02_System_Architecture.md)

2. **Set Up Development Environment**
   - Follow [03_Developer_Guide](./overview/03_Developer_Guide.md)
   - Get API keys from external services
   - Run backend and frontend locally

3. **Explore Features**
   - Read page-level documentation for features you'll work on
   - Check [API Endpoints](./api/api_endpoints.md) for available routes

4. **Deploy to Production**
   - When ready, follow [04_Deployment_Guide](./overview/04_Deployment_Guide.md)

---

## 🎯 Documentation by Role

### For Product Managers
- [01_Introduction](./overview/01_Introduction.md) - Features and use cases
- [Page Documentation](./pages/) - How each feature works
- [UX Design Principles](./technical/) - User experience approach

### For Developers
- [03_Developer_Guide](./overview/03_Developer_Guide.md) - Setup and workflow
- [02_System Architecture](./overview/02_System_Architecture.md) - Technical design
- [API Endpoints](./api/api_endpoints.md) - REST API reference
- [Tech Stack](./technical/tech_stack.md) - Technologies used

### For DevOps Engineers
- [04_Deployment_Guide](./overview/04_Deployment_Guide.md) - Production deployment
- [Service Integrations](./services/) - External dependencies
- Environment Variables - Configuration management

### For QA Engineers
- [Page Documentation](./pages/) - Feature specifications
- [API Endpoints](./api/api_endpoints.md) - Testing endpoints
- User Flow Diagrams - Testing scenarios

---

## 📖 How to Use This Documentation

### Finding Information

**By Feature:**
1. Check `/pages/` folder for page-specific docs
2. Example: For dashboard → `pages/page_dashboard.md`

**By API:**
1. Go to `api/api_endpoints.md`
2. Use Table of Contents to find endpoint group
3. See request/response examples

**By Service:**
1. Check `/services/` folder
2. Example: For Supabase → `services/service_supabase.md`

**By Technology:**
1. See `technical/tech_stack.md` for full list
2. Links to official documentation provided

---

## 🔄 Documentation Status

### ✅ Completed
- Introduction and overview
- System architecture
- Developer guide
- Deployment guide
- Dashboard page documentation
- PDF Viewer page documentation
- Complete API endpoints reference
- Supabase service documentation
- Tech stack documentation
- Updated README.md

### 🚧 In Progress
- Quiz engine page documentation
- AI Buddy pages documentation
- Additional service integration docs

### 📋 Planned
- WebSocket events detailed guide
- Data flow diagrams
- Performance optimization guide
- Security best practices
- Testing strategies
- Troubleshooting guide

---

## 🤝 Contributing to Documentation

Found an issue or want to improve documentation?

1. **Typos/Small Fixes:** Edit directly and submit PR
2. **New Pages:** Follow existing template structure
3. **Major Changes:** Open issue for discussion first

### Documentation Standards

- Use clear, concise language
- Include code examples where relevant
- Add diagrams for complex flows
- Keep formatting consistent (headings, lists, code blocks)
- Update Table of Contents when adding sections

---

## 📞 Getting Help

**Can't find what you're looking for?**

1. Use Ctrl+F to search within documents
2. Check related documentation links at bottom of each page
3. Review main [README.md](../README.md) for quick reference
4. Open a GitHub issue with `[Documentation]` tag

---

## 📊 Documentation Statistics

- **Total Documentation Files:** 10+
- **Total Pages:** 50+
- **Lines of Documentation:** 5000+
- **API Endpoints Documented:** 40+
- **Code Examples:** 100+

---

## 🗺️ Documentation Roadmap

### Phase 1 (Current) ✅
- Core overview documents
- Essential page documentation
- API reference
- Service integrations
- Tech stack

### Phase 2 (Next)
- Complete all page documentation
- WebSocket detailed guide
- Advanced topics (RAG, embeddings)
- Video tutorials

### Phase 3 (Future)
- Interactive API playground
- Searchable documentation site
- FAQ section
- Community examples

---

## 📝 Document Templates

When creating new documentation, use these templates:

### Page Documentation Template
```markdown
# [Page Name] Documentation

## Overview
[Brief description]

## Purpose
[Why this page exists]

## Components
[List of components used]

## API Endpoints
[Endpoints this page uses]

## Data Flow
[How data flows]

## Related Documentation
[Links to related docs]
```

### Service Documentation Template
```markdown
# [Service Name] Integration

## Overview
[What this service does]

## Setup
[Configuration steps]

## Usage
[How to use in code]

## API Reference
[Key methods/endpoints]

## Troubleshooting
[Common issues]
```

---

**Last Updated:** October 2025  
**Documentation Version:** 1.0.0  
**Project Version:** 1.0.0

---

**Happy Learning! 📚✨**
