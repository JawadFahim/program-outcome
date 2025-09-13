// src/pages/api/send-feedback.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { sendMail } from '../../lib/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { review, logs, pageUrl } = req.body;

    if (!review) {
        return res.status(400).json({ message: 'Review content is required.' });
    }

    try {
        const mailOptions = {
            from: '"Feedback Bot" <course@bup.edu.bd>',
            to: 'jawadanjum712@gmail.com',
            subject: 'New Feedback/Issue Report',
            html: `
                <h1>New Feedback/Issue Report</h1>
                <p><strong>Page:</strong> ${pageUrl || 'Unknown'}</p>
                <h2>User Review:</h2>
                <p>${review}</p>
                <hr />
                <h2>Console Logs:</h2>
                <pre><code>${logs || 'No console logs captured.'}</code></pre>
            `,
        };

        const mailResult = await sendMail(mailOptions);

        if (mailResult.success) {
            res.status(200).json({ message: 'Feedback sent successfully.' });
        } else {
            throw new Error('Failed to send feedback email.');
        }

    } catch (error) {
        console.error('Send feedback error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}
