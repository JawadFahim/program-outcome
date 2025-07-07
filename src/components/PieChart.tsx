import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
    passed: number;
    failed: number;
    absent: number;
}

const PieChart = ({ passed, failed, absent }: PieChartProps) => {
    const data: ChartData<'pie'> = {
        labels: ['Pass', 'Fail', 'Absent'],
        datasets: [
            {
                label: 'Student Status',
                data: [passed, failed, absent],
                backgroundColor: [
                    'rgba(93, 239, 110, 0.87)',  // Success color
                    'rgb(233, 67, 67)',   // Danger color
                    'rgba(107, 114, 128, 0.7)', // Secondary color
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(107, 114, 128, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                           const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
                           const percentage = total > 0 ? (context.parsed / total * 100).toFixed(2) : 0;
                           label += `${context.raw} (${percentage}%)`;
                        }
                        return label;
                    },
                },
            },
        },
    };

    return (
        <div className="chart-container">
            <Pie data={data} options={options} />
        </div>
    );
};

export default PieChart; 