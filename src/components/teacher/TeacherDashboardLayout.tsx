import Link from 'next/link';
import React, { useState } from 'react';
import {
    HiOutlineAcademicCap,
    HiOutlineChartPie,
    HiOutlineClipboardDocumentList,
    HiOutlineQuestionMarkCircle,
    HiOutlineBell,
    HiBars3,
    HiXMark,
    HiArrowRightOnRectangle,
} from 'react-icons/hi2';

/** Matches Tailwind `w-[200px]` / `lg:pl-[200px]` below */
const SIDEBAR_W = 'w-[200px]';
const MAIN_PAD = 'lg:pl-[200px]';

interface TeacherDashboardLayoutProps {
    teacherName: string;
    onLogout: () => void;
    activePage: 'homepage' | 'assessment' | 'summary';
    breadcrumbs: React.ReactNode;
    children: React.ReactNode;
}

const navLinkBase =
    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsla(212,100%,48%,1)] focus-visible:ring-offset-2';

export default function TeacherDashboardLayout({
    teacherName,
    onLogout,
    activePage,
    breadcrumbs,
    children,
}: TeacherDashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const initials =
        teacherName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase())
            .join('') || 'T';

    const sidebarInner = (
        <>
            <div className="flex shrink-0 items-center gap-2.5 px-1 pb-4 pt-0.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7928ca]/12 text-sm font-semibold text-[#7928ca] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]">
                    B
                </div>
                <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold tracking-tight text-[#334155]">BUP Academic</p>
                    <p className="truncate text-[11px] font-medium text-[#64748b]">OBE Suite</p>
                </div>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain" aria-label="Teacher navigation">
                <Link
                    href="/homepage"
                    className={`${navLinkBase} ${
                        activePage === 'homepage'
                            ? 'border-l-[3px] border-[#10b981] bg-[#10b981]/12 text-[#0f766e]'
                            : 'border-l-[3px] border-transparent text-[#475569] hover:bg-[#f8fafc]'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                >
                    <HiOutlineClipboardDocumentList className="h-[18px] w-[18px] shrink-0 opacity-80" aria-hidden />
                    Dashboard
                </Link>
                <Link
                    href="/assessment_score"
                    className={`${navLinkBase} ${
                        activePage === 'assessment'
                            ? 'border-l-[3px] border-[#10b981] bg-[#10b981]/12 text-[#0f766e]'
                            : 'border-l-[3px] border-transparent text-[#475569] hover:bg-[#f8fafc]'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                >
                    <HiOutlineAcademicCap className="h-[18px] w-[18px] shrink-0 opacity-80" aria-hidden />
                    Assessment
                </Link>
                <Link
                    href="/score_summary"
                    className={`${navLinkBase} ${
                        activePage === 'summary'
                            ? 'border-l-[3px] border-[#10b981] bg-[#10b981]/12 text-[#0f766e]'
                            : 'border-l-[3px] border-transparent text-[#475569] hover:bg-[#f8fafc]'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                >
                    <HiOutlineChartPie className="h-[18px] w-[18px] shrink-0 opacity-80" aria-hidden />
                    Summary
                </Link>
            </nav>

            <div className="mt-auto shrink-0 border-t border-black/[0.06] pt-3">
                <button
                    type="button"
                    onClick={() => {
                        setSidebarOpen(false);
                        onLogout();
                    }}
                    className={`${navLinkBase} w-full text-[#64748b] hover:bg-[#fef2f2] hover:text-[#b91c1c]`}
                >
                    <HiArrowRightOnRectangle className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#fafafa] font-[Inter,system-ui,sans-serif] text-[#334155] antialiased">
            {sidebarOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    aria-label="Close menu"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] max-h-screen flex-col border-r border-black/[0.06] bg-[#f1f5f9] px-3 pb-4 pt-5 shadow-[4px_0_24px_-12px_rgba(15,23,42,0.12)] transition-transform ${SIDEBAR_W} ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="flex min-h-0 flex-1 flex-col">{sidebarInner}</div>
            </aside>

            <div className={`flex min-h-screen min-w-0 flex-col ${MAIN_PAD}`}>
                <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            className="rounded-lg p-2 text-[#475569] hover:bg-[#f8fafc] lg:hidden"
                            onClick={() => setSidebarOpen((o) => !o)}
                            aria-expanded={sidebarOpen}
                            aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
                        >
                            {sidebarOpen ? <HiXMark className="h-6 w-6" /> : <HiBars3 className="h-6 w-6" />}
                        </button>
                        <div className="min-w-0 flex-1 text-xs font-medium text-[#64748b] sm:text-sm">{breadcrumbs}</div>
                        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                            <button
                                type="button"
                                className="rounded-lg p-2 text-[#64748b] transition-colors hover:bg-[#ede9fe] hover:text-[#5b21b6]"
                                title="Notifications"
                                aria-label="Notifications"
                            >
                                <HiOutlineBell className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                className="rounded-lg p-2 text-[#64748b] transition-colors hover:bg-[#ede9fe] hover:text-[#5b21b6]"
                                title="Help"
                                aria-label="Help"
                            >
                                <HiOutlineQuestionMarkCircle className="h-5 w-5" />
                            </button>
                            <div className="ml-1 hidden items-center gap-2 border-l border-black/[0.06] pl-3 sm:flex">
                                <div className="text-right">
                                    <p className="max-w-[140px] truncate text-xs font-semibold text-[#334155]">{teacherName}</p>
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#7928ca]">Teacher</p>
                                </div>
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#10b981] to-[#0f766e] text-xs font-semibold text-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]"
                                    aria-hidden
                                >
                                    {initials}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            </div>
        </div>
    );
}
