import Head from 'next/head';
import { useRouter } from 'next/router';

const HomePage = () => {
    const router = useRouter();

    // Placeholder for checking if user is authenticated
    // In a real app, you would get this from context, a store, or a session check
    const isAuthenticated = true; // Assume true for now, replace with actual auth check

    // If not authenticated, redirect to login
    // This is a client-side redirect, consider server-side protection as well
    if (typeof window !== 'undefined' && !isAuthenticated) {
        router.push('/login');
        return null; // Render nothing while redirecting
    }

    const handleLogout = () => {
        // Placeholder for logout logic
        // e.g., clear session, call logout API endpoint
        console.log('User logged out');
        router.push('/login'); // Redirect to login page after logout
    };

    return (
        <>
            <Head>
                <title>BICE - Homepage</title>
            </Head>
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white shadow-md rounded-lg p-8 max-w-lg w-full text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to the BICE Platform!</h1>
                    <p className="text-gray-600 mb-8">
                        This is your homepage. You have successfully logged in.
                    </p>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-md transition duration-150 ease-in-out"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default HomePage; 