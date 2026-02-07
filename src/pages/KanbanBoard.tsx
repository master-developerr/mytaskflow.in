import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAgency } from '@/context/AgencyContext';
import { Sidebar } from '@/components/Sidebar';
import { TaskDetailsPanel } from '@/components/TaskDetailsPanel';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { Task } from '@/types';

export function KanbanBoard() {
    const navigate = useNavigate();
    const { id: projectId } = useParams<{ id: string }>();
    const { agency, activeMode } = useAgency();
    const { projects } = useProjects(activeMode === 'agency' ? agency?.id : undefined);
    const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks(projectId, activeMode === 'agency' ? agency?.id : null);

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const currentProject = useMemo(() => {
        return projects.find(p => p.id === projectId);
    }, [projects, projectId]);

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setTimeout(() => setSelectedTask(null), 300);
    };

    // We need to keep local state for optimistic UI updates during drag
    // However, tasks come from useTasks hook. For hello-pangea, we strictly rely on the hook's data + optimistic update in onDragEnd.
    // We group tasks by stage for rendering.
    const columns = useMemo(() => {
        const createColumn = (stageTasks: Task[]) =>
            stageTasks.sort((a, b) => {
                const posA = a.position ?? 0;
                const posB = b.position ?? 0;
                if (posA !== posB) return posA - posB;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

        return {
            todo: createColumn(tasks.filter(t => t.stage === 'todo')),
            in_progress: createColumn(tasks.filter(t => t.stage === 'in_progress')),
            review: createColumn(tasks.filter(t => t.stage === 'review')),
            done: createColumn(tasks.filter(t => t.stage === 'done')),
        };
    }, [tasks]);

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        // Dropped outside the list
        if (!destination) {
            return;
        }

        const sourceStage = source.droppableId as Task['stage'];
        const destStage = destination.droppableId as Task['stage'];

        // If dropped in same place
        if (sourceStage === destStage && source.index === destination.index) {
            return;
        }

        // Calculate New Position
        const destColumn = columns[destStage as keyof typeof columns];
        if (!destColumn) return;

        let newPosition: number;

        // Removing the dragged item from consideration for calculations if it's in the same column
        // But hello-pangea/dnd indices are based on the list *without* the dragged item if it's moving? 
        // No, typically destination index is the final index in the new list.

        // We need to look at the task *currently* at the destination index, and the one before it.
        // But wait, 'destColumn' still contains the *old* state (if same column, it has the item at old index).
        // If different column, it doesn't have the item.

        const tasksInDest = [...destColumn];
        // If moving within same column, remove self first to simulate the "hole"
        if (sourceStage === destStage) {
            const movedTaskIndex = tasksInDest.findIndex(t => t.id === draggableId);
            if (movedTaskIndex > -1) tasksInDest.splice(movedTaskIndex, 1);
        }

        if (tasksInDest.length === 0) {
            // Empty column, default to current time (bottom/end) or 0
            newPosition = Date.now();
        } else if (destination.index === 0) {
            // Top of list: take first item's pos - 1000
            newPosition = (tasksInDest[0].position || 0) - 10000;
        } else if (destination.index >= tasksInDest.length) {
            // Bottom of list: take last item's pos + 1000
            newPosition = (tasksInDest[tasksInDest.length - 1].position || 0) + 10000;
        } else {
            // In between two tasks
            const prevTask = tasksInDest[destination.index - 1];
            const nextTask = tasksInDest[destination.index];
            newPosition = ((prevTask.position || 0) + (nextTask.position || 0)) / 2;
        }

        // Optimistic update
        // We update the task via useTasks, which updates local state. 
        // Since we sort columns by position, updating the position value should move the item visually.
        const newStatus: Task['status'] = destStage === 'done' ? 'done' : 'active';

        try {
            await updateTask(draggableId, {
                stage: destStage,
                status: newStatus,
                position: newPosition
            });
        } catch (err) {
            console.error('Failed to move task:', err);
        }
    };

    if (loading && tasks.length === 0) {
        return (
            <div className="flex bg-background-light dark:bg-background-dark h-screen w-full items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
            <Sidebar />

            <main className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark relative">
                {/* Header */}
                <header className="flex-shrink-0 flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark z-10">
                    <div className="flex items-center gap-8 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">grid_view</span>
                            </div>
                            <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">
                                {currentProject ? currentProject.name : 'All Tasks'}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/profile-mode')}
                            className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Profile Settings"
                        >
                            <span className="material-symbols-outlined">person</span>
                        </button>
                    </div>
                </header>

                <div className="flex-shrink-0 px-6 pt-6 pb-2">
                    <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                                {currentProject ? 'Project Board' : 'Global Board'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                                {currentProject ? `Managing tasks for ${currentProject.name}` : 'Overview of all tasks.'}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span>New Task</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mx-6 p-4 bg-red-50 text-red-600 rounded-lg mb-4">
                        Error: {error}
                    </div>
                )}

                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6 pt-4 custom-scrollbar">
                        <div className="flex h-full gap-6 min-w-max">
                            {(Object.keys(columns) as Array<keyof typeof columns>).map((status) => (
                                <div
                                    key={status}
                                    className="flex flex-col w-80 h-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 transition-colors"
                                >
                                    <div className="p-4 flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 rounded-t-xl">
                                        <div className="flex items-center gap-2">
                                            <div className={`size-2 rounded-full ${status === 'todo' ? 'bg-slate-400' :
                                                status === 'in_progress' ? 'bg-primary' :
                                                    status === 'review' ? 'bg-purple-500' : 'bg-emerald-500'
                                                }`}></div>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">{status.replace('_', ' ')}</h3>
                                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                                                {columns[status].length}
                                            </span>
                                        </div>
                                    </div>

                                    <Droppable droppableId={status}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-3 custom-scrollbar min-h-[100px] transition-colors rounded-b-xl ${snapshot.isDraggingOver
                                                    ? 'bg-blue-50/50 dark:bg-blue-900/10'
                                                    : ''
                                                    }`}
                                            >
                                                {columns[status].map((task, index) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                onClick={() => handleTaskClick(task)}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                }}
                                                                className={`group bg-white dark:bg-slate-800 p-4 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${snapshot.isDragging
                                                                    ? 'shadow-lg border-primary z-50'
                                                                    : 'shadow-sm border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-primary/50'
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${task.priority === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                                        task.priority === 'normal' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                            'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                                        }`}>
                                                                        {task.priority || 'Normal'}
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-slate-900 dark:text-slate-100 font-semibold text-sm mb-3 leading-snug">{task.title}</h4>
                                                                <div className="flex items-center justify-between mt-auto">
                                                                    <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(task.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            ))}
                        </div>
                    </div>
                </DragDropContext>
            </main>

            <TaskDetailsPanel
                isOpen={isPanelOpen}
                onClose={handleClosePanel}
                task={selectedTask}
                onUpdate={updateTask}
                onDelete={deleteTask}
            />

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={createTask}
                projectId={projectId}
            />
        </div>
    );
}
