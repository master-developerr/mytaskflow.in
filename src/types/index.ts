export interface Project {
    id: string;
    agency_id?: string;
    name: string;
    description?: string;
    status: 'active' | 'on_hold' | 'completed' | 'archived';
    scope: 'personal' | 'agency';
    start_date?: string;
    end_date?: string;
    owner_user_id: string;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    project_id: string;
    title: string;
    description?: string;
    stage: 'todo' | 'in_progress' | 'review' | 'done' | 'canceled';
    status: 'active' | 'done' | 'canceled';
    priority: 'normal' | 'high';
    assignee_id?: string;
    due_date?: string;
    recurrence_rule?: 'daily' | 'weekly' | 'monthly' | null;
    position?: number;
    created_at: string;
    updated_at: string;
}

export interface Subtask {
    id: string;
    task_id: string;
    title: string;
    is_done: boolean;
    created_at: string;
}

export interface TaskDependency {
    id: string;
    predecessor_task_id: string;
    successor_task_id: string;
}

export interface ProjectUpdate {
    id: string;
    project_id: string;
    status: 'on_track' | 'at_risk' | 'off_track' | 'on_hold' | 'done';
    progress_percentage?: number;
    notes?: string;
    created_at: string;
    author?: {
        name: string;
        avatar_url: string;
    };
}

export interface ProjectTemplate {
    id: string;
    scope: 'personal' | 'agency';
    agency_id?: string;
    name: string;
    created_at: string;
}

export interface TimeBlock {
    id: string;
    task_id: string;
    start_time: string;
    end_time: string;
}

export interface Profile {
    id: string;
    name: string;
    avatar_url?: string;
    email: string;
    active_mode: 'personal' | 'agency';
    created_at: string;
    updated_at: string;
}

export interface Agency {
    id: string;
    name: string;
    agency_code: string;
    owner_user_id: string;
    created_at: string;
}

export interface AgencyMember {
    id: string;
    agency_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: string;
}

