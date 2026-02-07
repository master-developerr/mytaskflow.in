import { useState } from 'react';

interface AvatarProps {
    src?: string | null;
    fallback?: string;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    xs: 'size-5',
    sm: 'size-8',
    md: 'size-9',
    lg: 'size-10',
    xl: 'size-28 md:size-32',
};

const textSizeClasses = {
    xs: 'text-[8px]',
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-4xl',
};

/**
 * Reusable Avatar component with proper handling for external URLs (like Google profile pictures).
 * - Uses `referrerPolicy="no-referrer"` to load Google-hosted images
 * - Falls back to initials on image load error
 */
export function Avatar({ src, fallback = '?', alt = 'Avatar', size = 'md', className = '' }: AvatarProps) {
    const [hasError, setHasError] = useState(false);

    const sizeClass = sizeClasses[size];
    const textSizeClass = textSizeClasses[size];

    const showImage = src && !hasError;

    return (
        <div
            className={`${sizeClass} rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 ${className}`}
        >
            {showImage ? (
                <img
                    src={src}
                    alt={alt}
                    referrerPolicy="no-referrer"
                    onError={() => setHasError(true)}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className={`${textSizeClass} font-bold text-slate-500 dark:text-slate-400 uppercase`}>
                    {fallback.charAt(0)}
                </span>
            )}
        </div>
    );
}
