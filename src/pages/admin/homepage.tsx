import Head from 'next/head';

import { useState, useEffect } from 'react';
import { PROGRAM_OUTCOMES } from '../../lib/constants';
import '../../styles/admin/homepage.css';
import AdminNavbar from '../../components/admin/AdminNavbar';

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
    const [sessions, setSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedPo, setSelectedPo] = useState('');
    const [dashboardData, setDashboardData] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        document.body.classList.add('admin-homepage');
        return () => {
            document.body.classList.remove('admin-homepage');
        }
    }, []);

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


    
    const selectedPoName = PROGRAM_OUTCOMES.find(p => p.no === selectedPo)?.name;

    return (
        <>
            <Head>
                <title>Admin Dashboard - BICE Course Outcome</title>
            </Head>
            <AdminNavbar page="dashboard" />
            <div className="admin-container">
                <main>
                    <div className="card filters">
                        <div className="select-group">
                            <label htmlFor="session-select" className="select-label">Filter by Session</label>
                            <select id="session-select" className="select-dropdown" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                                {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="select-group">
                            <label htmlFor="po-select" className="select-label">Filter by Program Outcome</label>
                            <select id="po-select" className="select-dropdown" value={selectedPo} onChange={e => setSelectedPo(e.target.value)}>
                                <option value="" disabled>Select a PO</option>
                                {PROGRAM_OUTCOMES.map(po => <option key={po.no} value={po.no}>{po.no}: {po.name}</option>)}
                            </select>
                        </div>
                        <button onClick={handleFetchData} className="btn-fetch" disabled={loading}>
                            {loading ? 'Loading...' : 'Get Data'}
                        </button>
                    </div>

                    {error && <p className="message error-message">{error}</p>}
                    
                    {dashboardData.length > 0 && (
                        <div className="results-header">
                            <h2 className="po-title">{selectedPo}: {selectedPoName}</h2>
                            <p className="po-name">Showing {dashboardData.length} entries</p>
                        </div>
                    )}

                    {loading && <p className="message">Loading data...</p>}

                    {!loading && dashboardData.length > 0 && (
                         <div className="results-grid">
                            {dashboardData.map(entry => (
                                <div key={entry._id} className="result-card">
                                    <div className="card-header">
                                        <h3 className="course-id">{entry.courseId} - {entry.co_no}</h3>
                                        <div className="card-details">
                                            <span className="detail-pill">Teacher: <strong>{entry.teacherId}</strong></span>
                                            <span className="detail-pill">Assessment: <strong>{entry.assessmentType}</strong></span>
                                            <span className="detail-pill">Pass Mark: <strong>{entry.passMark}</strong></span>
                                        </div>
                                    </div>
                                    <div className="table-container">
                                        <table className="score-table">
                                            <thead>
                                                <tr>
                                                    <th>Student ID</th>
                                                    <th className="text-center">Mark</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {entry.scores.map(score => (
                                                    <tr key={score.studentId}>
                                                        <td>{score.studentId}</td>
                                                        <td className={`text-center score-cell ${
                                                            typeof score.obtainedMark === 'number' 
                                                                ? (score.obtainedMark >= entry.passMark ? 'score-pass' : 'score-fail')
                                                                : 'score-absent'
                                                        }`}>
                                                            {String(score.obtainedMark)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && dashboardData.length === 0 && selectedPo && (
                        <div className="card message">
                            <p>No data found for the selected criteria. Please try a different session or Program Outcome.</p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default AdminHomePage; 