'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, type ToastProps } from '@/components/Toast';

interface ToastContextType {
    toast: (props: Omit<ToastProps, 'id' | 'onClose'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

interface ToastItem extends ToastProps {
    id: string;
}

const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const toast = useCallback((props: Omit<ToastProps, 'id' | 'onClose'>) => {
        const id = Math.random().toString(36).substring(2, 9);

        setToasts((prev) => {
            const newToasts = [...prev, { ...props, id }];
            // Keep only the latest MAX_TOASTS
            return newToasts.slice(-MAX_TOASTS);
        });

        // Auto-dismiss after duration
        const duration = props.duration || 5000;
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const handleClose = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            {/* Toast container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
                {toasts.map((t) => (
                    <Toast key={t.id} {...t} onClose={() => handleClose(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
