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

interface TestCountChartProps {
  data: WeeklyReportData[];
}

export default function TestCountChart({ data }: TestCountChartProps) {
  const chartData = data.map((item) => ({
    week: format(parseISO(item.weekStart), 'MMM dd'),
    'Unit Test Files': item.unitTestFiles,
    'E2E Test Files': item.e2eTestFiles,
    'Unit Test Cases': item.unitTestCases,
    'E2E Test Cases': item.e2eTestCases,
    'Total Test Cases': item.totalTestCases,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="Unit Test Files"
          stroke="#4a90e2"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="E2E Test Files"
          stroke="#e74c3c"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="Unit Test Cases"
          stroke="#50c878"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="E2E Test Cases"
          stroke="#f39c12"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
