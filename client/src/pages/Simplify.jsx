import { useEffect, useState } from 'react';
import { Brain, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { simplifNote, getSummaries, deleteSummary } from '../api';
import useStore from '../store/appStore';

const STYLES = [
  { value: 'simple', label: 'Simple English', desc: 'Plain language for easy understanding' },
  { value: 'detailed', label: 'Detailed Notes', desc: 'Comprehensive notes with headings' },
  { value: 'bullet_points', label: 'Bullet Points', desc: 'Concise bullet-point summary' },
  { value: 'flashcards', label: 'Flashcard Q&A', desc: 'Question & answer pairs for revision' },
];

export default function Simplify() {
  const { materials, fetchMaterials } = useStore();
  const [selectedId, setSelectedId] = useState('');
  const [style, setStyle] = useState('simple');
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loadingSummaries, setLoadingSummaries] = useState(false);

  useEffect(() => { fetchMaterials(); }, []);

  useEffect(() => {
    if (!selectedId) { setSummaries([]); return; }
    setLoadingSummaries(true);
    getSummaries(selectedId)
      .then(({ data }) => {
        setSummaries(data);
        if (data.length > 0) setExpanded(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingSummaries(false));
  }, [selectedId]);

  const eligibleMaterials = materials.filter(
    (m) => m.material_type !== 'school_timetable'
  );

  async function handleSimplify() {
    if (!selectedId) return toast.error('Select a material first');
    setLoading(true);
    try {
      const { data } = await simplifNote(selectedId, style);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Simplify Notes</h1>
        <p className="text-gray-500 text-sm mt-1">Use AI to simplify, summarise, or turn your notes into flashcards.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <div>
              <label className="label">Select Material</label>
              <select className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                <option value="">— Choose a file —</option>
                {eligibleMaterials.map((m) => (
                  <option key={m.id} value={m.id}>{m.original_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Summary Style</label>
              <div className="space-y-2">
                {STYLES.map((s) => (
                  <label
                    key={s.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      style === s.value
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="style"
                      value={s.value}
                      checked={style === s.value}
                      onChange={() => setStyle(s.value)}
                      className="mt-0.5 accent-indigo-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSimplify}
              disabled={!selectedId || loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
              ) : (
                <><Brain size={16} /> Simplify Now</>
              )}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-3">
          {!selectedId && (
            <div className="card p-12 text-center text-gray-400">
              <Brain size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Select a material to get started</p>
              <p className="text-sm mt-1">Your AI-generated summaries will appear here.</p>
            </div>
          )}

          {selectedId && loadingSummaries && (
            <div className="card p-8 text-center text-gray-400">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading summaries...</p>
            </div>
          )}

          {selectedId && !loadingSummaries && summaries.length === 0 && (
            <div className="card p-12 text-center text-gray-400">
              <Brain size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No summaries yet for this file. Generate one!</p>
            </div>
          )}

          {summaries.map((s) => (
            <div key={s.id} className="card overflow-hidden">
              <div
                className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge bg-indigo-100 text-indigo-700">
                    {STYLES.find((x) => x.value === s.style)?.label || s.style}
                  </span>
                  <span className="text-xs text-gray-400">
                    {dayjs(s.created_at).format('MMM D, YYYY · HH:mm')}
                  </span>
                  {s.tokens_used && (
                    <span className="text-xs text-gray-400">{s.tokens_used.toLocaleString()} tokens used</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(s.summary_text);
                      toast.success('Copied!');
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                  {expanded === s.id ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                </div>
              </div>
              {expanded === s.id && (
                <div className="p-5 prose-study text-sm overflow-x-auto">
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
