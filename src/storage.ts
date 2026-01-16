import { BracketState } from './types';

const STORAGE_KEY = 'cs2_bracket_state_v1';

export function saveBracketState(state: BracketState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save bracket state:', error);
  }
}

export function loadBracketState(): BracketState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as BracketState;
  } catch (error) {
    console.error('Failed to load bracket state:', error);
    return null;
  }
}

export function clearBracketState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear bracket state:', error);
  }
}

