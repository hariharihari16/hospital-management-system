/**
 * MediCore - User Accounts & Authentication Management Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, renderSkeletonTable, renderEmptyState,
    renderErrorState, refreshIcons
} from '../ui.js';

let usersData = [];
let staffList = [];
let searchQuery = '';

export async function renderUsers(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div style="background: var(--info-bg); border-bottom: 1px solid var(--info-border); padding: 12px 20px; display: flex; align-items: center; gap: 10px; font-size: 0.84rem; color: var(--info-text);">
                <i data-lucide="shield-check" style="color: var(--info); width: 18px; height: 18px;"></i>
                <span><strong>Security & Access Control:</strong> Accounts are mapped 1-to-1 to verified hospital staff members. Passwords are sent securely to the Spring Boot REST backend.</span>
            </div>

            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="user-search-input" placeholder="Search accounts by username, staff name..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-users-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-user-btn">
                        <i data-lucide="user-plus"></i> Create User Account
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Username</th>
                            <th>Associated Staff Member</th>
                            <th>Account Type</th>
                            <th>Security Status</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
                        ${renderSkeletonTable(6, 4)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination">
                <span id="users-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#add-user-btn').addEventListener('click', () => openUserModal());
    container.querySelector('#refresh-users-btn').addEventListener('click', () => loadUsers(container));

    const searchInput = container.querySelector('#user-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderUsersRows(container);
    });

    await loadUsers(container);
}

export async function loadUsers(container) {
    const tbody = container.querySelector('#users-table-body');
    const countLabel = container.querySelector('#users-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(6, 4);
        const [users, staff] = await Promise.all([
            api.auth.getUsers(),
            api.staff.getAll().catch(() => [])
        ]);
        usersData = users;
        staffList = staff;
        state.updateCache('staff', staff);
        renderUsersRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderUsersRows(container) {
    const tbody = container.querySelector('#users-table-body');
    const countLabel = container.querySelector('#users-count-label');
    if (!tbody) return;

    const filtered = usersData.filter(u => {
        if (!searchQuery) return true;
        return (u.username && u.username.toLowerCase().includes(searchQuery)) ||
               (u.staffName && u.staffName.toLowerCase().includes(searchQuery)) ||
               (String(u.userId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${usersData.length} system user logins`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">${renderEmptyState('No user logins found', 'Provision staff credentials for system access.')}</td></tr>`;
        refreshIcons();
        return;
    }

    tbody.innerHTML = filtered.map(u => {
        const hasHash = u.password && u.password.startsWith('$2a$');
        return `
            <tr>
                <td class="cell-bold">#USR-${u.userId}</td>
                <td>
                    <div class="cell-bold" style="display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="shield" style="width: 14px; height: 14px; color: var(--primary);"></i>
                        ${escapeHtml(u.username)}
                    </div>
                </td>
                <td>
                    <div class="cell-bold">${escapeHtml(u.staffName || `Staff #${u.staffId}`)}</div>
                    <span class="cell-subtext">Staff ID #${u.staffId}</span>
                </td>
                <td>
                    <span class="badge ${u.username.includes('admin') ? 'badge-info' : 'badge-neutral'}">
                        ${u.username.includes('admin') ? 'System Admin' : 'Staff Access'}
                    </span>
                </td>
                <td>
                    <span class="badge ${hasHash ? 'badge-success' : 'badge-warning'}">
                        ${hasHash ? 'Encrypted Hash' : 'Active'}
                    </span>
                </td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-icon-only edit-user-btn" data-id="${u.userId}" title="Edit User">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon-only text-danger delete-user-btn" data-id="${u.userId}" title="Delete User">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    refreshIcons();

    tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const user = usersData.find(u => u.userId === id);
            if (user) openUserModal(user);
        });
    });

    tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const user = usersData.find(u => u.userId === id);
            if (user) confirmDeleteUser(user, container);
        });
    });
}

export function openUserModal(user = null) {
    const isEdit = !!user;
    const title = isEdit ? `Edit User #${user.userId} (${user.username})` : 'Create System User Account';

    // Find staff who do not already have an account (or include current user's staff)
    const existingStaffIds = new Set(usersData.map(u => u.staffId));
    const availableStaff = staffList.filter(s => {
        if (isEdit && s.staffId === user.staffId) return true;
        return !existingStaffIds.has(s.staffId);
    });

    const staffOptions = (availableStaff.length > 0 ? availableStaff : staffList).map(s => 
        `<option value="${s.staffId}" ${user && user.staffId === s.staffId ? 'selected' : ''}>#${s.staffId} - ${escapeHtml(s.name)} (${escapeHtml(s.role || '')})</option>`
    ).join('');

    const bodyHtml = `
        <form id="user-form">
            <div class="form-group">
                <label class="form-label">Associated Staff Member <span class="req">*</span></label>
                <select class="form-control" id="usr-staff" required>
                    <option value="">Select Staff Member...</option>
                    ${staffOptions}
                </select>
                <div class="form-hint">Backend constraint: each staff member can have at most one user account.</div>
            </div>

            <div class="form-group">
                <label class="form-label">Username <span class="req">*</span></label>
                <input type="text" class="form-control" id="usr-name" required value="${escapeHtml(user?.username || '')}" placeholder="e.g. dr_sharma, nurse_anita">
            </div>

            <div class="form-group">
                <label class="form-label">${isEdit ? 'New Password (or keep current)' : 'Password'} <span class="req">*</span></label>
                <input type="password" class="form-control" id="usr-pass" ${isEdit ? '' : 'required'} placeholder="${isEdit ? 'Leave blank to preserve current' : 'Enter account password'}">
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-user-btn">
            ${isEdit ? 'Update Account' : 'Create Account'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'sm' });

    modal.querySelector('#save-user-btn').addEventListener('click', async () => {
        const staffIdVal = modal.querySelector('#usr-staff').value;
        const username = modal.querySelector('#usr-name').value.trim();
        let password = modal.querySelector('#usr-pass').value;

        if (!staffIdVal) {
            showToast('Please select a staff member', 'warning');
            modal.querySelector('#usr-staff').focus();
            return;
        }
        if (!username) {
            showToast('Username is required', 'warning');
            modal.querySelector('#usr-name').focus();
            return;
        }

        if (isEdit && !password) {
            // Keep current password
            password = user.password;
        } else if (!password) {
            showToast('Password is required', 'warning');
            modal.querySelector('#usr-pass').focus();
            return;
        }

        const payload = {
            staffId: Number(staffIdVal),
            username,
            password
        };

        const saveBtn = modal.querySelector('#save-user-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (isEdit) {
                await api.auth.updateUser(user.userId, payload);
                showToast(`User account #${user.userId} updated`, 'success');
            } else {
                const created = await api.auth.createUser(payload);
                showToast(`User account "${created.username}" created`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-user-accounts');
            if (container) loadUsers(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Account' : 'Create Account';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeleteUser(user, container) {
    showConfirm({
        title: 'Delete User Account',
        message: `Are you sure you want to delete login account for "${user.username}"?`,
        confirmText: 'Delete Account',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.auth.deleteUser(user.userId);
            showToast(`User #${user.userId} deleted`, 'success');
            await loadUsers(container);
        }
    });
}
