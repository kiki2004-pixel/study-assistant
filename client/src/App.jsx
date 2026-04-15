import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Materials from './pages/Materials';
import Simplify from './pages/Simplify';
import Timetable from './pages/Timetable';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<Upload />} />
        <Route path="materials" element={<Materials />} />
        <Route path="simplify" element={<Simplify />} />
        <Route path="timetable" element={<Timetable />} />
      </Route>
    </Routes>
  );
}
