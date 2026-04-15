import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Materials
export const getMaterials = (params) => api.get('/materials', { params });
export const getMaterial = (id) => api.get(`/materials/${id}`);
export const uploadMaterial = (formData) =>
  api.post('/materials/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateMaterial = (id, data) => api.patch(`/materials/${id}`, data);
export const deleteMaterial = (id) => api.delete(`/materials/${id}`);

// Subjects
export const getSubjects = () => api.get('/subjects');
export const createSubject = (data) => api.post('/subjects', data);
export const updateSubject = (id, data) => api.patch(`/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);

// AI
export const simplifNote = (material_id, style) => api.post('/ai/simplify', { material_id, style });
export const getSummaries = (material_id) => api.get(`/ai/summaries/${material_id}`);
export const deleteSummary = (id) => api.delete(`/ai/summaries/${id}`);

// Timetable
export const generateTimetable = (data) => api.post('/timetable/generate', data);
export const getTimetables = () => api.get('/timetable');
export const getTimetable = (id) => api.get(`/timetable/${id}`);
export const deleteTimetable = (id) => api.delete(`/timetable/${id}`);

export default api;
