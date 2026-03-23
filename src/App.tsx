import { useState, useEffect } from 'react';
import { format, subWeeks } from 'date-fns';
import ReportDashboard from './components/ReportDashboard';
import DateRangeSelector from './components/DateRangeSelector';
import SnapshotButton from './components/SnapshotButton';
import JiraDefectsDashboard from './components/JiraDefectsDashboard';
import './App.css';

export interface WeeklyReportData {
  weekStart: string;
  timestamp: string;
  unitTestFiles: number;
  unitTestCases: number;
  e2eTestFiles: number;
  e2eTestCases: number;
  totalTestFiles: number;
  totalTestCases: number;
  lineCoverage: number | null;
  functionCoverage: number | null;
  branchCoverage: number | null;
  averageCoverage: number | null;
}

function App() {
  const [reportData, setReportData] = useState<WeeklyReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(
    format(subWeeks(new Date(), 12), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<'reports' | 'jira'>('reports');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/report?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handleSnapshotCreated = () => {
    fetchReport();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Team Dashboard</h1>
        <p className="subtitle">
          Track test coverage, test count growth, and defect metrics
        </p>
      </header>

      <div className="app-tabs">
        <button
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Test Reports
        </button>
        <button
          className={`tab-button ${activeTab === 'jira' ? 'active' : ''}`}
          onClick={() => setActiveTab('jira')}
        >
          Jira Defects
        </button>
      </div>

      {activeTab === 'reports' && (
        <>
          <div className="app-controls">
            <DateRangeSelector
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            <SnapshotButton onSnapshotCreated={handleSnapshotCreated} />
          </div>

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading report data...</div>
          ) : (
            <ReportDashboard data={reportData} />
          )}
        </>
      )}

      {activeTab === 'jira' && (
        <JiraDefectsDashboard />
      )}
    </div>
  );
}

export default App;
