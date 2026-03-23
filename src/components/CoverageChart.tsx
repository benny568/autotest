import { format, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { WeeklyReportData } from '../App';

interface CoverageChartProps {
  data: WeeklyReportData[];
}

function roundOrNull(value: number | null): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Number(value.toFixed(1));
}

export default function CoverageChart({ data }: CoverageChartProps) {
  const chartData = data.map((item) => ({
    week: format(parseISO(item.weekStart), 'MMM dd'),
    'Line Coverage': roundOrNull(item.lineCoverage),
    'Function Coverage': roundOrNull(item.functionCoverage),
    'Branch Coverage': roundOrNull(item.branchCoverage),
    'Average Coverage': roundOrNull(item.averageCoverage),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis domain={[0, 100]} />
        <Tooltip
          formatter={(value) =>
            value == null || value === '' ? '—' : `${value}%`
          }
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="Line Coverage"
          stroke="#4a90e2"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="Function Coverage"
          stroke="#50c878"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="Branch Coverage"
          stroke="#f39c12"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="Average Coverage"
          stroke="#9b59b6"
          strokeWidth={3}
          dot={{ r: 5 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
