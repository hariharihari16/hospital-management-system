/**
 * MediCore Hospital Management System - Global State Store
 */

const SESSION_KEY = 'medicore_auth_user';
const CURRENCY_KEY = 'medicore_currency';

class StateStore {
    constructor() {
        this.currentTab = 'overview';
        this.currency = localStorage.getItem(CURRENCY_KEY) || '₹';
        this.user = this.loadUserSession();
        this.backendStatus = { online: false, latency: null, checkedAt: null };
        this.listeners = new Map();

        // Cached lookup collections for cross-referencing
        this.cache = {
            patients: [],
            doctors: [],
            departments: [],
            rooms: [],
            medicines: [],
            bills: []
        };
    }

    loadUserSession() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Failed to parse user session:', e);
            return null;
        }
    }

    setUser(user) {
        this.user = user;
        if (user) {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        } else {
            sessionStorage.removeItem(SESSION_KEY);
        }
        this.emit('authChange', this.user);
    }

    logout() {
        this.setUser(null);
    }

    setCurrency(curr) {
        this.currency = curr;
        localStorage.setItem(CURRENCY_KEY, curr);
        this.emit('currencyChange', curr);
    }

    setTab(tab) {
        this.currentTab = tab;
        this.emit('tabChange', tab);
    }

    setBackendStatus(status) {
        this.backendStatus = { ...status, checkedAt: new Date() };
        this.emit('backendStatusChange', this.backendStatus);
    }

    updateCache(key, data) {
        if (this.cache[key] !== undefined) {
            this.cache[key] = Array.isArray(data) ? data : [];
            this.emit(`cache:${key}`, this.cache[key]);
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.listeners.get(event)?.delete(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    console.error(`Error in listener for ${event}:`, e);
                }
            });
        }
    }
}

export const state = new StateStore();
export default state;
