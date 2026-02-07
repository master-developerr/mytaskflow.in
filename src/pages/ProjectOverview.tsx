import { useParams } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useAgency } from '@/context/AgencyContext';
import { useTasks } from '@/hooks/useTasks';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { Sidebar } from '@/components/Sidebar';

export function ProjectOverview() {
    const { id } = useParams<{ id: string }>();
    const { agency, activeMode } = useAgency();
    const { projects, loading: projectsLoading, error } = useProjects(activeMode === 'agency' ? agency?.id : undefined);

    // Hooks should be called unconditionally at the top level
    // We pass 'skip' logic inside the hook or handle null/undefined appropriately
    const project = projects.find(p => p.id === id);

    // Fetch tasks for this project
    const { tasks } = useTasks(id);
    // Fetch updates for this project
    const { updates, loading: updatesLoading } = useProjectUpdates(id);

    // Status color mapping
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            case 'on_hold': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
            case 'completed': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
            case 'archived': return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
            default: return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    if (projectsLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
                Loading project details...
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark text-red-500">
                Error: {error || 'Project not found'}
            </div>
        );
    }

    // Calculate progress
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="h-16 bg-white dark:bg-[#1a2632] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
                    <button className="md:hidden text-slate-500 mr-4">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="flex items-center gap-2 text-sm flex-1">
                        <span className="text-slate-500 dark:text-slate-400">Projects</span>
                        <span className="text-slate-400 dark:text-slate-600">/</span>
                        <span className="text-slate-900 dark:text-white font-medium">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Header Actions */}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
                    <div className="max-w-7xl mx-auto flex flex-col gap-8">
                        {/* Status Header */}
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 lg:p-8 flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{project.name}</h1>
                                    <span className={`${getStatusColor(project.status)} text-xs font-bold px-2 py-1 rounded capitalize`}>{project.status.replace('_', ' ')}</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg leading-relaxed">
                                    {project.description || 'No description provided.'}
                                </p>
                                <div className="flex items-center gap-6 mt-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                        <span>
                                            {project.end_date
                                                ? `Due ${new Date(project.end_date).toLocaleDateString()}`
                                                : 'No deadline'}
                                        </span>
                                    </div>
                                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
                                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                        <span className="material-symbols-outlined text-[18px]">person</span>
                                        Owner
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 min-w-[240px]">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-slate-700 dark:text-slate-300">Project Progress</span>
                                    <span className="text-blue-600 dark:text-blue-400">{progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(19,127,236,0.3)] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                                        <span className="block text-2xl font-bold text-slate-900 dark:text-white">{completedTasks}</span>
                                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Tasks Done</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                                        <span className="block text-2xl font-bold text-slate-900 dark:text-white">{totalTasks - completedTasks}</span>
                                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Remaining</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid: Tasks & Updates */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Updates Feed (Span 4) */}
                            <div className="lg:col-span-12 flex flex-col gap-6">
                                <h3 className="text-slate-900 dark:text-white text-lg font-bold">Recent Updates</h3>

                                {updatesLoading && <p className="text-sm text-slate-500">Loading updates...</p>}
                                {!updatesLoading && updates.length === 0 && <p className="text-sm text-slate-500">No project updates yet.</p>}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {updates.map((update) => (
                                        <div key={update.id} className="bg-white dark:bg-[#1a2632] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                {/* Using a simple avatar placeholder since we don't have Avatar imported yet, or we assume it is global/available */}
                                                <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {update.author?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{update.author?.name || 'Unknown User'}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-500">{new Date(update.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {update.notes}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${update.status === 'on_track' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    update.status === 'at_risk' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        update.status === 'off_track' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {update.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
