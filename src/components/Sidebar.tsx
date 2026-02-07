import { useNavigate, useLocation } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { agency, activeMode } = useAgency();
    const { signOut, user } = useAuth();

    // Mode is now handled globally in AgencyContext

    const menuItems = [
        { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
        { name: 'Projects', icon: 'view_kanban', path: '/projects' },
        { name: 'Calendar', icon: 'calendar_today', path: '/calendar' },
        { name: 'Milestones', icon: 'flag', path: '/milestones' },
        ...(activeMode === 'agency' ? [{ name: 'Team', icon: 'group', path: '/agency-settings' }] : []),
    ];

    return (
        <aside className="hidden md:flex w-64 h-full bg-white dark:bg-[#151f2b] border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 transition-colors">
            {/* Sidebar Header */}
            <div className="p-6 h-16 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">AgencyOS</h1>
            </div>

            {/* Current Context */}
            <div className="px-4 py-4">
                <button
                    onClick={() => navigate('/profile-mode')}
                    className="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all group"
                >
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[18px]">
                            {activeMode === 'agency' ? 'business' : 'person'}
                        </span>
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {activeMode === 'agency' ? (agency?.name || 'Personal Workspace') : 'Personal Workspace'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Switch Context</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-slate-400 ml-auto">chevron_right</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[22px] transition-colors ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                                {item.icon}
                            </span>
                            <span className="text-sm font-medium">{item.name}</span>
                            {isActive && <div className="size-1.5 bg-primary rounded-full ml-auto"></div>}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => navigate('/profile-mode')}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                    <Avatar
                        src={(user?.metadata as any)?.avatar_url || (user?.metadata as any)?.picture}
                        fallback={user?.email || 'U'}
                        alt="Profile"
                        size="sm"
                        className="border border-white dark:border-slate-800"
                    />
                    <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.email?.split('@')[0]}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Profile Settings</span>
                    </div>
                </button>
                <button
                    onClick={async () => {
                        await signOut();
                        navigate('/login');
                    }}
                    className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all font-medium text-xs"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Log Out
                </button>
            </div>
        </aside>
    );
}
