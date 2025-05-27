import { create } from "zustand";

const useAppStore = create((set) => ({
  // State properties
  exercises: [],
  currentExercise: null,
  programFiles: [],
  currentProgram: null, // Selected program (object) from the tabs
  currentCode: "", // Current code in the editor
  isRenameModalOpen: false,
  fileToRename: null,
  isDeleteModalOpen: false,
  fileToDelete: null,
  isNewFileModalOpen: false,
  newFileRequestFrom: '',
  compileOutput: "",
  isBlocklySeleted: false,
  currentFloor: 0,
  isInfoBoxExpanded: false,
  user: null, // Future: User Info (authentication)
  // Actions (functions to update state)
  setExercises: (exercises) =>
    set((state) => ({ exercises: [...exercises] })),
  setCurrentExercise: (exercise) =>
    set((state) => ({ currentExercise: { ...exercise } })),
  setProgramFiles: (programFiles) =>
    set((state) => ({ programFiles: Array.isArray(programFiles) ? programFiles : []   })),
  setCurrentProgram: (program) =>
    set((state) => ({ currentProgram: { ...program } })),
  setCurrentCode: (code) => 
    set((state) => ({ currentCode: code })),
  openRenameModal: (file) => 
    set({ isRenameModalOpen: true, fileToRename: file }),
  closeRenameModal: () => 
    set({ isRenameModalOpen: false, fileToRename: null }),
  openDeleteModal: (file) => 
    set({ isDeleteModalOpen: true, fileToDelete: file }),
  closeDeleteModal: () =>
     set({ isDeleteModalOpen: false, fileToDelete: null }),
  openNewFileModal: (source) => 
    set({ isNewFileModalOpen: true, newFileRequestFrom: source }),
  closeNewFileModal: () =>
    set({ isNewFileModalOpen: false }),
  setCompileOutput: (output) =>
    set((state) => ({ compileOutput: output })),
  setBlocklySelected: (selected) =>
    set((state) => ({ isBlocklySeleted: selected })),
  setCurrentFloor: (floor) =>
    set((state) => ({ currentFloor: floor })),
  setInfoBoxExpanded: (expanded) =>
    set((state) => ({ isInfoBoxExpanded: expanded })),
  setUser: (user) =>
    set((state) => ({ user: user ? { ...user } : null })),
}));

export const useExercises = () => 
  useAppStore((state) => state.exercises);
export const useCurrentExercise = () =>
  useAppStore((state) => state.currentExercise);
export const useProgramFiles = () =>
  useAppStore((state) => state.programFiles);
export const useCurrentProgram = () =>
  useAppStore((state) => state.currentProgram);
export const useCurrentCode = () =>
  useAppStore((state) => state.currentCode);
export const useCompileOutput = () =>
  useAppStore((state) => state.compileOutput);
export const useIsBlocklySelected = () =>
  useAppStore((state) => state.isBlocklySeleted);
export const useCurrentFloor = () =>
  useAppStore((state) => state.currentFloor);
export const useInfoBoxExpanded = () =>
  useAppStore((state) => state.isInfoBoxExpanded);
export const useUser = () => 
  useAppStore((state) => state.user);


export const useAppActions = () =>
  useAppStore((state) => ({
    setExercises: state.setExercises,
    setCurrentExercise: state.setCurrentExercise,
    setProgramFiles: state.setProgramFiles,
    setCurrentProgram: state.setCurrentProgram,
    setCurrentCode: state.setCurrentCode,
    setUser: state.setUser,
    openRenameModal: (file) => set({ isRenameModalOpen: true, fileToRename: file }),
    closeRenameModal: () => set({ isRenameModalOpen: false, fileToRename: null }),
    setBlocklySelected: state.setBlocklySelected,
    setCompileOutput: state.setCompileOutput,
    setCurrentFllor: state.setCurrent,
    setInfoBoxExpanded: state.setInfoBoxExpanded,
  }));

export default useAppStore;
