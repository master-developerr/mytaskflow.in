import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';

interface Client {
    id: string;
    name: string;
    email: string | null;
    details: any;
    created_at: string;
}

export function AgencySettings() {
    const navigate = useNavigate();
    const { agency, members, userRole, refreshAgency } = useAgency();
    const { user } = useAuth();

    // Clients State
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [clientForm, setClientForm] = useState({ name: '', email: '' });
    const [submittingClient, setSubmittingClient] = useState(false);

    // Member Editing State
    const [editingMember, setEditingMember] = useState<any | null>(null);
    const [memberForm, setMemberForm] = useState({ role: 'member', job_title: '' });
    const [submittingMember, setSubmittingMember] = useState(false);

    useEffect(() => {
        if (agency) {
            fetchClients();
        }
    }, [agency]);

    const fetchClients = async () => {
        setLoadingClients(true);
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('agency_id', agency?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setLoadingClients(false);
        }
    };

    const handleSaveClient = async () => {
        if (!agency || !clientForm.name) return;
        setSubmittingClient(true);
        try {
            if (editingClient) {
                const { error } = await supabase
                    .from('clients')
                    .update({ name: clientForm.name, email: clientForm.email })
                    .eq('id', editingClient.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('clients')
                    .insert([{
                        agency_id: agency.id,
                        name: clientForm.name,
                        email: clientForm.email
                    }]);
                if (error) throw error;
            }
            fetchClients();
            setIsClientModalOpen(false);
            setEditingClient(null);
            setClientForm({ name: '', email: '' });
        } catch (err) {
            console.error('Error saving client:', err);
            alert('Failed to save client');
        } finally {
            setSubmittingClient(false);
        }
    };

    const handleDeleteClient = async (id: string) => {
        if (!confirm('Are you sure you want to remove this client?')) return;
        try {
            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) throw error;
            fetchClients();
        } catch (err) {
            console.error('Error deleting client:', err);
            alert('Failed to delete client');
        }
    };

    const openClientModal = (client?: Client) => {
        if (client) {
            setEditingClient(client);
            setClientForm({ name: client.name, email: client.email || '' });
        } else {
            setEditingClient(null);
            setClientForm({ name: '', email: '' });
        }
        setIsClientModalOpen(true);
    };

    const handleEditMember = (member: any) => {
        setEditingMember(member);
        setMemberForm({ role: member.role, job_title: member.job_title || '' });
    };

    const handleSaveMember = async () => {
        if (!editingMember) return;
        setSubmittingMember(true);
        try {
            const { error } = await supabase
                .from('agency_memberships')
                .update({ role: memberForm.role, job_title: memberForm.job_title })
                .eq('id', editingMember.id);

            if (error) throw error;
            refreshAgency();
            setEditingMember(null);
        } catch (err) {
            console.error('Error updating member:', err);
            alert('Failed to update member');
        } finally {
            setSubmittingMember(false);
        }
    };

    if (!agency) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">No Active Agency</h2>
                    <p className="text-slate-500 mb-4">You need to select or create an agency profile.</p>
                    <button onClick={() => navigate('/profile-mode')} className="text-primary hover:underline">Go to Profile Mode</button>
                </div>
            </div>
        );
    }

    const inviteLink = `${window.location.origin}/join/${agency.agency_code}`;
    const isAdmin = userRole === 'owner' || userRole === 'admin';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        alert('Invite link copied to clipboard!');
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
            {/* Sidebar (Collapsed on small screens) */}
            <aside className="hidden md:flex flex-col w-64 h-full bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary">token</span>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">{agency.name}</h1>
                            <button
                                onClick={() => navigate('/profile-mode')}
                                className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                            >
                                Switch Agency <span className="material-symbols-outlined text-[12px]">expand_more</span>
                            </button>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="/dashboard">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-medium">Dashboard</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="/projects">
                        <span className="material-symbols-outlined">folder_open</span>
                        <span className="text-sm font-medium">Projects</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary dark:bg-primary/20" href="#">
                        <span className="material-symbols-outlined icon-fill">settings</span>
                        <span className="text-sm font-medium">Agency Settings</span>
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark relative">
                {/* Top Nav Bar */}
                <header className="flex-shrink-0 flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark z-10">
                    <div className="flex items-center gap-8 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">settings</span>
                            </div>
                            <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Settings</h2>
                        </div>
                    </div>
                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.email}</p>
                            </div>
                            <Avatar
                                src={(user?.metadata as any)?.avatar_url || (user?.metadata as any)?.picture}
                                fallback={user?.email || 'U'}
                                alt="Profile"
                                size="md"
                            />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
                    <div className="max-w-[1000px] mx-auto space-y-8">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <a className="hover:text-primary transition-colors" href="#">Settings</a>
                            <span className="mx-2">/</span>
                            <span className="font-medium text-slate-900 dark:text-white">Agency & Team</span>
                        </nav>

                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="space-y-2">
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Agency Settings</h1>
                                <p className="text-slate-500 dark:text-slate-400 max-w-xl text-base">Manage your team roster, roles, clients, and workspace preferences.</p>
                            </div>
                            <div className="flex gap-3">
                                {(userRole === 'owner' || userRole === 'admin') && (
                                    <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                                        Export List
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Invite Card */}
                        <section className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">link</span>
                                    Invite New Members
                                </h3>
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Share Invite Code or Link</label>
                                        <div className="relative flex items-center">
                                            <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg py-2.5 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50" readOnly type="text" value={inviteLink} />
                                            <button className="absolute right-2 p-1.5 text-slate-400 hover:text-primary transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-700" title="Regenerate Link">
                                                <span className="material-symbols-outlined text-[20px]">refresh</span>
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">Code: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{agency.agency_code}</span></p>
                                    </div>
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full md:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-lg transition-colors border border-transparent dark:border-slate-700 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                        Copy Link
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Team Management Table */}
                        <section className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Team Members <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">{members.length} Active</span></h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            <th className="px-6 py-3 min-w-[200px]">Member</th>
                                            <th className="px-6 py-3 min-w-[120px]">Job Title</th>
                                            <th className="px-6 py-3 min-w-[120px]">Role</th>
                                            <th className="px-6 py-3 min-w-[120px]">Joined</th>
                                            <th className="px-6 py-3 w-[60px]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                                        {members.map((member) => (
                                            <tr
                                                key={member.id}
                                                className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${user?.id === member.user_id ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                                                    }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            src={member.profile?.avatar_url}
                                                            fallback={member.profile?.name || member.user_id.substring(0, 2)}
                                                            alt="Member avatar"
                                                            size="lg"
                                                            className="border border-slate-200 dark:border-slate-700"
                                                        />
                                                        <div>
                                                            <div className="font-medium text-slate-900 dark:text-white">
                                                                {member.profile?.name || 'Unknown User'}
                                                                {user?.id === member.user_id && <span className="ml-2 text-xs text-slate-400 font-normal">(You)</span>}
                                                            </div>
                                                            <div className="text-slate-500 dark:text-slate-400 text-xs">{member.profile?.email || 'No Email'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                    {member.job_title || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${member.role === 'owner'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                                        : member.role === 'admin'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                                                        }`}>
                                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                    {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {isAdmin && member.role !== 'owner' && (
                                                        <button
                                                            onClick={() => handleEditMember(member)}
                                                            className="text-slate-400 hover:text-primary dark:hover:text-primary p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                            title="Edit Member"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Clients Management */}
                        <section className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clients <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">{clients.length} Active</span></h3>
                                {isAdmin && (
                                    <button
                                        onClick={() => openClientModal()}
                                        className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                        Add Client
                                    </button>
                                )}
                            </div>

                            {loadingClients ? (
                                <div className="p-8 flex justify-center">
                                    <span className="material-symbols-outlined animate-spin text-slate-400">progress_activity</span>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                <th className="px-6 py-3">Client Name</th>
                                                <th className="px-6 py-3">Contact</th>
                                                <th className="px-6 py-3">Added</th>
                                                <th className="px-6 py-3 w-[80px]"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                                            {clients.map((client) => (
                                                <tr key={client.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                        {client.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                        {client.email || '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                        {new Date(client.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {isAdmin && (
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => openClientModal(client)}
                                                                    className="text-slate-400 hover:text-primary p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClient(client.id)}
                                                                    className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {clients.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                                        No clients added yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        <div className="h-8"></div>
                    </div>
                </div>

                {/* Client Modal */}
                {isClientModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#15202b] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Client Name *</label>
                                    <input
                                        type="text"
                                        value={clientForm.name}
                                        onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0d141b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm px-3 py-2.5"
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={clientForm.email}
                                        onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0d141b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm px-3 py-2.5"
                                        placeholder="contact@example.com"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={() => setIsClientModalOpen(false)}
                                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveClient}
                                    disabled={submittingClient || !clientForm.name}
                                    className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submittingClient && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Member Edit Modal */}
                {editingMember && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#15202b] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Edit Team Member</h3>
                            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-3">
                                <Avatar
                                    src={editingMember.profile?.avatar_url}
                                    fallback={editingMember.profile?.name || '?'}
                                    alt="Member avatar"
                                    size="sm"
                                />
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{editingMember.profile?.name || 'Unknown User'}</p>
                                    <p className="text-xs text-slate-500">{editingMember.profile?.email}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Job Title</label>
                                    <input
                                        type="text"
                                        value={memberForm.job_title}
                                        onChange={(e) => setMemberForm({ ...memberForm, job_title: e.target.value })}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0d141b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm px-3 py-2.5"
                                        placeholder="e.g. Senior Designer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
                                    <select
                                        value={memberForm.role}
                                        onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0d141b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm px-3 py-2.5"
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1">Admins can manage tasks, projects, and clients.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={() => setEditingMember(null)}
                                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveMember}
                                    disabled={submittingMember}
                                    className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submittingMember && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
