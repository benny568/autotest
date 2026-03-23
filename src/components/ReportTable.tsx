import { format, parseISO } from 'date-fns';
import { WeeklyReportData } from '../App';
import './ReportTable.css';

interface ReportTableProps {
  data: WeeklyReportData[];
}

function formatCovPct(value: number | null) {
  return value == null || Number.isNaN(value) ? '—' : `${value.toFixed(1)}%`;
}

export default function ReportTable({ data }: ReportTableProps) {
  return (
    <div className="report-table-container">
      <table className="report-table">
        <thead>
          <tr>
            <th>Week Starting</th>
            <th>Unit Test Files</th>
            <th>Unit Test Cases</th>
            <th>E2E Test Files</th>
            <th>E2E Test Cases</th>
            <th>Total Test Files</th>
            <th>Total Test Cases</th>
            <th>Line Coverage %</th>
            <th>Function Coverage %</th>
            <th>Branch Coverage %</th>
            <th>Average Coverage %</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const prevRow = index > 0 ? data[index - 1] : null;
            const getChange = (current: number, prev: number | null) => {
              if (prev === null) return null;
              const change = current - prev;
              return change !== 0 ? (change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)) : '0';
            };

            const getCoverageChange = (
              current: number | null,
              prev: number | null
            ) => {
              if (prev == null || current == null) return null;
              const change = current - prev;
              return change !== 0 ? (change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)) : '0';
            };

            return (
              <tr key={row.weekStart}>
                <td>{format(parseISO(row.weekStart), 'MMM dd, yyyy')}</td>
                <td>
                  {row.unitTestFiles}
                  {prevRow && (
                    <span className={`change ${(row.unitTestFiles - prevRow.unitTestFiles) >= 0 ? 'positive' : 'negative'}`}>
                      {getChange(row.unitTestFiles, prevRow.unitTestFiles)}
                    </span>
                  )}
                </td>
                <td>
                  {row.unitTestCases}
                  {prevRow && (
                    <span className={`change ${(row.unitTestCases - prevRow.unitTestCases) >= 0 ? 'positive' : 'negative'}`}>
                      {getChange(row.unitTestCases, prevRow.unitTestCases)}
                    </span>
                  )}
                </td>
                <td>
                  {row.e2eTestFiles}
                  {prevRow && (
                    <span className={`change ${(row.e2eTestFiles - prevRow.e2eTestFiles) >= 0 ? 'positive' : 'negative'}`}>
                      {getChange(row.e2eTestFiles, prevRow.e2eTestFiles)}
                    </span>
                  )}
                </td>
                <td>
                  {row.e2eTestCases}
                  {prevRow && (
                    <span className={`change ${(row.e2eTestCases - prevRow.e2eTestCases) >= 0 ? 'positive' : 'negative'}`}>
                      {getChange(row.e2eTestCases, prevRow.e2eTestCases)}
                    </span>
                  )}
                </td>
                <td>{row.totalTestFiles}</td>
                <td>{row.totalTestCases}</td>
                <td>
                  {formatCovPct(row.lineCoverage)}
                  {prevRow && (
                    <span
                      className={`change ${
                        (row.lineCoverage ?? 0) >= (prevRow.lineCoverage ?? 0)
                          ? 'positive'
                          : 'negative'
                      }`}
                    >
                      {getCoverageChange(row.lineCoverage, prevRow.lineCoverage)}
                    </span>
                  )}
                </td>
                <td>
                  {formatCovPct(row.functionCoverage)}
                  {prevRow && (
                    <span
                      className={`change ${
                        (row.functionCoverage ?? 0) >= (prevRow.functionCoverage ?? 0)
                          ? 'positive'
                          : 'negative'
                      }`}
                    >
                      {getCoverageChange(row.functionCoverage, prevRow.functionCoverage)}
                    </span>
                  )}
                </td>
                <td>
                  {formatCovPct(row.branchCoverage)}
                  {prevRow && (
                    <span
                      className={`change ${
                        (row.branchCoverage ?? 0) >= (prevRow.branchCoverage ?? 0)
                          ? 'positive'
                          : 'negative'
                      }`}
                    >
                      {getCoverageChange(row.branchCoverage, prevRow.branchCoverage)}
                    </span>
                  )}
                </td>
                <td className="average-coverage">{formatCovPct(row.averageCoverage)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
