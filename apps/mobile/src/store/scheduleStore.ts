import { create } from 'zustand';

export interface ScheduleItem {
  id: string;
  day: number; // 1-5 (Mon-Fri)
  className: string;
  startHour: number; // 7-22
  startMinute: number; // 0-59
  endHour: number; // 7-22
  endMinute: number; // 0-59
  location: string;
}

interface ScheduleState {
  schedulesByTerm: Record<string, ScheduleItem[]>;
  selectedTerm: string;

  setSelectedTerm: (term: string) => void;
  addScheduleItems: (term: string, items: ScheduleItem[]) => void;
  removeScheduleItem: (term: string, itemId: string) => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedulesByTerm: {},
  selectedTerm: 'WN2026',

  setSelectedTerm: (term: string) => {
    set({ selectedTerm: term });
  },

  addScheduleItems: (term: string, items: ScheduleItem[]) => {
    const currentTermSchedules = get().schedulesByTerm[term] || [];
    set({
      schedulesByTerm: {
        ...get().schedulesByTerm,
        [term]: [...currentTermSchedules, ...items],
      },
    });
  },

  removeScheduleItem: (term: string, itemId: string) => {
    const currentTermSchedules = get().schedulesByTerm[term] || [];
    set({
      schedulesByTerm: {
        ...get().schedulesByTerm,
        [term]: currentTermSchedules.filter((i) => i.id !== itemId),
      },
    });
  },
}));
