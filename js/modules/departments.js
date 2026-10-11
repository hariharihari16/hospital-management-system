/**
 * MediCore - Departments Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, renderSkeletonTable, renderEmptyState,
    renderErrorState, refreshIcons
} from '../ui.js';

let departmentsData = [];
let searchQuery = '';

export async function renderDepartments(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="dept-search-input" placeholder="Search departments by name or building location..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-depts-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-dept-btn">
                        <i data-lucide="building-2"></i> Add Department
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Department Name</th>
                            <th>Building & Location</th>
                            <th>Active Doctors</th>
                            <th>Assigned Staff</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="depts-table-body">
                        ${renderSkeletonTable(6, 3)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination">
                <span id="depts-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#add-dept-btn').addEventListener('click', () => openDepartmentModal());
    container.querySelector('#refresh-depts-btn').addEventListener('click', () => loadDepartments(container));

    const searchInput = container.querySelector('#dept-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderDepartmentRows(container);
    });

    await loadDepartments(container);
}

export async function loadDepartments(container) {
    const tbody = container.querySelector('#depts-table-body');
    const countLabel = container.querySelector('#depts-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(6, 3);
        const [depts, docs, staff] = await Promise.all([
            api.departments.getAll(),
            api.doctors.getAll().catch(() => []),
            api.staff.getAll().catch(() => [])
        ]);
        departmentsData = depts;
        state.updateCache('departments', departmentsData);
        state.updateCache('doctors', docs);
        state.updateCache('staff', staff);
        renderDepartmentRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderDepartmentRows(container) {
    const tbody = container.querySelector('#depts-table-body');
    const countLabel = container.querySelector('#depts-count-label');
    if (!tbody) return;

    const doctors = state.cache.doctors || [];
    const staff = state.cache.staff || [];

    const filtered = departmentsData.filter(d => {
        if (!searchQuery) return true;
        return (d.deptName && d.deptName.toLowerCase().includes(searchQuery)) ||
               (d.location && d.location.toLowerCase().includes(searchQuery)) ||
               (String(d.deptId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${departmentsData.length} departments`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">${renderEmptyState('No departments found', 'Create departments like Cardiology, Neurology, Pediatrics...')}</td></tr>`;
        refreshIcons();
        return;
    }

    tbody.innerHTML = filtered.map(d => {
        const docCount = doctors.filter(doc => doc.deptId === d.deptId).length;
        const staffCount = staff.filter(s => s.deptId === d.deptId).length;
        return `
            <tr>
                <td class="cell-bold">#${d.deptId}</td>
                <td>
                    <div class="cell-bold">${escapeHtml(d.deptName)}</div>
                </td>
                <td>
                    <i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--text-muted); vertical-align: middle;"></i>
                    ${escapeHtml(d.location || 'Main Campus')}
                </td>
                <td>
                    <span class="badge badge-info">${docCount} ${docCount === 1 ? 'Doctor' : 'Doctors'}</span>
                </td>
                <td>
                    <span class="badge badge-neutral">${staffCount} ${staffCount === 1 ? 'Staff' : 'Staff'}</span>
                </td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-icon-only edit-dept-btn" data-id="${d.deptId}" title="Edit Department">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon-only text-danger delete-dept-btn" data-id="${d.deptId}" title="Delete Department">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    refreshIcons();

    tbody.querySelectorAll('.edit-dept-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const dept = departmentsData.find(d => d.deptId === id);
            if (dept) openDepartmentModal(dept);
        });
    });

    tbody.querySelectorAll('.delete-dept-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const dept = departmentsData.find(d => d.deptId === id);
            if (dept) confirmDeleteDepartment(dept, container);
        });
    });
}

export function openDepartmentModal(department = null) {
    const isEdit = !!department;
    const title = isEdit ? `Edit Department #${department.deptId}` : 'Add New Department';

    const bodyHtml = `
        <form id="department-form">
            <div class="form-group">
                <label class="form-label">Department Name <span class="req">*</span></label>
                <input type="text" class="form-control" id="dept-name" required value="${escapeHtml(department?.deptName || '')}" placeholder="e.g. Cardiology, Neurology">
            </div>

            <div class="form-group">
                <label class="form-label">Location / Building Floor</label>
                <input type="text" class="form-control" id="dept-loc" value="${escapeHtml(department?.location || '')}" placeholder="e.g. Building A, Floor 2">
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-dept-btn">
            ${isEdit ? 'Update Department' : 'Save Department'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'sm' });

    modal.querySelector('#save-dept-btn').addEventListener('click', async () => {
        const deptName = modal.querySelector('#dept-name').value.trim();
        const location = modal.querySelector('#dept-loc').value.trim() || null;

        if (!deptName) {
            showToast('Department name is required', 'warning');
            modal.querySelector('#dept-name').focus();
            return;
        }

        const payload = { deptName, location };
        const saveBtn = modal.querySelector('#save-dept-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (isEdit) {
                await api.departments.update(department.deptId, payload);
                showToast(`Department #${department.deptId} updated`, 'success');
            } else {
                const created = await api.departments.create(payload);
                showToast(`Department "${created.deptName}" created`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-departments');
            if (container) loadDepartments(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Department' : 'Save Department';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeleteDepartment(department, container) {
    showConfirm({
        title: 'Delete Department',
        message: `Are you sure you want to delete department "${department.deptName}"?`,
        confirmText: 'Delete Department',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.departments.delete(department.deptId);
            showToast(`Department #${department.deptId} deleted`, 'success');
            await loadDepartments(container);
        }
    });
}
