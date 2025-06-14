import Head from 'next/head';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { setAuthTokenCookie } from '../lib/jwt';

const LoginPage = () => {
    const [teacherId, setTeacherId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        if (!teacherId || !password) {
            setError('Please enter both Teacher ID and Password.');
            return;
        }

        try {
            // Call the CORRECT API endpoint
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ teacherId, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // The server sends back a token, which we store in the cookie
                setAuthTokenCookie(data.token);
                
                router.push(`/homepage`);
            } else {
                setError(data.message || 'Login failed. Please try again.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <>
            <Head>
                <title>BICE Course Outcome - Login</title>
            </Head>
            <style jsx global>{`
                :root {
                    --primary-color: #4f46e5;
                    --primary-hover: #4338ca;
                    --text-primary: #111827;
                    --text-secondary: #6b7280;
                    --bg-main: #f9fafb;
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
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
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
                    transform: translateY(0);
                }

                .btn-primary:hover {
                    background-color: var(--primary-hover);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
                    transform: translateY(-2px);
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

                .forgot-password-link {
                    display: block;
                    text-align: center;
                    font-size: 0.875rem;
                    color: var(--primary-color);
                    text-decoration: none;
                    margin-top: 1.5rem;
                }

                .forgot-password-link:hover {
                    text-decoration: underline;
                }

                /* Modal Styles */
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    z-index: 50;
                }
                .modal-content {
                    background-color: var(--bg-card);
                    padding: 2rem;
                    border-radius: 1rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    width: 100%;
                    max-width: 26rem;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .modal-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                }
                .modal-close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--text-secondary);
                }
                .modal-body {
                    color: var(--text-secondary);
                    margin-bottom: 1.5rem;
                }
                .modal-footer {
                    text-align: right;
                }
            `}</style>
            <div className="login-container">
                <div className="login-card">
                    <div>
                        <h1 className="login-title">BICE Course Outcome</h1>
                        <p className="login-subtitle">Teacher Login</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="teacherIdInput" className="form-label">Teacher ID</label>
                            <input
                                type="text"
                                id="teacherIdInput"
                                name="teacherId"
                                className="input-field"
                                placeholder="Enter your Teacher ID"
                                value={teacherId}
                                onChange={(e) => setTeacherId(e.target.value)}
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

                        <div>
                            <a 
                                href="/forgot-password" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    router.push('/forgot-password');
                                }} 
                                className="forgot-password-link"
                            >
                                Forgot Password?
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default LoginPage; 