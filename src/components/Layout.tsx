import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
    teacherName: string;
    onLogout: () => void;
    page: 'homepage' | 'assessment' | 'summary';
    title: string;
    topbarRight?: React.ReactNode;
}

const PAGE_LABELS: Record<string, { title: string; subtitle: string }> = {
    homepage: { title: 'Course Management', subtitle: 'Define and map Course Objectives (CO) to ensure alignment with Program Outcomes (PO) and Bloom\'s Taxonomy levels.' },
    assessment: { title: 'Assessment Score', subtitle: 'Enter and manage student scores for each Course Objective and assessment type.' },
    summary: { title: 'Academic Reports', subtitle: 'View aggregated pass/fail summaries and program outcome attainment.' },
};

const Layout = ({ children, teacherName, onLogout, page, title, topbarRight }: LayoutProps) => {
    const pageInfo = PAGE_LABELS[page] || { title, subtitle: '' };

    return (
        <div className="app-shell">
            <Sidebar teacherName={teacherName} onLogout={onLogout} page={page} />

            <div className="app-content">
                {/* Top Bar */}
                <header className="topbar">
                    <div className="topbar-breadcrumbs">
                        <span className="breadcrumb-root">BUP OBE System</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" className="breadcrumb-sep">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="breadcrumb-active">{pageInfo.title}</span>
                    </div>
                    <div className="topbar-right">
                        {topbarRight}
                        <button className="topbar-icon-btn" title="Notifications">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                            </svg>
                        </button>
                        <button className="topbar-icon-btn" title="Help">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                            </svg>
                        </button>
                        <div className="topbar-user">
                            <span className="topbar-user-name">{teacherName}</span>
                            <div className="topbar-user-avatar">
                                {teacherName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'T'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main scrollable content */}
                <main className="main-content">
                    {children}
                </main>
            </div>

        </div>
    );
};

export default Layout;
