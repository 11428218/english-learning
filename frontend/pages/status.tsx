import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner } from '../components/common';
import api from '../lib/api';

type HealthData = {
  status: 'ok' | 'degraded';
  uptime_seconds: number;
  memory_mb: {
    rss: number;
    heap_used: number;
    heap_total: number;
  };
  database?: {
    connected: boolean;
    words_total?: number;
    reviews_due_today?: number;
    error?: string;
  };
  timestamp: string;
};

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getSystemHealth();
      setHealth(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !health) {
    return <Spinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
          <p className="text-gray-600">Live health checks for backend and database</p>
        </div>
        <Button onClick={load}>Refresh</Button>
      </div>

      {error && (
        <Card className="border border-red-200">
          <div className="text-red-700">{error}</div>
        </Card>
      )}

      {health && (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Overall</div>
                <div className="text-2xl font-bold text-gray-900">{health.status.toUpperCase()}</div>
              </div>
              <div className={health.status === 'ok' ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                {health.status === 'ok' ? 'Healthy' : 'Degraded'}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">Last update: {new Date(health.timestamp).toLocaleString()}</div>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <div className="text-sm text-gray-500">Uptime</div>
              <div className="text-2xl font-bold text-primary">{Math.floor(health.uptime_seconds)}s</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">RSS Memory</div>
              <div className="text-2xl font-bold text-primary">{health.memory_mb.rss} MB</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Heap Used / Total</div>
              <div className="text-2xl font-bold text-primary">
                {health.memory_mb.heap_used} / {health.memory_mb.heap_total} MB
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="text-xl font-bold mb-3">Database</h2>
            {health.database?.connected ? (
              <div className="space-y-2 text-gray-700">
                <div>Connection: <span className="text-green-600 font-semibold">Connected</span></div>
                <div>Words Total: <span className="font-semibold">{health.database.words_total || 0}</span></div>
                <div>Due Reviews Today: <span className="font-semibold">{health.database.reviews_due_today || 0}</span></div>
              </div>
            ) : (
              <div className="text-red-700">
                Connection: Disconnected ({health.database?.error || 'unknown'})
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
