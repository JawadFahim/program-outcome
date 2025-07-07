import Link from 'next/link';
import { useRouter } from 'next/router';
import { removeAdminAuthTokenCookie } from '../../lib/jwt';
import '../../styles/admin/AdminNavbar.css';

interface AdminNavbarProps {
    page: 'dashboard' | 'teachers' | 'student';
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
                </nav>
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
        </header>
    );
};

export default AdminNavbar;
 