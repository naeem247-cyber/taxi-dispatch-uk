import { useEffect, useState } from 'react';
import { getJobs } from '../services/api';
import type { Job } from '../types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJobs()
      .then(setJobs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load jobs'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Jobs Table</h1>
      {loading && <p>Loading jobs…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Pickup</th>
                <th>Dropoff</th>
                <th>Passenger</th>
                <th>Status</th>
                <th>Fare</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>{j.id}</td>
                  <td>{j.pickup}</td>
                  <td>{j.dropoff}</td>
                  <td>{j.passengerName ?? '-'}</td>
                  <td>{j.status ?? '-'}</td>
                  <td>{typeof j.fare === 'number' ? `PKR ${j.fare}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
