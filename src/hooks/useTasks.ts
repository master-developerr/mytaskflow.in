import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';

export function useTasks(projectId?: string, agencyId?: string | null) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase.from('tasks').select('*');

            if (projectId) {
                query = query.eq('project_id', projectId);
            } else if (agencyId !== undefined) {
                // If agencyId is null, it means Personal Mode (projects with agency_id is null)
                // Filter tasks by projects that match the agencyId
                // We use a subquery or just fetch projectIds first.
                // For simplicity and to avoid complex joins in JS, let's fetch project IDs.
                const { data: projects } = await supabase
                    .from('projects')
                    .select('id')
                    .filter('agency_id', agencyId === null ? 'is' : 'eq', agencyId);

                const projectIds = projects?.map(p => p.id) || [];
                if (projectIds.length > 0) {
                    query = query.in('project_id', projectIds);
                } else {
                    // No projects, so no tasks
                    setTasks([]);
                    setLoading(false);
                    return;
                }
            }

            const { data, error } = await query.order('position', { ascending: true });

            if (error) {
                throw error;
            }

            setTasks(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    const createTask = async (task: Partial<Task>) => {
        try {
            // Default new tasks to bottom (high position value) if not specified
            // Since we migrated existing tasks to negative timestamps, 0 or positive timestamps will be at the bottom.
            // Let's use Date.now() to ensures strictly increasing order for new tasks at bottom.
            const taskWithPos = {
                ...task,
                position: task.position ?? Date.now()
            };

            const { data, error } = await supabase.from('tasks').insert([taskWithPos]).select().single();
            if (error) throw error;
            setTasks(prev => [...prev, data]); // Append to end since sorting is ASC
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        // Optimistic update
        setTasks(prev => prev.map(t => {
            if (t.id === id) {
                return { ...t, ...updates };
            }
            return t;
        }));

        try {
            const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
            if (error) throw error;
            // Confirm update with server data (optional, but good for consistency)
            setTasks(prev => prev.map(t => t.id === id ? data : t));
            return data;
        } catch (err: any) {
            setError(err.message);
            // Revert optimistic update (this is tricky without previous state, but we can re-fetch)
            // Ideally we'd rollback. For now, let's just re-fetch to ensure consistency on error.
            console.error('Update failed, reverting via fetch', err);
            fetchTasks();
            throw err;
        }
    };

    const deleteTask = async (id: string) => {
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, loading, error, createTask, updateTask, deleteTask, refreshTasks: fetchTasks };
}
