import { WeeklyReportData } from '../App';
import './SummaryCards.css';

interface SummaryCardsProps {
  latest: WeeklyReportData;
  growth: {
    unitTestFiles: number;
    unitTestCases: number;
    e2eTestFiles: number;
    e2eTestCases: number;
    lineCoverage: number | null;
    averageCoverage: number | null;
  };
}

export default function SummaryCards({ latest, growth }: SummaryCardsProps) {
  const formatGrowth = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}`;
  };

  const formatPct = (value: number | null) =>
    value == null || Number.isNaN(value) ? '—' : `${value.toFixed(1)}%`;

  const formatGrowthPct = (value: number | null) => {
    if (value == null || Number.isNaN(value)) return '—';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="summary-cards">
      <div className="summary-card">
        <h3>Unit Tests</h3>
        <div className="card-content">
          <div className="metric">
            <span className="metric-label">Test Files:</span>
            <span className="metric-value">{latest.unitTestFiles}</span>
            <span className={`metric-growth ${growth.unitTestFiles >= 0 ? 'positive' : 'negative'}`}>
              ({formatGrowth(growth.unitTestFiles)})
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Test Cases:</span>
            <span className="metric-value">{latest.unitTestCases}</span>
            <span className={`metric-growth ${growth.unitTestCases >= 0 ? 'positive' : 'negative'}`}>
              ({formatGrowth(growth.unitTestCases)})
            </span>
          </div>
        </div>
      </div>

      <div className="summary-card">
        <h3>E2E Tests</h3>
        <div className="card-content">
          <div className="metric">
            <span className="metric-label">Test Files:</span>
            <span className="metric-value">{latest.e2eTestFiles}</span>
            <span className={`metric-growth ${growth.e2eTestFiles >= 0 ? 'positive' : 'negative'}`}>
              ({formatGrowth(growth.e2eTestFiles)})
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Test Cases:</span>
            <span className="metric-value">{latest.e2eTestCases}</span>
            <span className={`metric-growth ${growth.e2eTestCases >= 0 ? 'positive' : 'negative'}`}>
              ({formatGrowth(growth.e2eTestCases)})
            </span>
          </div>
        </div>
      </div>

      <div className="summary-card">
        <h3>Total Tests</h3>
        <div className="card-content">
          <div className="metric">
            <span className="metric-label">Test Files:</span>
            <span className="metric-value">{latest.totalTestFiles}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Test Cases:</span>
            <span className="metric-value">{latest.totalTestCases}</span>
          </div>
        </div>
      </div>

      <div className="summary-card coverage">
        <h3>Coverage</h3>
        <div className="card-content">
          <div className="metric">
            <span className="metric-label">Line Coverage:</span>
            <span className="metric-value">{formatPct(latest.lineCoverage)}</span>
            {growth.lineCoverage != null && (
              <span
                className={`metric-growth ${growth.lineCoverage >= 0 ? 'positive' : 'negative'}`}
              >
                ({formatGrowthPct(growth.lineCoverage)})
              </span>
            )}
          </div>
          <div className="metric">
            <span className="metric-label">Average Coverage:</span>
            <span className="metric-value">{formatPct(latest.averageCoverage)}</span>
            {growth.averageCoverage != null && (
              <span
                className={`metric-growth ${growth.averageCoverage >= 0 ? 'positive' : 'negative'}`}
              >
                ({formatGrowthPct(growth.averageCoverage)})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
