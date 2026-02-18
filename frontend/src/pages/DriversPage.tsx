import { useEffect, useState } from 'react';
import { getDrivers } from '../services/api';
import type { Driver } from '../types';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDrivers()
      .then(setDrivers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load drivers'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Drivers List</h1>
      {loading && <p>Loading drivers…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.phone ?? '-'}</td>
                  <td>{d.vehicle ?? '-'}</td>
                  <td>{d.status ?? '-'}</td>
                  <td>{d.currentLocation ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
