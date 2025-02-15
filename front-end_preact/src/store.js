import { create } from 'zustand';

const useAppStore = create((set) => ({
  // State properties
  exercises: [],
  currentExercise: null,
  programFiles: [],
  currentProgram: null,
  currentCode: "",

  // Future: User Info (for when you add authentication)
  user: null, // { id, name, preferences, etc. }

  // Actions (functions to update state)
  setExercises: (exercises) => set({ exercises }),
  setCurrentExercise: (exercise) => set({ currentExercise: exercise }),
  setProgramFiles: (programFiles) => set({ programFiles }),
  setCurrentProgram: (program) => set({ currentProgram: program }),
  setCurrentCode: (code) => set({ currentCode: code }),
  setUser: (user) => set({ user }), // Future-proof for user data
}));

export default useAppStore;
