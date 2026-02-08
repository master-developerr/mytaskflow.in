
=======
# MyTaskFlow 🚀

MyTaskFlow is a lightweight, modern project and task management platform designed for **individuals and small agencies** who want clarity, speed, and control—without the overhead of enterprise tools.

It starts as a **personal productivity tool by default** and smoothly scales into a **collaborative agency workspace** using a simple agency-code system.

---

## ✨ Key Features

### 🧑 Personal Mode (Default)
- Personal projects and tasks
- Kanban task board (To Do → In Progress → Review → Done)
- Sub-tasks as checklists
- Milestones for major goals
- Recurring tasks (daily / weekly / monthly)
- Optional time blocking for focus work

### 🏢 Agency Mode
- Create an agency from your profile
- Join an agency using a **unique agency code**
- Shared agency projects and templates
- Team task assignment (4–5 members, scalable to 30+)
- Clear roles: Owner, Admin, Member
- Project-level visibility and collaboration

### 🔁 Smart Task Management
- Drag-and-drop Kanban workflow
- Advisory task dependencies (soft, non-blocking)
- Priority flags and due dates
- Project status updates (On Track, At Risk, etc.)

---

## 🧠 Product Philosophy

- **Personal-first**: No agency required to start
- **Opt-in collaboration**: Teams form intentionally
- **Soft enforcement**: The system guides, not blocks
- **No ERP bloat**: No HR, payroll, billing, or shift planning
- **Scalable by design**: Grow without re-architecting

---

## 🏗️ Tech Stack

### Frontend
- UI designed using **Stitch UI**
- Prototyping and flows explored with **Uizard**
- Web-first, productivity-focused layout

### Backend
- **Supabase**
  - PostgreSQL database
  - Supabase Auth (Email/Password)
  - Row Level Security (RLS)
- No custom backend server required (v1)

### Architecture Highlights
- Personal + Agency scoped data
- Strong RLS-based access control
- Clean, extensible schema
- Local-first development support

---

## 🔐 Authentication & Access Control

- Email + Password authentication
- Every user starts in **Personal Mode**
- Agency access controlled via:
  - Unique agency code
  - Role-based permissions
- All data access secured using Supabase RLS

---

## 🗂️ Core Concepts

| Concept | Description |
|------|------------|
| Project | Container for tasks, milestones, updates |
| Task | Unit of work with stages & status |
| Sub-task | Checklist item inside a task |
| Milestone | Major project checkpoint |
| Template | Reusable project structure |
| Agency | Shared workspace for collaboration |
| Time Block | Optional focus-time reservation |

---

## 🚫 Out of Scope (By Design)

- Payroll or HR management
- Invoicing or accounting
- Shift scheduling
- Approval workflows
- Multi-agency per user (planned for future)

---

## 🛠️ Development Status

- ✅ Product PRD completed
- ✅ Agency & profile system designed
- ✅ Supabase backend PRD completed
- 🚧 Backend implementation in progress
- 🚧 UI implementation in progress

---

## 🧭 Roadmap (High Level)

- [ ] Supabase schema & RLS policies
- [ ] Auth & onboarding flow
- [ ] Core project/task APIs
- [ ] UI integration
- [ ] Internal agency MVP
- [ ] Public beta

---

## 🤝 Contributing

This project is currently in **active development**.  
Contributions, suggestions, and discussions are welcome once the MVP stabilizes.

---

## 📄 License

TBD (MIT / Apache-2.0 planned)

---

## 📬 Contact

Built with ❤️ for focused work and small teams.

---

**MyTaskFlow** — from personal productivity to agency collaboration, without the chaos.
>>>>>>> 31b87e381deae0ad8829dbbdd24364ed9c9cf49d
