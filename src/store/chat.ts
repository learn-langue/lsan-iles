import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Lang } from '../domain/types';
import type { ChatMessage } from './useApp';

interface ChatState {
  threads: Record<string, ChatMessage[]>; // clé : `${lang}:${scenarioId}`
  push: (key: string, m: ChatMessage) => void;
  clear: (key: string) => void;
}

export const chatKey = (lang: Lang, scenario: string) => `${lang}:${scenario}`;

export const useChat = create<ChatState>()(
  persist(
    (set) => ({
      threads: {},
      push: (key, m) => set((s) => ({ threads: { ...s.threads, [key]: [...(s.threads[key] ?? []), m].slice(-60) } })),
      clear: (key) => set((s) => ({ threads: { ...s.threads, [key]: [] } })),
    }),
    { name: 'lsan-iles-chat', storage: createJSONStorage(() => localStorage) },
  ),
);
