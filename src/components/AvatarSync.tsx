import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function AvatarSync() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const syncAvatar = async () => {
            try {
                // 1. Get Google Avatar URL from metadata
                const googleAvatar = (user.metadata as any)?.avatar_url || (user.metadata as any)?.picture;

                if (!googleAvatar) return;

                // 2. Check current profile avatar
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single();

                // 3. Update if different (or if profile avatar is missing)
                if (!profile?.avatar_url || profile.avatar_url !== googleAvatar) {
                    // console.log('Syncing avatar...', googleAvatar);
                    await supabase
                        .from('profiles')
                        .update({
                            avatar_url: googleAvatar,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', user.id);
                }
            } catch (err) {
                console.error("Avatar sync failed:", err);
            }
        };

        syncAvatar();
    }, [user]);

    return null; // Renderless component
}
