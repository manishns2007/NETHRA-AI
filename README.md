<div align="center">
  <!-- Placeholders for logo -->
  <img src="https://via.placeholder.com/150x150.png?text=NETHRA-AI+Logo" alt="NETHRA AI Logo" width="120" />

  # NETHRA-AI
  **Intelligence at the Speed of Investigation**

  An advanced, AI-assisted digital forensics and investigation platform built to accelerate evidence discovery using AI, Graph Analysis, and automated data pipelines.

  [Live Demo](https://nethra-ai-tau.vercel.app/) • [Documentation](#) • [Report Bug](#) • [Request Feature](#)

  <!-- Badges -->
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Status](https://img.shields.io/badge/Status-Beta-orange)]()
</div>

<br />

> **Developed for the Kerala Police Cyberdome**, NETHRA AI streamlines cybercrime investigations by combining digital forensics, artificial intelligence, and intelligent evidence management into a unified, secure system.

## 📑 Table of Contents

- [About The Project](#-about-the-project)
- [Live Demo](#-live-demo)
- [Key Features](#-key-features)
- [Investigation Workflow](#-investigation-workflow)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Project](#running-the-project)
- [Usage](#-usage)
- [Security Features](#-security-features)
- [Why NETHRA-AI?](#-why-nethra-ai)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🔍 About The Project

**NETHRA AI** transforms raw digital evidence into actionable intelligence. By leveraging automated optical character recognition (OCR), named entity extraction (NER), and knowledge graph mapping, investigators can uncover hidden connections across thousands of artifacts in seconds.

The platform provides a secure, evidence-centric workspace, enabling law enforcement and forensic experts to interact with case files seamlessly.

---

## 🌐 Live Demo

Experience the marketing landing page and feature highlights here:  
**[NETHRA AI Live Deployment](https://nethra-ai-tau.vercel.app/)**

---

## ✨ Key Features

- **Automated Processing**: Upload documents, images, or raw text. The platform automatically queues and processes evidence through OCR and NER pipelines.
- **Knowledge Graphs**: Visualize hidden connections between entities across your entire case using interactive Cytoscape graphs.
- **Contextual AI**: Query your evidence using an intelligent AI assistant strictly grounded in the selected investigation context.
- **Evidence Management**: Secure storage with forensic integrity verification.
- **Interactive Dashboards**: Comprehensive views mapping evidence, metadata, and extracted indicators.
- **Chain of Custody Tracking**: Immutable audit logging for all interactions with evidence artifacts.
- **Reporting**: Full evidence intelligence reports generated instantly.

---

## 🔬 Investigation Workflow

1. **Ingest Evidence**: Securely upload digital files to the platform.
2. **Automated Pipeline**: The system extracts metadata, transcribes images via OCR, and runs LLM-based Named Entity Recognition (NER) to pull out critical indicators.
3. **Graph Construction**: Entities and relationships are automatically mapped into an interactive knowledge graph.
4. **AI Insights & Assistant**: Chat dynamically with the evidence and review AI-generated contextual insights.
5. **Report Generation**: Export comprehensive, formatted investigative reports.

---

## 📸 Screenshots

> **Note:** Replace these placeholders with actual screenshots of the application.

| Dashboard | Knowledge Graph | AI Assistant |
|:---:|:---:|:---:|
| <img src="https://via.placeholder.com/400x250.png?text=Dashboard+View" alt="Dashboard" /> | <img src="https://via.placeholder.com/400x250.png?text=Knowledge+Graph" alt="Graph" /> | <img src="https://via.placeholder.com/400x250.png?text=AI+Assistant" alt="Assistant" /> |

---

## 🏗️ System Architecture

NETHRA AI uses a decoupled microservices-like architecture:
- **Frontend Panel**: React-based Single Page Application (SPA) providing an immersive, ambient-themed investigation dashboard.
- **Backend API**: High-performance FastAPI server managing database transactions and API routing.
- **Asynchronous Workers**: Celery workers handling heavy OCR, LLM inference, and graph generation tasks in the background without blocking the UI.
- **Intelligence Layer**: Gemini LLMs processing text for entities, relationships, and actionable insights.

---

## 💻 Technology Stack

**Frontend:**
- React 18
- Vite
- TailwindCSS
- React Router DOM
- Cytoscape.js (Knowledge Graphs)
- Lucide Icons

**Backend:**
- Python 3.10+
- FastAPI
- SQLAlchemy + SQLite/PostgreSQL
- Celery + Redis (Task Queues)
- Gemini API (LLM Integration)
- Uvicorn

---

## 📂 Project Structure

```text
NETHRA-AI/
├── backend/                  # FastAPI backend server
│   ├── app/                  # Application code (API, Models, Services)
│   ├── alembic/              # Database migrations
│   ├── tests/                # Unit testing
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React frontend application
│   ├── src/                  # React components, contexts, services
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite bundler config
└── marketing-site/           # Next.js landing page (deployed to Vercel)
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v18+)
- Python (3.10+)
- Redis (for Celery workers)
- Git

### Environment Variables

Before starting, configure your environment variables.

**Backend (`backend/.env`):**
```env
# TODO: Add specific environment variables (e.g., GEMINI_API_KEY, REDIS_URL, DATABASE_URL)
GEMINI_API_KEY=your_google_gemini_api_key
REDIS_URL=redis://localhost:6379/0
```

**Frontend (`frontend/.env`):**
```env
# TODO: Add specific environment variables
VITE_API_URL=http://localhost:8000/api/v1
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/NETHRA-AI.git
   cd NETHRA-AI
   ```

2. Install Backend Dependencies:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Install Frontend Dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Project

You need to run three separate processes:

1. **Backend Server** (from `backend/` directory):
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Celery Worker** (from `backend/` directory):
   ```bash
   celery -A app.core.celery_app worker --loglevel=info
   ```

3. **Frontend Application** (from `frontend/` directory):
   ```bash
   npm run dev
   ```

*(Optional)* Docker support is planned. A `docker-compose.yml` can be used in the future to orchestrate all services easily.

---

## 🛠️ Usage

1. Open your browser to `http://localhost:5173`.
2. Navigate to the **Evidence Vault**.
3. Click **Ingest Evidence** to upload a document or image.
4. Wait for the processing to complete (indicated by the processing logs).
5. Open the **Investigation Workspace** to explore extracted entities, metadata, OCR text, and the interactive Knowledge Graph.
6. Use the **AI Assistant** to ask targeted questions about the evidence context.

---

## 🛡️ Security Features

- **Chain of Custody**: Every read, write, and AI interaction with an evidence item is persistently logged to maintain forensic integrity.
- **Isolated Contexts**: The Contextual AI strictly queries against the selected evidence context to prevent cross-contamination of cases.
- **Role-Based Access (Upcoming)**: Support for distinct investigator roles, auditing, and organizational boundaries.

---

## ❓ Why NETHRA-AI?

Traditional digital forensics tools often require manual correlation of data across fragmented systems. NETHRA AI bridges the gap between raw data extraction and actionable intelligence by automatically connecting the dots, reducing investigation cycles from days to minutes. 

---

## 🗺️ Roadmap

- [x] Initial OCR and Metadata Extraction Pipeline
- [x] Intelligent LLM-based Entity Extraction
- [x] Interactive Knowledge Graph Visualization
- [x] Evidence-aware AI Assistant Context
- [ ] Multi-case evidence correlation and subgraph matching
- [ ] Advanced role-based access control (RBAC)
- [ ] Full Docker containerization for one-click deployment
- [ ] Integration with broader OSINT data sources

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgements

- [Kerala Police Cyberdome](https://cyberdome.kerala.gov.in/) for inspiring the initiative.
- [Cytoscape.js](https://js.cytoscape.org/) for robust graph rendering.
- [FastAPI](https://fastapi.tiangolo.com/) for the lightning-fast backend framework.
- [React](https://reactjs.org/) & [Vite](https://vitejs.dev/) for a seamless frontend experience.
