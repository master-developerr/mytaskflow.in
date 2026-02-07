import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function OnboardingModal() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const checkProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('name, gender, dob, phone_number')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // Ignore "no rows" if handling creation elsewhere, but usually profile exists on trigger
                    console.error("Error fetching profile:", error);
                }

                if (data) {
                    // Check if any required field is missing
                    if (!data.name || !data.dob || !data.gender || !data.phone_number) {
                        setFullName(data.name || '');
                        setGender(data.gender || '');
                        setDob(data.dob || '');
                        setPhoneNumber(data.phone_number || '');
                        setIsOpen(true);
                    }
                } else {
                    // No profile record found, must complete details
                    setIsOpen(true);
                }
            } catch (err) {
                console.error("Onboarding check failed", err);
            } finally {
                setLoading(false);
            }
        };

        checkProfile();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!fullName || !gender || !dob || !phoneNumber) {
            setError("All fields are required to continue.");
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    name: fullName,
                    gender,
                    dob,
                    phone_number: phoneNumber,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setIsOpen(false);
        } catch (err: any) {
            setError(err.message || "Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || loading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome to AgencyFlow!</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please complete your profile to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                        <input
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
                            <select
                                required
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="notsay">Prefer not to say</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
                            <input
                                type="date"
                                required
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span> : 'Complete Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
