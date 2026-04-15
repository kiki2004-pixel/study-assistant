import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, X, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadMaterial, createSubject } from '../api';
import useStore from '../store/appStore';

const MATERIAL_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'textbook', label: 'Textbook' },
  { value: 'module', label: 'Module' },
  { value: 'school_timetable', label: 'School Timetable' },
];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Upload() {
  const { subjects, fetchSubjects, addMaterial, addSubject } = useStore();
  const [queue, setQueue] = useState([]);
  const [materialType, setMaterialType] = useState('note');
  const [subject, setSubject] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchSubjects(); }, []);

  const onDrop = useCallback((accepted) => {
    const files = accepted.map((f) => ({ file: f, status: 'pending', id: Math.random().toString(36) }));
    setQueue((q) => [...q, ...files]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: 20 * 1024 * 1024,
  });

  const removeFromQueue = (id) => setQueue((q) => q.filter((f) => f.id !== id));

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const { data } = await createSubject({ name: newSubjectName.trim() });
      addSubject(data);
      setSubject(data.name);
      setNewSubjectName('');
      setAddingSubject(false);
      toast.success(`Subject "${data.name}" created`);
    } catch {
      toast.error('Could not create subject');
    }
  };

  const handleUpload = async () => {
    if (queue.length === 0) return;
    setUploading(true);

    for (const item of queue) {
      setQueue((q) => q.map((f) => f.id === item.id ? { ...f, status: 'uploading' } : f));
      try {
        const fd = new FormData();
        fd.append('file', item.file);
        fd.append('material_type', materialType);
        fd.append('subject', subject);
        const { data } = await uploadMaterial(fd);
        addMaterial(data);
        setQueue((q) => q.map((f) => f.id === item.id ? { ...f, status: 'done' } : f));
      } catch (err) {
        setQueue((q) => q.map((f) => f.id === item.id ? { ...f, status: 'error', error: err.response?.data?.error || 'Upload failed' } : f));
      }
    }
    setUploading(false);
    toast.success('Upload complete!');
  };

  const clearDone = () => setQueue((q) => q.filter((f) => f.status !== 'done'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Materials</h1>
        <p className="text-gray-500 text-sm mt-1">Upload your notes, textbooks, modules, or school timetable.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Dropzone */}
        <div className="lg:col-span-2 space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <UploadIcon size={36} className={`mx-auto mb-3 ${isDragActive ? 'text-indigo-500' : 'text-gray-300'}`} />
            <p className="font-medium text-gray-700">
              {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-400 mt-1">or click to browse</p>
            <p className="text-xs text-gray-400 mt-2">PDF, TXT, PNG, JPG — max 20MB each</p>
          </div>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="card p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{queue.length} file{queue.length > 1 ? 's' : ''} queued</span>
                <button onClick={clearDone} className="text-xs text-gray-400 hover:text-gray-600">Clear done</button>
              </div>
              {queue.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  <FileText size={16} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.file.name}</p>
                    <p className="text-xs text-gray-400">{formatSize(item.file.size)}</p>
                  </div>
                  {item.status === 'pending' && (
                    <button onClick={() => removeFromQueue(item.id)} className="text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  )}
                  {item.status === 'uploading' && (
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {item.status === 'done' && <CheckCircle size={16} className="text-green-500" />}
                  {item.status === 'error' && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={14} /> {item.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Settings */}
        <div className="space-y-5">
          <div className="card p-4 space-y-4">
            <h2 className="font-semibold text-gray-900">Upload Settings</h2>

            <div>
              <label className="label">Material Type</label>
              <select className="input" value={materialType} onChange={(e) => setMaterialType(e.target.value)}>
                {MATERIAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Subject (optional)</label>
              <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">— None —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
              {!addingSubject ? (
                <button
                  onClick={() => setAddingSubject(true)}
                  className="mt-1.5 flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                >
                  <Plus size={12} /> Add new subject
                </button>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Subject name"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                  />
                  <button onClick={handleAddSubject} className="btn-primary px-3 py-1.5">Add</button>
                  <button onClick={() => setAddingSubject(false)} className="btn-secondary px-3 py-1.5">Cancel</button>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={queue.length === 0 || uploading}
              className="btn-primary w-full justify-center"
            >
              {uploading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
              ) : (
                <><UploadIcon size={16} /> Upload {queue.length > 0 ? `${queue.length} file${queue.length > 1 ? 's' : ''}` : 'Files'}</>
              )}
            </button>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Supported Files</h3>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>📄 <strong>PDF</strong> — Notes, textbooks, handouts</li>
              <li>📝 <strong>TXT</strong> — Plain text notes</li>
              <li>🖼️ <strong>PNG/JPG</strong> — Handwritten notes, diagrams</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
