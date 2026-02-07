import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useAgency } from '../context/AgencyContext';
import { Sidebar } from '../components/Sidebar';
import { CreateProjectModal } from '../components/CreateProjectModal';

export function Projects() {
    const navigate = useNavigate();
    const { agency, activeMode, loading: agencyLoading } = useAgency();
    const { projects, loading: projectsLoading, error, createProject } = useProjects(activeMode === 'agency' ? agency?.id : undefined);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = filter === 'all' || p.status === filter;
        return matchesSearch && matchesFilter;
    });

    const activeProjects = projects.filter(p => p.status === 'active').length;
    const projectStats = {
        total: projects.length,
        active: activeProjects,
        onTrack: projects.filter(p => p.status === 'active').length, // Simple logic for now
        atRisk: 0 // Placeholder
    };

    const loading = agencyLoading || projectsLoading;

    if (loading && projects.length === 0) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
                <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-hidden h-screen flex">
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="h-16 bg-white dark:bg-[#151f2b] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 z-10 transition-colors">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Home</span>
                        <span className="text-slate-400 dark:text-slate-600">/</span>
                        <span className="text-slate-900 dark:text-white font-medium">Projects</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center justify-center size-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </button>
                        <button className="relative flex items-center justify-center size-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                            <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#151f2b]"></span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 lg:p-10 scroll-smooth">
                    <div className="max-w-7xl mx-auto flex flex-col gap-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Active Projects</h2>
                                <p className="text-slate-500 dark:text-slate-400">Manage your ongoing projects and track progress.</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-blue-500/20"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                New Project
                            </button>
                        </div>

                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-[#151f2b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Projects</span>
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-1.5 rounded-md">
                                        <span className="material-symbols-outlined text-lg">folder_open</span>
                                    </span>
                                </div>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{projectStats.total}</span>
                                <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                    <span className="material-symbols-outlined text-sm">trending_up</span>
                                    Updated just now
                                </span>
                            </div>
                            <div className="bg-white dark:bg-[#151f2b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">On Track</span>
                                    <span className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-1.5 rounded-md">
                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                    </span>
                                </div>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{projectStats.onTrack}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                    Healthy status
                                </span>
                            </div>
                            <div className="bg-white dark:bg-[#151f2b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">At Risk</span>
                                    <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-1.5 rounded-md">
                                        <span className="material-symbols-outlined text-lg">warning</span>
                                    </span>
                                </div>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{projectStats.atRisk}</span>
                                <span className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                    Needs attention
                                </span>
                            </div>
                        </div>

                        {/* Filters and Controls */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-[#151f2b] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="relative w-full sm:w-80">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                </span>
                                <input
                                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 transition-shadow"
                                    placeholder="Search projects..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-lg p-1 border border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilter('active')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'active' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        Active
                                    </button>
                                    <button
                                        onClick={() => setFilter('completed')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'completed' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        Completed
                                    </button>
                                </div>
                                <button className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                                    Filter
                                </button>
                            </div>
                        </div>

                        {error ? (
                            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                                Error loading projects: {error}
                            </div>
                        ) : filteredProjects.length === 0 && !loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#151f2b] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl text-slate-400">folder_off</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No projects found</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 mb-6 text-center max-w-xs">Try adjusting your search or filters, or create a new project.</p>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Create New Project
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProjects.map(project => (
                                    <div
                                        key={project.id}
                                        className="group bg-white dark:bg-[#151f2b] rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col justify-between h-full cursor-pointer"
                                        onClick={() => navigate(`/kanban/${project.id}`)}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${project.status === 'active'
                                                            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-100 dark:border-green-900/50'
                                                            : 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-100 dark:border-slate-900/50'
                                                            }`}>
                                                            {project.status}
                                                        </span>
                                                        <span className="text-xs text-slate-400">Normal Priority</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{project.name}</h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{agency?.name || 'Creative Agency'}</p>
                                                </div>
                                                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                                    <span className="material-symbols-outlined">more_horiz</span>
                                                </button>
                                            </div>
                                            <div className="mb-6">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Progress</span>
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">0%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                    <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                <div className="inline-block size-8 rounded-full ring-2 ring-white dark:ring-[#151f2b] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                                    ME
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                                <span className="text-xs font-medium">{new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Placeholder */}
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-3 min-h-[250px] p-6 text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[24px]">add</span>
                                    </div>
                                    <span className="font-medium text-sm">Create New Project</span>
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={createProject}
                agencyId={activeMode === 'agency' ? agency?.id : undefined}
            />
        </div>
    );
}
