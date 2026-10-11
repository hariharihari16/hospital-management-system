/**
 * MediCore - Dashboard Overview Module
 * Computes live KPIs, charts, and recent records strictly from backend APIs.
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    formatDate, formatTime, formatCurrency, renderStatusBadge,
    escapeHtml, refreshIcons, renderErrorState, renderSkeletonTable
} from '../ui.js';
import { openPatientModal } from './patients.js';
import { openAppointmentModal } from './appointments.js';
import { openBillModal } from './billing.js';
import { openAdmissionModal } from './rooms-admissions.js';

let apptChartInstance = null;
let revenueChartInstance = null;

export async function renderDashboard(container) {
    const today = new Date();
    const dateFormatted = today.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const userName = state.user?.staffName || state.user?.username || 'Hospital Administrator';

    container.innerHTML = `
        <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 24px;">
            <!-- Welcome Banner & Quick Actions -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: gap: 16px; background: linear-gradient(135deg, #090e1a 0%, #111a2e 100%); color: #ffffff; padding: 24px 28px; border-radius: var(--radius-xl); border: 1px solid #1e293b; box-shadow: var(--shadow-md);">
                <div>
                    <div style="font-size: 0.8rem; font-weight: 600; color: #14b8a6; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                        <i data-lucide="calendar" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${dateFormatted}
                    </div>
                    <h2 style="font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px;">
                        Welcome back, ${escapeHtml(userName)}
                    </h2>
                    <p style="font-size: 0.88rem; color: #94a3b8; max-width: 600px;">
                        MediCore Healthcare Operations Dashboard. All clinical, inpatient, and financial metrics below are synchronized live with the database.
                    </p>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-primary" id="dash-quick-patient-btn">
                        <i data-lucide="user-plus"></i> New Patient
                    </button>
                    <button class="btn btn-secondary" style="background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); color: #ffffff;" id="dash-quick-appt-btn">
                        <i data-lucide="calendar-plus"></i> Book Appt
                    </button>
                    <button class="btn btn-secondary" style="background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); color: #ffffff;" id="dash-quick-bill-btn">
                        <i data-lucide="receipt"></i> Create Bill
                    </button>
                </div>
            </div>

            <!-- KPI Cards Grid -->
            <div class="kpi-grid" id="dash-kpi-grid">
                ${renderSkeletonKpiCards(6)}
            </div>

            <!-- Charts Section (backed strictly by live API data) -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px;">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Appointment Status Distribution</h3>
                            <span class="card-subtitle">Real-time status breakdown from active bookings</span>
                        </div>
                    </div>
                    <div class="card-body" style="height: 280px; position: relative;">
                        <canvas id="dash-appt-chart"></canvas>
                        <div id="dash-appt-chart-empty" style="display: none; height: 100%; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.9rem;">
                            No appointment data available to plot chart.
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Billing & Collections Summary</h3>
                            <span class="card-subtitle">Aggregated totals from verified billing invoices</span>
                        </div>
                    </div>
                    <div class="card-body" style="height: 280px; position: relative;">
                        <canvas id="dash-revenue-chart"></canvas>
                        <div id="dash-revenue-chart-empty" style="display: none; height: 100%; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.9rem;">
                            No financial records available to plot chart.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Two Column Section: Recent Appointments & Recent Patients -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(460px, 1fr)); gap: 24px;">
                <!-- Recent Appointments -->
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Recent Appointments</h3>
                            <span class="card-subtitle">Latest booked clinical visits</span>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="window.MediCore.switchTab('appointments')">
                            View All <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Date & Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="dash-recent-appts-tbody">
                                ${renderSkeletonTable(4, 4)}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Recent Patients -->
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Recent Patients</h3>
                            <span class="card-subtitle">Newly registered patient records</span>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="window.MediCore.switchTab('patients')">
                            View All <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Patient ID</th>
                                    <th>Name</th>
                                    <th>Gender</th>
                                    <th>Contact Phone</th>
                                </tr>
                            </thead>
                            <tbody id="dash-recent-patients-tbody">
                                ${renderSkeletonTable(4, 4)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Pharmacy Inventory Low Stock Alert (if any stock <= 50) -->
            <div class="card" id="dash-stock-alert-card" style="display: none;">
                <div class="card-header" style="background: var(--warning-bg); border-bottom-color: var(--warning-border);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i data-lucide="alert-triangle" style="color: var(--warning);"></i>
                        <div>
                            <h3 class="card-title" style="color: var(--warning-text);">Pharmacy Inventory Alerts</h3>
                            <span class="card-subtitle" style="color: var(--warning-text);">Medications with inventory at or below threshold</span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="window.MediCore.switchTab('medicines')">
                        Manage Medicines
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Dosage</th>
                                <th>Remaining Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="dash-low-stock-tbody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    refreshIcons();

    // Quick action button listeners
    container.querySelector('#dash-quick-patient-btn').addEventListener('click', () => openPatientModal());
    container.querySelector('#dash-quick-appt-btn').addEventListener('click', () => openAppointmentModal());
    container.querySelector('#dash-quick-bill-btn').addEventListener('click', () => openBillModal());

    await loadDashboardData(container);
}

function renderSkeletonKpiCards(count = 6) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="kpi-card">
                <div class="skeleton-bar" style="width: 40%; height: 12px;"></div>
                <div class="skeleton-bar" style="width: 60%; height: 28px; margin: 8px 0;"></div>
                <div class="skeleton-bar" style="width: 50%; height: 12px;"></div>
            </div>
        `;
    }
    return html;
}

export async function loadDashboardData(container) {
    try {
        const [
            patients, doctors, appointments,
            bills, payments, admissions, rooms, medicines
        ] = await Promise.all([
            api.patients.getAll().catch(() => []),
            api.doctors.getAll().catch(() => []),
            api.appointments.getAll().catch(() => []),
            api.bills.getAll().catch(() => []),
            api.payments.getAll().catch(() => []),
            api.admissions.getAll().catch(() => []),
            api.rooms.getAll().catch(() => []),
            api.medicines.getAll().catch(() => [])
        ]);

        // Cache lists
        state.updateCache('patients', patients);
        state.updateCache('doctors', doctors);
        state.updateCache('rooms', rooms);
        state.updateCache('medicines', medicines);
        state.updateCache('bills', bills);

        // 1. Calculate Real KPIs
        const totalPatients = patients.length;
        const totalDoctors = doctors.length;
        const totalAppointments = appointments.length;

        // Scheduled appointments count
        const scheduledAppts = appointments.filter(a => (a.status || '').toUpperCase() === 'SCHEDULED').length;

        // Financial KPIs
        const totalBilled = bills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
        const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const outstanding = Math.max(0, totalBilled - totalPaid);

        // Active Inpatient Admissions
        const activeStatuses = ['ADMITTED', 'OCCUPIED', 'ACTIVE', 'Admitted', 'Occupied', 'Active'];
        const activeAdmissions = admissions.filter(a => activeStatuses.includes(a.status)).length;
        const totalRooms = rooms.length;

        renderKpiGrid(container, {
            totalPatients,
            totalDoctors,
            totalAppointments,
            scheduledAppts,
            totalBilled,
            totalPaid,
            outstanding,
            activeAdmissions,
            totalRooms
        });

        // 2. Render Charts
        renderCharts(appointments, totalBilled, totalPaid, outstanding);

        // 3. Render Recent Appointments Table (Last 5)
        renderRecentAppointments(container, appointments);

        // 4. Render Recent Patients Table (Last 5)
        renderRecentPatients(container, patients);

        // 5. Check Low Stock Medicines (< 100 or <= 50)
        renderLowStockAlert(container, medicines);

    } catch (err) {
        console.error('Error loading dashboard data:', err);
        const grid = container.querySelector('#dash-kpi-grid');
        if (grid) grid.innerHTML = renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()');
        refreshIcons();
    }
}

function renderKpiGrid(container, stats) {
    const grid = container.querySelector('#dash-kpi-grid');
    if (!grid) return;

    grid.innerHTML = `
        <!-- Total Patients -->
        <div class="kpi-card">
            <div class="kpi-header">
                <span class="kpi-title">Total Patients</span>
                <div class="kpi-icon-bubble kpi-icon-teal">
                    <i data-lucide="users"></i>
                </div>
            </div>
            <div class="kpi-value">${stats.totalPatients}</div>
            <div class="kpi-footer">
                <span style="color: var(--success); font-weight: 600;"><i data-lucide="shield-check" style="width: 12px; height: 12px;"></i> Verified EMRs</span>
            </div>
        </div>

        <!-- Medical Specialists -->
        <div class="kpi-card">
            <div class="kpi-header">
                <span class="kpi-title">Doctors & Specialists</span>
                <div class="kpi-icon-bubble kpi-icon-blue">
                    <i data-lucide="stethoscope"></i>
                </div>
            </div>
            <div class="kpi-value">${stats.totalDoctors}</div>
            <div class="kpi-footer">
                <span>Active Clinical Staff</span>
            </div>
        </div>

        <!-- Appointments -->
        <div class="kpi-card">
            <div class="kpi-header">
                <span class="kpi-title">Appointments</span>
                <div class="kpi-icon-bubble kpi-icon-amber">
                    <i data-lucide="calendar"></i>
                </div>
            </div>
            <div class="kpi-value">${stats.totalAppointments}</div>
            <div class="kpi-footer">
                <span style="font-weight: 600; color: var(--warning);">${stats.scheduledAppts} Scheduled Upcoming</span>
            </div>
        </div>

        <!-- Inpatient Bed Occupancy -->
        <div class="kpi-card">
            <div class="kpi-header">
                <span class="kpi-title">Active Admissions</span>
                <div class="kpi-icon-bubble kpi-icon-indigo">
                    <i data-lucide="bed"></i>
                </div>
            </div>
            <div class="kpi-value">${stats.activeAdmissions} <span style="font-size: 1rem; color: var(--text-muted); font-weight: normal;">/ ${stats.totalRooms} Rooms</span></div>
            <div class="kpi-footer">
                <span>Inpatient Ward Capacity</span>
            </div>
        </div>

        <!-- Total Billed -->
        <div class="kpi-card">
            <div class="kpi-header">
                <span class="kpi-title">Total Invoiced</span>
                <div class="kpi-icon-bubble kpi-icon-emerald">
                    <i data-lucide="receipt"></i>
                </div>
            </div>
            <div class="kpi-value" style="font-size: 1.6rem;">${formatCurrency(stats.totalBilled)}</div>
            <div class="kpi-footer">
                <span>Aggregated Billings</span>
            </div>
        </div>

        <!-- Total Collected / Outstanding -->
        <div class="kpi-card">
            <div class="kpi-header">
                <span class="kpi-title">Collected Revenue</span>
                <div class="kpi-icon-bubble ${stats.outstanding > 0 ? 'kpi-icon-teal' : 'kpi-icon-emerald'}">
                    <i data-lucide="banknote"></i>
                </div>
            </div>
            <div class="kpi-value" style="font-size: 1.6rem; color: var(--success);">${formatCurrency(stats.totalPaid)}</div>
            <div class="kpi-footer">
                <span style="color: ${stats.outstanding > 0 ? 'var(--danger)' : 'var(--text-muted)'}; font-weight: 600;">
                    ${formatCurrency(stats.outstanding)} Outstanding Due
                </span>
            </div>
        </div>
    `;

    refreshIcons();
}

function renderCharts(appointments, totalBilled, totalPaid, outstanding) {
    if (!window.Chart) return;

    // 1. Appointment Status Doughnut Chart
    const apptCanvas = document.getElementById('dash-appt-chart');
    const apptEmpty = document.getElementById('dash-appt-chart-empty');
    if (apptCanvas) {
        if (apptChartInstance) {
            apptChartInstance.destroy();
            apptChartInstance = null;
        }

        if (appointments.length === 0) {
            apptCanvas.style.display = 'none';
            if (apptEmpty) apptEmpty.style.display = 'flex';
        } else {
            apptCanvas.style.display = 'block';
            if (apptEmpty) apptEmpty.style.display = 'none';

            const counts = { SCHEDULED: 0, COMPLETED: 0, PENDING: 0, CANCELLED: 0 };
            appointments.forEach(a => {
                const s = (a.status || 'SCHEDULED').toUpperCase();
                if (counts[s] !== undefined) counts[s]++;
                else counts.SCHEDULED++;
            });

            apptChartInstance = new window.Chart(apptCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Scheduled', 'Completed', 'Pending', 'Cancelled'],
                    datasets: [{
                        data: [counts.SCHEDULED, counts.COMPLETED, counts.PENDING, counts.CANCELLED],
                        backgroundColor: ['#f59e0b', '#10b981', '#0ea5e9', '#ef4444'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans' } } }
                    },
                    cutout: '68%'
                }
            });
        }
    }

    // 2. Billing & Collections Bar Chart
    const revCanvas = document.getElementById('dash-revenue-chart');
    const revEmpty = document.getElementById('dash-revenue-chart-empty');
    if (revCanvas) {
        if (revenueChartInstance) {
            revenueChartInstance.destroy();
            revenueChartInstance = null;
        }

        if (totalBilled === 0 && totalPaid === 0) {
            revCanvas.style.display = 'none';
            if (revEmpty) revEmpty.style.display = 'flex';
        } else {
            revCanvas.style.display = 'block';
            if (revEmpty) revEmpty.style.display = 'none';

            revenueChartInstance = new window.Chart(revCanvas, {
                type: 'bar',
                data: {
                    labels: ['Total Invoiced', 'Received Payments', 'Pending Due'],
                    datasets: [{
                        label: `Amount (${state.currency})`,
                        data: [totalBilled, totalPaid, outstanding],
                        backgroundColor: ['#0d9488', '#10b981', '#ef4444'],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (val) => `${state.currency}${val.toLocaleString()}`
                            }
                        }
                    }
                }
            });
        }
    }
}

function renderRecentAppointments(container, appointments) {
    const tbody = container.querySelector('#dash-recent-appts-tbody');
    if (!tbody) return;

    if (appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">No appointments scheduled</td></tr>';
        return;
    }

    const recent = [...appointments].slice(0, 5);
    tbody.innerHTML = recent.map(a => `
        <tr>
            <td class="cell-bold">${escapeHtml(a.patientName || `Patient #${a.patientId}`)}</td>
            <td>${escapeHtml(a.doctorName || `Doctor #${a.doctorId}`)}</td>
            <td>${formatDate(a.apptDate)} <span class="cell-subtext">${formatTime(a.apptTime)}</span></td>
            <td>${renderStatusBadge(a.status)}</td>
        </tr>
    `).join('');
}

function renderRecentPatients(container, patients) {
    const tbody = container.querySelector('#dash-recent-patients-tbody');
    if (!tbody) return;

    if (patients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">No registered patients</td></tr>';
        return;
    }

    const recent = [...patients].slice(0, 5);
    tbody.innerHTML = recent.map(p => `
        <tr>
            <td class="cell-bold">#${p.patientId}</td>
            <td class="cell-bold">${escapeHtml(p.name)}</td>
            <td><span class="badge badge-neutral">${escapeHtml(p.gender || '—')}</span></td>
            <td>${escapeHtml(p.phone || '—')}</td>
        </tr>
    `).join('');
}

function renderLowStockAlert(container, medicines) {
    const card = container.querySelector('#dash-stock-alert-card');
    const tbody = container.querySelector('#dash-low-stock-tbody');
    if (!card || !tbody) return;

    const lowStock = medicines.filter(m => (m.stock !== null && m.stock <= 50));
    if (lowStock.length > 0) {
        card.style.display = 'block';
        tbody.innerHTML = lowStock.map(m => `
            <tr>
                <td class="cell-bold">${escapeHtml(m.medicineName)}</td>
                <td>${escapeHtml(m.dosage || '—')}</td>
                <td style="font-weight: 700; color: var(--warning);">${m.stock} units</td>
                <td><span class="badge badge-warning">Low Stock</span></td>
            </tr>
        `).join('');
    } else {
        card.style.display = 'none';
    }
}
