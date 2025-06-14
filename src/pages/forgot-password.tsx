import Head from 'next/head';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';

const ForgotPasswordPage = () => {
    const [emailOrId, setEmailOrId] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const router = useRouter();

    const handleRequestOtp = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrId }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setStep('reset');
            } else {
                setError(data.message || 'Failed to send OTP.');
            }
        } catch (err) {
            console.error('Request OTP error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrId, otp, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message + ' You will be redirected to login shortly.');
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(data.message || 'Failed to reset password.');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>BICE Course Outcome - Forgot Password</title>
            </Head>
            <style jsx global>{`
                :root {
                    --primary-color: #4f46e5;
                    --primary-hover: #4338ca;
                    --success-color: #10b981;
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

                .container-sm {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }

                .card {
                    background-color: var(--bg-card);
                    padding: 2.5rem;
                    border-radius: 1.5rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    width: 100%;
                    max-width: 28rem;
                    border: 1px solid #e5e7eb;
                }
                
                .card-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    text-align: center;
                    margin-bottom: 0.5rem;
                }
                
                .card-subtitle {
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
                }

                .btn-primary:hover:not(:disabled) {
                    background-color: var(--primary-hover);
                }
                
                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
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

                .message {
                    font-size: 0.875rem;
                    text-align: center;
                    margin-bottom: 1rem;
                }
                .message.success {
                    color: var(--success-color);
                }
                .message.error {
                    color: var(--error-color);
                }

                .back-link {
                    display: block;
                    text-align: center;
                    font-size: 0.875rem;
                    color: var(--primary-color);
                    text-decoration: none;
                    margin-top: 1.5rem;
                }

                .back-link:hover {
                    text-decoration: underline;
                }
            `}</style>
            <div className="container-sm">
                <div className="card">
                    {step === 'request' ? (
                        <div>
                            <h1 className="card-title">Forgot Password</h1>
                            <p className="card-subtitle">Enter your ID or Email to receive an OTP.</p>
                            <form onSubmit={handleRequestOtp}>
                                <div className="form-group">
                                    <label htmlFor="emailOrId" className="form-label">Teacher ID or Email</label>
                                    <input
                                        type="text"
                                        id="emailOrId"
                                        className="input-field"
                                        placeholder="e.g., T-123 or yourname@example.com"
                                        value={emailOrId}
                                        onChange={(e) => setEmailOrId(e.target.value)}
                                        required
                                    />
                                </div>
                                {error && <p className="message error">{error}</p>}
                                <div className="form-group">
                                    <button type="submit" className="btn-primary" disabled={isLoading}>
                                        {isLoading ? 'Sending...' : 'Send OTP'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div>
                            <h1 className="card-title">Reset Password</h1>
                            <p className="card-subtitle">An OTP has been sent to your email. Please enter it below to reset your password.</p>
                             <form onSubmit={handleResetPassword}>
                                <div className="form-group">
                                    <label htmlFor="otp" className="form-label">OTP Code</label>
                                    <input
                                        type="text"
                                        id="otp"
                                        className="input-field"
                                        placeholder="Enter the 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="newPassword" className="form-label">New Password</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        className="input-field"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        className="input-field"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                {error && <p className="message error">{error}</p>}
                                {message && <p className="message success">{message}</p>}

                                <div className="form-group">
                                    <button type="submit" className="btn-primary" disabled={isLoading}>
                                        {isLoading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                     <a href="#" onClick={() => router.push('/login')} className="back-link">
                        Back to Login
                    </a>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordPage; 