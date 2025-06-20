import Head from 'next/head';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { setAdminAuthTokenCookie } from '../../lib/jwt';

const AdminLoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

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
            <style jsx global>{`
                :root {
                    --primary-color: #10b981; /* Green Theme */
                    --primary-hover: #059669;
                    --text-primary: #111827;
                    --text-secondary: #6b7280;
                    --bg-main: #f0fdf4; /* Light Green BG */
                    --bg-card: #ffffff;
                    --border-color: #d1d5db;
                    --error-color: #ef4444;
                }

                body {
                    font-family: 'Inter', sans-serif;
                    background-color: var(--bg-main);
                    color: var(--text-primary);
                    margin: 0;
                }

                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }

                .login-card {
                    background-color: var(--bg-card);
                    padding: 2.5rem;
                    border-radius: 1.5rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    width: 100%;
                    max-width: 28rem;
                    border: 1px solid #e5e7eb;
                }
                
                .login-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    text-align: center;
                    margin-bottom: 0.5rem;
                }
                
                .login-subtitle {
                    font-size: 1rem;
                    color: var(--text-secondary);
                    text-align: center;
                    margin-bottom: 2.5rem;
                }

                .input-field {
                    width: 100%;
                    padding: 1rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    font-size: 1rem;
                    transition: all 0.2s ease-in-out;
                    box-sizing: border-box;
                }

                .input-field:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
                }

                .btn-primary {
                    background-color: var(--primary-color);
                    color: white;
                    padding: 1rem;
                    width: 100%;
                    border: none;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease-in-out;
                }

                .btn-primary:hover {
                    background-color: var(--primary-hover);
                }
                
                .form-label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                }
                
                .form-group {
                    margin-bottom: 1.5rem;
                }

                .error-message {
                    color: var(--error-color);
                    font-size: 0.875rem;
                    text-align: center;
                    margin-bottom: 1rem;
                }

                .teacher-login-link {
                    text-align: center;
                    margin-top: 2rem;
                    font-size: 0.875rem;
                }
                
                .teacher-login-link a {
                    color: var(--text-secondary);
                    text-decoration: none;
                }

                .teacher-login-link a:hover {
                    color: var(--primary-color);
                    text-decoration: underline;
                }
            `}</style>
            <div className="login-container">
                <div className="login-card">
                    <div>
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