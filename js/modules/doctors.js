/**
 * MediCore - Doctors Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, renderSkeletonTable, renderEmptyState,
    renderErrorState, refreshIcons
} from '../ui.js';

let doctorsData = [];
let departmentsList = [];
let searchQuery = '';

export async function renderDoctors(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="doctor-search-input" placeholder="Search doctors by name, specialization, department..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-doctors-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-doctor-btn">
                        <i data-lucide="user-plus"></i> Add Doctor
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table" id="doctors-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Doctor Name</th>
                            <th>Specialization</th>
                            <th>Department</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="doctors-table-body">
                        ${renderSkeletonTable(7, 4)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination">
                <span id="doctors-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#add-doctor-btn').addEventListener('click', () => openDoctorModal());
    container.querySelector('#refresh-doctors-btn').addEventListener('click', () => loadDoctors(container));

    const searchInput = container.querySelector('#doctor-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderDoctorsRows(container);
    });

    await loadDoctors(container);
}

export async function loadDoctors(container) {
    const tbody = container.querySelector('#doctors-table-body');
    const countLabel = container.querySelector('#doctors-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(7, 4);
        const [docs, depts] = await Promise.all([
            api.doctors.getAll(),
            api.departments.getAll().catch(() => [])
        ]);
        doctorsData = docs;
        departmentsList = depts;
        state.updateCache('doctors', doctorsData);
        state.updateCache('departments', departmentsList);
        renderDoctorsRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderDoctorsRows(container) {
    const tbody = container.querySelector('#doctors-table-body');
    const countLabel = container.querySelector('#doctors-count-label');
    if (!tbody) return;

    const filtered = doctorsData.filter(d => {
        if (!searchQuery) return true;
        return (d.name && d.name.toLowerCase().includes(searchQuery)) ||
               (d.specialization && d.specialization.toLowerCase().includes(searchQuery)) ||
               (d.deptName && d.deptName.toLowerCase().includes(searchQuery)) ||
               (d.phone && d.phone.toLowerCase().includes(searchQuery)) ||
               (d.email && d.email.toLowerCase().includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${doctorsData.length} doctors`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">${renderEmptyState('No doctors found', 'Add doctors to assign them to appointments and departments.')}</td></tr>`;
        refreshIcons();
        return;
    }

    tbody.innerHTML = filtered.map(d => `
        <tr>
            <td class="cell-bold">#${d.doctorId}</td>
            <td>
                <div class="cell-bold">${escapeHtml(d.name)}</div>
            </td>
            <td>
                <span class="badge badge-info">${escapeHtml(d.specialization || 'General')}</span>
            </td>
            <td>
                <span class="cell-bold">${escapeHtml(d.deptName || '—')}</span>
            </td>
            <td>${escapeHtml(d.phone || '—')}</td>
            <td>${escapeHtml(d.email || '—')}</td>
            <td style="text-align: right;">
                <div class="table-actions" style="justify-content: flex-end;">
                    <button class="btn btn-secondary btn-icon-only edit-doctor-btn" data-id="${d.doctorId}" title="Edit Doctor">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn btn-secondary btn-icon-only text-danger delete-doctor-btn" data-id="${d.doctorId}" title="Delete Doctor">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    refreshIcons();

    tbody.querySelectorAll('.edit-doctor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const doc = doctorsData.find(d => d.doctorId === id);
            if (doc) openDoctorModal(doc);
        });
    });

    tbody.querySelectorAll('.delete-doctor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const doc = doctorsData.find(d => d.doctorId === id);
            if (doc) confirmDeleteDoctor(doc, container);
        });
    });
}

export function openDoctorModal(doctor = null) {
    const isEdit = !!doctor;
    const title = isEdit ? `Edit Doctor #${doctor.doctorId}` : 'Add New Doctor';

    const deptOptions = departmentsList.map(dept => 
        `<option value="${dept.deptId}" ${doctor && doctor.deptId === dept.deptId ? 'selected' : ''}>${escapeHtml(dept.deptName)}</option>`
    ).join('');

    const bodyHtml = `
        <form id="doctor-form">
            <div class="form-group">
                <label class="form-label">Doctor Name <span class="req">*</span></label>
                <input type="text" class="form-control" id="doc-name" required value="${escapeHtml(doctor?.name || '')}" placeholder="e.g. Dr. Rajesh Sharma">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Specialization</label>
                    <input type="text" class="form-control" id="doc-spec" value="${escapeHtml(doctor?.specialization || '')}" placeholder="e.g. Cardiologist, Neurologist">
                </div>
                <div class="form-group">
                    <label class="form-label">Department <span class="req">*</span></label>
                    <select class="form-control" id="doc-dept" required>
                        <option value="">Select Department...</option>
                        ${deptOptions}
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-control" id="doc-phone" value="${escapeHtml(doctor?.phone || '')}" placeholder="e.g. 9876543210">
                </div>
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-control" id="doc-email" value="${escapeHtml(doctor?.email || '')}" placeholder="e.g. doctor@hospital.com">
                </div>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-doctor-btn">
            ${isEdit ? 'Update Doctor' : 'Save Doctor'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'md' });

    modal.querySelector('#save-doctor-btn').addEventListener('click', async () => {
        const name = modal.querySelector('#doc-name').value.trim();
        const specialization = modal.querySelector('#doc-spec').value.trim() || null;
        const deptIdVal = modal.querySelector('#doc-dept').value;
        const phone = modal.querySelector('#doc-phone').value.trim() || null;
        const email = modal.querySelector('#doc-email').value.trim() || null;

        if (!name) {
            showToast('Doctor name is required', 'warning');
            modal.querySelector('#doc-name').focus();
            return;
        }

        if (!deptIdVal) {
            showToast('Please select a department', 'warning');
            modal.querySelector('#doc-dept').focus();
            return;
        }

        const deptId = Number(deptIdVal);
        const payload = { name, specialization, deptId, phone, email };

        const saveBtn = modal.querySelector('#save-doctor-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (isEdit) {
                await api.doctors.update(doctor.doctorId, payload);
                showToast(`Doctor #${doctor.doctorId} updated successfully`, 'success');
            } else {
                const created = await api.doctors.create(payload);
                showToast(`Doctor "${created.name}" added successfully`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-doctors');
            if (container) loadDoctors(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Doctor' : 'Save Doctor';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeleteDoctor(doctor, container) {
    showConfirm({
        title: 'Delete Doctor',
        message: `Are you sure you want to delete "${doctor.name}"? Appointments linked to this doctor will be affected.`,
        confirmText: 'Delete Doctor',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.doctors.delete(doctor.doctorId);
            showToast(`Doctor #${doctor.doctorId} removed`, 'success');
            await loadDoctors(container);
        }
    });
}
