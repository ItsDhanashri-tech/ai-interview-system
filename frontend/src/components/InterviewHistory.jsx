import React, { useState, useEffect } from 'react';
import { History, Calendar, Award, ArrowRight, PlayCircle, Bot, Trash2 } from 'lucide-react';

export default function InterviewHistory({ token, onViewReport, onNewInterview }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/interviews/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch interview history.');
      }
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this interview history? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeletingId(sessionId);
    try {
      const res = await fetch(`/api/interviews/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete interview session.');
      }
      await fetchHistory();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };


  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-semibold text-sm">Loading your interview history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            <span>Interview Practice History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review past mock interview sessions, score trends, and feedback reports
          </p>
        </div>

        <button
          onClick={onNewInterview}
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Start New Interview</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-900 text-slate-500 rounded-full flex items-center justify-center mx-auto">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Interview Sessions Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Select a job role and take your first AI mock interview to generate performance feedback reports!
          </p>
          <button
            onClick={onNewInterview}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2"
          >
            <span>Take First Interview</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((sess) => {
            const isCompleted = sess.status === 'completed';
            const score = sess.overall_score;

            return (
              <div
                key={sess.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {sess.job_role?.title || 'Job Role'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-medium border border-slate-700">
                        {sess.interview_type}
                      </span>
                      <span>•</span>
                      <span>Difficulty: {sess.difficulty}</span>
                    </div>
                  </div>

                  {isCompleted && score !== null ? (
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Overall Score</span>
                      <span className="text-xl font-black text-emerald-400">{score}/100</span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      In Progress
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{sess.created_at ? new Date(sess.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isCompleted && (
                      <button
                        onClick={() => onViewReport(sess.id)}
                        className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>View Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(sess.id)}
                      disabled={deletingId === sess.id}
                      className="text-slate-400 hover:text-red-400 font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Delete Interview History"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{deletingId === sess.id ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
