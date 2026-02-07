# Product Requirements Document (PRD)

## Product Name (Working Title)

**AgencyFlow** – Scalable Project & Task Management Platform for Small Agencies

---

## 1. Executive Summary

AgencyFlow is a lightweight yet scalable project and task management platform designed for **small agencies (4–5 members)** that need clarity, accountability, and execution speed—without the overhead of enterprise ERP systems. The product is intentionally minimal at its core but architected to expand gradually as the agency grows (up to ~30 users) without requiring a complete rewrite.

This PRD is written specifically for **Antigravity** to build the system end-to-end: backend, APIs, business logic, and a basic functional frontend shell. UI design is handled separately (via Stitch / Uizard) and is **out of scope** for this document.

---

## 2. Product Vision & Philosophy

### 2.1 Vision

To create a calm, fast, and reliable system that helps small agency teams:

* Know **what to work on next**
* Understand **project health at a glance**
* Reduce mental load and coordination overhead
* Scale team size and project complexity safely

AgencyFlow is **not** an ERP, HR system, accounting tool, or workforce planner.

### 2.2 Design Philosophy

* **Execution over process**: The tool should help users complete work, not manage bureaucracy.
* **Soft enforcement**: The system guides users instead of blocking them.
* **Progressive complexity**: Advanced features appear only when needed.
* **Human-first workflows**: Designed for how people actually work, not idealized processes.

---

## 3. Target Users

### 3.1 Primary Users (Phase 1)

* Small agencies (4–5 members)
* Digital marketing agencies
* Creative studios
* Consulting teams
* Freelance collectives

### 3.2 Secondary Users (Future)

* Agencies with 10–30 members
* Distributed or hybrid teams
* Project managers handling multiple client accounts

---

## 4. Goals & Non-Goals

### 4.1 Product Goals

* Clear ownership of tasks
* Visual understanding of project status
* Fast task creation and updates
* Minimal configuration
* Safe scalability

### 4.2 Explicit Non-Goals

The system must **not** include:

* Payroll or salary management
* Invoicing, billing, or accounting
* HR contracts or compliance
* Shift scheduling or workforce planning
* Approval chains or rigid workflow enforcement

---

## 5. Core Domain Entities

### 5.1 User

Represents a team member.

Fields:

* id
* name
* email
* password_hash
* role (Admin, Member)
* status (Active, Inactive)
* created_at
* updated_at

Rules:

* Only Admins can manage users and templates
* Members can manage tasks assigned to them

---

### 5.2 Project

A container for tasks, milestones, updates, and planning.

Fields:

* id
* name
* description (optional)
* owner_id
* status (Active, On Hold, Completed, Archived)
* start_date (optional)
* end_date (optional)
* created_at
* updated_at

Rules:

* Projects are always owned by a user
* Projects can be created manually or from templates

---

### 5.3 Task

Represents a unit of work.

Fields:

* id
* project_id
* title
* description (optional)
* assignee_id (optional)
* priority (Normal, High)
* stage (To Do, In Progress, Review, Done, Canceled)
* status (Active, Done, Canceled)
* due_date (optional)
* recurrence_rule (optional)
* created_at
* updated_at

Rules:

* Tasks belong to exactly one project
* Stage represents workflow; status represents closure

---

### 5.4 Sub-task

Lightweight checklist item inside a task.

Fields:

* id
* task_id
* title
* is_done

Rules:

* Sub-tasks do not appear independently
* Sub-tasks do not have assignees or dates

---

### 5.5 Milestone

Represents a major checkpoint in a project.

Fields:

* id
* project_id
* name
* target_date (optional)
* status (Pending, Reached)

Rules:

* Milestones may optionally link to tasks
* Completion can be manual or automatic

---

### 5.6 Task Dependency

Defines an advisory dependency between tasks.

Fields:

* id
* predecessor_task_id
* successor_task_id

Rules:

* Dependencies are advisory only
* System must not hard-block task progress

---

### 5.7 Recurring Task

Defines repetition rules for tasks.

Fields:

* task_id
* frequency (Daily, Weekly, Monthly)

Rules:

* Next task is created only when previous is marked Done
* Prevents future-task clutter

---

### 5.8 Project Template

Reusable blueprint for projects.

Fields:

* id
* name
* description (optional)

Rules:

* Templates include task structures and milestones
* Templates do not affect existing projects

---

### 5.9 Project Update

Snapshot of project status at a moment in time.

Fields:

* id
* project_id
* status (On Track, At Risk, Off Track, On Hold, Done)
* progress_percentage
* notes
* created_at

---

### 5.10 Time Block (Optional Planning)

Optional focus-time reservation.

Fields:

* id
* task_id
* start_time
* end_time

Rules:

* Time blocks are optional
* No enforcement or conflict resolution

---

## 6. Functional Requirements

### 6.1 Project Dashboard

Each project has a dashboard that shows:

* Task completion summary
* Progress indicator
* Milestones overview
* Recent project updates

Purpose:

* Answer: “Is this project on track?”

---

### 6.2 Task Management

Features:

* Create tasks quickly
* Drag-and-drop between stages
* Assign users
* Set priority and due dates

---

### 6.3 Sub-tasks

* Inline checklist
* Simple done/not-done state
* No separate views

---

### 6.4 Recurring Tasks

* Daily / Weekly / Monthly
* New instance created only after completion

---

### 6.5 Task Dependencies

* Advisory only
* Visual “Blocked by” indicator
* Manual override allowed

---

### 6.6 Milestones

* Project-level checkpoints
* Optional auto-completion

---

### 6.7 Project Templates

* Save any project as template
* Create new projects from templates

---

### 6.8 Project Updates

* Periodic status snapshots
* Manual progress entry

---

### 6.9 Time Blocking

* Optional
* Calendar-style view
* No enforcement

---

## 7. Permissions & Roles

### Roles

* Admin
* Member

Admins:

* Manage users
* Manage templates
* Full project access

Members:

* Manage assigned tasks
* View projects

---

## 8. API Requirements

REST-style APIs grouped by:

* Authentication
* Users
* Projects
* Tasks
* Templates
* Updates

All APIs must:

* Be stateless
* Use JSON
* Require authentication

---

## 9. Non-Functional Requirements

### 9.1 Performance

* Fast load times
* Low latency for task actions

### 9.2 Usability

* Minimal clicks
* Clear defaults

### 9.3 Scalability

* Support up to 30 users
* Modular architecture

### 9.4 Security

* Secure authentication
* Role-based access control

---

## 10. Deployment & Setup

* Local-first setup
* Simple environment configuration
* Clear run instructions

---

## 11. Out of Scope (Hard Exclusions)

* Payroll
* Accounting
* Invoicing
* HR
* Shift planning
* Approval workflows

---

## 12. Future Expansion (Not for Initial Build)

* Client portal
* Mobile app
* Advanced analytics
* Integrations (Slack, Email)

---

## 13. Success Metrics

* Daily active usage
* Task completion rate
* Project delivery consistency

---

## 14. Final Note for Antigravity

This system must remain:

* Calm
* Minimal
* Understandable by non-technical users

Any feature that increases cognitive load without clear benefit should be rejected.

**This PRD is the source of truth.**
