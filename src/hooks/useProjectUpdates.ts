import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ProjectUpdate } from '../types';

export function useProjectUpdates(projectId?: string) {
    const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUpdates = useCallback(async () => {
        if (!projectId) {
            setUpdates([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('project_updates')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUpdates(data || []);
        } catch (err: any) {
            console.error('Error fetching updates:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchUpdates();
    }, [fetchUpdates]);

    const postUpdate = async (update: Partial<ProjectUpdate>) => {
        try {
            const { data, error } = await supabase
                .from('project_updates')
                .insert([update])
                .select()
                .single();

            if (error) throw error;

            // Optimistically update or re-fetch. Since we need author info, re-fetch is safer or manual merge.
            // For simplicity, let's just trigger a refresh or hack the author in if it's current user.
            fetchUpdates();
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return {
        updates,
        loading,
        error,
        postUpdate,
        refreshUpdates: fetchUpdates
    };
}
