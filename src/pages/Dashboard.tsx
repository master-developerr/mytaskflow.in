import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { supabase } from '../lib/supabase';
import { Sidebar } from '../components/Sidebar';
import { Avatar } from '../components/Avatar';

export function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { agency, members, activeMode } = useAgency();
    const { projects, loading: projectsLoading } = useProjects(activeMode === 'agency' ? agency?.id : undefined);

    const [tasks, setTasks] = useState<any[]>([]);
    const [tasksLoading, setTasksLoading] = useState(true);

    // Mode is now handled globally in AgencyContext

    useEffect(() => {
        async function fetchAgencyTasks() {
            if (projects.length === 0) {
                setTasksLoading(false);
                return;
            }

            setTasksLoading(true);
            const projectIds = projects.map(p => p.id);
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .in('project_id', projectIds);

                if (error) throw error;
                setTasks(data || []);
            } catch (err) {
                console.error('Error fetching dashboard tasks:', err);
            } finally {
                setTasksLoading(false);
            }
        }

        if (projects.length > 0) {
            fetchAgencyTasks();
        } else if (!projectsLoading) {
            setTasksLoading(false);
        }
    }, [projects, projectsLoading]);

    // Derived stats
    const stats = useMemo(() => {
        const activeProjects = projects.length;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        const pendingTasks = totalTasks - completedTasks;

        const now = new Date();
        const overdueTasks = tasks.filter(t => {
            if (!t.due_date || t.status === 'done') return false;
            return new Date(t.due_date) < now;
        });

        return {
            activeProjects,
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks
        };
    }, [projects, tasks]);

    const userProfile = useMemo(() => {
        return members.find(m => m.user_id === user?.id)?.profile;
    }, [members, user]);

    // Avatar fallback logic
    const avatarUrl = userProfile?.avatar_url || (user?.metadata as any)?.avatar_url || (user?.metadata as any)?.picture;
    const displayName = userProfile?.name || user?.email;

    const loading = projectsLoading || tasksLoading;

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-hidden h-screen flex">
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Nav */}
                <header className="h-16 bg-white dark:bg-[#1a2632] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
                    <div className="flex items-center gap-2 text-sm flex-1">
                        <span className="text-slate-500 dark:text-slate-400">Home</span>
                        <span className="text-slate-400 dark:text-slate-600">/</span>
                        <span className="text-slate-900 dark:text-white font-medium">Dashboard</span>
                    </div>
                    {/* Right Actions */}
                    <div className="flex items-center gap-4 lg:gap-6">
                        <button
                            onClick={() => navigate('/profile-mode')}
                            className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Profile Settings"
                        >
                            <span className="material-symbols-outlined">person</span>
                        </button>
                        <button className="relative text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1a2632]"></span>
                        </button>
                        {/* Profile */}
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => navigate('/profile-mode')}
                        >
                            <div className="hidden sm:block text-right">
                                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{displayName}</p>
                                <p className="text-[10px] text-slate-500 capitalize">{activeMode === 'agency' && agency ? agency.name : 'Personal Workspace'}</p>
                            </div>
                            <Avatar
                                src={avatarUrl}
                                fallback={displayName || 'U'}
                                alt="Profile"
                                size="md"
                                className="ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                </header>

                {/* Scrollable Dashboard Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
                    {loading && (
                        <div className="flex items-center justify-center h-64">
                            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                        </div>
                    )}

                    {!loading && (
                        <div className="max-w-7xl mx-auto flex flex-col gap-8">
                            {/* Page Heading */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        {activeMode === 'agency' ? 'Agency Overview' : 'Personal Dashboard'}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                                        Welcome back, {userProfile?.name?.split(' ')[0] || (user?.email?.split('@')[0]) || 'there'}. {activeMode === 'agency' ? "Here's the agency status." : "Here's your personal focus."}
                                    </p>
                                </div>
                                <button onClick={() => navigate('/projects')} className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm shadow-primary/30 transition-all min-w-[140px]">
                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                    New Project
                                </button>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Stat Card 1 */}
                                <div className="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 group hover:border-primary/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Projects</span>
                                        <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-md">folder</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activeProjects}</span>
                                    </div>
                                </div>
                                {/* Stat Card 2 */}
                                <div className="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 group hover:border-primary/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Task Completion</span>
                                        <span className="material-symbols-outlined text-blue-500 bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-md">task_alt</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</span>
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stats.completedTasks} / {stats.totalTasks} Done</span>
                                    </div>
                                    {/* Mini Progress */}
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                                        <div className="bg-primary h-full rounded-full" style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}></div>
                                    </div>
                                </div>
                                {/* Stat Card 3 */}
                                <div className="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 group hover:border-primary/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Tasks</span>
                                        <span className="material-symbols-outlined text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded-md">pending_actions</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.pendingTasks}</span>
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">awaiting</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Grid Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column (2/3 width) */}
                                <div className="lg:col-span-2 flex flex-col gap-6">
                                    {/* Project Breakdown */}
                                    <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Project Health</h3>
                                            <button onClick={() => navigate('/projects')} className="text-primary text-sm font-medium hover:underline">View All</button>
                                        </div>
                                        <div className="flex flex-col gap-6">
                                            {projects.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No active projects yet.</p>}
                                            {projects.slice(0, 3).map(p => {
                                                const projectTasks = tasks.filter(t => t.project_id === p.id);
                                                const completed = projectTasks.filter(t => t.status === 'done').length;
                                                const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
                                                return (
                                                    <div key={p.id} className="flex flex-col gap-2">
                                                        <div className="flex justify-between text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                                                                <span className="text-slate-400 text-xs">{projectTasks.length} tasks</span>
                                                            </div>
                                                            <span className="text-slate-500 font-medium">{progress}%</span>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                                                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {/* Overdue Tasks */}
                                    <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 font-display">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-red-500">warning</span>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Attention Needed</h3>
                                            </div>
                                            <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-md dark:bg-red-900/20">{stats.overdueTasks.length} Overdue</span>
                                        </div>
                                        <div className="space-y-3">
                                            {stats.overdueTasks.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No overdue tasks. Good job!</p>}
                                            {stats.overdueTasks.slice(0, 5).map(task => (
                                                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/10">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1">
                                                            <span className="material-symbols-outlined text-red-400 text-sm">event_busy</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{task.title}</p>
                                                            <p className="text-xs text-red-500 font-medium lowercase">Due {new Date(task.due_date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">{task.priority || 'Normal'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* Right Column (1/3 width) - Team Feed */}
                                {activeMode === 'agency' && (
                                    <div className="lg:col-span-1">
                                        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 h-full flex flex-col">
                                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 text-lg">Team Activity</h3>
                                            <div className="relative pl-4 border-l border-slate-200 dark:border-slate-700 space-y-8 flex-1">
                                                {members.slice(0, 5).map(member => (
                                                    <div key={member.id} className="relative">
                                                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white dark:ring-[#1a2632]"></div>
                                                        <div className="flex items-start gap-3">
                                                            <Avatar
                                                                src={member.profile?.avatar_url}
                                                                fallback={member.profile?.name || '?'}
                                                                alt="Member avatar"
                                                                size="sm"
                                                            />
                                                            <div>
                                                                <p className="text-sm text-slate-900 dark:text-white leading-relaxed font-medium">{member.profile?.name}</p>
                                                                <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {members.length === 0 && <p className="text-sm text-slate-500">No activity recorded.</p>}
                                            </div>
                                            <button onClick={() => navigate('/agency-settings')} className="w-full mt-8 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">Manage Team</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
