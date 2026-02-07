import { useNavigate } from 'react-router-dom';

export function TaskDetailsPanel() {
    const navigate = useNavigate();

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display min-h-screen flex items-center justify-center p-4">
            {/* Modal/Panel Container - behaving as a page for this step to match route flow */}
            <div className="bg-white dark:bg-[#1a2632] w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden relative max-h-[90vh]">

                {/* Main Task Content */}
                <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" title="Mark Complete">
                                <span className="material-symbols-outlined">check_circle</span>
                                <span className="text-xs font-bold uppercase">Mark Complete</span>
                            </button>
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                            <div className="flex -space-x-1.5">
                                <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold border-2 border-white dark:border-[#1a2632]">JD</div>
                            </div>
                            <button className="w-8 h-8 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-colors">
                                <span className="material-symbols-outlined text-[16px]">person_add</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><span className="material-symbols-outlined">attach_file</span></button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><span className="material-symbols-outlined">more_horiz</span></button>
                            <button
                                onClick={() => navigate('/kanban')}
                                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 overflow-y-auto">
                        {/* Simplified content for React Component... full content in prototype */}
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">Draft social media content calendar for Q4 launch</h1>
                        <div className="prose dark:prose-invert prose-slate max-w-none">
                            <p>Create a comprehensive content calendar for Instagram, LinkedIn, and Twitter/X focusing on the new product features.</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Meta) */}
                <div className="w-full md:w-80 bg-slate-50 dark:bg-[#15202b] p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Website Redesign
                        </span>
                    </div>
                    {/* More details... */}
                </div>
            </div>
        </div>
    );
}
