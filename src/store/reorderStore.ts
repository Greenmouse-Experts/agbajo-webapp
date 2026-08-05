import { create } from "zustand";
import type { GroupSlot } from "#/api/groups/groups-api.tsx";

interface ReorderState {
  slots: GroupSlot[];
  setSlots: (slots: GroupSlot[]) => void;
  moveSlotUp: (index: number) => void;
  moveSlotDown: (index: number) => void;
}

export const useReorderStore = create<ReorderState>((set) => ({
  slots: [],
  setSlots: (slots) => set({ slots }),
  moveSlotUp: (index) =>
    set((state) => {
      if (index <= 0 || index >= state.slots.length) return {};
      const newSlots = [...state.slots];
      const temp = newSlots[index];
      newSlots[index] = newSlots[index - 1];
      newSlots[index - 1] = temp;
      return {
        slots: newSlots.map((slot, idx) => ({
          ...slot,
          slotOrder: idx + 1,
        })),
      };
    }),
  moveSlotDown: (index) =>
    set((state) => {
      if (index < 0 || index >= state.slots.length - 1) return {};
      const newSlots = [...state.slots];
      const temp = newSlots[index];
      newSlots[index] = newSlots[index + 1];
      newSlots[index + 1] = temp;
      return {
        slots: newSlots.map((slot, idx) => ({
          ...slot,
          slotOrder: idx + 1,
        })),
      };
    }),
}));
