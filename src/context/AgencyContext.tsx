
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Agency, AgencyMemberWithProfile } from '../types/agency';

interface AgencyContextType {
    agency: Agency | null;
    members: AgencyMemberWithProfile[];
    userRole: string | null;
    loading: boolean;
    error: string | null;
    createAgency: (name: string) => Promise<void>;
    joinAgency: (code: string) => Promise<void>;
    leaveAgency: () => Promise<void>;
    deleteAgency: () => Promise<void>;
    refreshAgency: () => Promise<void>;
    activeMode: 'personal' | 'agency';
    switchMode: (newMode: 'personal' | 'agency') => Promise<void>;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [agency, setAgency] = useState<Agency | null>(null);
    const [members, setMembers] = useState<AgencyMemberWithProfile[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [activeMode, setActiveMode] = useState<'personal' | 'agency'>(() => {
        const saved = localStorage.getItem('activeMode');
        return (saved === 'personal' || saved === 'agency') ? saved : 'personal';
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshAgency = async () => {
        if (!user) {
            setAgency(null);
            setMembers([]);
            setUserRole(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Check if user is in an agency
            const { data: memberData, error: memberError } = await supabase
                .from('agency_members')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (memberError && memberError.code !== 'PGRST116') {
                throw memberError;
            }

            if (memberData) {
                // Fetch agency details
                const { data: agencyData, error: agencyError } = await supabase
                    .from('agencies')
                    .select('*')
                    .eq('id', memberData.agency_id)
                    .single();

                if (agencyError) throw agencyError;

                setAgency(agencyData as Agency);
                setUserRole(memberData.role);

                // Fetch all members
                const { data: allMembers, error: membersError } = await supabase
                    .from('agency_members')
                    .select('*')
                    .eq('agency_id', memberData.agency_id);

                if (membersError) throw membersError;

                // Fetch profiles for these members
                const userIds = allMembers.map((m: any) => m.user_id);
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', userIds);

                if (profilesError) console.error('Error fetching profiles:', profilesError);

                // Merge members with profiles
                const mergedMembers: AgencyMemberWithProfile[] = allMembers.map((m: any) => ({
                    ...m,
                    profile: profiles?.find((p: any) => p.id === m.user_id)
                }));

                setMembers(mergedMembers);
            } else {
                setAgency(null);
                setMembers([]);
                setUserRole(null);
                // If not in agency, must be in personal mode
                setActiveMode('personal');
                localStorage.setItem('activeMode', 'personal');
            }

            // Fetch active_mode from profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('active_mode')
                .eq('id', user.id)
                .single();

            if (profileData?.active_mode) {
                let mode = profileData.active_mode as 'personal' | 'agency';
                // Double check: if mode is agency but they aren't in one, force personal
                if (mode === 'agency' && !memberData) {
                    mode = 'personal';
                }
                setActiveMode(mode);
                localStorage.setItem('activeMode', mode);
            } else if (user && !profileData?.active_mode) {
                // If column exists but is null, default to personal
                setActiveMode('personal');
                localStorage.setItem('activeMode', 'personal');
            }

        } catch (err: any) {
            console.error('Error fetching agency/mode:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshAgency();
    }, [user]);

    const createAgency = async (name: string) => {
        if (!user) return;
        if (agency) throw new Error('You are already a member of an agency. You can only belong to one agency at a time.');

        setLoading(true);
        try {
            // Generate simple agency code
            const code = Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

            // 1. Create Agency
            const { data: newAgency, error: createError } = await supabase
                .from('agencies')
                .insert([{
                    name,
                    agency_code: code,
                    owner_user_id: user.id
                }])
                .select()
                .single();

            if (createError) throw createError;

            // 2. Add owner as member
            const { error: memberError } = await supabase
                .from('agency_members')
                .insert([{
                    agency_id: newAgency.id,
                    user_id: user.id,
                    role: 'owner'
                }]);

            if (memberError) throw memberError;

            // 3. Set active mode to 'agency' in profile
            await supabase
                .from('profiles')
                .update({ active_mode: 'agency' })
                .eq('id', user.id);

            await refreshAgency();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const joinAgency = async (code: string) => {
        if (!user) return;
        if (agency) throw new Error('You are already a member of an agency. You can only belong to one agency at a time.');

        setLoading(true);
        try {
            // 1. Find Agency
            const { data: agencyData, error: findError } = await supabase
                .from('agencies')
                .select('id')
                .eq('agency_code', code)
                .single();

            if (findError || !agencyData) throw new Error('Invalid agency code');

            const targetAgencyId = agencyData.id;

            // 2. Check if already member (safety check)
            const { data: existingMember } = await supabase
                .from('agency_members')
                .select('agency_id')
                .eq('agency_id', targetAgencyId)
                .eq('user_id', user.id)
                .single();

            if (existingMember) throw new Error('Already a member of this agency');

            // 3. Add member
            const { error: joinError } = await supabase
                .from('agency_members')
                .insert([{
                    agency_id: targetAgencyId,
                    user_id: user.id,
                    role: 'member'
                }]);

            if (joinError) throw joinError;

            // 4. Set active mode to 'agency' in profile
            await supabase
                .from('profiles')
                .update({ active_mode: 'agency' })
                .eq('id', user.id);

            await refreshAgency();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const leaveAgency = async () => {
        if (!user || !agency) return;
        setLoading(true);
        try {
            const { error: leaveError } = await supabase
                .from('agency_members')
                .delete()
                .eq('agency_id', agency.id)
                .eq('user_id', user.id);

            if (leaveError) throw leaveError;

            // 2. Set active mode back to 'personal'
            await supabase
                .from('profiles')
                .update({ active_mode: 'personal' })
                .eq('id', user.id);

            await refreshAgency();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteAgency = async () => {
        if (!user || !agency || userRole !== 'owner') {
            console.error('Delete agency validation failed:', { user: !!user, agency: !!agency, userRole });
            return;
        }
        if (!window.confirm('CRITICAL: This will permanently delete the agency and ALL associated projects, tasks, and data for everyone. This cannot be undone. Are you sure?')) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            console.log('Starting agency deletion:', agency.id);

            // 1. Set all members' active_mode back to 'personal' first (best effort)
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ active_mode: 'personal' })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error updating profile mode:', updateError);
            }

            // 2. Delete agency (cascading delete handles members and projects)
            const { error: deleteError } = await supabase
                .from('agencies')
                .delete()
                .eq('id', agency.id);

            if (deleteError) {
                console.error('Error deleting agency:', deleteError);
                throw deleteError;
            }

            console.log('Agency deleted successfully');

            // Reset local state
            setAgency(null);
            setMembers([]);
            setUserRole(null);

            // Force refresh to ensure clean state
            await refreshAgency();

            // Show success message
            alert('Agency deleted successfully. You are now in Personal Mode.');
        } catch (err: any) {
            console.error('Delete agency error:', err);
            setError(err.message || 'Failed to delete agency');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const switchMode = async (newMode: 'personal' | 'agency') => {
        if (!user) return;
        if (newMode === 'agency' && !agency) {
            throw new Error('You must be a member of an agency to use Agency Mode.');
        }

        console.log(`Switching mode to: ${newMode}`);
        setActiveMode(newMode);
        localStorage.setItem('activeMode', newMode);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ active_mode: newMode })
                .eq('id', user.id);
            if (error) throw error;
        } catch (err: any) {
            console.error('Error updating active_mode in DB:', err);
            // Re-fetch to sync if update failed, but we keep the local state for now
            // to avoid flickering unless refreshAgency forces it back.
            await refreshAgency();
            throw err;
        }
    };


    return (
        <AgencyContext.Provider value={{
            agency,
            members,
            userRole,
            loading,
            error,
            createAgency,
            joinAgency,
            leaveAgency,
            deleteAgency,
            refreshAgency,
            activeMode,
            switchMode
        }}>
            {children}
        </AgencyContext.Provider>
    );
}

export const useAgency = () => {
    const context = useContext(AgencyContext);
    if (context === undefined) {
        throw new Error('useAgency must be used within an AgencyProvider');
    }
    return context;
};
