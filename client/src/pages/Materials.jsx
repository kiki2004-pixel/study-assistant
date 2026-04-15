import { useEffect, useState } from 'react';
import { FileText, Trash2, Brain, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { deleteMaterial as apiDelete } from '../api';
import useStore from '../store/appStore';
import SimplifyPanel from '../components/materials/SimplifyPanel';

const TYPE_COLORS = {
  note: 'bg-blue-100 text-blue-700',
  textbook: 'bg-purple-100 text-purple-700',
  module: 'bg-green-100 text-green-700',
  school_timetable: 'bg-amber-100 text-amber-700',
};

const TYPE_LABELS = {
  note: 'Note',
  textbook: 'Textbook',
  module: 'Module',
  school_timetable: 'School Timetable',
};

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Materials() {
  const { materials, subjects, fetchMaterials, removeMaterial } = useStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [simplifyTarget, setSimplifyTarget] = useState(null);

  useEffect(() => { fetchMaterials(); }, []);

  const filtered = materials.filter((m) => {
    const matchSearch = m.original_name.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || m.material_type === typeFilter;
    const matchSubject = !subjectFilter || m.subject === subjectFilter;
    return matchSearch && matchType && matchSubject;
  });

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await apiDelete(id);
      removeMaterial(id);
      toast.success('Deleted');
    } catch {
      toast.error('Could not delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Materials</h1>
        <p className="text-gray-500 text-sm mt-1">{materials.length} file{materials.length !== 1 ? 's' : ''} uploaded</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="input w-auto" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No materials found</p>
          <p className="text-sm mt-1">Try adjusting your filters or upload new files.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {filtered.map((m) => (
            <div key={m.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={18} className="text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{m.original_name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`badge ${TYPE_COLORS[m.material_type] || 'bg-gray-100 text-gray-600'}`}>
                    {TYPE_LABELS[m.material_type] || m.material_type}
                  </span>
                  {m.subject && (
                    <span className="badge bg-gray-100 text-gray-600">{m.subject}</span>
                  )}
                  <span className="text-xs text-gray-400">{formatSize(m.file_size)}</span>
                  <span className="text-xs text-gray-400">{dayjs(m.created_at).format('MMM D, YYYY')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSimplifyTarget(m)}
                  className="btn-secondary text-xs px-3 py-1.5 gap-1.5"
                  title="Simplify with AI"
                >
                  <Brain size={14} /> Simplify
                </button>
                <button
                  onClick={() => handleDelete(m.id, m.original_name)}
                  className="btn-danger text-xs px-2.5 py-1.5"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simplify side panel */}
      {simplifyTarget && (
        <SimplifyPanel material={simplifyTarget} onClose={() => setSimplifyTarget(null)} />
      )}
    </div>
  );
}
