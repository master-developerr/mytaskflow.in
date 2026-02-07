import { useState, useEffect, useMemo } from 'react';
import { useAgency } from '../context/AgencyContext';
import { useProjects } from '../hooks/useProjects';
import { supabase } from '../lib/supabase';
import { twMerge } from 'tailwind-merge';
import { Sidebar } from '../components/Sidebar';
import { TaskDetailsPanel } from '../components/TaskDetailsPanel';

interface CalendarEvent {
    id: string;
    title: string;
    type: 'task' | 'milestone';
    date: Date;
    durationMinutes?: number;
    colorClass: string;
    project_id: string;
    project_name?: string;
    priority?: string;
    status?: string;
}

export function Calendar() {
    const { agency, activeMode } = useAgency();
    const { projects } = useProjects(activeMode === 'agency' ? agency?.id : undefined);

    const [tasks, setTasks] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Date State
    const [currentDate, setCurrentDate] = useState(new Date());

    // Drag and Drop State
    const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | any | null>(null);
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

    const fetchData = async () => {
        if (projects.length === 0) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const projectIds = projects.map(p => p.id);

        try {
            // Fetch Tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .in('project_id', projectIds);

            if (tasksError) throw tasksError;

            // Fetch Milestones
            const { data: milestonesData, error: milestonesError } = await supabase
                .from('milestones')
                .select('*')
                .in('project_id', projectIds);

            if (milestonesError) throw milestonesError;

            setTasks(tasksData || []);
            setMilestones(milestonesData || []);

        } catch (err) {
            console.error("Error fetching calendar data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [projects]);


    // Helper: Start of week
    const startOfWeek = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }, [currentDate]);

    // Generate week days
    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
        }
        return days;
    }, [startOfWeek]);

    // Calculate Week Number of Month
    const weekNumberString = useMemo(() => {
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const dayOfMonth = currentDate.getDate();
        // Simple approximation: (Day + Offset) / 7
        // Or just checking where the current week falls. 
        // Let's use standard "Week X" of Month.
        const currentWeekNumber = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);
        return `Week ${currentWeekNumber}`;
    }, [currentDate]);

    const monthName = weekDays[0].toLocaleString('default', { month: 'long', year: 'numeric' });


    // Data Processing
    const { scheduledEvents, backlogTasks } = useMemo(() => {
        const scheduled: CalendarEvent[] = [];
        const backlog: any[] = [];

        tasks.forEach(t => {
            const project = projects.find(p => p.id === t.project_id);
            if (t.due_date) {
                // Parse date at midnight to match calendar grid comparison
                const d = new Date(t.due_date);
                d.setHours(0, 0, 0, 0);

                scheduled.push({
                    id: t.id,
                    title: t.title,
                    type: 'task',
                    date: d,
                    durationMinutes: 60,
                    colorClass: 'bg-indigo-100 dark:bg-indigo-900/60 border-l-4 border-indigo-500 text-indigo-700 dark:text-indigo-200',
                    project_id: t.project_id,
                    project_name: project?.name,
                    priority: t.priority,
                    status: t.stage
                });
            } else {
                backlog.push({ ...t, project_name: project?.name });
            }
        });

        milestones.forEach(m => {
            const project = projects.find(p => p.id === m.project_id);
            if (m.target_date) {
                const d = new Date(m.target_date);
                d.setHours(0, 0, 0, 0);

                scheduled.push({
                    id: m.id,
                    title: m.name,
                    type: 'milestone',
                    date: d,
                    durationMinutes: 0,
                    colorClass: 'bg-amber-100 dark:bg-amber-900/60 border-l-4 border-amber-500 text-amber-700 dark:text-amber-200',
                    project_id: m.project_id,
                    project_name: project?.name
                });
            }
        });

        return { scheduledEvents: scheduled, backlogTasks: backlog };
    }, [tasks, milestones, projects]);

    // Navigation
    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    // Drag and Drop Logic
    const handleDragStart = (e: React.DragEvent, item: any, source: 'backlog' | 'calendar') => {
        setDraggedEvent({ ...item, source });
        e.dataTransfer.effectAllowed = 'move';
        // Transparent drag image or default
    };

    const handleDragOver = (e: React.DragEvent, date: Date) => {
        e.preventDefault(); // Allow drop
        setDragOverDate(date);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverDate(null);
    }


    const handleDrop = async (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        setDragOverDate(null);

        if (!draggedEvent) return;

        // If it's a milestone, we might not want to move it via drag yet, or maybe we do. 
        // Focusing on TASKS as per user request ("kanban").
        if (draggedEvent.type === 'milestone') return;

        const taskId = draggedEvent.id;
        const newDateStr = date.toISOString();

        // Optimistic Update
        const updatedTasks = tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, due_date: newDateStr };
            }
            return t;
        });
        setTasks(updatedTasks);
        setDraggedEvent(null);

        // API Update
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ due_date: newDateStr })
                .eq('id', taskId);

            if (error) {
                console.error("Failed to update task date:", error);
                // Revert on error (could fetch fresh data)
                fetchData(); // crude revert/refresh
            }
        } catch (err) {
            console.error("Error in drop update:", err);
        }
    };



    const handleTaskClick = (task: any) => {
        // Map calendar/backlog item format to Task format if needed
        // Our calendar items have some extra props, but TaskDetailsPanel expects Task
        // We might need to fetch the full task or just pass what we have if it matches.
        // For now, let's assume the task object from state has enough or we use what we have.
        // Actually, 'tasks' state has the full task objects from Supabase.
        const fullTask = tasks.find(t => t.id === task.id);
        if (fullTask) {
            setDragOverDate(null); // Clear any drag state
            setDraggedEvent(null);
            // Trigger panel
            // We need state for panel
            setSelectedTask(fullTask);
            setIsPanelOpen(true);
        }
    };

    const handleUpdateTask = async (id: string, updates: any) => {
        // Optimistic
        const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
        setTasks(updatedTasks);
        if (selectedTask && selectedTask.id === id) {
            setSelectedTask({ ...selectedTask, ...updates });
        }

        try {
            const { error } = await supabase.from('tasks').update(updates).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error("Failed to update task", err);
            fetchData(); // Revert
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!window.confirm("Delete this task?")) return;

        const updatedTasks = tasks.filter(t => t.id !== id);
        setTasks(updatedTasks);
        setIsPanelOpen(false);

        try {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error("Failed to delete task", err);
            fetchData();
        }
    };

    // Panel State
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-hidden h-screen flex">
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <TaskDetailsPanel
                    isOpen={isPanelOpen}
                    onClose={() => setIsPanelOpen(false)}
                    task={selectedTask}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                />

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-50 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                            <p className="text-sm text-slate-500 mt-2">Loading schedule...</p>
                        </div>
                    </div>
                )}
                {/* Top Header */}
                <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark flex items-center justify-between px-6 z-10 shrink-0">
                    <div className="flex items-center gap-6">
                        {/* Date Navigation */}
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                {monthName}
                            </h2>
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                <button onClick={handlePrevWeek} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-shadow shadow-sm hover:shadow">
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                <button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-shadow shadow-sm hover:shadow mx-0.5">
                                    {weekNumberString}
                                </button>
                                <button onClick={handleNextWeek} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-shadow shadow-sm hover:shadow">
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Calendar Workspace */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Backlog / Unscheduled Tasks Sidebar */}
                    <div className="w-80 bg-background-light dark:bg-[#15202b] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-surface-dark">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Unscheduled <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">{backlogTasks.length}</span></h3>
                        </div>
                        {/* Task List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {backlogTasks.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No unscheduled tasks.</p>}
                            {backlogTasks.map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task, 'backlog')}
                                    onClick={() => handleTaskClick(task)}
                                    className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 group relative select-none"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded-sm truncate max-w-[150px]">{task.project_name || 'Project'}</span>
                                    </div>
                                    <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">{task.title}</h4>
                                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                                        {task.priority && <span className="capitalize">{task.priority} Priority</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Calendar Grid */}
                    <div className="flex-1 overflow-auto bg-white dark:bg-surface-dark relative flex flex-col">
                        {/* Day Headers */}
                        <div className="flex border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-surface-dark z-20 shadow-sm">
                            <div className="w-16 shrink-0 border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"></div> {/* Time axis spacer */}
                            <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-800">
                                {weekDays.map((day, i) => {
                                    const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();
                                    return (
                                        <div key={i} className={`text-center py-4 group cursor-pointer ${isToday ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            <p className={`text-xs font-medium uppercase mb-1 ${isToday ? 'text-primary font-bold' : 'text-slate-500 dark:text-slate-400'}`}>{day.toLocaleString('default', { weekday: 'short' })}</p>
                                            <div className={`text-xl font-semibold w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors ${isToday ? 'bg-primary text-white shadow-md shadow-blue-500/30' : 'text-slate-700 dark:text-slate-200 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                                                }`}>
                                                {day.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Grid Body */}
                        <div className="flex relative min-h-[500px] h-full">
                            {/* Time Labels (Mocked) */}
                            <div className="w-16 shrink-0 flex flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-xs font-medium text-slate-400 dark:text-slate-500 select-none">
                                <div className="p-2 text-center text-xs">All Day</div>
                            </div>

                            {/* Grid Columns */}
                            <div className="flex-1 grid grid-cols-7 relative divide-x divide-slate-100 dark:divide-slate-800 bg-dots-light dark:bg-dots-dark">
                                {weekDays.map((day, i) => {
                                    const dayEvents = scheduledEvents.filter(e => {
                                        return e.date.getDate() === day.getDate() &&
                                            e.date.getMonth() === day.getMonth() &&
                                            e.date.getFullYear() === day.getFullYear();
                                    });
                                    const isDragOver = dragOverDate?.getDate() === day.getDate() && dragOverDate?.getMonth() === day.getMonth();

                                    return (
                                        <div
                                            key={i}
                                            className={twMerge(
                                                "relative h-full transition-colors p-2 flex flex-col gap-2 overflow-y-auto min-h-[200px]",
                                                isDragOver ? "bg-primary/10 ring-inset ring-2 ring-primary/30" : "bg-slate-50/10 hover:bg-slate-50/50"
                                            )}
                                            onDragOver={(e) => handleDragOver(e, day)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, day)}
                                        >
                                            {dayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    draggable={event.type === 'task'} // Only drag tasks for now
                                                    onDragStart={(e) => handleDragStart(e, event, 'calendar')}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTaskClick(event);
                                                    }}
                                                    className={twMerge(
                                                        "rounded-md p-2 text-xs border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] mb-1 select-none",
                                                        event.colorClass,
                                                        draggedEvent?.id === event.id ? "opacity-50" : ""
                                                    )}
                                                    title={event.title}
                                                >
                                                    <p className="font-bold truncate">{event.title}</p>
                                                    <p className="opacity-80 truncate text-[10px] mt-0.5">{event.project_name}</p>
                                                </div>
                                            ))}

                                            {/* Hint for dropping */}
                                            {isDragOver && (
                                                <div className="border-2 border-dashed border-primary/40 rounded-lg h-16 flex items-center justify-center bg-primary/5">
                                                    <span className="text-primary/60 text-xs font-bold">Drop here</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
