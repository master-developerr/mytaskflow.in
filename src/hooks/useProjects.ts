import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

export function useProjects(agencyId?: string) {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshProjects = async () => {
        setLoading(true);
        try {
            let query = supabase.from('projects').select('*');
            if (agencyId) {
                query = query.eq('agency_id', agencyId);
            } else if (user) {
                // Personal Mode: Show projects created by user that are NOT part of an agency (or just all user projects? Assuming personal = no agency set or explicitly personal)
                // For now, let's assume personal projects have null agency_id OR we just show all my projects. 
                // Creating a specific filter for "Personal" might be best: agency_id IS NULL
                query = query.is('agency_id', null).eq('owner_user_id', user.id);
            }
            const { data, error } = await query;
            if (error) throw error;
            setProjects(data as Project[] || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createProject = async (project: Partial<Project>) => {
        if (!user) throw new Error('User not authenticated');

        const newProject = {
            ...project,
            owner_user_id: user.id,
            scope: project.agency_id ? 'agency' : 'personal'
        };

        try {
            const { data, error } = await supabase.from('projects').insert([newProject]).select().single();
            if (error) throw error;
            setProjects(prev => [...prev, data]);
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    useEffect(() => {
        refreshProjects();
    }, [agencyId]);

    return { projects, loading, error, createProject, refreshProjects };
}
