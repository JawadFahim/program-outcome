// src/components/FeedbackPanel.tsx
import { useState } from 'react';

interface FeedbackPanelProps {
    onClose: () => void;
    consoleLogs: string[];
}

const FeedbackPanel = ({ onClose, consoleLogs }: FeedbackPanelProps) => {
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const response = await fetch('/api/send-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    review,
                    logs: consoleLogs.join('\n'),
                    pageUrl: window.location.href,
                }),
            });

            if (response.ok) {
                alert('Feedback submitted successfully!');
                onClose();
            } else {
                alert('Failed to submit feedback. Please try again.');
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            alert('An error occurred while submitting your feedback.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="feedback-backdrop">
            <div className="feedback-panel">
                <div className="feedback-header">
                    <h2>
                        <svg className="feedback-header-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Report Issue
                    </h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <p className="feedback-description">
                        Help us improve by reporting bugs, suggesting features, or sharing your feedback. Your input is valuable to us!
                    </p>
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Please describe the issue or provide your feedback in detail..."
                        required
                    />
                    <div className="feedback-footer">
                        <span className="feedback-info">
                            Your feedback will be sent along with page information to help us understand the context.
                        </span>
                        <button type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackPanel;
