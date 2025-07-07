import Link from 'next/link';

interface NavbarProps {
    teacherName: string;
    onLogout: () => void;
    page: 'homepage' | 'assessment' | 'summary';
    title: string;
}

const Navbar = ({ teacherName, onLogout, page, title }: NavbarProps) => {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    {title}
                </div>
                <div className="navbar-links-centered">
                    <Link href="/homepage" className={`navbar-link ${page === 'homepage' ? 'active' : ''}`}>
                        Outcome Mapper
                    </Link>
                    <Link href="/assessment_score" className={`navbar-link ${page === 'assessment' ? 'active' : ''}`}>
                        Assessment Score
                    </Link>
                    <Link href="/score_summary" className={`navbar-link ${page === 'summary' ? 'active' : ''}`}>
                        View Summaries
                    </Link>
                </div>
                <div className="navbar-user-section">
                    <div className="teacher-info">
                        Teacher: <span>{teacherName}</span>
                    </div>
                    <button onClick={onLogout} className="btn btn-danger">Logout</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 