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
                <Link href="/" legacyBehavior>
                    <a className="navbar-brand">{title}</a>
                </Link>
                <div className="navbar-links">
                    {page !== 'homepage' && (
                        <Link href="/homepage" legacyBehavior><a className="navbar-link">Course Objective</a></Link>
                    )}
                    {page !== 'assessment' && (
                        <Link href="/assessment_score" legacyBehavior><a className="navbar-link">Assessment Score</a></Link>
                    )}
                    {page !== 'summary' && (
                        <Link href="/score_summary" legacyBehavior><a className="navbar-link">View Summaries</a></Link>
                    )}

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