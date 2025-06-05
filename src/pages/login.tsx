import Head from 'next/head';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';

const LoginPage = () => {
    const [teacherId, setTeacherId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const router = useRouter();

    const handleLogin = async (event: FormEvent) => {
        event.preventDefault();
        setError(''); // Clear previous errors

        if (!teacherId || !password) {
            setError('Please enter both Teacher ID and Password.');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ teacherId, password }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Login successful:', data.message);
                // Redirect to homepage or dashboard
                router.push('/homepage');
            } else {
                setError(data.message || 'Login failed. Please try again.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    const openForgotPasswordModal = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        setShowForgotPasswordModal(true);
    };

    const closeForgotPasswordModal = () => {
        setShowForgotPasswordModal(false);
    };

    return (
        <>
            <Head>
                <title>BICE Course Outcome - Login</title>
                {/* Assuming Tailwind is set up via globals.css or similar */}
            </Head>
            <style jsx global>{`
                body {
                    font-family: 'Inter', sans-serif;
                }
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #f0f4f8; /* A light, neutral background */
                }
                .login-card {
                    background-color: white;
                    padding: 2.5rem; /* Tailwind p-10 */
                    border-radius: 0.75rem; /* Tailwind rounded-xl */
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Tailwind shadow-lg */
                    width: 100%;
                    max-width: 28rem; /* Tailwind max-w-md */
                }
                .input-field {
                    width: 100%;
                    padding: 0.75rem 1rem; /* Tailwind p-3 px-4 */
                    border: 1px solid #d1d5db; /* Tailwind border-gray-300 */
                    border-radius: 0.375rem; /* Tailwind rounded-md */
                    transition: border-color 0.3s ease;
                }
                .input-field:focus {
                    outline: none;
                    border-color: #3b82f6; /* Tailwind border-blue-500 */
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); /* Focus ring */
                }
                .btn-primary {
                    background-color: #2563eb; /* Tailwind bg-blue-600 */
                    color: white;
                    padding: 0.75rem;
                    width: 100%;
                    border-radius: 0.375rem; /* Tailwind rounded-md */
                    font-weight: 500; /* Tailwind font-medium */
                    transition: background-color 0.3s ease;
                }
                .btn-primary:hover {
                    background-color: #1d4ed8; /* Tailwind bg-blue-700 */
                }
            `}</style>
            <div className="login-container px-4 py-8">
                <div className="login-card">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">BICE Course Outcome</h1>
                        <p className="text-gray-600 mt-1">Teacher Login</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="mb-5">
                            <label htmlFor="teacherIdInput" className="block text-sm font-medium text-gray-700 mb-1">Teacher ID</label>
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

                        <div className="mb-6">
                            <label htmlFor="passwordInput" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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

                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                        <div className="mb-6">
                            <button type="submit" className="btn-primary">Login</button>
                        </div>

                        <div className="text-center">
                            <a href="#" onClick={openForgotPasswordModal} className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                                Forgot Password?
                            </a>
                        </div>
                    </form>
                </div>
            </div>

            {showForgotPasswordModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center px-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Forgot Password</h3>
                            <button onClick={closeForgotPasswordModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Please contact the system administrator or your department head to reset your password.
                        </p>
                        <div className="text-right">
                            <button onClick={closeForgotPasswordModal} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LoginPage; 