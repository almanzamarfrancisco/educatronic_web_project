import { create } from "zustand";

const useAppStore = create((set) => ({
  // State properties
  exercises: [],
  currentExercise: null,
  programFiles: [],
  currentProgram: null,
  currentCode: "",
  user: null, // Future: User Info (authentication)
  // Actions (functions to update state)
  setExercises: (exercises) =>
    set((state) => ({ exercises: [...exercises] })),
  setCurrentExercise: (exercise) =>
    set((state) => ({ currentExercise: { ...exercise } })),
  setProgramFiles: (programFiles) =>
    set((state) => ({ programFiles: [...programFiles] })),
  setCurrentProgram: (program) =>
    set((state) => ({ currentProgram: { ...program } })),
  setCurrentCode: (code) =>
    set((state) => ({ currentCode: code })),
  setUser: (user) =>
    set((state) => ({ user: user ? { ...user } : null })),
}));

export const useExercises = () => useAppStore((state) => state.exercises);
export const useCurrentExercise = () =>
  useAppStore((state) => state.currentExercise);
export const useProgramFiles = () =>
  useAppStore((state) => state.programFiles);
export const useCurrentProgram = () =>
  useAppStore((state) => state.currentProgram);
export const useCurrentCode = () => useAppStore((state) => state.currentCode);
export const useUser = () => useAppStore((state) => state.user);

export const useAppActions = () =>
  useAppStore((state) => ({
    setExercises: state.setExercises,
    setCurrentExercise: state.setCurrentExercise,
    setProgramFiles: state.setProgramFiles,
    setCurrentProgram: state.setCurrentProgram,
    setCurrentCode: state.setCurrentCode,
    setUser: state.setUser,
  }));

export default useAppStore;
