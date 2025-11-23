'use client';

import React, { useState } from 'react';
import { Bot, MessageSquare, Loader2, Send } from 'lucide-react';
import { apiPost } from '@/lib/apiClient';

export function OrganizerCopilot() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAsk = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setResponse('');
        try {
            const res = await apiPost<{ data: string }>('/api/ai/chat', { 
                message: prompt,
                context: "You are the Organizer Copilot for the xSPRINT tournament system. Help the admin with scheduling, announcements, and rules."
            });
            setResponse(res.data);
        } catch (error) {
            setResponse("Sorry, I couldn't connect to the AI service.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-indigo-50/50 dark:bg-indigo-900/20">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex gap-2 items-center">
                    <Bot className="w-5 h-5" /> Organizer Copilot
                </h3>
            </div>
            <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="relative">
                    <input
                        type="text"
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                        placeholder="Ask me anything..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    />
                    <button
                        onClick={handleAsk}
                        disabled={loading}
                        className="absolute right-2 top-2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>

                {response && (
                    <div className="mt-2 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-sm text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-800 leading-relaxed shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        <span className="font-bold block mb-1 text-indigo-700 dark:text-indigo-400">AI Response:</span>
                        {response}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 mt-auto">
                    <button onClick={() => { setPrompt("Draft a delay announcement due to rain"); }} className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 py-2.5 rounded-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all text-gray-600 dark:text-gray-300 font-medium">
                        📢 Announcement
                    </button>
                    <button onClick={() => { setPrompt("Suggest optimal rest time for finals"); }} className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 py-2.5 rounded-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all text-gray-600 dark:text-gray-300 font-medium">
                        ⏱️ Rest Time
                    </button>
                </div>
            </div>
        </div>
    );
}
