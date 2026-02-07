
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Milestone {
    id: string;
    project_id: string;
    name: string;
    target_date?: string;
    status: 'pending' | 'reached';
    created_at?: string;
}

export function useMilestones(projectId?: string) {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMilestones = useCallback(async () => {
        if (!projectId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('milestones')
                .select('*')
                .eq('project_id', projectId)
                .order('target_date', { ascending: true });

            if (error) throw error;

            setMilestones(data as Milestone[] || []);
        } catch (err: any) {
            console.error('Error fetching milestones:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchMilestones();
    }, [fetchMilestones]);

    const createMilestone = async (milestone: Partial<Milestone>) => {
        try {
            const { data, error } = await supabase
                .from('milestones')
                .insert([milestone])
                .select()
                .single();

            if (error) throw error;
            setMilestones(prev => [...prev, data]);
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
        try {
            const { data, error } = await supabase
                .from('milestones')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            setMilestones(prev => prev.map(m => m.id === id ? data : m));
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const deleteMilestone = async (id: string) => {
        try {
            const { error } = await supabase
                .from('milestones')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMilestones(prev => prev.filter(m => m.id !== id));
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return {
        milestones,
        loading,
        error,
        createMilestone,
        updateMilestone,
        deleteMilestone,
        refreshMilestones: fetchMilestones
    };
}
