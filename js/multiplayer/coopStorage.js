'use strict';

const STORAGE_KEY = 'fateRunner_coop_data';

export const CoopStorage = {
    getDefaultData() {
        return {
            roomCode: '',
            isHost: false,
            currentLevel: 0,
            maxLevelCleared: 0,
            totalCoinsCollected: 0,
            totalDeaths: 0,
            lastPlayed: new Date().toISOString(),
            status: 'in_progress'
        };
    },

    getData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return this.getDefaultData();
            const parsed = JSON.parse(raw);
            return { ...this.getDefaultData(), ...parsed };
        } catch (e) {
            console.error('[CoopStorage] Failed to read data:', e);
            return this.getDefaultData();
        }
    },

    saveData(data) {
        try {
            const updated = {
                ...this.getData(),
                ...data,
                lastPlayed: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated, null, 2));
            return updated;
        } catch (e) {
            console.error('[CoopStorage] Failed to save data:', e);
        }
    },

    recordLevelCleared(levelIndex, coinsInLevel = 0) {
        const current = this.getData();
        const nextLevel = levelIndex + 1;
        const newMax = Math.max(current.maxLevelCleared, nextLevel);
        const updatedCoins = (current.totalCoinsCollected || 0) + coinsInLevel;

        return this.saveData({
            currentLevel: nextLevel,
            maxLevelCleared: newMax,
            totalCoinsCollected: updatedCoins,
            status: 'level_cleared'
        });
    },

    recordBothDiedReset() {
        const current = this.getData();
        return this.saveData({
            currentLevel: 0,
            totalDeaths: (current.totalDeaths || 0) + 1,
            status: 'both_died_reset_level_1'
        });
    },

    resetAll() {
        const defaultData = this.getDefaultData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
};
