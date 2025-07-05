import Link from 'next/link';
import { useRouter } from 'next/router';
import { removeAdminAuthTokenCookie } from '../../lib/jwt';

interface AdminNavbarProps {
    page: 'dashboard' | 'teachers';
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
        return 'Admin Dashboard';
    };

    return (
        <header className="admin-header">
            <div className="header-nav">
                <h1 className="header-title">{getTitle()}</h1>
                {page !== 'dashboard' && (
                    <Link href="/admin/homepage" legacyBehavior>
                        <a className="nav-link">Dashboard</a>
                    </Link>
                )}
                {page !== 'teachers' && (
                    <Link href="/admin/teacher-details" legacyBehavior>
                        <a className="nav-link">Teacher Details</a>
                    </Link>
                )}
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
        </header>
    );
};

export default AdminNavbar;
