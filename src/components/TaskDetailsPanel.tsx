
import { Task } from '@/types';

interface TaskDetailsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    task?: Task | null;
    onUpdate?: (id: string, updates: Partial<Task>) => Promise<any>;
    onDelete?: (id: string) => Promise<any>;
}

export function TaskDetailsPanel({ isOpen, onClose, task, onUpdate, onDelete }: TaskDetailsPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background-dark/30 dark:bg-black/50 backdrop-blur-[1px] transition-opacity"
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div className="relative h-full w-full max-w-[720px] bg-white dark:bg-[#1a2632] shadow-2xl z-20 flex flex-col border-l border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {task ? `TASK-${task.id.slice(0, 4)}` : 'TASK-????'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                            <select
                                value={task?.stage || 'todo'}
                                onChange={(e) => {
                                    if (!task || !onUpdate) return;
                                    const newStage = e.target.value as Task['stage'];
                                    const newStatus = newStage === 'done' ? 'done' : 'active';
                                    onUpdate(task.id, { stage: newStage, status: newStatus });
                                }}
                                className="bg-transparent border-none text-xs font-medium text-slate-700 dark:text-slate-300 focus:ring-0 p-0 cursor-pointer capitalize"
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                    </div>
                    {/* ... actions ... */}
                    <div className="flex items-center gap-2">
                        {onDelete && task && (
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this task?')) {
                                        onDelete(task.id).then(onClose);
                                    }
                                }}
                                className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        )}
                        <button className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors ml-2" onClick={onClose}>
                            <span className="material-symbols-outlined text-[24px]">close</span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="flex flex-col gap-8 max-w-[640px] mx-auto">
                        {/* Headline */}
                        <div className="group relative">
                            <input
                                type="text"
                                value={task?.title || ''}
                                onChange={(e) => task && onUpdate && onUpdate(task.id, { title: e.target.value })}
                                className="w-full text-3xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight bg-transparent border-none focus:ring-0 focus:outline-none p-0 placeholder:text-slate-400"
                                placeholder="Task Title"
                            />
                        </div>

                        {/* Description Section */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Description</h3>
                            <div className="w-full">
                                <textarea
                                    value={task?.description || ''}
                                    onChange={(e) => task && onUpdate && onUpdate(task.id, { description: e.target.value })}
                                    className="w-full min-h-[120px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    placeholder="Add a more detailed description..."
                                />
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Priority</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={task?.priority || 'normal'}
                                        onChange={(e) => task && onUpdate && onUpdate(task.id, { priority: e.target.value as Task['priority'] })}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 capitalize focus:ring-primary focus:border-primary p-2.5"
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Due Date</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            if (task && onUpdate) {
                                                // Handle date clearing or setting
                                                const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                                                // @ts-ignore - Supabase handles null for date usually, or we might need undefined? fallback to undefined if needed but string|null is safest for JSON
                                                onUpdate(task.id, { due_date: val });
                                            }
                                        }}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary p-2.5"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
