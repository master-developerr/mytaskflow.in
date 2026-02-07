export type AgencyRole = 'owner' | 'member' | 'admin';

export interface Agency {
    id: string;
    name: string;
    agency_code: string;
    owner_user_id: string;
    created_at: string;
}

export interface AgencyMember {
    id: string; // Note: The schema uses composite PK (agency_id, user_id), so this might be undefined or we construct it.
    agency_id: string;
    user_id: string;
    role: AgencyRole;
    job_title?: string;
    created_at?: string; // Schema says joined_at
    joined_at?: string;
}

export interface AgencyMemberWithProfile extends AgencyMember {
    profile?: {
        name: string;
        avatar_url: string;
        email?: string; // Email might need to come from elsewhere or auth metadata if not in profiles
    };
}
