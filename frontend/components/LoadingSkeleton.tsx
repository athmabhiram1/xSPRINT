export function LoadingSkeleton({ variant = 'card' }: { variant?: 'card' | 'table' }) {
    if (variant === 'table') {
        return (
            <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
            </div>
        );
    }

    return (
        <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
    );
}
