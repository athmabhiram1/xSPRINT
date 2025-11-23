'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface ToastProps {
    id?: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    onClose?: () => void;
}

const toastStyles = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
};

const iconStyles = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
};

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

export function Toast({ type, title, message, onClose }: ToastProps) {
    const Icon = icons[type];

    return (
        <div
            className={`${toastStyles[type]} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right duration-300`}
        >
            <Icon className={`${iconStyles[type]} w-5 h-5 flex-shrink-0 mt-0.5`} />

            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{title}</h4>
                <p className="text-sm mt-1 opacity-90">{message}</p>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
