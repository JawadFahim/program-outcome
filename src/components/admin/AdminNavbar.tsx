import Link from 'next/link';
import { useRouter } from 'next/router';
import { removeAdminAuthTokenCookie } from '../../lib/jwt';
import '../../styles/admin/AdminNavbar.css';

interface AdminNavbarProps {
    page: 'dashboard' | 'teachers' | 'student' | 'student-entry' | 'course-offer';
}

const AdminNavbar = ({ page }: AdminNavbarProps) => {
    const router = useRouter();

    const handleLogout = () => {
        removeAdminAuthTokenCookie();
        router.push('/admin/login');
    };

    const getTitle = () => {
        if (page === 'teachers') {
            return 'Teacher Management';
        }
        if (page === 'student') {
            return 'Student Information';
        }
        if (page === 'student-entry') {
            return 'Student Entry';
        }
        if (page === 'course-offer') {
            return 'Course Offer';
        }
        return 'Admin Dashboard';
    };

    return (
        <header className="admin-header">
            <div className="header-nav">
                <h1 className="header-title">{getTitle()}</h1>
                <nav className="nav-links-container">
                    <Link href="/admin/homepage" className={`nav-link ${page === 'dashboard' ? 'active' : ''}`}>
                        Dashboard
                    </Link>
                    
                    <Link href="/admin/teacher-details" className={`nav-link ${page === 'teachers' ? 'active' : ''}`}>
                        Teacher Management
                    </Link>

                    <Link href="/admin/student" className={`nav-link ${page === 'student' ? 'active' : ''}`}>
                        Student Info
                    </Link>

                    <Link href="/admin/student-entry" className={`nav-link ${page === 'student-entry' ? 'active' : ''}`}>
                        Student Entry
                    </Link>

                    <Link href="/admin/course-offer" className={`nav-link ${page === 'course-offer' ? 'active' : ''}`}>
                        Course Offer
                    </Link>
                </nav>
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
        </header>
    );
};

export default AdminNavbar;
 