import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { PROGRAM_OUTCOMES } from '../../lib/constants';
import '../../styles/admin/homepage.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable?: {
        finalY?: number;
    };
}

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
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleDropdownToggle = (name: string) => {
        setOpenDropdown(prev => (prev === name ? null : name));
    };

    useEffect(() => {
        document.body.classList.add('admin-homepage');

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.custom-select')) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.body.classList.remove('admin-homepage');
            document.removeEventListener('mousedown', handleClickOutside);
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

    const handleSessionSelect = (session: string) => {
        setSelectedSession(session);
        setOpenDropdown(null);
    };

    const handlePoSelect = (po: string) => {
        setSelectedPo(po);
        setOpenDropdown(null);
    };

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

    const generatePdf = () => {
        if (!dashboardData.length || !selectedPo || !selectedSession) return;

        const doc: jsPDFWithAutoTable = new jsPDF();
        const poName = PROGRAM_OUTCOMES.find(p => p.no === selectedPo)?.name || '';

        // PDF Header
        doc.setFontSize(18);
        doc.text('Program Outcome Achievement Report', 14, 22);
        doc.setFontSize(12);
        doc.text(`Program Outcome: ${selectedPo}: ${poName}`, 14, 32);
        doc.text(`Session: ${selectedSession}`, 14, 38);

        let startY = 45; // Initial Y position for the first table

        dashboardData.forEach((entry) => {
            const tableHeight = (entry.scores.length + 1) * 10 + 20; // Estimate table height
            if (startY + tableHeight > 280) { // Check if it fits on the page
                doc.addPage();
                startY = 20;
            }

            // Entry Header
            doc.setFontSize(14);
            doc.text(`${entry.courseId} - ${entry.co_no}`, 14, startY);
            
            doc.setFontSize(10);
            doc.text(
                `Teacher: ${entry.teacherId} | Assessment: ${entry.assessmentType} | Pass Mark: ${entry.passMark}`,
                14,
                startY + 6
            );
            
            // Student scores table for the entry
            const tableHead = [['Student ID', 'Student Name', 'Mark']];
            const tableBody = entry.scores.map(score => [
                score.studentId,
                score.name,
                String(score.obtainedMark)
            ]);

            autoTable(doc, {
                head: tableHead,
                body: tableBody,
                startY: startY + 8,
                theme: 'striped',
                headStyles: { fillColor: [74, 94, 114] },
            });

            startY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : startY;
        });

        doc.save(`PO_Report_${selectedPo}_${selectedSession}.pdf`);
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
                            <div className="custom-select">
                                <button id="session-select" className="custom-select-toggle" onClick={() => handleDropdownToggle('session')}>
                                    <span className={!selectedSession ? 'placeholder' : ''}>
                                        {selectedSession || 'Select a Session'}
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                                {openDropdown === 'session' && (
                                    <div className="custom-select-options">
                                        {sessions.map(s => (
                                            <div key={s} className={`custom-select-option ${selectedSession === s ? 'selected' : ''}`} onClick={() => handleSessionSelect(s)}>
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="select-group">
                            <label htmlFor="po-select" className="select-label">Filter by Program Outcome</label>
                            <div className="custom-select">
                                <button id="po-select" className="custom-select-toggle" onClick={() => handleDropdownToggle('po')}>
                                    <span className={!selectedPo ? 'placeholder' : ''}>
                                        {selectedPo ? `${selectedPo}: ${PROGRAM_OUTCOMES.find(p => p.no === selectedPo)?.name}` : 'Select a PO'}
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                                {openDropdown === 'po' && (
                                    <div className="custom-select-options">
                                        <div className="custom-select-option" onClick={() => handlePoSelect('')}>Select a PO</div>
                                        {PROGRAM_OUTCOMES.map(po => (
                                            <div key={po.no} className={`custom-select-option ${selectedPo === po.no ? 'selected' : ''}`} onClick={() => handlePoSelect(po.no)}>
                                                {po.no}: {po.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button onClick={handleFetchData} className="btn-fetch" disabled={loading}>
                            {loading ? 'Loading...' : 'Get Data'}
                        </button>
                    </div>

                    {error && <p className="message error-message">{error}</p>}
                    
                    {dashboardData.length > 0 && (
                        <div className="results-header">
                            <div>
                                <h2 className="po-title">{selectedPo}: {selectedPoName}</h2>
                                <p className="po-name">Showing {dashboardData.length} entries</p>
                            </div>
                            <button onClick={generatePdf} className="btn-fetch">
                                Generate PDF Report
                            </button>
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