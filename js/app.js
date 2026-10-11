/**
 * MediCore Hospital Management System - Main Application Orchestrator
 */

import { api } from './api.js';
import { state } from './state.js';
import { showToast, closeActiveModal, refreshIcons } from './ui.js';
import { renderLoginOverlay } from './auth-ui.js';

// Feature Modules
import { renderDashboard } from './modules/dashboard.js';
import { renderPatients, loadPatients } from './modules/patients.js';
import { renderDoctors } from './modules/doctors.js';
import { renderDepartments } from './modules/departments.js';
import { renderAppointments } from './modules/appointments.js';
import { renderMedicalRecords } from './modules/medical-records.js';
import { renderPrescriptions } from './modules/prescriptions.js';
import { renderMedicines } from './modules/medicines.js';
import { renderLabTests } from './modules/lab-tests.js';
import { renderRoomsAdmissions } from './modules/rooms-admissions.js';
import { renderBilling, loadBilling } from './modules/billing.js';
import { renderPayments } from './modules/payments.js';
import { renderInsurance } from './modules/insurance.js';
import { renderStaff } from './modules/staff.js';
import { renderUsers } from './modules/users.js';
import { renderReports } from './modules/reports.js';
import { renderSettings } from './modules/settings.js';

// Route Definitions
const ROUTES = {
    'overview': { title: 'Hospital Operations Overview', crumb: 'Dashboard / Overview', render: renderDashboard },
    'patients': { title: 'Patient Directory & EMR', crumb: 'Clinical / Patients', render: renderPatients },
    'doctors': { title: 'Specialist Physicians & Doctors', crumb: 'Medical Staff / Doctors', render: renderDoctors },
    'departments': { title: 'Clinical Departments', crumb: 'Hospital / Departments', render: renderDepartments },
    'appointments': { title: 'Appointment Scheduling', crumb: 'Scheduling / Appointments', render: renderAppointments },
    'medical-records': { title: 'Electronic Medical Records (EMR)', crumb: 'Clinical / Medical Records', render: renderMedicalRecords },
    'prescriptions': { title: 'Digital Prescriptions', crumb: 'Pharmacy / Prescriptions', render: renderPrescriptions },
    'medicines': { title: 'Pharmacy Inventory & Medicines', crumb: 'Pharmacy / Medicines', render: renderMedicines },
    'lab-tests': { title: 'Diagnostic Laboratory Tests', crumb: 'Diagnostics / Lab Tests', render: renderLabTests },
    'rooms-admissions': { title: 'Rooms & Inpatient Admissions', crumb: 'Inpatient / Rooms & Admissions', render: renderRoomsAdmissions },
    'billing': { title: 'Patient Invoicing & Billing', crumb: 'Finance / Billing', render: renderBilling },
    'payments': { title: 'Payment Collections & Receipts', crumb: 'Finance / Payments', render: renderPayments },
    'insurance': { title: 'Health Insurance Policies', crumb: 'Finance / Insurance', render: renderInsurance },
    'staff': { title: 'Hospital Staff Directory', crumb: 'Administration / Staff', render: renderStaff },
    'user-accounts': { title: 'User Accounts & Security Logins', crumb: 'Security / User Accounts', render: renderUsers },
    'reports': { title: 'Operational & Financial Reports', crumb: 'Analytics / Reports', render: renderReports },
    'settings': { title: 'System Configuration & Settings', crumb: 'System / Settings', render: renderSettings }
};

// Global MediCore interface
window.MediCore = {
    switchTab,
    reloadCurrentTab,
    closeActiveModal,
    checkBackendHealth,
    loadPatients,
    loadBilling
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Theme
    initTheme();

    // 2. Setup Navigation & Layout Handlers
    initNavigation();
    initMobileDrawer();
    initGlobalSearch();
    initNotifications();

    // 3. User Session & Login check
    updateUserInterface();
    if (!state.user) {
        renderLoginOverlay(() => {
            updateUserInterface();
            switchTab(state.currentTab);
        });
    }

    // 4. Initial Health Probe
    await checkBackendHealth();

    // 5. Initial View Load
    switchTab(state.currentTab);

    // 6. Heartbeat Health Probe every 30 seconds
    setInterval(checkBackendHealth, 30000);
});

function initTheme() {
    const savedTheme = localStorage.getItem('medicore_theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    const themeToggleBtn = document.getElementById('theme-toggle-top-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-theme');
            if (isDark) {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('medicore_theme', 'light');
                showToast('Switched to Light Theme', 'info');
            } else {
                document.body.classList.add('dark-theme');
                localStorage.setItem('medicore_theme', 'dark');
                showToast('Switched to Dark Theme', 'info');
            }
            refreshIcons();
        });
    }
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            if (tab) switchTab(tab);
        });
    });

    const logoutBtn = document.getElementById('sidebar-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            state.logout();
            showToast('You have been signed out', 'info');
            updateUserInterface();
            renderLoginOverlay(() => {
                updateUserInterface();
                switchTab('overview');
            });
        });
    }
}

function initMobileDrawer() {
    const mobileToggle = document.getElementById('mobile-menu-toggle-btn');
    const sidebar = document.querySelector('.app-sidebar');
    const overlay = document.getElementById('sidebar-mobile-overlay');

    if (mobileToggle && sidebar && overlay) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

function initGlobalSearch() {
    const globalInput = document.getElementById('global-search-input');
    if (globalInput) {
        globalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = globalInput.value.trim();
                if (query) {
                    // Route to patients tab and filter
                    switchTab('patients');
                    setTimeout(() => {
                        const patInput = document.getElementById('patient-search-input');
                        if (patInput) {
                            patInput.value = query;
                            patInput.dispatchEvent(new Event('input'));
                        }
                    }, 100);
                }
            }
        });
    }
}

function initNotifications() {
    const notifBtn = document.getElementById('notifications-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', async () => {
            // Fetch live pending alerts: pending appointments, low stock medicines
            try {
                const [appts, meds] = await Promise.all([
                    api.appointments.getAll().catch(() => []),
                    api.medicines.getAll().catch(() => [])
                ]);

                const pendingAppts = appts.filter(a => (a.status || '').toUpperCase() === 'PENDING');
                const lowStock = meds.filter(m => (m.stock !== null && m.stock <= 50));

                let alertCount = pendingAppts.length + lowStock.length;

                showToast(`System Status: ${pendingAppts.length} pending appointment(s), ${lowStock.length} low-stock medicine(s).`, alertCount > 0 ? 'warning' : 'info');
            } catch {
                showToast('Unable to check notification alerts', 'info');
            }
        });
    }
}

export function switchTab(tabName) {
    const route = ROUTES[tabName] || ROUTES['overview'];
    state.setTab(tabName);

    // 1. Update navigation active state
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.tab === tabName) {
            el.classList.add('active');
        }
    });

    // 2. Update Top Bar Title & Breadcrumbs
    const titleEl = document.getElementById('current-page-title');
    const crumbEl = document.getElementById('current-breadcrumbs');
    if (titleEl) titleEl.textContent = route.title;
    if (crumbEl) crumbEl.textContent = route.crumb;

    // 3. Update tab container visibility
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    let pane = document.getElementById(`tab-${tabName}`);
    if (!pane) {
        pane = document.createElement('div');
        pane.id = `tab-${tabName}`;
        pane.className = 'tab-pane';
        const contentArea = document.querySelector('.app-content');
        if (contentArea) contentArea.appendChild(pane);
    }
    pane.classList.add('active');

    // 4. Render module content
    if (typeof route.render === 'function') {
        route.render(pane);
    }

    // Close mobile drawer if open
    const sidebar = document.querySelector('.app-sidebar');
    const overlay = document.getElementById('sidebar-mobile-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshIcons();
}

export function reloadCurrentTab() {
    switchTab(state.currentTab);
}

export async function checkBackendHealth() {
    const pill = document.getElementById('backend-status-pill');
    const label = document.getElementById('backend-status-label');
    if (!pill || !label) return;

    const res = await api.ping();
    state.setBackendStatus(res);

    if (res.online) {
        pill.className = 'backend-status-pill online';
        label.textContent = `Backend Connected (${res.latency}ms)`;
        pill.title = `Connected to ${res.baseUrl} - Latency: ${res.latency}ms`;
    } else {
        pill.className = 'backend-status-pill offline';
        label.textContent = 'Backend Offline';
        pill.title = `Failed connecting to ${res.baseUrl}: ${res.error}`;
    }
    refreshIcons();
}

function updateUserInterface() {
    const user = state.user;
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-user-avatar');

    if (nameEl) nameEl.textContent = user?.staffName || user?.username || 'Guest Administrator';
    if (roleEl) roleEl.textContent = user?.role || 'Operations Staff';
    if (avatarEl) {
        const initials = (user?.staffName || user?.username || 'MC')
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
        avatarEl.textContent = initials;
    }
}
