/**
 * MediCore - Hospital Staff Directory Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, renderSkeletonTable, renderEmptyState,
    renderErrorState, refreshIcons
} from '../ui.js';

let staffData = [];
let departmentsList = [];
let searchQuery = '';

export async function renderStaff(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="staff-search-input" placeholder="Search staff by name, role, department..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-staff-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-staff-btn">
                        <i data-lucide="user-plus"></i> Add Staff Member
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Staff ID</th>
                            <th>Staff Name</th>
                            <th>Role / Designation</th>
                            <th>Department</th>
                            <th>Phone</th>
                            <th>Email Address</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="staff-table-body">
                        ${renderSkeletonTable(7, 4)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination">
                <span id="staff-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#add-staff-btn').addEventListener('click', () => openStaffModal());
    container.querySelector('#refresh-staff-btn').addEventListener('click', () => loadStaff(container));

    const searchInput = container.querySelector('#staff-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderStaffRows(container);
    });

    await loadStaff(container);
}

export async function loadStaff(container) {
    const tbody = container.querySelector('#staff-table-body');
    const countLabel = container.querySelector('#staff-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(7, 4);
        const [staff, depts] = await Promise.all([
            api.staff.getAll(),
            api.departments.getAll().catch(() => [])
        ]);
        staffData = staff;
        departmentsList = depts;
        state.updateCache('staff', staff);
        state.updateCache('departments', depts);
        renderStaffRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderStaffRows(container) {
    const tbody = container.querySelector('#staff-table-body');
    const countLabel = container.querySelector('#staff-count-label');
    if (!tbody) return;

    const filtered = staffData.filter(s => {
        if (!searchQuery) return true;
        return (s.name && s.name.toLowerCase().includes(searchQuery)) ||
               (s.role && s.role.toLowerCase().includes(searchQuery)) ||
               (s.deptName && s.deptName.toLowerCase().includes(searchQuery)) ||
               (s.phone && s.phone.toLowerCase().includes(searchQuery)) ||
               (s.email && s.email.toLowerCase().includes(searchQuery)) ||
               (String(s.staffId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${staffData.length} staff members`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">${renderEmptyState('No staff members found', 'Add hospital administrators, nurses, technicians, and specialists.')}</td></tr>`;
        refreshIcons();
        return;
    }

    tbody.innerHTML = filtered.map(s => `
        <tr>
            <td class="cell-bold">#STF-${s.staffId}</td>
            <td>
                <div class="cell-bold">${escapeHtml(s.name)}</div>
            </td>
            <td>
                <span class="badge badge-info">${escapeHtml(s.role || 'Staff')}</span>
            </td>
            <td>
                <span class="cell-bold">${escapeHtml(s.deptName || '—')}</span>
            </td>
            <td>${escapeHtml(s.phone || '—')}</td>
            <td>${escapeHtml(s.email || '—')}</td>
            <td style="text-align: right;">
                <div class="table-actions" style="justify-content: flex-end;">
                    <button class="btn btn-secondary btn-icon-only edit-staff-btn" data-id="${s.staffId}" title="Edit Staff">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn btn-secondary btn-icon-only text-danger delete-staff-btn" data-id="${s.staffId}" title="Delete Staff">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    refreshIcons();

    tbody.querySelectorAll('.edit-staff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const staff = staffData.find(s => s.staffId === id);
            if (staff) openStaffModal(staff);
        });
    });

    tbody.querySelectorAll('.delete-staff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const staff = staffData.find(s => s.staffId === id);
            if (staff) confirmDeleteStaff(staff, container);
        });
    });
}

export function openStaffModal(staff = null) {
    const isEdit = !!staff;
    const title = isEdit ? `Edit Staff #${staff.staffId}` : 'Add Staff Member';

    const deptOptions = departmentsList.map(dept => 
        `<option value="${dept.deptId}" ${staff && staff.deptId === dept.deptId ? 'selected' : ''}>${escapeHtml(dept.deptName)}</option>`
    ).join('');

    const bodyHtml = `
        <form id="staff-form">
            <div class="form-group">
                <label class="form-label">Full Name <span class="req">*</span></label>
                <input type="text" class="form-control" id="stf-name" required value="${escapeHtml(staff?.name || '')}" placeholder="e.g. Vikram Malhotra, Kavita Deshmukh">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Role / Job Title</label>
                    <select class="form-control" id="stf-role">
                        <option value="Administrator" ${staff?.role === 'Administrator' ? 'selected' : ''}>Administrator</option>
                        <option value="Head Nurse" ${staff?.role === 'Head Nurse' ? 'selected' : ''}>Head Nurse</option>
                        <option value="Staff Nurse" ${staff?.role === 'Staff Nurse' ? 'selected' : ''}>Staff Nurse</option>
                        <option value="Lab Technician" ${staff?.role === 'Lab Technician' ? 'selected' : ''}>Lab Technician</option>
                        <option value="Billing Officer" ${staff?.role === 'Billing Officer' ? 'selected' : ''}>Billing Officer</option>
                        <option value="Pharmacist" ${staff?.role === 'Pharmacist' ? 'selected' : ''}>Pharmacist</option>
                        <option value="Receptionist" ${staff?.role === 'Receptionist' ? 'selected' : ''}>Receptionist</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Assigned Department <span class="req">*</span></label>
                    <select class="form-control" id="stf-dept" required>
                        <option value="">Select Department...</option>
                        ${deptOptions}
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-control" id="stf-phone" value="${escapeHtml(staff?.phone || '')}" placeholder="e.g. 9988776650">
                </div>
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-control" id="stf-email" value="${escapeHtml(staff?.email || '')}" placeholder="e.g. staff@hospital.com">
                </div>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-staff-btn">
            ${isEdit ? 'Update Staff Member' : 'Save Staff Member'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'md' });

    modal.querySelector('#save-staff-btn').addEventListener('click', async () => {
        const name = modal.querySelector('#stf-name').value.trim();
        const role = modal.querySelector('#stf-role').value;
        const deptIdVal = modal.querySelector('#stf-dept').value;
        const phone = modal.querySelector('#stf-phone').value.trim() || null;
        const email = modal.querySelector('#stf-email').value.trim() || null;

        if (!name) {
            showToast('Staff name is required', 'warning');
            modal.querySelector('#stf-name').focus();
            return;
        }
        if (!deptIdVal) {
            showToast('Please select a department', 'warning');
            modal.querySelector('#stf-dept').focus();
            return;
        }

        const payload = {
            name,
            role,
            deptId: Number(deptIdVal),
            phone,
            email
        };

        const saveBtn = modal.querySelector('#save-staff-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (isEdit) {
                await api.staff.update(staff.staffId, payload);
                showToast(`Staff member #${staff.staffId} updated`, 'success');
            } else {
                const created = await api.staff.create(payload);
                showToast(`Staff member "${created.name}" created`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-staff');
            if (container) loadStaff(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Staff Member' : 'Save Staff Member';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeleteStaff(staff, container) {
    showConfirm({
        title: 'Delete Staff Member',
        message: `Are you sure you want to delete staff member "${staff.name}" (#STF-${staff.staffId})? Any linked system user login will also be deleted.`,
        confirmText: 'Delete Staff',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.staff.delete(staff.staffId);
            showToast(`Staff member #${staff.staffId} deleted`, 'success');
            await loadStaff(container);
        }
    });
}
