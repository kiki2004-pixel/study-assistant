import { useEffect, useState } from 'react';
import { Calendar, Plus, Trash2, ChevronDown, Clock, BookOpen, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { generateTimetable, getTimetable, deleteTimetable as apiDelete } from '../api';
import useStore from '../store/appStore';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SUBJECT_COLORS = [
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-teal-100 text-teal-800 border-teal-200',
];

function getSubjectColor(subject, subjects) {
  const idx = subjects.findIndex((s) => s.name === subject);
  return SUBJECT_COLORS[idx % SUBJECT_COLORS.length] || SUBJECT_COLORS[0];
}

function TimetableGrid({ schedule, subjects }) {
  if (!schedule?.timetable) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {schedule.timetable.map((day) => (
        <div key={day.date} className="card p-4">
          <div className="mb-3">
            <p className="font-semibold text-gray-900">{day.day}</p>
            <p className="text-xs text-gray-400">{dayjs(day.date).format('MMM D, YYYY')}</p>
          </div>
          {day.slots.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No sessions</p>
          ) : (
            <div className="space-y-2">
              {day.slots.map((slot, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-2.5 text-xs ${getSubjectColor(slot.subject, subjects)}`}
                >
                  <div className="flex items-center gap-1 font-semibold mb-0.5">
                    <Clock size={11} />
                    {slot.time}
                  </div>
                  <p className="font-medium">{slot.subject}</p>
                  <p className="opacity-75 mt-0.5 leading-snug">{slot.activity}</p>
                  <p className="opacity-60 mt-1">{slot.duration_minutes} min</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Timetable() {
  const { materials, subjects, timetables, fetchMaterials, fetchSubjects, fetchTimetables, addTimetable, removeTimetable } = useStore();
  const [view, setView] = useState('generate'); // 'generate' | 'view'
  const [activeTimetable, setActiveTimetable] = useState(null);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  // Form state
  const [schoolTimetableId, setSchoolTimetableId] = useState('');
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().add(6, 'day').format('YYYY-MM-DD'));
  const [studyHours, setStudyHours] = useState(4);
  const [timetableName, setTimetableName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchMaterials();
    fetchSubjects();
    fetchTimetables();
  }, []);

  const schoolTimetables = materials.filter((m) => m.material_type === 'school_timetable');

  function toggleSubject(s) {
    setSelectedSubjects((prev) => {
      const exists = prev.find((x) => x.name === s.name);
      if (exists) return prev.filter((x) => x.name !== s.name);
      return [...prev, { name: s.name, priority: s.priority || 1, exam_date: s.exam_date || '' }];
    });
  }

  function updateSubjectPriority(name, priority) {
    setSelectedSubjects((prev) =>
      prev.map((s) => (s.name === name ? { ...s, priority: parseInt(priority) } : s))
    );
  }

  function updateSubjectExam(name, exam_date) {
    setSelectedSubjects((prev) =>
      prev.map((s) => (s.name === name ? { ...s, exam_date } : s))
    );
  }

  async function handleGenerate() {
    if (selectedSubjects.length === 0) return toast.error('Select at least one subject');
    if (!startDate || !endDate) return toast.error('Set start and end dates');

    setGenerating(true);
    try {
      const { data } = await generateTimetable({
        school_timetable_id: schoolTimetableId || undefined,
        subjects: selectedSubjects,
        start_date: startDate,
        end_date: endDate,
        study_hours_per_day: studyHours,
        name: timetableName || undefined,
      });
      addTimetable({ id: data.id, name: data.name, start_date: data.start_date, end_date: data.end_date, created_at: data.created_at });
      setActiveTimetable(data);
      setView('view');
      toast.success('Timetable generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function loadTimetable(id) {
    setLoadingTimetable(true);
    try {
      const { data } = await getTimetable(id);
      setActiveTimetable(data);
      setView('view');
    } catch {
      toast.error('Could not load timetable');
    } finally {
      setLoadingTimetable(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this timetable?')) return;
    try {
      await apiDelete(id);
      removeTimetable(id);
      if (activeTimetable?.id === id) setActiveTimetable(null);
      toast.success('Deleted');
    } catch {
      toast.error('Could not delete');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Timetable</h1>
          <p className="text-gray-500 text-sm mt-1">Generate an AI-powered study schedule tailored to your subjects.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('generate')}
            className={view === 'generate' ? 'btn-primary' : 'btn-secondary'}
          >
            <Sparkles size={15} /> Generate New
          </button>
          {timetables.length > 0 && (
            <button
              onClick={() => setView('view')}
              className={view === 'view' ? 'btn-primary' : 'btn-secondary'}
            >
              <Calendar size={15} /> View Saved
            </button>
          )}
        </div>
      </div>

      {/* Generate form */}
      {view === 'generate' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-4 space-y-4">
              <h2 className="font-semibold text-gray-900">Settings</h2>

              <div>
                <label className="label">Timetable Name (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. Week 3 Study Plan"
                  value={timetableName}
                  onChange={(e) => setTimetableName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Study Hours Per Day: <span className="text-indigo-600 font-semibold">{studyHours}h</span></label>
                <input
                  type="range" min="1" max="10" value={studyHours}
                  onChange={(e) => setStudyHours(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="label">School Timetable (optional)</label>
                <select className="input" value={schoolTimetableId} onChange={(e) => setSchoolTimetableId(e.target.value)}>
                  <option value="">— None —</option>
                  {schoolTimetables.map((m) => (
                    <option key={m.id} value={m.id}>{m.original_name}</option>
                  ))}
                </select>
                {schoolTimetables.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Upload your school timetable to avoid scheduling conflicts.</p>
                )}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || selectedSubjects.length === 0}
              className="btn-primary w-full justify-center"
            >
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
              ) : (
                <><Sparkles size={16} /> Generate Timetable</>
              )}
            </button>
          </div>

          {/* Subject selection */}
          <div className="lg:col-span-2">
            <div className="card p-4">
              <h2 className="font-semibold text-gray-900 mb-1">Select Subjects</h2>
              <p className="text-xs text-gray-400 mb-4">Choose the subjects to include and set their priority.</p>

              {subjects.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No subjects yet. Add some in the Upload page.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {subjects.map((s) => {
                    const selected = selectedSubjects.find((x) => x.name === s.name);
                    return (
                      <div
                        key={s.id}
                        className={`rounded-lg border p-3 transition-colors ${
                          selected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              onChange={() => toggleSubject(s)}
                              className="accent-indigo-600 w-4 h-4"
                            />
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-sm font-medium text-gray-800">{s.name}</span>
                          </label>
                          {s.exam_date && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              Exam: {dayjs(s.exam_date).format('MMM D')}
                            </span>
                          )}
                        </div>

                        {selected && (
                          <div className="mt-3 grid grid-cols-2 gap-3 pl-6">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">
                                Priority: <span className="font-semibold text-indigo-600">{selected.priority}/5</span>
                              </label>
                              <input
                                type="range" min="1" max="5"
                                value={selected.priority}
                                onChange={(e) => updateSubjectPriority(s.name, e.target.value)}
                                className="w-full accent-indigo-600"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Exam Date (optional)</label>
                              <input
                                type="date"
                                className="input text-xs py-1"
                                value={selected.exam_date}
                                onChange={(e) => updateSubjectExam(s.name, e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View saved timetables */}
      {view === 'view' && (
        <div className="space-y-5">
          {/* Timetable selector */}
          {timetables.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Saved plans:</span>
                {timetables.map((t) => (
                  <div key={t.id} className="flex items-center gap-1">
                    <button
                      onClick={() => loadTimetable(t.id)}
                      className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        activeTimetable?.id === t.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.name}
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingTimetable && (
            <div className="card p-8 text-center">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading timetable...</p>
            </div>
          )}

          {activeTimetable && !loadingTimetable && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{activeTimetable.name}</h2>
                  <p className="text-sm text-gray-500">
                    {dayjs(activeTimetable.start_date).format('MMM D')} – {dayjs(activeTimetable.end_date).format('MMM D, YYYY')}
                  </p>
                </div>
              </div>
              <TimetableGrid
                schedule={activeTimetable.schedule_json}
                subjects={activeTimetable.subjects_json || []}
              />
            </div>
          )}

          {!activeTimetable && !loadingTimetable && timetables.length === 0 && (
            <div className="card p-12 text-center text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No timetables saved yet</p>
              <button onClick={() => setView('generate')} className="btn-primary mt-3 mx-auto">
                Generate your first timetable
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
