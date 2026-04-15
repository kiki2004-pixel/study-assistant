import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FolderOpen, Brain, Calendar, FileText, BookOpen, StickyNote, Clock } from 'lucide-react';
import useStore from '../store/appStore';
import dayjs from 'dayjs';

const MATERIAL_TYPE_LABELS = {
  note: 'Note',
  textbook: 'Textbook',
  module: 'Module',
  school_timetable: 'School Timetable',
};

const TYPE_COLORS = {
  note: 'bg-blue-100 text-blue-700',
  textbook: 'bg-purple-100 text-purple-700',
  module: 'bg-green-100 text-green-700',
  school_timetable: 'bg-amber-100 text-amber-700',
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { materials, subjects, timetables, fetchMaterials, fetchSubjects, fetchTimetables } = useStore();

  useEffect(() => {
    fetchMaterials();
    fetchSubjects();
    fetchTimetables();
  }, []);

  const recent = materials.slice(0, 5);
  const latest = timetables[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's your study overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderOpen} label="Materials" value={materials.length} color="bg-indigo-100 text-indigo-600" />
        <StatCard icon={BookOpen} label="Subjects" value={subjects.length} color="bg-pink-100 text-pink-600" />
        <StatCard icon={Calendar} label="Timetables" value={timetables.length} color="bg-amber-100 text-amber-600" />
        <StatCard icon={StickyNote} label="Notes" value={materials.filter(m => m.material_type === 'note').length} color="bg-green-100 text-green-600" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/upload', icon: Upload, label: 'Upload Files', color: 'bg-indigo-600 text-white hover:bg-indigo-700' },
            { to: '/materials', icon: FolderOpen, label: 'View Materials', color: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' },
            { to: '/simplify', icon: Brain, label: 'Simplify Notes', color: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' },
            { to: '/timetable', icon: Calendar, label: 'Create Timetable', color: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${color}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Materials */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Materials</h2>
            <Link to="/materials" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FolderOpen size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No materials yet. Upload your first file!</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <FileText size={18} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.original_name}</p>
                    <p className="text-xs text-gray-400">{dayjs(m.created_at).format('MMM D, YYYY')}</p>
                  </div>
                  <span className={`badge ${TYPE_COLORS[m.material_type] || 'bg-gray-100 text-gray-600'}`}>
                    {MATERIAL_TYPE_LABELS[m.material_type] || m.material_type}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Latest Timetable */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Latest Study Plan</h2>
            <Link to="/timetable" className="text-sm text-indigo-600 hover:underline">Manage</Link>
          </div>
          {!latest ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No timetable yet.</p>
              <Link to="/timetable" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">Generate one now →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{latest.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock size={13} />
                  {dayjs(latest.start_date).format('MMM D')} – {dayjs(latest.end_date).format('MMM D, YYYY')}
                </p>
              </div>
              <Link to="/timetable" className="btn-primary text-sm w-full justify-center">
                View Full Timetable
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
