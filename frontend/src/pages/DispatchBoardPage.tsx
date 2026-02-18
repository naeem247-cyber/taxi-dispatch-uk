import { useEffect, useMemo, useState } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';
import { getJobs } from '../services/api';
import type { DispatchEvent, Job } from '../types';

export default function DispatchBoardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<DispatchEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getJobs()
      .then((data) => {
        if (active) setJobs(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load jobs'));

    const socket = connectSocket();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('dispatch:update', (payload: unknown) => {
      setEvents((prev) => [
        { type: 'dispatch:update', payload, timestamp: new Date().toISOString() },
        ...prev,
      ].slice(0, 20));
    });

    socket.on('job:created', (payload: Job) => {
      setJobs((prev) => [payload, ...prev]);
      setEvents((prev) => [
        { type: 'job:created', payload, timestamp: new Date().toISOString() },
        ...prev,
      ].slice(0, 20));
    });

    socket.on('job:updated', (payload: Job) => {
      setJobs((prev) => prev.map((j) => (j.id === payload.id ? payload : j)));
      setEvents((prev) => [
        { type: 'job:updated', payload, timestamp: new Date().toISOString() },
        ...prev,
      ].slice(0, 20));
    });

    return () => {
      active = false;
      socket.off('connect');
      socket.off('disconnect');
      socket.off('dispatch:update');
      socket.off('job:created');
      socket.off('job:updated');
      disconnectSocket();
    };
  }, []);

  const stats = useMemo(() => {
    const pending = jobs.filter((j) => j.status === 'pending').length;
    const active = jobs.filter((j) => j.status === 'assigned' || j.status === 'in_progress').length;
    const completed = jobs.filter((j) => j.status === 'completed').length;
    return { pending, active, completed, total: jobs.length };
  }, [jobs]);

  return (
    <div>
      <h1>Live Dispatch Board</h1>
      <p className={connected ? 'status ok' : 'status'}>
        Socket: {connected ? 'Connected' : 'Disconnected'}
      </p>
      {error && <p className="error">{error}</p>}

      <div className="stats-grid">
        <div className="card"><h3>Total Jobs</h3><p>{stats.total}</p></div>
        <div className="card"><h3>Pending</h3><p>{stats.pending}</p></div>
        <div className="card"><h3>Active</h3><p>{stats.active}</p></div>
        <div className="card"><h3>Completed</h3><p>{stats.completed}</p></div>
      </div>

      <section className="card">
        <h3>Live Events</h3>
        {events.length === 0 ? (
          <p className="muted">No live events yet.</p>
        ) : (
          <ul className="event-list">
            {events.map((event, idx) => (
              <li key={`${event.type}-${idx}`}>
                <strong>{event.type}</strong>
                <small>{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}</small>
                <pre>{JSON.stringify(event.payload, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
