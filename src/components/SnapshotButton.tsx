import { useState } from 'react';
import './SnapshotButton.css';

interface SnapshotButtonProps {
  onSnapshotCreated: () => void;
}

export default function SnapshotButton({ onSnapshotCreated }: SnapshotButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCreateSnapshot = async () => {
    setLoading(true);
    setMessage(null);
    try {
      setMessage('Checking out main branch and pulling latest code...');
      const response = await fetch('/api/snapshot', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to create snapshot');
      }
      const data = await response.json();
      const gitStatus = data.gitPullResult === 'success' 
        ? ' (code updated)' 
        : data.gitPullResult === 'failed' 
        ? ' (git pull failed, using existing code)' 
        : '';
      setMessage(`Snapshot created for ${new Date(data.timestamp).toLocaleString()}${gitStatus}`);
      setTimeout(() => setMessage(null), 5000);
      onSnapshotCreated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error creating snapshot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="snapshot-button-container">
      <button
        onClick={handleCreateSnapshot}
        disabled={loading}
        className="snapshot-button"
      >
        {loading ? 'Creating...' : 'Create Snapshot'}
      </button>
      {message && (
        <div className={`snapshot-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
