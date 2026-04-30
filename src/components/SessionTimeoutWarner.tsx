import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

const WARNING_BEFORE_MS = 5 * 60 * 1000;  // show warning 5 min before expiry
const CHECK_INTERVAL_MS = 20 * 1000;      // check every 20 seconds

const AUTH_PAGES = ['/login', '/admin/login', '/forgot-password'];

const getTokenExpiry = (cookieName: string): number | null => {
    const token = Cookies.get(cookieName);
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
};

const SessionTimeoutWarner = () => {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [dismissed, setDismissed] = useState(false);

    const checkExpiry = useCallback(() => {
        const isAdminPath = router.pathname.startsWith('/admin');
        const cookieName = isAdminPath ? 'admin_auth_token' : 'auth_token';
        const expiry = getTokenExpiry(cookieName);

        if (!expiry) {
            setTimeLeft(null);
            return;
        }

        const remaining = expiry - Date.now();
        if (remaining <= 0) {
            setTimeLeft(0);
        } else if (remaining <= WARNING_BEFORE_MS) {
            setTimeLeft(remaining);
            setDismissed(false);
        } else {
            setTimeLeft(null);
        }
    }, [router.pathname]);

    useEffect(() => {
        if (AUTH_PAGES.includes(router.pathname)) return;

        checkExpiry();
        const interval = setInterval(checkExpiry, CHECK_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [checkExpiry, router.pathname]);

    if (timeLeft === null || dismissed) return null;

    const isAdmin = router.pathname.startsWith('/admin');
    const loginPath = isAdmin ? '/admin/login' : '/login';

    if (timeLeft === 0) {
        return (
            <div className="session-timeout-overlay">
                <div className="session-timeout-modal">
                    <div className="session-timeout-icon">🔒</div>
                    <h2>Session Expired</h2>
                    <p>Your session has expired. Please log in again to continue.</p>
                    <button className="btn btn-primary" onClick={() => router.push(loginPath)}>
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    const minutesLeft = Math.max(1, Math.ceil(timeLeft / 60000));

    return (
        <div className="session-warning-banner">
            <div className="session-warning-content">
                <span className="session-warning-icon">⏱</span>
                <span className="session-warning-text">
                    Session expires in{' '}
                    <strong>{minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}</strong>.
                    Please save your work.
                </span>
            </div>
            <button
                className="session-warning-dismiss"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss session warning"
            >
                ✕
            </button>
        </div>
    );
};

export default SessionTimeoutWarner;
