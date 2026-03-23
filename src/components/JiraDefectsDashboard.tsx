import { useState, useEffect } from 'react';
import './JiraDefectsDashboard.css';

export interface DefectByPriority {
  priority: string;
  total: number;
  byStatus: Record<string, number>;
}

export interface JiraDefectsData {
  totalDefects: number;
  defectsByPriority: DefectByPriority[];
  statuses: string[];
  cacheKey?: string;
}

interface JiraDefectsDashboardProps {
  team?: string;
}

export default function JiraDefectsDashboard({ team }: JiraDefectsDashboardProps) {
  const [data, setData] = useState<JiraDefectsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{ priority: string; status: string | null } | null>(null);
  const [issueKeys, setIssueKeys] = useState<string[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);

  useEffect(() => {
    fetchDefects();
  }, [team]);

  const fetchDefects = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = team 
        ? `/api/jira/defects?team=${encodeURIComponent(team)}`
        : '/api/jira/defects';
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Jira defects');
      }
      const defectsData = await response.json();
      setData(defectsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="jira-defects-dashboard">
        <div className="loading">Loading defects data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jira-defects-dashboard">
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button onClick={fetchDefects} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="jira-defects-dashboard">
        <div className="empty-state">No defects data available</div>
      </div>
    );
  }

  const statusOrder = ['Not Started', 'In Progress', 'Dev Complete', 'Test Complete', 'DONE'];

  const handleCategoryClick = async (priority: string, status: string | null = null) => {
    if (!data?.cacheKey) {
      alert('Cache key not available. Please refresh the data first.');
      return;
    }

    setSelectedCategory({ priority, status });
    setLoadingKeys(true);
    setIssueKeys([]);

    try {
      const params = new URLSearchParams({
        priority,
        cacheKey: data.cacheKey,
      });
      if (status) {
        params.append('status', status);
      }
      
      const response = await fetch(`/api/jira/defects/keys?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch issue keys');
      }
      const keysData = await response.json();
      setIssueKeys(keysData.issueKeys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issue keys');
    } finally {
      setLoadingKeys(false);
    }
  };

  const closeModal = () => {
    setSelectedCategory(null);
    setIssueKeys([]);
  };

  return (
    <div className="jira-defects-dashboard">
      <div className="jira-header">
        <h2>Open Defects Dashboard</h2>
        <div className="total-defects-badge">
          Total Open Defects: <strong>{data.totalDefects}</strong>
        </div>
      </div>

      {data.defectsByPriority.length === 0 ? (
        <div className="empty-state">
          <p>No open defects found.</p>
        </div>
      ) : (
        <div className="defects-table-container">
          <table className="defects-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Total</th>
                {statusOrder.map((status) => (
                  <th key={status}>{status}</th>
                ))}
                <th>Other</th>
              </tr>
            </thead>
            <tbody>
              {data.defectsByPriority.map((defect) => (
                <tr key={defect.priority}>
                  <td className="priority-cell">
                    <span className={`priority-badge priority-${defect.priority.toLowerCase().replace(/\s+/g, '-')}`}>
                      {defect.priority}
                    </span>
                  </td>
                  <td className="total-cell">
                    <strong 
                      className="clickable-count" 
                      onClick={() => handleCategoryClick(defect.priority, null)}
                      title="Click to view ticket IDs"
                    >
                      {defect.total}
                    </strong>
                  </td>
                  {statusOrder.map((status) => (
                    <td key={status} className="status-cell">
                      <span 
                        className="clickable-count" 
                        onClick={() => handleCategoryClick(defect.priority, status)}
                        title="Click to view ticket IDs"
                      >
                        {defect.byStatus[status] || 0}
                      </span>
                    </td>
                  ))}
                  <td className="status-cell other-status">
                    <span 
                      className="clickable-count" 
                      onClick={() => handleCategoryClick(defect.priority, 'Other')}
                      title="Click to view ticket IDs"
                    >
                      {defect.byStatus['Other'] || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="refresh-controls">
        <button onClick={fetchDefects} className="refresh-button">
          Refresh Data
        </button>
        <span className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Modal for displaying issue keys */}
      {selectedCategory && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Ticket IDs: {selectedCategory.priority}
                {selectedCategory.status && ` - ${selectedCategory.status}`}
              </h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              {loadingKeys ? (
                <div className="loading">Loading ticket IDs...</div>
              ) : issueKeys.length > 0 ? (
                <div className="issue-keys-list">
                  <p className="issue-count">Total: {issueKeys.length} tickets</p>
                  <div className="issue-keys-grid">
                    {issueKeys.map((key) => (
                      <a
                        key={key}
                        href={`https://cvs-hcd.atlassian.net/browse/${key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="issue-key-link"
                      >
                        {key}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">No tickets found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
