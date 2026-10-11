/**
 * MediCore - Patients Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, formatDate, calculateAge, renderSkeletonTable,
    renderEmptyState, renderErrorState, refreshIcons
} from '../ui.js';

let patientsData = [];
let searchQuery = '';

export async function renderPatients(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="patient-search-input" placeholder="Search patients by name, phone, email..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-patients-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-patient-btn">
                        <i data-lucide="user-plus"></i> New Patient
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table" id="patients-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Patient Name</th>
                            <th>Gender / Age</th>
                            <th>DOB</th>
                            <th>Contact Phone</th>
                            <th>Email Address</th>
                            <th>City / Address</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="patients-table-body">
                        ${renderSkeletonTable(8, 4)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination" id="patients-pagination">
                <span id="patients-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    // Event listeners
    container.querySelector('#add-patient-btn').addEventListener('click', () => openPatientModal());
    container.querySelector('#refresh-patients-btn').addEventListener('click', () => loadPatients(container));
    
    const searchInput = container.querySelector('#patient-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderPatientsRows(container);
    });

    await loadPatients(container);
}

export async function loadPatients(container) {
    const tbody = container.querySelector('#patients-table-body');
    const countLabel = container.querySelector('#patients-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(8, 4);
        patientsData = await api.patients.getAll();
        state.updateCache('patients', patientsData);
        renderPatientsRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderPatientsRows(container) {
    const tbody = container.querySelector('#patients-table-body');
    const countLabel = container.querySelector('#patients-count-label');
    if (!tbody) return;

    const filtered = patientsData.filter(p => {
        if (!searchQuery) return true;
        return (p.name && p.name.toLowerCase().includes(searchQuery)) ||
               (p.phone && p.phone.toLowerCase().includes(searchQuery)) ||
               (p.email && p.email.toLowerCase().includes(searchQuery)) ||
               (p.address && p.address.toLowerCase().includes(searchQuery)) ||
               (String(p.patientId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${patientsData.length} patients`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8">${renderEmptyState('No patients found', 'Try adjusting your search query or create a new patient record.')}</td></tr>`;
        refreshIcons();
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const age = calculateAge(p.dob);
        return `
            <tr>
                <td class="cell-bold">#${p.patientId}</td>
                <td>
                    <div class="cell-bold">${escapeHtml(p.name)}</div>
                </td>
                <td>
                    <span class="badge ${p.gender === 'Female' ? 'badge-info' : 'badge-neutral'}">${escapeHtml(p.gender || 'Unknown')}</span>
                    <span class="cell-subtext">${age}</span>
                </td>
                <td>${formatDate(p.dob)}</td>
                <td>${escapeHtml(p.phone || '—')}</td>
                <td>${escapeHtml(p.email || '—')}</td>
                <td><span class="text-truncate" style="max-width: 160px; display: inline-block;">${escapeHtml(p.address || '—')}</span></td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-icon-only view-patient-btn" data-id="${p.patientId}" title="View Record">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon-only edit-patient-btn" data-id="${p.patientId}" title="Edit Patient">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon-only text-danger delete-patient-btn" data-id="${p.patientId}" title="Delete Patient">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    refreshIcons();

    // Attach row events
    tbody.querySelectorAll('.view-patient-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const patient = patientsData.find(p => p.patientId === id);
            if (patient) openPatientDetailModal(patient);
        });
    });

    tbody.querySelectorAll('.edit-patient-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const patient = patientsData.find(p => p.patientId === id);
            if (patient) openPatientModal(patient);
        });
    });

    tbody.querySelectorAll('.delete-patient-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const patient = patientsData.find(p => p.patientId === id);
            if (patient) confirmDeletePatient(patient, container);
        });
    });
}

export function openPatientModal(patient = null) {
    const isEdit = !!patient;
    const title = isEdit ? `Edit Patient #${patient.patientId}` : 'Register New Patient';

    const bodyHtml = `
        <form id="patient-form">
            <div class="form-group">
                <label class="form-label">Full Name <span class="req">*</span></label>
                <input type="text" class="form-control" id="p-name" required value="${escapeHtml(patient?.name || '')}" placeholder="e.g. Eleanor Brooks">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Date of Birth</label>
                    <input type="date" class="form-control" id="p-dob" value="${escapeHtml(patient?.dob || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Gender</label>
                    <select class="form-control" id="p-gender">
                        <option value="Male" ${patient?.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${patient?.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${patient?.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-control" id="p-phone" value="${escapeHtml(patient?.phone || '')}" placeholder="e.g. 9123456780">
                </div>
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-control" id="p-email" value="${escapeHtml(patient?.email || '')}" placeholder="e.g. patient@example.com">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Residential Address</label>
                <textarea class="form-control" id="p-address" rows="2" placeholder="Full residential street, city, pin">${escapeHtml(patient?.address || '')}</textarea>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-patient-btn">
            ${isEdit ? 'Update Patient Record' : 'Save Patient'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'md' });

    modal.querySelector('#save-patient-btn').addEventListener('click', async () => {
        const name = modal.querySelector('#p-name').value.trim();
        const dob = modal.querySelector('#p-dob').value || null;
        const gender = modal.querySelector('#p-gender').value;
        const phone = modal.querySelector('#p-phone').value.trim() || null;
        const email = modal.querySelector('#p-email').value.trim() || null;
        const address = modal.querySelector('#p-address').value.trim() || null;

        if (!name) {
            showToast('Patient name is required', 'warning');
            modal.querySelector('#p-name').focus();
            return;
        }

        const payload = { name, dob, gender, phone, email, address };
        const saveBtn = modal.querySelector('#save-patient-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (isEdit) {
                await api.patients.update(patient.patientId, payload);
                showToast(`Patient #${patient.patientId} updated successfully`, 'success');
            } else {
                const created = await api.patients.create(payload);
                showToast(`Patient #${created.patientId} registered successfully`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-patients');
            if (container) loadPatients(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Patient Record' : 'Save Patient';
            showToast(err.message, 'error');
        }
    });
}

export function openPatientDetailModal(patient) {
    const age = calculateAge(patient.dob);
    const bodyHtml = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">Patient ID</div>
                <div class="detail-value">#${patient.patientId}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Full Name</div>
                <div class="detail-value">${escapeHtml(patient.name)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Gender & Age</div>
                <div class="detail-value">${escapeHtml(patient.gender || '—')} (${age})</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Date of Birth</div>
                <div class="detail-value">${formatDate(patient.dob)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Phone Number</div>
                <div class="detail-value">${escapeHtml(patient.phone || '—')}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Email Address</div>
                <div class="detail-value">${escapeHtml(patient.email || '—')}</div>
            </div>
        </div>
        <div class="detail-item" style="margin-bottom: 20px;">
            <div class="detail-label">Residential Address</div>
            <div class="detail-value" style="font-weight: normal;">${escapeHtml(patient.address || '—')}</div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Close</button>
            <button class="btn btn-primary" id="edit-from-detail-btn">
                <i data-lucide="pencil"></i> Edit Details
            </button>
        </div>
    `;

    const modal = showModal({
        title: `Patient Profile: ${patient.name}`,
        bodyHtml,
        size: 'lg'
    });

    modal.querySelector('#edit-from-detail-btn')?.addEventListener('click', () => {
        closeActiveModal();
        openPatientModal(patient);
    });
}

function confirmDeletePatient(patient, container) {
    showConfirm({
        title: 'Delete Patient Record',
        message: `Are you sure you want to delete patient "${patient.name}" (ID #${patient.patientId})? This action will cascade delete all linked appointments, records, and bills.`,
        confirmText: 'Delete Patient',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.patients.delete(patient.patientId);
            showToast(`Patient #${patient.patientId} deleted`, 'success');
            await loadPatients(container);
        }
    });
}
