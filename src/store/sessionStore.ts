import { create } from 'zustand';
import { storage, StorageKeys } from '../services/storage';
import { addSeconds, differenceInSeconds } from 'date-fns';

export type SessionState = 'IDLE' | 'ACTIVE' | 'ESCALATING' | 'LOCKED' | 'COMPLETED';

interface SessionDurations {
    activeDuration: number; // Seconds (e.g., 300 for 5 mins)
    escalationDuration: number; // Seconds (e.g., 60 for 1 min)
    lockDuration: number; // Seconds (e.g., 60 for 1 min)
}

const DEFAULT_DURATIONS: SessionDurations = {
    activeDuration: 300, // 5 mins
    escalationDuration: 60, // 1 min
    lockDuration: 60, // 1 min
};

interface SessionStoreState {
    currentState: SessionState;
    startTime: number | null; // Unix timestamp in *seconds* (or ms, let's use ms)
    currentLockEndTime: number | null; // When the current lock ends
    durations: SessionDurations;
    streak: number;
    totalTime: number;

    // Actions
    startSession: () => void;
    endSession: () => void; // Can be called in ACTIVE or ESCALATING
    checkTransitions: () => void; // Tick function called by timer
    triggerLock: () => void; // Transition to LOCKED
    completeLock: () => void; // Transition from LOCKED to ESCALATING (loop)
    resetCompleted: () => void; // COMPLETED -> IDLE
    initialize: () => void;
    setDurations: (durations: SessionDurations) => void;
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
    currentState: 'IDLE',
    startTime: null,
    currentLockEndTime: null,
    durations: DEFAULT_DURATIONS,
    streak: 0,
    totalTime: 0,

    initialize: () => {
        const savedState = storage.getString(StorageKeys.SESSION_STATE) as SessionState;
        const savedStartTime = storage.getNumber(StorageKeys.START_TIME);
        const savedDurations = storage.getString(StorageKeys.DURATIONS);
        const savedStreak = storage.getNumber(StorageKeys.STREAK) || 0;
        const savedTotalTime = storage.getNumber(StorageKeys.TOTAL_TIME) || 0;

        const durations = savedDurations ? JSON.parse(savedDurations) : DEFAULT_DURATIONS;

        set({ durations, streak: savedStreak, totalTime: savedTotalTime });

        if (savedState && savedState !== 'IDLE' && savedState !== 'COMPLETED') {
            set({
                currentState: savedState,
                startTime: savedStartTime || null,
            });
        }
    },

    startSession: () => {
        const { currentState } = get();
        if (currentState !== 'IDLE' && currentState !== 'COMPLETED') return;

        const now = Date.now();
        set({
            currentState: 'ACTIVE',
            startTime: now,
            currentLockEndTime: null,
        });

        // Persist
        storage.set(StorageKeys.SESSION_STATE, 'ACTIVE');
        storage.set(StorageKeys.START_TIME, now);
    },

    endSession: () => {
        const { currentState, streak } = get();
        // User can end session in ACTIVE or ESCALATING.
        // In LOCKED, they cannot end it (UI shouldn't allow it, logic should prevent it).
        if (currentState === 'LOCKED') {
            console.warn("Attempted to end session during LOCKED state");
            return;
        }

        const newStreak = streak + 1;

        // Calculate accrued time (simple MVP: add activeDuration)
        // Ideally we track actual elapsed, but activeDuration is the "target" meta.
        const addedTime = get().durations.activeDuration;
        const newTotalTime = get().totalTime + addedTime;

        set({
            currentState: 'COMPLETED',
            startTime: null,
            currentLockEndTime: null,
            streak: newStreak,
            totalTime: newTotalTime,
        });

        storage.set(StorageKeys.SESSION_STATE, 'COMPLETED');
        storage.set(StorageKeys.STREAK, newStreak);
        storage.set(StorageKeys.TOTAL_TIME, newTotalTime);
    },

    checkTransitions: () => {
        const { currentState, startTime, durations, currentLockEndTime, triggerLock, completeLock } = get();

        if (currentState === 'IDLE' || currentState === 'COMPLETED' || !startTime) return;

        const now = Date.now();
        const elapsedSeconds = differenceInSeconds(now, startTime);

        if (currentState === 'ACTIVE') {
            if (elapsedSeconds >= durations.activeDuration) {
                // Transition to ESCALATING
                set({ currentState: 'ESCALATING' });
                storage.set(StorageKeys.SESSION_STATE, 'ESCALATING');
            }
        } else if (currentState === 'ESCALATING') {
            // Automatically check if we should lock? 
            // Spec says: "Escalation Duration ends -> Locked"
            // We need to track when Escalation started. 
            // Actually, simple calculation:
            // Active ends at T0 + activeDuration
            // Escalation ends at T0 + activeDuration + escalationDuration

            const escalationEndTime = addSeconds(startTime, durations.activeDuration + durations.escalationDuration).getTime();

            if (now >= escalationEndTime) {
                triggerLock();
            }
        } else if (currentState === 'LOCKED') {
            if (currentLockEndTime && now >= currentLockEndTime) {
                completeLock();
            }
        }
    },

    triggerLock: () => {
        const { durations } = get();
        const now = Date.now();
        const lockEndTime = addSeconds(now, durations.lockDuration).getTime();

        set({
            currentState: 'LOCKED',
            currentLockEndTime: lockEndTime
        });

        storage.set(StorageKeys.SESSION_STATE, 'LOCKED');
        // storage.set(StorageKeys.LOCK_END_TIME, lockEndTime); // TODO: Add key if persistence needed
    },

    completeLock: () => {
        // Lock finished. Go back to ESCALATING (loop).
        set({
            currentState: 'ESCALATING',
            currentLockEndTime: null,
            // We need to reset the "base" time for escalation? 
            // No, the spec says "Escalation -> Lock -> Escalation -> Lock".
            // In the loop, Escalation lasts for escalationDuration again?
            // "Escalation + Lock repeat in a chain"

            // If we just go back to ESCALATING state, checkTransitions checks total elapsed time.
            // Since total elapsed time > active + escalation, it would immediately re-lock.

            // Implementation Detail: We need to handle the "Loop" timing.
            // Simplest way: Update startTime to "shift" the window? 
            // OR better: track `lastPhaseStartTime`.
        });

        // For MVP V1: Let's simple toggle. 
        // To prevent immediate re-lock, we probably need a "grace period" or reset the timer logic for the loop.
        // Let's assume we update startTime to simulate a "new" escalation phase starting NOW, but keeping the record that we are deep in the session.
        // Actually, if we update startTime, we lose the total session duration tracking?
        // Better: Add `currentPhaseStartTime` to state.

        const now = Date.now();
        // We want to be in Escalating for `escalationDuration`.
        // So we effectively pretend the session started `activeDuration` ago?
        // No, that's messy.

        // Let's just update the check logic to be phase-aware. 
        // But for now, let's just RESET startTime to (Now - ActiveDuration). 
        // That puts us at the START of Escalating.
        const { durations } = get();
        const newFakeStartTime = addSeconds(now, -durations.activeDuration).getTime();

        set({
            currentState: 'ESCALATING',
            startTime: newFakeStartTime
        });
        storage.set(StorageKeys.SESSION_STATE, 'ESCALATING');
    },

    resetCompleted: () => {
        set({ currentState: 'IDLE' });
        storage.set(StorageKeys.SESSION_STATE, 'IDLE');
    },

    setDurations: (newDurations: SessionDurations) => {
        set({ durations: newDurations });
        storage.set(StorageKeys.DURATIONS, JSON.stringify(newDurations));
    },

}));
