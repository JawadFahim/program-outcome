import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { removeAdminAuthTokenCookie } from '../../lib/jwt';
import { useState, useEffect } from 'react';
import { PROGRAM_OUTCOMES } from '../../lib/constants';

interface Score {
    studentId: string;
    name: string;
    obtainedMark: number | string;
}

interface ScoreEntry {
    _id: string;
    teacherId: string;
    courseId: string;
    co_no: string;
    assessmentType: string;
    passMark: number;
    scores: Score[];
    po_no: string;
    session: string;
}

const AdminHomePage = () => {
    const router = useRouter();
    const [sessions, setSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedPo, setSelectedPo] = useState('');
    const [dashboardData, setDashboardData] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await fetch('/api/admin/sessions');
                if (!res.ok) throw new Error('Failed to fetch sessions');
                const data = await res.json();
                setSessions(data);
                if (data.length > 0) {
                    setSelectedSession(data[0]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            }
        };
        fetchSessions();
    }, []);

    const handleFetchData = async () => {
        if (!selectedSession || !selectedPo) {
            setError('Please select both a session and a Program Outcome.');
            return;
        }
        setLoading(true);
        setError('');
        setDashboardData([]);
        try {
            const res = await fetch(`/api/admin/dashboard?session=${selectedSession}&po_no=${selectedPo}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to fetch dashboard data');
            }
            const data = await res.json();
            setDashboardData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        removeAdminAuthTokenCookie();
        router.push('/admin/login');
    };
    
    const selectedPoName = PROGRAM_OUTCOMES.find(p => p.no === selectedPo)?.name;

    return (
        <>
            <Head>
                <title>Admin Dashboard - BICE Course Outcome</title>
            </Head>
            <style jsx>{`
                /* Admin Dashboard Styles */
                body {
                    background-color: #f9fafb;
                }
                .admin-container {
                    font-family: 'Inter', sans-serif;
                    padding: 0 2rem 2rem;
                }
                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 0;
                    background-color: #fff;
                    border-bottom: 1px solid #e5e7eb;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    padding: 1rem 2rem;
                    margin: 0 -2rem;
                }
                .header-nav {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }
                .header-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                }
                .nav-link {
                    font-weight: 500;
                    color: #10b981;
                    text-decoration: none;
                    transition: color 0.2s ease;
                }
                .nav-link:hover {
                    color: #059669;
                    text-decoration: underline;
                }
                .logout-btn {
                    background-color: #ef4444;
                    color: white;
                    border: none;
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                .logout-btn:hover {
                    background-color: #dc2626;
                }
                .filters {
                    display: flex;
                    gap: 1.5rem;
                    align-items: center;
                    margin: 2rem 0;
                    padding: 1.5rem;
                    background-color: #fff;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
                }
                .select-group {
                    display: flex;
                    flex-direction: column;
                }
                .select-label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 0.5rem;
                }
                .select-dropdown {
                    padding: 0.75rem 1rem;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    background-color: #fff;
                    min-width: 200px;
                }
                .btn-fetch {
                    background-color: #10b981;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    align-self: flex-end;
                }
                .btn-fetch:hover {
                    background-color: #059669;
                }
                .results-header {
                    margin-top: 2rem;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 0.5rem;
                }
                .po-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                }
                .po-name {
                    font-size: 1.125rem;
                    color: #6b7280;
                }
                .results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 2rem;
                    margin-top: 2rem;
                }
                .result-card {
                    background-color: #fff;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
                }
                .card-header {
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 1rem;
                    margin-bottom: 1rem;
                }
                .course-id {
                    font-size: 1.25rem;
                    font-weight: 600;
                }
                .card-details {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                .table-container {
                    max-height: 300px;
                    overflow-y: auto;
                    margin-top: 1rem;
                }
                .score-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .score-table th, .score-table td {
                    padding: 0.75rem;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }
                .score-table th {
                    background-color: #f3f4f6;
                    font-weight: 600;
                    position: sticky;
                    top: 0;
                }
                .message {
                    text-align: center;
                    padding: 2rem;
                    font-size: 1.125rem;
                    color: #6b7280;
                }
            `}</style>
            <div className="admin-container">
                <header className="admin-header">
                    <div className="header-nav">
                        <h1 className="header-title">Admin Dashboard</h1>
                        <Link href="/admin/teacher-details" legacyBehavior>
                            <a className="nav-link">Teacher Details</a>
                        </Link>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </header>
                <main>
                    <div className="filters">
                        <div className="select-group">
                            <label htmlFor="session-select" className="select-label">Session</label>
                            <select id="session-select" className="select-dropdown" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                                {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="select-group">
                            <label htmlFor="po-select" className="select-label">Program Outcome</label>
                            <select id="po-select" className="select-dropdown" value={selectedPo} onChange={e => setSelectedPo(e.target.value)}>
                                <option value="" disabled>Select a PO</option>
                                {PROGRAM_OUTCOMES.map(po => <option key={po.no} value={po.no}>{po.no}</option>)}
                            </select>
                        </div>
                        <button onClick={handleFetchData} className="btn-fetch" disabled={loading}>
                            {loading ? 'Loading...' : 'Get Data'}
                        </button>
                    </div>

                    {error && <p className="message" style={{color: '#ef4444'}}>{error}</p>}
                    
                    {dashboardData.length > 0 && (
                        <div className="results-header">
                            <h2 className="po-title">{selectedPo}</h2>
                            <p className="po-name">{selectedPoName}</p>
                        </div>
                    )}

                    {loading && <p className="message">Loading data...</p>}

                    {!loading && dashboardData.length === 0 && selectedPo && (
                        <p className="message">No data found for the selected criteria.</p>
                    )}

                    <div className="results-grid">
                        {dashboardData.map(entry => (
                            <div key={entry._id} className="result-card">
                                <div className="card-header">
                                    <h3 className="course-id">{entry.courseId} - {entry.co_no}</h3>
                                    <div className="card-details">
                                        <span>Teacher: <strong>{entry.teacherId}</strong></span>
                                        <span>Assessment: <strong>{entry.assessmentType}</strong></span>
                                        <span>Pass Mark: <strong>{entry.passMark}</strong></span>
                                    </div>
                                </div>
                                <div className="table-container">
                                    <table className="score-table">
                                        <thead>
                                            <tr>
                                                <th>Student ID</th>
                                                <th>Mark</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entry.scores.map(score => (
                                                <tr key={score.studentId}>
                                                    <td>{score.studentId}</td>
                                                    <td>{score.obtainedMark}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </>
    );
};

export default AdminHomePage; 