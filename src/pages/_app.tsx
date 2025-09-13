import { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IoIosWarning } from 'react-icons/io';
import FeedbackPanel from '../components/FeedbackPanel';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
    const [isFeedbackPanelOpen, setIsFeedbackPanelOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const originalConsoleLog = console.log;
        const originalConsoleWarn = console.warn;
        const originalConsoleError = console.error;

        const captureLog = (level: string, ...args: unknown[]) => {
            const message = args.map(arg => {
                try {
                    return JSON.stringify(arg);
                } catch {
                    return String(arg);
                }
            }).join(' ');

            setConsoleLogs(prevLogs => [...prevLogs, `[${level}] ${new Date().toISOString()}: ${message}`]);
        };

        console.log = (...args) => {
            originalConsoleLog.apply(console, args);
            captureLog('LOG', ...args);
        };
        console.warn = (...args) => {
            originalConsoleWarn.apply(console, args);
            captureLog('WARN', ...args);
        };
        console.error = (...args) => {
            originalConsoleError.apply(console, args);
            captureLog('ERROR', ...args);
        };

        return () => {
            console.log = originalConsoleLog;
            console.warn = originalConsoleWarn;
            console.error = originalConsoleError;
        };
    }, []);

    const showFeedbackButton = router.pathname.startsWith('/admin/') || ['/homepage', '/assessment_score', '/score_summary'].includes(router.pathname);

    return (
        <>
            <Component {...pageProps} />
            {showFeedbackButton && (
                <>
                    <button
                        onClick={() => setIsFeedbackPanelOpen(true)}
                        className="feedback-button"
                        aria-label="Report an Issue"
                    >
                        <div className="feedback-button-content">
                            <div className="feedback-button-icon">
                                <IoIosWarning size={24} />
                            </div>
                            <span className="feedback-button-text">Report an Issue</span>
                        </div>
                    </button>
                    {isFeedbackPanelOpen && (
                        <FeedbackPanel
                            onClose={() => setIsFeedbackPanelOpen(false)}
                            consoleLogs={consoleLogs}
                        />
                    )}
                </>
            )}
        </>
    );
}

export default MyApp; 