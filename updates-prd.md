# Updates PRD – Agency & Profile Enhancements

> **Purpose**: This document captures ONLY the new or updated features introduced after the base PRD.
> It is intended for Antigravity to implement as an incremental update.
> **Do not re-implement existing features unless explicitly mentioned here.**

---

## 1. Overview of Updates

This update introduces **multi-mode usage** into the product, allowing the same application to be used in:

1. **Personal Mode (default)** – solo usage with no collaboration
2. **Agency Owner Mode** – user creates and manages an agency
3. **Agency Member Mode** – user joins an agency using a unique agency code

These updates are designed to:

* Preserve full functionality for personal users
* Enable small agency collaboration (4–5 members)
* Allow smooth future expansion without architectural rework

---

## 2. Profile Section (NEW / UPDATED)

### 2.1 Profile as Control Center

A new **Profile** section acts as the control hub for:

* User identity
* Current working mode
* Agency creation and joining

Profile must clearly display:

* User name & email
* Current mode:

  * Personal
  * Agency (with agency name)

---

## 3. Personal Use Mode (DEFAULT)

### 3.1 Behavior

* Every new user starts in **Personal Mode** by default
* No agency is required to use the app
* All existing features work exactly as before in personal scope

### 3.2 Scope Rules

* Projects, tasks, templates, and updates are **private**
* No other users can view or interact with personal data

---

## 4. Create an Agency (NEW FEATURE)

### 4.1 Entry Point

From **Profile → Create an Agency**

### 4.2 Agency Creation Flow

When a user creates an agency:

1. User enters:

   * Agency name
2. System generates:

   * A **unique agency code** (short, human-readable, shareable)
3. System actions:

   * Creates a new agency workspace
   * Assigns the creator as **Agency Owner**
   * Switches user mode from Personal → Agency

---

### 4.3 Agency Code

Rules for agency code:

* Must be unique across the system
* Immutable once created
* Used for joining the agency
* Intended to be shared manually (copy/paste)

---

## 5. Join an Agency (NEW FEATURE)

### 5.1 Entry Point

From **Profile → Join an Agency**

### 5.2 Join Flow

1. User selects "Join an Agency"
2. User enters an **Agency Code**
3. System validates the code

If valid:

* User is added to the agency
* User role defaults to **Member**
* User mode switches to Agency

If invalid:

* Clear error message is shown
* No partial join occurs

---

### 5.3 Join Rules

* A user can belong to **only one agency at a time** (v1)
* Joining does not require approval (v1)
* Invitations are code-based only (v1)

---

## 6. Leave Agency (UPDATED BEHAVIOR)

### 6.1 Member Leaving

* Members can leave an agency at any time
* On leaving:

  * User returns to **Personal Mode**
  * Loses access to agency projects and tasks

### 6.2 Owner Restrictions

* Agency Owners **cannot leave** the agency directly
* Owner must:

  * Transfer ownership (future feature)
  * Or delete the agency (future feature)

(v1 behavior: owner leaving is disabled)

---

## 7. Mode Awareness (NEW SYSTEM BEHAVIOR)

### 7.1 Active Mode

The system must always know the user’s **active mode**:

* Personal
* Agency

All data operations (projects, tasks, templates) must be scoped to the active mode.

---

### 7.2 Mode-Based Scoping Rules

| Feature         | Personal Mode | Agency Mode          |
| --------------- | ------------- | -------------------- |
| Projects        | Private       | Shared within agency |
| Tasks           | Personal only | Agency members       |
| Templates       | Personal      | Agency-wide          |
| Project Updates | Private       | Visible to agency    |

---

## 8. Agency Roles (UPDATED)

### 8.1 Roles

Roles within an agency:

* **Owner** – creator of the agency
* **Admin** – elevated member
* **Member** – standard user

---

### 8.2 Permissions Summary

**Owner**:

* Full control
* Manage members
* View agency code

**Admin**:

* Create and manage projects
* Assign tasks

**Member**:

* Work on assigned tasks
* View agency projects

---

## 9. Data Model Additions (FOR ANTIGRAVITY)

### 9.1 New / Updated Fields

**User**:

* active_mode (Personal | Agency)

**Agency**:

* id
* name
* agency_code
* owner_user_id

**AgencyMembership**:

* agency_id
* user_id
* role
* joined_at

**Project / Template**:

* scope (Personal | Agency)
* agency_id (nullable)

---

## 10. Error Handling & UX Expectations

* Invalid agency code → clear, friendly error
* Attempt to join while already in agency → blocked with explanation
* Attempt for owner to leave agency → blocked with explanation

---

## 11. Explicit Non-Goals (This Update)

This update does **NOT** include:

* Multiple agencies per user
* Invite approvals
* Email invitations
* Ownership transfer
* Agency deletion

These are reserved for future updates.

---

## 12. Implementation Notes for Antigravity

* Treat this document as an **incremental layer** on top of the base PRD
* Do NOT refactor unrelated features
* Personal Mode must remain fully functional even without agencies
* Agency logic must be additive, not mandatory

---

## 13. Final Instruction

Implement **only what is described in this document** as new behavior.

If a feature is not mentioned here, assume it already exists or is out of scope.

**End of updates-prd.md**
