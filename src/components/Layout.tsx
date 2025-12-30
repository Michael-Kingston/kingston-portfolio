import React from 'react';

interface LayoutProps {
    header: React.ReactNode;
    sidebar: React.ReactNode;
    pieChart: React.ReactNode;
    main: React.ReactNode;
}

export function Layout({ header, sidebar, pieChart, main }: LayoutProps) {
    return (
        <div className="h-screen w-screen bg-[#050505] text-white flex p-4 gap-4 overflow-hidden">
            {/* Sidebar Container */}
            <div className="w-80 h-full flex-shrink-0 flex flex-col gap-4">
                <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-[#0a0a0c] border border-white/5 shadow-2xl">
                    {sidebar}
                </div>
                <div className="h-64 flex-shrink-0 rounded-2xl overflow-hidden bg-[#0a0a0c] border border-white/5 shadow-2xl p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Allocation</h3>
                    {pieChart}
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full min-w-0 gap-4">
                {/* Header Container */}
                <header className="h-20 w-full flex-shrink-0 rounded-2xl bg-[#0a0a0c] border border-white/5 px-6 flex items-center shadow-xl">
                    {header}
                </header>

                {/* Main Content Container */}
                <main className="flex-1 relative overflow-hidden rounded-2xl bg-[#0a0a0c] border border-white/5 shadow-xl">
                    {main}
                </main>
            </div>
        </div>
    );
}
