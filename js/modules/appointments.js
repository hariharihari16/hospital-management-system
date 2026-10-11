/**
 * MediCore - Appointments Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, formatDate, formatTime, renderStatusBadge,
    renderSkeletonTable, renderEmptyState, renderErrorState, refreshIcons
} from '../ui.js';

let appointmentsData = [];
let statusFilter = 'ALL';
let searchQuery = '';
let viewMode = 'list'; // 'list' | 'grouped'

export async function renderAppointments(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="appt-search-input" placeholder="Search by patient, doctor, reason..." value="${escapeHtml(searchQuery)}">
                    </div>
                    <select class="select-filter" id="appt-status-filter">
                        <option value="ALL">All Statuses</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING">Pending</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
                <div class="table-toolbar-right">
                    <div class="btn-group" style="display: flex; gap: 4px; background: var(--bg-main); padding: 3px; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
                        <button class="btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}" id="view-mode-list-btn" title="Table View">
                            <i data-lucide="list"></i> Table
                        </button>
                        <button class="btn btn-sm ${viewMode === 'grouped' ? 'btn-primary' : 'btn-secondary'}" id="view-mode-grouped-btn" title="Grouped by Date">
                            <i data-lucide="calendar"></i> Timeline
                        </button>
                    </div>
                    <button class="btn btn-secondary" id="refresh-appts-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="book-appt-btn">
                        <i data-lucide="calendar-plus"></i> Book Appointment
                    </button>
                </div>
            </div>

            <div id="appts-view-container">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Patient Name</th>
                                <th>Doctor / Specialist</th>
                                <th>Date & Time</th>
                                <th>Reason / Chief Complaint</th>
                                <th>Status</th>
                                <th style="text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="appts-table-body">
                            ${renderSkeletonTable(7, 4)}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="table-pagination">
                <span id="appts-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#book-appt-btn').addEventListener('click', () => openAppointmentModal());
    container.querySelector('#refresh-appts-btn').addEventListener('click', () => loadAppointments(container));

    const searchInput = container.querySelector('#appt-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderAppointmentsContent(container);
    });

    const statusSelect = container.querySelector('#appt-status-filter');
    statusSelect.value = statusFilter;
    statusSelect.addEventListener('change', (e) => {
        statusFilter = e.target.value;
        renderAppointmentsContent(container);
    });

    container.querySelector('#view-mode-list-btn').addEventListener('click', () => {
        viewMode = 'list';
        container.querySelector('#view-mode-list-btn').className = 'btn btn-sm btn-primary';
        container.querySelector('#view-mode-grouped-btn').className = 'btn btn-sm btn-secondary';
        renderAppointmentsContent(container);
    });

    container.querySelector('#view-mode-grouped-btn').addEventListener('click', () => {
        viewMode = 'grouped';
        container.querySelector('#view-mode-grouped-btn').className = 'btn btn-sm btn-primary';
        container.querySelector('#view-mode-list-btn').className = 'btn btn-sm btn-secondary';
        renderAppointmentsContent(container);
    });

    await loadAppointments(container);
}

export async function loadAppointments(container) {
    const tbody = container.querySelector('#appts-table-body');
    const countLabel = container.querySelector('#appts-count-label');

    try {
        if (tbody) tbody.innerHTML = renderSkeletonTable(7, 4);
        const [appts, patients, docs] = await Promise.all([
            api.appointments.getAll(),
            api.patients.getAll().catch(() => []),
            api.doctors.getAll().catch(() => [])
        ]);
        appointmentsData = appts;
        state.updateCache('patients', patients);
        state.updateCache('doctors', docs);
        renderAppointmentsContent(container);
    } catch (err) {
        const viewWrap = container.querySelector('#appts-view-container');
        if (viewWrap) {
            viewWrap.innerHTML = renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()');
        }
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function getFilteredAppointments() {
    return appointmentsData.filter(a => {
        if (statusFilter !== 'ALL' && (a.status || '').toUpperCase() !== statusFilter) {
            return false;
        }
        if (!searchQuery) return true;
        return (a.patientName && a.patientName.toLowerCase().includes(searchQuery)) ||
               (a.doctorName && a.doctorName.toLowerCase().includes(searchQuery)) ||
               (a.reason && a.reason.toLowerCase().includes(searchQuery)) ||
               (String(a.apptId).includes(searchQuery));
    });
}

function renderAppointmentsContent(container) {
    const countLabel = container.querySelector('#appts-count-label');
    const viewWrap = container.querySelector('#appts-view-container');
    if (!viewWrap) return;

    const filtered = getFilteredAppointments();

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${appointmentsData.length} appointments`;
    }

    if (filtered.length === 0) {
        viewWrap.innerHTML = renderEmptyState('No appointments found', 'Book a new appointment or modify your filter options.');
        refreshIcons();
        return;
    }

    if (viewMode === 'grouped') {
        renderGroupedView(viewWrap, filtered, container);
    } else {
        renderListView(viewWrap, filtered, container);
    }
}

function renderListView(viewWrap, filtered, container) {
    viewWrap.innerHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Patient Name</th>
                        <th>Doctor / Specialist</th>
                        <th>Date & Time</th>
                        <th>Reason / Chief Complaint</th>
                        <th>Status</th>
                        <th style="text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody id="appts-table-body">
                    ${filtered.map(a => `
                        <tr>
                            <td class="cell-bold">#${a.apptId}</td>
                            <td>
                                <div class="cell-bold">${escapeHtml(a.patientName || `Patient #${a.patientId}`)}</div>
                            </td>
                            <td>
                                <div class="cell-bold">${escapeHtml(a.doctorName || `Doctor #${a.doctorId}`)}</div>
                            </td>
                            <td>
                                <div class="cell-bold">${formatDate(a.apptDate)}</div>
                                <span class="cell-subtext"><i data-lucide="clock" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${formatTime(a.apptTime)}</span>
                            </td>
                            <td>${escapeHtml(a.reason || 'General Consultation')}</td>
                            <td>${renderStatusBadge(a.status)}</td>
                            <td style="text-align: right;">
                                <div class="table-actions" style="justify-content: flex-end;">
                                    <button class="btn btn-secondary btn-icon-only edit-appt-btn" data-id="${a.apptId}" title="Edit Appointment">
                                        <i data-lucide="pencil"></i>
                                    </button>
                                    <button class="btn btn-secondary btn-icon-only text-danger delete-appt-btn" data-id="${a.apptId}" title="Cancel / Delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    refreshIcons();
    attachRowActions(viewWrap, container);
}

function renderGroupedView(viewWrap, filtered, container) {
    // Group by appointment date
    const groups = {};
    filtered.forEach(a => {
        const d = a.apptDate || 'Undated';
        if (!groups[d]) groups[d] = [];
        groups[d].push(a);
    });

    const sortedDates = Object.keys(groups).sort().reverse();

    viewWrap.innerHTML = `
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 20px;">
            ${sortedDates.map(dateStr => `
                <div class="date-group-card" style="background: var(--bg-main); border: 1px solid var(--card-border); border-radius: var(--radius-lg); padding: 18px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid var(--card-border); padding-bottom: 8px;">
                        <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="calendar" style="color: var(--primary);"></i> ${formatDate(dateStr)}
                        </h4>
                        <span class="badge badge-neutral">${groups[dateStr].length} Bookings</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px;">
                        ${groups[dateStr].map(a => `
                            <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius-md); padding: 14px; box-shadow: var(--shadow-xs);">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                    <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${escapeHtml(a.patientName || `Patient #${a.patientId}`)}</span>
                                    ${renderStatusBadge(a.status)}
                                </div>
                                <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 6px;">
                                    <i data-lucide="user-check" style="width: 13px; height: 13px;"></i> ${escapeHtml(a.doctorName || `Doctor #${a.doctorId}`)}
                                </div>
                                <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 10px;">
                                    <i data-lucide="clock" style="width: 13px; height: 13px;"></i> ${formatTime(a.apptTime)} — ${escapeHtml(a.reason || 'General')}
                                </div>
                                <div style="display: flex; justify-content: flex-end; gap: 6px;">
                                    <button class="btn btn-secondary btn-sm edit-appt-btn" data-id="${a.apptId}">Edit</button>
                                    <button class="btn btn-secondary btn-sm text-danger delete-appt-btn" data-id="${a.apptId}">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    refreshIcons();
    attachRowActions(viewWrap, container);
}

function attachRowActions(viewWrap, container) {
    viewWrap.querySelectorAll('.edit-appt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const appt = appointmentsData.find(a => a.apptId === id);
            if (appt) openAppointmentModal(appt);
        });
    });

    viewWrap.querySelectorAll('.delete-appt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const appt = appointmentsData.find(a => a.apptId === id);
            if (appt) confirmDeleteAppointment(appt, container);
        });
    });
}

export async function openAppointmentModal(appointment = null) {
    const isEdit = !!appointment;
    const title = isEdit ? `Edit Appointment #${appointment.apptId}` : 'Schedule New Appointment';

    // Ensure we have live doctors and patients
    let [patients, docs] = [state.cache.patients, state.cache.doctors];
    if (!patients || patients.length === 0) {
        patients = await api.patients.getAll().catch(() => []);
        state.updateCache('patients', patients);
    }
    if (!docs || docs.length === 0) {
        docs = await api.doctors.getAll().catch(() => []);
        state.updateCache('doctors', docs);
    }

    const patientOptions = patients.map(p => 
        `<option value="${p.patientId}" ${appointment && appointment.patientId === p.patientId ? 'selected' : ''}>#${p.patientId} - ${escapeHtml(p.name)} (${p.phone || 'No phone'})</option>`
    ).join('');

    const doctorOptions = docs.map(d => 
        `<option value="${d.doctorId}" ${appointment && appointment.doctorId === d.doctorId ? 'selected' : ''}>Dr. ${escapeHtml(d.name)} (${escapeHtml(d.specialization || d.deptName || 'General')})</option>`
    ).join('');

    // Format apptTime for input type="time" (HH:mm)
    let timeVal = '09:30';
    if (appointment && appointment.apptTime) {
        timeVal = appointment.apptTime.slice(0, 5);
    }

    // Default today date
    const today = new Date().toISOString().split('T')[0];
    const dateVal = appointment?.apptDate || today;

    const bodyHtml = `
        <form id="appointment-form">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Patient <span class="req">*</span></label>
                    <select class="form-control" id="appt-patient" required>
                        <option value="">Select Patient...</option>
                        ${patientOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Doctor <span class="req">*</span></label>
                    <select class="form-control" id="appt-doctor" required>
                        <option value="">Select Doctor...</option>
                        ${doctorOptions}
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Appointment Date <span class="req">*</span></label>
                    <input type="date" class="form-control" id="appt-date" required value="${dateVal}">
                </div>
                <div class="form-group">
                    <label class="form-label">Appointment Time <span class="req">*</span></label>
                    <input type="time" class="form-control" id="appt-time" required value="${timeVal}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" id="appt-status">
                        <option value="SCHEDULED" ${appointment?.status === 'Scheduled' || appointment?.status === 'SCHEDULED' ? 'selected' : ''}>Scheduled</option>
                        <option value="COMPLETED" ${appointment?.status === 'Completed' || appointment?.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                        <option value="PENDING" ${appointment?.status === 'Pending' || appointment?.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                        <option value="CANCELLED" ${appointment?.status === 'Cancelled' || appointment?.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Reason / Chief Complaint</label>
                    <input type="text" class="form-control" id="appt-reason" value="${escapeHtml(appointment?.reason || '')}" placeholder="e.g. Chest pain, Routine Checkup">
                </div>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-appt-btn">
            ${isEdit ? 'Update Booking' : 'Confirm Appointment'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'md' });

    modal.querySelector('#save-appt-btn').addEventListener('click', async () => {
        const patientIdVal = modal.querySelector('#appt-patient').value;
        const doctorIdVal = modal.querySelector('#appt-doctor').value;
        const apptDate = modal.querySelector('#appt-date').value;
        let apptTime = modal.querySelector('#appt-time').value;
        const status = modal.querySelector('#appt-status').value;
        const reason = modal.querySelector('#appt-reason').value.trim() || null;

        if (!patientIdVal) {
            showToast('Please select a patient', 'warning');
            modal.querySelector('#appt-patient').focus();
            return;
        }
        if (!doctorIdVal) {
            showToast('Please select a doctor', 'warning');
            modal.querySelector('#appt-doctor').focus();
            return;
        }
        if (!apptDate) {
            showToast('Please select appointment date', 'warning');
            modal.querySelector('#appt-date').focus();
            return;
        }
        if (!apptTime) {
            showToast('Please select appointment time', 'warning');
            modal.querySelector('#appt-time').focus();
            return;
        }

        // Format apptTime with seconds (HH:mm:ss) as expected by LocalTime
        if (apptTime.length === 5) {
            apptTime = `${apptTime}:00`;
        }

        const payload = {
            patientId: Number(patientIdVal),
            doctorId: Number(doctorIdVal),
            apptDate,
            apptTime,
            status,
            reason
        };

        const saveBtn = modal.querySelector('#save-appt-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Booking...';

        try {
            if (isEdit) {
                await api.appointments.update(appointment.apptId, payload);
                showToast(`Appointment #${appointment.apptId} updated successfully`, 'success');
            } else {
                const created = await api.appointments.create(payload);
                showToast(`Appointment #${created.apptId} scheduled successfully`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-appointments');
            if (container) loadAppointments(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Booking' : 'Confirm Appointment';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeleteAppointment(appointment, container) {
    showConfirm({
        title: 'Cancel / Delete Appointment',
        message: `Are you sure you want to delete appointment #${appointment.apptId} for patient "${appointment.patientName}"?`,
        confirmText: 'Delete Appointment',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.appointments.delete(appointment.apptId);
            showToast(`Appointment #${appointment.apptId} removed`, 'success');
            await loadAppointments(container);
        }
    });
}
