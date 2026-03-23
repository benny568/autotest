import { WeeklyReportData } from '../App';
import TestCountChart from './TestCountChart';
import CoverageChart from './CoverageChart';
import ReportTable from './ReportTable';
import SummaryCards from './SummaryCards';
import './ReportDashboard.css';

interface ReportDashboardProps {
  data: WeeklyReportData[];
}

export default function ReportDashboard({ data }: ReportDashboardProps) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>No data available for the selected date range.</p>
        <p>Create a snapshot to start tracking test metrics.</p>
      </div>
    );
  }

  const latest = data[data.length - 1];
  const first = data[0];

  const growth = {
    unitTestFiles: latest.unitTestFiles - first.unitTestFiles,
    unitTestCases: latest.unitTestCases - first.unitTestCases,
    e2eTestFiles: latest.e2eTestFiles - first.e2eTestFiles,
    e2eTestCases: latest.e2eTestCases - first.e2eTestCases,
    lineCoverage:
      latest.lineCoverage != null && first.lineCoverage != null
        ? latest.lineCoverage - first.lineCoverage
        : null,
    averageCoverage:
      latest.averageCoverage != null && first.averageCoverage != null
        ? latest.averageCoverage - first.averageCoverage
        : null,
  };

  return (
    <div className="report-dashboard">
      <SummaryCards latest={latest} growth={growth} />
      
      <div className="charts-section">
        <div className="chart-container">
          <h2>Test Count Growth</h2>
          <TestCountChart data={data} />
        </div>
        
        <div className="chart-container">
          <h2>Test Coverage Trends</h2>
          <CoverageChart data={data} />
        </div>
      </div>

      <div className="table-section">
        <h2>Detailed Weekly Report</h2>
        <ReportTable data={data} />
      </div>
    </div>
  );
}
