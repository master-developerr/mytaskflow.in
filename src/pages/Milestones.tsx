import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAgency } from '../context/AgencyContext';
import { useProjects } from '../hooks/useProjects';
import { useMilestones } from '../hooks/useMilestones';
import { useProjectUpdates } from '../hooks/useProjectUpdates';
import { Avatar } from '../components/Avatar';
import { Sidebar } from '../components/Sidebar';

export function Milestones() {
    const { agency, activeMode } = useAgency();
    const { projects, loading: projectsLoading } = useProjects(activeMode === 'agency' ? agency?.id : undefined);

    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    useEffect(() => {
        if (projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    const { milestones, loading: milestonesLoading } = useMilestones(selectedProjectId || undefined);
    const { updates, loading: updatesLoading } = useProjectUpdates(selectedProjectId || undefined);

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    // Calculate progress
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'reached').length;
    const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-hidden h-screen flex">
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Navigation */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] px-6 py-3 sticky top-0 z-50">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Milestones</h2>
                        </div>
                        {/* Project Selector */}
                        <div className="hidden md:block relative min-w-[200px]">
                            <select
                                value={selectedProjectId || ''}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="block w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-10 px-3 text-sm font-medium appearance-none"
                            >
                                {projectsLoading ? (
                                    <option>Loading projects...</option>
                                ) : projects.length === 0 ? (
                                    <option value="">No projects found</option>
                                ) : (
                                    projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))
                                )}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <span className="material-symbols-outlined text-[18px]">expand_more</span>
                            </span>
                        </div>
                    </div>
                </header>

                <div className="layout-container flex h-full grow flex-col max-w-[1280px] mx-auto w-full px-4 md:px-8 py-6 overflow-y-auto">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap gap-2 px-1 mb-4">
                        <Link className="text-slate-500 dark:text-slate-400 hover:text-primary text-sm font-medium" to="/projects">Projects</Link>
                        <span className="text-slate-400 dark:text-slate-600 text-sm font-medium">/</span>
                        <span className="text-slate-900 dark:text-white text-sm font-medium">{selectedProject?.name || 'Select Project'}</span>
                        <span className="text-slate-400 dark:text-slate-600 text-sm font-medium">/</span>
                        <span className="text-slate-900 dark:text-white text-sm font-medium">Milestones</span>
                    </div>

                    {!selectedProjectId ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-400 mb-4">folder_off</span>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Project Selected</h3>
                            <p className="text-slate-500">Select a project to view its milestones.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-6">
                            {/* Left Column: Milestones Timeline (Span 8) */}
                            <div className="lg:col-span-8 flex flex-col gap-8">
                                {/* Page Header & Progress */}
                                <div className="flex flex-col gap-6 bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                                    <div className="flex flex-wrap justify-between gap-4 items-start">
                                        <div className="flex flex-col gap-2">
                                            <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">{selectedProject?.name}</h1>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage key dates, track deliverables, and view team progress.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex h-9 items-center justify-center rounded-lg px-3 bg-primary text-white text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-600 transition-colors">
                                                <span className="material-symbols-outlined text-[18px] mr-1">flag</span> Add Milestone
                                            </button>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Overall Completion</span>
                                            <span className="text-sm font-bold text-primary">{progress}%</span>
                                        </div>
                                        <div className="rounded-full bg-slate-100 dark:bg-slate-700 h-2.5 overflow-hidden">
                                            <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vertical Timeline */}
                                <div className="relative pl-4">
                                    {/* Vertical Line */}
                                    <div className="absolute left-[27px] top-2 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800"></div>
                                    <div className="flex flex-col gap-8">
                                        {milestonesLoading && <p className="pl-12 text-slate-500">Loading milestones...</p>}
                                        {!milestonesLoading && milestones.length === 0 && (
                                            <div className="pl-12 py-4">
                                                <p className="text-slate-500 italic">No milestones yet. Create one to get started!</p>
                                            </div>
                                        )}
                                        {milestones.map((milestone) => (
                                            <div key={milestone.id} className={`relative flex gap-6 group ${milestone.status === 'reached' ? 'opacity-80 hover:opacity-100' : ''}`}>
                                                {/* Dot */}
                                                <div className={`relative z-10 flex-none w-6 h-6 rounded-full mt-5 flex items-center justify-center transition-all ${milestone.status === 'reached'
                                                    ? 'bg-primary'
                                                    : 'bg-white dark:bg-[#1e293b] border-[3px] border-primary shadow-[0_0_0_3px_rgba(19,127,236,0.15)] group-hover:scale-110'
                                                    }`}>
                                                    {milestone.status === 'reached' && <span className="material-symbols-outlined text-[14px] text-white">check</span>}
                                                </div>
                                                {/* Card */}
                                                <div className={`flex-1 rounded-xl p-5 border shadow-sm transition-all ${milestone.status === 'reached'
                                                    ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                                                    : 'bg-white dark:bg-[#1e293b] border-primary/40 shadow-blue-500/5 group-hover:shadow-md'
                                                    }`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-col">
                                                            {milestone.target_date && (
                                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{new Date(milestone.target_date).toLocaleDateString()}</span>
                                                            )}
                                                            <h3 className={`text-lg font-bold ${milestone.status === 'reached' ? 'text-slate-700 dark:text-slate-300 line-through decoration-slate-400' : 'text-slate-900 dark:text-white'}`}>{milestone.name}</h3>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${milestone.status === 'reached'
                                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800'
                                                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800'
                                                            }`}>
                                                            {milestone.status === 'reached' ? (
                                                                <><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Reached</>
                                                            ) : (
                                                                <><span className="material-symbols-outlined text-[14px]">bolt</span> In Progress</>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Updates Feed (Span 4) */}
                            <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-slate-900 dark:text-white text-lg font-bold">Recent Updates</h3>
                                </div>
                                {/* Post Update Action */}
                                <button className="flex items-center gap-3 w-full p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-primary/50 hover:shadow-sm transition-all text-left group">
                                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Post a new update...</span>
                                </button>
                                <div className="flex flex-col gap-4">
                                    {updatesLoading && <p className="text-sm text-slate-500">Loading updates...</p>}
                                    {!updatesLoading && updates.length === 0 && <p className="text-sm text-slate-500">No recent updates.</p>}
                                    {updates.map((update) => (
                                        <div key={update.id} className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={update.author?.avatar_url}
                                                    fallback={update.author?.name || '?'}
                                                    alt="Author avatar"
                                                    size="sm"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{update.author?.name || 'Unknown User'}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-500">{new Date(update.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {update.notes}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
