import Link from 'next/link';

interface SidebarProps {
    teacherName: string;
    onLogout: () => void;
    page: 'homepage' | 'assessment' | 'summary';
}

const Sidebar = ({ teacherName, onLogout, page }: SidebarProps) => {
    const initials = teacherName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase() || 'T';

    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-brand">
                <div className="sidebar-brand-logo">
                    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                        <rect width="40" height="40" rx="8" fill="rgba(255,255,255,0.15)" />
                        <path d="M10 28V12h8c2.2 0 3.9.5 5 1.5s1.7 2.3 1.7 3.9c0 1-.3 1.9-.8 2.6-.5.7-1.2 1.2-2 1.5 1 .3 1.8.8 2.4 1.6.6.8.9 1.7.9 2.8 0 1.7-.6 3.1-1.8 4S20.5 28 18 28H10zm3.5-9.5h4.2c1.1 0 1.9-.3 2.5-.8.6-.5.9-1.2.9-2.1 0-.9-.3-1.6-.9-2.1-.6-.5-1.4-.8-2.5-.8h-4.2v5.8zm0 7h4.6c1.2 0 2.1-.3 2.7-.9.6-.6.9-1.3.9-2.3 0-.9-.3-1.7-.9-2.2-.6-.5-1.5-.8-2.7-.8h-4.6V25.5z" fill="white" />
                    </svg>
                </div>
                <div className="sidebar-brand-text">
                    <div className="sidebar-brand-name">BUP Academic</div>
                    <div className="sidebar-brand-tagline">Excellence &amp; Discipline</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <Link href="/homepage" className={`sidebar-nav-item ${page === 'homepage' ? 'active' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                    </svg>
                    Dashboard
                </Link>

                <Link href="/assessment_score" className={`sidebar-nav-item ${page === 'assessment' ? 'active' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                    </svg>
                    Assessment Score
                </Link>

                <Link href="/score_summary" className={`sidebar-nav-item ${page === 'summary' ? 'active' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                    </svg>
                    OBE Mapping
                </Link>

                <span className="sidebar-nav-item disabled">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                    </svg>
                    Session Admin
                </span>

                <span className="sidebar-nav-item disabled">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                    Academic Reports
                </span>

                <span className="sidebar-nav-item disabled">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                    </svg>
                    Settings
                </span>
            </nav>

            {/* New Assessment CTA */}
            <div className="sidebar-cta-wrapper">
                <Link href="/assessment_score" className="sidebar-cta">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    New Assessment
                </Link>
            </div>

            {/* User + Logout at bottom */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{teacherName}</div>
                        <div className="sidebar-user-role">Teacher</div>
                    </div>
                </div>
                <button onClick={onLogout} className="sidebar-logout-btn" title="Logout">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
