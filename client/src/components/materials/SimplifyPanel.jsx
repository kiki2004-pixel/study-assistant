import { useEffect, useState } from 'react';
import { X, Brain, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { simplifNote, getSummaries, deleteSummary } from '../../api';
import dayjs from 'dayjs';

const STYLES = [
  { value: 'simple', label: 'Simple English' },
  { value: 'detailed', label: 'Detailed Notes' },
  { value: 'bullet_points', label: 'Bullet Points' },
  { value: 'flashcards', label: 'Flashcard Q&A' },
];

export default function SimplifyPanel({ material, onClose }) {
  const [style, setStyle] = useState('simple');
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchSummaries();
  }, [material.id]);

  async function fetchSummaries() {
    try {
      const { data } = await getSummaries(material.id);
      setSummaries(data);
      if (data.length > 0) setExpanded(data[0].id);
    } catch {
      // silently fail
    }
  }

  async function handleSimplify() {
    setLoading(true);
    try {
      const { data } = await simplifNote(material.id, style);
      setSummaries((prev) => [data, ...prev]);
      setExpanded(data.id);
      toast.success('Note simplified!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Simplification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteSummary(id);
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Could not delete');
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-indigo-600" />
            <div>
              <h2 className="font-semibold text-gray-900">Simplify Note</h2>
              <p className="text-xs text-gray-400 truncate max-w-xs">{material.original_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Generate */}
        <div className="p-5 border-b border-gray-50 flex gap-3">
          <select
            className="input flex-1"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleSimplify}
            disabled={loading}
            className="btn-primary shrink-0"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Brain size={15} /> Generate</>
            )}
          </button>
        </div>

        {/* Summaries */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {summaries.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              <Brain size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No summaries yet. Generate one above!</p>
            </div>
          )}

          {summaries.map((s) => (
            <div key={s.id} className="border border-gray-100 rounded-xl overflow-hidden">
              {/* Summary header */}
              <div
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="badge bg-indigo-100 text-indigo-700 capitalize">
                    {STYLES.find((x) => x.value === s.style)?.label || s.style}
                  </span>
                  <span className="text-xs text-gray-400">
                    {dayjs(s.created_at).format('MMM D, HH:mm')}
                  </span>
                  {s.tokens_used && (
                    <span className="text-xs text-gray-400">{s.tokens_used.toLocaleString()} tokens</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(s.summary_text); }}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                    title="Copy"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                  {expanded === s.id ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                </div>
              </div>

              {/* Summary body */}
              {expanded === s.id && (
                <div className="p-4 prose-study text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.summary_text}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
