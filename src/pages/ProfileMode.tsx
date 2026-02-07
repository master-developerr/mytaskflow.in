import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { supabase } from '../lib/supabase';

export function ProfileMode() {
    const { user, signOut } = useAuth();
    const {
        agency,
        createAgency,
        joinAgency,
        leaveAgency,
        deleteAgency,
        userRole,
        activeMode,
        switchMode,
        loading: agencyLoading,
        error: agencyError
    } = useAgency();
    const navigate = useNavigate();

    const [newAgencyName, setNewAgencyName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');

    // Profile State
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [showSwitchToast, setShowSwitchToast] = useState(false);

    useEffect(() => {
        if (user) {
            const loadProfile = async () => {
                const { data } = await supabase.from('profiles').select('gender, dob').eq('id', user.id).single();
                if (data) {
                    setGender(data.gender || '');
                    setDob(data.dob || '');
                }
            };
            loadProfile();
        }
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const handleModeChange = async (newMode: 'personal' | 'agency') => {
        if (newMode === activeMode) return;

        try {
            await switchMode(newMode);
            setShowSwitchToast(true);
            setTimeout(() => setShowSwitchToast(false), 3000);
        } catch (err: any) {
            setLocalError(err.message);
        }
    };

    const handleCreateAgency = async () => {
        if (!newAgencyName.trim()) {
            setLocalError('Please enter an agency name');
            return;
        }
        setIsSubmitting(true);
        setLocalError(null);
        try {
            await createAgency(newAgencyName);
            navigate('/dashboard');
        } catch (err: any) {
            setLocalError(err.message || 'Failed to create agency');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinAgency = async () => {
        if (!joinCode.trim()) {
            setLocalError('Please enter an invitation code');
            return;
        }
        setIsSubmitting(true);
        setLocalError(null);
        try {
            await joinAgency(joinCode);
            navigate('/dashboard');
        } catch (err: any) {
            setLocalError(err.message || 'Failed to join agency');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        setProfileSuccess('');
        try {
            const { error } = await supabase.from('profiles').update({
                gender,
                dob: dob || null
            }).eq('id', user?.id);

            if (error) throw error;
            setProfileSuccess('Profile updated successfully');
            setTimeout(() => setProfileSuccess(''), 3000);
        } catch (err: any) {
            console.error('Error saving profile:', err);
            setLocalError(err.message || 'Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleDeleteProfile = async () => {
        if (!window.confirm('CRITICAL: This will permanently delete your account and all associated data. This cannot be undone. Are you sure?')) {
            return;
        }

        setIsSavingProfile(true);
        setLocalError(null);
        try {
            console.log('Invoking full account deletion...');

            // Call the Supabase edge function to delete the user account (Auth + Data)
            const { error } = await supabase.functions.invoke('delete-user-account', {
                method: 'POST'
            });

            if (error) {
                console.error('Edge function error:', error);
                throw new Error(error.message || 'The server encountered an error during deletion.');
            }

            console.log('Account deleted successfully. Cleaning up local session...');

            // Sign out locally
            await supabase.auth.signOut();

            // Force navigation to signup page
            window.location.href = '/register';

        } catch (err: any) {
            console.error('Error during account deletion:', err);
            setLocalError(err.message || 'Failed to delete account. Please try again.');
            setIsSavingProfile(false);
        }
    };



    const copyAgencyCode = () => {
        if (agency?.agency_code) {
            navigator.clipboard.writeText(agency.agency_code);
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }
    };

    const avatarUrl = (user?.metadata as any)?.avatar_url || (user?.metadata as any)?.picture;
    const [avatarError, setAvatarError] = useState(false);

    // Reset error state when avatarUrl changes
    useEffect(() => {
        if (avatarUrl) setAvatarError(false);
    }, [avatarUrl]);

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white h-screen flex overflow-hidden font-display transition-colors">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#151f2b] border-r border-slate-200 dark:border-slate-800 flex-col justify-between hidden md:flex z-10 transition-colors">
                <div className="flex flex-col h-full">
                    <div className="p-6 h-16 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50">
                        <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-[20px]">grid_view</span>
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">AgencyOS</h1>
                    </div>

                    <nav className="flex-1 px-3 py-4 space-y-1">
                        <button onClick={() => navigate('/dashboard')} className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">dashboard</span>
                            <span className="text-sm font-medium">Dashboard</span>
                        </button>
                        <button onClick={() => navigate('/projects')} className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">view_kanban</span>
                            <span className="text-sm font-medium">Projects</span>
                        </button>
                    </nav>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <button onClick={handleSignOut} className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all">
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto scroll-smooth bg-background-light dark:bg-background-dark">
                <div className="max-w-5xl mx-auto p-8 md:p-12 lg:p-16">
                    <div className="flex flex-col gap-2 mb-10">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Profile & Mode Control</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your identity and switch between personal and agency workspaces.</p>
                    </div>

                    {/* Profile Card */}
                    <div className="bg-white dark:bg-[#151f2b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 mb-10 relative overflow-hidden transition-colors">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                            <div className="relative">
                                <div className="size-28 md:size-32 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-white dark:ring-[#151f2b] shadow-md flex items-center justify-center overflow-hidden">
                                    {avatarUrl && !avatarError ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Profile"
                                            referrerPolicy="no-referrer"
                                            onError={() => setAvatarError(true)}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-4xl font-bold text-slate-400 dark:text-slate-500">{user?.email?.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <button className="absolute bottom-1 right-1 size-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#151f2b] shadow-sm hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                            </div>

                            <div className="flex-1 w-full text-center md:text-left">
                                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{user?.email?.split('@')[0] || 'Member'}</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSavingProfile}
                                            className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                                        >
                                            {isSavingProfile ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : null}
                                            Save Profile
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-xl">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                                        <select
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                {profileSuccess && <p className="text-green-600 dark:text-green-400 text-xs mt-3 flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span> {profileSuccess}</p>}
                                {localError && <p className="text-red-600 dark:text-red-400 text-xs mt-3 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span> {localError}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex flex-col items-center gap-6 mb-12">
                        <div className="bg-white dark:bg-[#151f2b] p-1.5 rounded-xl inline-flex w-full md:w-auto min-w-[320px] shadow-sm border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => handleModeChange('personal')}
                                className={`flex-1 px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeMode === 'personal' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <span className={`material-symbols-outlined text-[20px] ${activeMode === 'personal' ? 'fill-1' : ''}`}>person</span>
                                Personal
                            </button>
                            <button
                                onClick={() => handleModeChange('agency')}
                                className={`flex-1 px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeMode === 'agency' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <span className={`material-symbols-outlined text-[20px] ${activeMode === 'agency' ? 'fill-1' : ''}`}>business</span>
                                Agency
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
                            Switching to Agency mode enables team collaboration, shared resources, and organization-wide analytics.
                        </p>
                    </div>

                    {/* Agency Management Section */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Agency Management</h3>
                            <div className="flex items-center gap-2">
                                {agencyLoading && <span className="material-symbols-outlined animate-spin text-sm text-slate-400">progress_activity</span>}
                                <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] uppercase font-bold rounded">Active</span>
                            </div>
                        </div>

                        {agencyError && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium">
                                {agencyError}
                            </div>
                        )}

                        {agency ? (
                            <div className="bg-white dark:bg-[#151f2b] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col md:flex-row items-center justify-between gap-8 transition-colors">
                                <div className="flex items-center gap-5">
                                    <div className="size-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-3xl">business</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Workspace</p>
                                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{agency.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex -space-x-1">
                                                <div className="size-5 rounded-full bg-slate-200 dark:bg-slate-700 border border-white dark:border-[#151f2b]"></div>
                                                <div className="size-5 rounded-full bg-slate-300 dark:bg-slate-600 border border-white dark:border-[#151f2b]"></div>
                                            </div>
                                            <span className="text-[11px] text-slate-500 font-medium">+8 members</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 min-w-[240px]">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Invite Code</p>
                                    <div className="flex items-center justify-between gap-4">
                                        <code className="text-lg font-mono font-bold text-slate-900 dark:text-white">{agency.agency_code}</code>
                                        <button onClick={copyAgencyCode} className="text-slate-400 hover:text-primary transition-colors relative">
                                            <span className="material-symbols-outlined text-xl">content_copy</span>
                                            {copySuccess && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-slate-900 text-white px-2 py-1 rounded">{copySuccess}</span>}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2">Share this code to invite new members.</p>
                                </div>
                            </div>
                        ) : null}

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-[#151f2b] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm transition-all hover:border-primary/20 group">
                                <div className="size-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
                                    <span className="material-symbols-outlined text-2xl">add_business</span>
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Create New Agency</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Establish a new workspace for your team.</p>
                                <div className="space-y-4">
                                    <input
                                        className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm px-4 py-3 transition-all disabled:opacity-50"
                                        placeholder={agency ? "You are already in an agency" : "e.g. Acme Design Co."}
                                        type="text"
                                        value={newAgencyName}
                                        onChange={(e) => setNewAgencyName(e.target.value)}
                                        disabled={!!agency}
                                    />
                                    <button
                                        onClick={handleCreateAgency}
                                        disabled={isSubmitting || !!agency}
                                        className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                                    >
                                        {agency ? 'Already in an Agency' : 'Create Agency'}
                                    </button>
                                    {agency && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-900/10 p-2.5 rounded-lg border border-amber-100/50 dark:border-amber-900/20 flex items-start gap-2 leading-relaxed">
                                            <span className="material-symbols-outlined text-[14px] mt-0.5">info</span>
                                            To create a new agency, you must first {userRole === 'owner' ? 'delete' : 'leave'} your current one in the Danger Zone below.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#151f2b] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm transition-all hover:border-primary/20 group">
                                <div className="size-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 transition-transform group-hover:scale-110">
                                    <span className="material-symbols-outlined text-2xl">group_add</span>
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Join an Agency</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter a code to join an existing team.</p>
                                <div className="space-y-4">
                                    <input
                                        className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm px-4 py-3 transition-all disabled:opacity-50"
                                        placeholder={agency ? "You are already in an agency" : "e.g. XXX-0000-YY"}
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        disabled={!!agency}
                                    />
                                    <button
                                        onClick={handleJoinAgency}
                                        disabled={isSubmitting || !!agency}
                                        className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                                    >
                                        {agency ? 'Already in an Agency' : 'Join Team'}
                                    </button>
                                    {agency && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-900/10 p-2.5 rounded-lg border border-amber-100/50 dark:border-amber-900/20 flex items-start gap-2 leading-relaxed">
                                            <span className="material-symbols-outlined text-[14px] mt-0.5">info</span>
                                            To join another agency, you must first {userRole === 'owner' ? 'delete' : 'leave'} your current one in the Danger Zone below.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-12 mt-12 border-t border-slate-200 dark:border-slate-800 space-y-6">
                            {agency && (
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-amber-50/30 dark:bg-amber-900/10 p-8 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                                    <div>
                                        <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-1">
                                            {userRole === 'owner' ? 'Delete Agency' : 'Leave Agency'}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {userRole === 'owner'
                                                ? 'Permanently delete this agency and all its data.'
                                                : 'Remove yourself from this agency workspace.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={userRole === 'owner' ? deleteAgency : leaveAgency}
                                        className="px-6 py-2.5 bg-white dark:bg-transparent border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 font-bold rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {userRole === 'owner' ? 'delete' : 'logout'}
                                        </span>
                                        {userRole === 'owner' ? 'Delete Agency' : 'Leave Agency'}
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-red-50/30 dark:bg-red-900/10 p-8 rounded-2xl border border-red-100 dark:border-red-900/20">
                                <div>
                                    <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-1">Delete Account</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Permanently delete your profile and all associated data.</p>
                                </div>
                                <button
                                    onClick={handleDeleteProfile}
                                    className="px-6 py-2.5 bg-white dark:bg-transparent border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                                    Delete My Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Switched Toast */}
            {showSwitchToast && (
                <div className="fixed bottom-6 right-6 bg-[#1a2632] text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300 z-[100]">
                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                    <span className="text-sm font-medium">Switched to {activeMode === 'agency' ? 'Agency' : 'Personal'} Mode</span>
                    <button onClick={() => setShowSwitchToast(false)} className="text-slate-400 hover:text-white transition-colors ml-4">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}
        </div>
    );
}

