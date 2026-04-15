import { create } from 'zustand';
import * as api from '../api';

const useStore = create((set, get) => ({
  materials: [],
  subjects: [],
  timetables: [],
  loading: false,

  fetchMaterials: async (params) => {
    const { data } = await api.getMaterials(params);
    set({ materials: data });
  },
  addMaterial: (m) => set((s) => ({ materials: [m, ...s.materials] })),
  removeMaterial: (id) => set((s) => ({ materials: s.materials.filter((m) => m.id !== id) })),

  fetchSubjects: async () => {
    const { data } = await api.getSubjects();
    set({ subjects: data });
  },
  addSubject: (s) => set((st) => ({ subjects: [...st.subjects, s] })),
  removeSubject: (id) => set((s) => ({ subjects: s.subjects.filter((x) => x.id !== id) })),

  fetchTimetables: async () => {
    const { data } = await api.getTimetables();
    set({ timetables: data });
  },
  addTimetable: (t) => set((s) => ({ timetables: [t, ...s.timetables] })),
  removeTimetable: (id) => set((s) => ({ timetables: s.timetables.filter((t) => t.id !== id) })),
}));

export default useStore;
