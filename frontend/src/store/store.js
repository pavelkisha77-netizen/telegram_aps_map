import { create } from 'zustand';

export const useMapStore = create((set) => ({
  points: [],
  draftPoint: null,
  selectedPoint: null,
  selectedCity: null,
  currentLocation: null,

  setPoints: (points) => set({ points }),

  addPoint: (point) =>
    set((state) => ({
      points: [
        {
          _id: point._id || Date.now().toString(),
          markerColor: point.markerColor || 'red',
          ...point
        },
        ...state.points
      ]
    })),

  updatePointInStore: (updatedPoint) =>
    set((state) => ({
      points: state.points.map((point) => (point._id === updatedPoint._id ? updatedPoint : point)),
      selectedPoint:
        state.selectedPoint?._id === updatedPoint._id ? updatedPoint : state.selectedPoint
    })),

  deletePointFromStore: (pointId) =>
    set((state) => ({
      points: state.points.filter((point) => point._id !== pointId),
      selectedPoint: state.selectedPoint?._id === pointId ? null : state.selectedPoint
    })),

  setDraftPoint: (draftPoint) => set({ draftPoint }),
  clearDraftPoint: () => set({ draftPoint: null }),

  setSelectedPoint: (selectedPoint) => set({ selectedPoint }),
  clearSelectedPoint: () => set({ selectedPoint: null }),
  setSelectedCity: (selectedCity) => set({ selectedCity }),
  setCurrentLocation: (currentLocation) => set({ currentLocation })
}));
