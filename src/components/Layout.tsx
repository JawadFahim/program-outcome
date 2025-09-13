import React, { useState } from 'react';
import Navbar from './Navbar';
import FeedbackPanel from './FeedbackPanel';

interface LayoutProps {
    children: React.ReactNode;
    teacherName: string;
    onLogout: () => void;
    page: 'homepage' | 'assessment' | 'summary';
    title: string;
}

const Layout = ({ children, teacherName, onLogout, page, title }: LayoutProps) => {
    const [showFeedback, setShowFeedback] = useState(false);
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

    // Capture console logs for feedback
    React.useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            setConsoleLogs(prev => [...prev.slice(-9), `LOG: ${args.join(' ')}`]);
            originalLog(...args);
        };

        console.error = (...args) => {
            setConsoleLogs(prev => [...prev.slice(-9), `ERROR: ${args.join(' ')}`]);
            originalError(...args);
        };

        console.warn = (...args) => {
            setConsoleLogs(prev => [...prev.slice(-9), `WARN: ${args.join(' ')}`]);
            originalWarn(...args);
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar teacherName={teacherName} onLogout={onLogout} page={page} title={title} />
            <main>
                {children}
            </main>
            
            {/* Feedback Button */}
            <button 
                className="feedback-button"
                onClick={() => setShowFeedback(true)}
                title="Report Issue or Feedback"
            >
                <div className="feedback-button-content">
                    <div className="feedback-button-icon">
                        <div className="warning-triangle">
                            <span>!</span>
                        </div>
                    </div>
                    <span className="feedback-button-text">Report Issue</span>
                </div>
            </button>

            {/* Feedback Panel */}
            {showFeedback && (
                <FeedbackPanel 
                    onClose={() => setShowFeedback(false)}
                    consoleLogs={consoleLogs}
                />
            )}
        </div>
    );
};

export default Layout;
 