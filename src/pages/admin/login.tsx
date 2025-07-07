import Head from 'next/head';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { setAdminAuthTokenCookie } from '../../lib/jwt';
import '../../styles/admin/login.css';
import bupImage from '../../assets/bup.jpg';
import bupLogo from '../../assets/bup_logo.png';

const AdminLoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        document.body.classList.add('admin-login-page');
        return () => {
            document.body.classList.remove('admin-login-page');
        };
    }, []);

    const handleLogin = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setAdminAuthTokenCookie(data.token);
                router.push('/admin/homepage');
            } else {
                setError(data.message || 'Login failed. Please try again.');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <>
            <Head>
                <title>BICE Course Outcome - Admin Login</title>
            </Head>
            <div className="login-container" style={{ backgroundImage: `url(${bupImage.src})` }}>
                <div className="login-card">
                    <div>
                        <img src={bupLogo.src} alt="BUP Logo" className="login-logo" />
                        <h1 className="login-title">BICE Course Outcome</h1>
                        <p className="login-subtitle">Admin Login</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="usernameInput" className="form-label">Username</label>
                            <input
                                type="text"
                                id="usernameInput"
                                name="username"
                                className="input-field"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="passwordInput" className="form-label">Password</label>
                            <input
                                type="password"
                                id="passwordInput"
                                name="password"
                                className="input-field"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <div className="form-group">
                            <button type="submit" className="btn-primary">Login</button>
                        </div>

                        <div className="teacher-login-link">
                            <Link href="/login" passHref legacyBehavior>
                                <a>Not an Admin? Go to Teacher Login</a>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AdminLoginPage; 