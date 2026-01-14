import React from 'react';

export default function StatusBadge({ status }) {
    const statusConfig = {
        draft: { color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Draft' },
        waiting_kasi: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Menunggu Kasi' },
        waiting_cdk: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Menunggu KaCDK' },
        final: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Selesai' },
        rejected: { color: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Ditolak' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
        <span
            className={`px-3 py-1 font-bold rounded-full border ${config.color} text-[10px] uppercase tracking-wider shadow-sm transition-all whitespace-nowrap`}
        >
            {config.label}
        </span>
    );
}
