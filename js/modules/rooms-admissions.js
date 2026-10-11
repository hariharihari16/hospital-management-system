/**
 * MediCore - Rooms & Inpatient Admissions Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, formatDate, renderStatusBadge, renderSkeletonTable,
    renderEmptyState, renderErrorState, refreshIcons
} from '../ui.js';

let roomsData = [];
let admissionsData = [];
let subTab = 'admissions'; // 'admissions' | 'rooms'
let searchQuery = '';

export async function renderRoomsAdmissions(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="btn-group" style="display: flex; gap: 4px; background: var(--bg-main); padding: 3px; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
                        <button class="btn btn-sm ${subTab === 'admissions' ? 'btn-primary' : 'btn-secondary'}" id="subtab-admissions-btn">
                            <i data-lucide="bed"></i> Inpatient Admissions
                        </button>
                        <button class="btn btn-sm ${subTab === 'rooms' ? 'btn-primary' : 'btn-secondary'}" id="subtab-rooms-btn">
                            <i data-lucide="door-open"></i> Hospital Rooms & Wards
                        </button>
                    </div>
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="ra-search-input" placeholder="Search rooms, patients, wards..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-ra-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="primary-ra-action-btn">
                        <i data-lucide="${subTab === 'admissions' ? 'user-plus' : 'plus'}"></i>
                        ${subTab === 'admissions' ? 'Admit Patient' : 'Add New Room'}
                    </button>
                </div>
            </div>

            <div id="ra-content-area">
                <!-- Admissions or Rooms Table will render here -->
                <div class="table-responsive">
                    <table class="data-table">
                        <tbody id="ra-skeleton-body">
                            ${renderSkeletonTable(6, 4)}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="table-pagination">
                <span id="ra-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    const searchInput = container.querySelector('#ra-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderActiveSubTab(container);
    });

    container.querySelector('#subtab-admissions-btn').addEventListener('click', () => {
        subTab = 'admissions';
        updateSubTabButtons(container);
        renderActiveSubTab(container);
    });

    container.querySelector('#subtab-rooms-btn').addEventListener('click', () => {
        subTab = 'rooms';
        updateSubTabButtons(container);
        renderActiveSubTab(container);
    });

    container.querySelector('#refresh-ra-btn').addEventListener('click', () => loadRoomsAndAdmissions(container));
    container.querySelector('#primary-ra-action-btn').addEventListener('click', () => {
        if (subTab === 'admissions') {
            openAdmissionModal();
        } else {
            openRoomModal();
        }
    });

    await loadRoomsAndAdmissions(container);
}

function updateSubTabButtons(container) {
    const admBtn = container.querySelector('#subtab-admissions-btn');
    const roomBtn = container.querySelector('#subtab-rooms-btn');
    const primaryBtn = container.querySelector('#primary-ra-action-btn');

    if (subTab === 'admissions') {
        admBtn.className = 'btn btn-sm btn-primary';
        roomBtn.className = 'btn btn-sm btn-secondary';
        primaryBtn.innerHTML = '<i data-lucide="user-plus"></i> Admit Patient';
    } else {
        admBtn.className = 'btn btn-sm btn-secondary';
        roomBtn.className = 'btn btn-sm btn-primary';
        primaryBtn.innerHTML = '<i data-lucide="plus"></i> Add New Room';
    }
    refreshIcons();
}

export async function loadRoomsAndAdmissions(container) {
    const contentArea = container.querySelector('#ra-content-area');
    const countLabel = container.querySelector('#ra-count-label');

    try {
        if (contentArea) contentArea.innerHTML = `<div class="table-responsive"><table class="data-table"><tbody>${renderSkeletonTable(6, 4)}</tbody></table></div>`;
        const [rooms, admissions, patients] = await Promise.all([
            api.rooms.getAll(),
            api.admissions.getAll(),
            api.patients.getAll().catch(() => [])
        ]);
        roomsData = rooms;
        admissionsData = admissions;
        state.updateCache('rooms', rooms);
        state.updateCache('patients', patients);
        renderActiveSubTab(container);
    } catch (err) {
        if (contentArea) contentArea.innerHTML = renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()');
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderActiveSubTab(container) {
    if (subTab === 'admissions') {
        renderAdmissionsTable(container);
    } else {
        renderRoomsTable(container);
    }
}

function renderAdmissionsTable(container) {
    const contentArea = container.querySelector('#ra-content-area');
    const countLabel = container.querySelector('#ra-count-label');
    if (!contentArea) return;

    const filtered = admissionsData.filter(a => {
        if (!searchQuery) return true;
        return (a.patientName && a.patientName.toLowerCase().includes(searchQuery)) ||
               (a.roomNumber && a.roomNumber.toLowerCase().includes(searchQuery)) ||
               (a.status && a.status.toLowerCase().includes(searchQuery)) ||
               (String(a.admissionId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${admissionsData.length} inpatient admissions`;
    }

    if (filtered.length === 0) {
        contentArea.innerHTML = renderEmptyState('No admissions found', 'Register patients to rooms for inpatient monitoring and care.');
        refreshIcons();
        return;
    }

    contentArea.innerHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Admission ID</th>
                        <th>Patient Name</th>
                        <th>Room Assigned</th>
                        <th>Admission Date</th>
                        <th>Discharge Date</th>
                        <th>Status</th>
                        <th style="text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody id="admissions-tbody">
                    ${filtered.map(a => `
                        <tr>
                            <td class="cell-bold">#ADM-${a.admissionId}</td>
                            <td>
                                <div class="cell-bold">${escapeHtml(a.patientName || `Patient #${a.patientId}`)}</div>
                            </td>
                            <td>
                                <span class="badge badge-info"><i data-lucide="door-closed" style="width: 12px; height: 12px;"></i> Room ${escapeHtml(a.roomNumber || `#${a.roomId}`)}</span>
                            </td>
                            <td>${formatDate(a.admissionDate)}</td>
                            <td>${formatDate(a.dischargeDate)}</td>
                            <td>${renderStatusBadge(a.status)}</td>
                            <td style="text-align: right;">
                                <div class="table-actions" style="justify-content: flex-end;">
                                    <button class="btn btn-secondary btn-icon-only edit-adm-btn" data-id="${a.admissionId}" title="Edit / Discharge">
                                        <i data-lucide="pencil"></i>
                                    </button>
                                    <button class="btn btn-secondary btn-icon-only text-danger delete-adm-btn" data-id="${a.admissionId}" title="Delete Admission">
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

    contentArea.querySelectorAll('.edit-adm-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const adm = admissionsData.find(a => a.admissionId === id);
            if (adm) openAdmissionModal(adm);
        });
    });

    contentArea.querySelectorAll('.delete-adm-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const adm = admissionsData.find(a => a.admissionId === id);
            if (adm) confirmDeleteAdmission(adm, container);
        });
    });
}

function renderRoomsTable(container) {
    const contentArea = container.querySelector('#ra-content-area');
    const countLabel = container.querySelector('#ra-count-label');
    if (!contentArea) return;

    // Check which rooms are currently occupied
    const activeAdmissionStatuses = ['ADMITTED', 'OCCUPIED', 'ACTIVE', 'Admitted', 'Occupied', 'Active'];
    const occupiedRoomIds = new Set(
        admissionsData
            .filter(a => activeAdmissionStatuses.includes(a.status))
            .map(a => a.roomId)
    );

    const filtered = roomsData.filter(r => {
        if (!searchQuery) return true;
        return (r.roomNumber && r.roomNumber.toLowerCase().includes(searchQuery)) ||
               (r.roomType && r.roomType.toLowerCase().includes(searchQuery)) ||
               (r.ward && r.ward.toLowerCase().includes(searchQuery)) ||
               (String(r.roomId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${roomsData.length} hospital rooms`;
    }

    if (filtered.length === 0) {
        contentArea.innerHTML = renderEmptyState('No hospital rooms registered', 'Add General, ICU, and VIP suites for patients.');
        refreshIcons();
        return;
    }

    contentArea.innerHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Room ID</th>
                        <th>Room Number</th>
                        <th>Room Category</th>
                        <th>Ward / Wing</th>
                        <th>Current Occupancy</th>
                        <th style="text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody id="rooms-tbody">
                    ${filtered.map(r => {
                        const isOccupied = occupiedRoomIds.has(r.roomId);
                        const statusBadge = isOccupied
                            ? '<span class="badge badge-danger"><i data-lucide="user-x" style="width: 12px; height: 12px;"></i> Occupied</span>'
                            : '<span class="badge badge-success"><i data-lucide="check" style="width: 12px; height: 12px;"></i> Available</span>';

                        return `
                            <tr>
                                <td class="cell-bold">#RM-${r.roomId}</td>
                                <td>
                                    <div class="cell-bold">${escapeHtml(r.roomNumber)}</div>
                                </td>
                                <td>
                                    <span class="badge badge-neutral">${escapeHtml(r.roomType || 'General')}</span>
                                </td>
                                <td>${escapeHtml(r.ward || 'East Wing')}</td>
                                <td>${statusBadge}</td>
                                <td style="text-align: right;">
                                    <div class="table-actions" style="justify-content: flex-end;">
                                        <button class="btn btn-secondary btn-icon-only edit-room-btn" data-id="${r.roomId}" title="Edit Room">
                                            <i data-lucide="pencil"></i>
                                        </button>
                                        <button class="btn btn-secondary btn-icon-only text-danger delete-room-btn" data-id="${r.roomId}" title="Delete Room">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    refreshIcons();

    contentArea.querySelectorAll('.edit-room-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const rm = roomsData.find(r => r.roomId === id);
            if (rm) openRoomModal(rm);
        });
    });

    contentArea.querySelectorAll('.delete-room-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const rm = roomsData.find(r => r.roomId === id);
            if (rm) confirmDeleteRoom(rm, container);
        });
    });
}

export async function openAdmissionModal(admission = null) {
    const isEdit = !!admission;
    const title = isEdit ? `Update Admission #ADM-${admission.admissionId}` : 'Admit Patient to Room';

    let [patients, rooms] = [state.cache.patients, state.cache.rooms];
    if (!patients || patients.length === 0) patients = await api.patients.getAll().catch(() => []);
    if (!rooms || rooms.length === 0) rooms = await api.rooms.getAll().catch(() => []);

    const patientOptions = patients.map(p => 
        `<option value="${p.patientId}" ${admission && admission.patientId === p.patientId ? 'selected' : ''}>#${p.patientId} - ${escapeHtml(p.name)}</option>`
    ).join('');

    const roomOptions = rooms.map(r => 
        `<option value="${r.roomId}" ${admission && admission.roomId === r.roomId ? 'selected' : ''}>Room ${escapeHtml(r.roomNumber)} (${escapeHtml(r.roomType || 'Standard')}, ${escapeHtml(r.ward || '')})</option>`
    ).join('');

    const today = new Date().toISOString().split('T')[0];
    const admDate = admission?.admissionDate || today;

    const bodyHtml = `
        <form id="admission-form">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Patient <span class="req">*</span></label>
                    <select class="form-control" id="adm-patient" required>
                        <option value="">Select Patient...</option>
                        ${patientOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Room Assigned <span class="req">*</span></label>
                    <select class="form-control" id="adm-room" required>
                        <option value="">Select Room...</option>
                        ${roomOptions}
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Admission Date <span class="req">*</span></label>
                    <input type="date" class="form-control" id="adm-date" required value="${admDate}">
                </div>
                <div class="form-group">
                    <label class="form-label">Discharge Date</label>
                    <input type="date" class="form-control" id="adm-dis-date" value="${admission?.dischargeDate || ''}">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Admission Status</label>
                <select class="form-control" id="adm-status">
                    <option value="ADMITTED" ${admission?.status === 'ADMITTED' || admission?.status === 'Admitted' ? 'selected' : ''}>Admitted</option>
                    <option value="DISCHARGED" ${admission?.status === 'DISCHARGED' || admission?.status === 'Discharged' ? 'selected' : ''}>Discharged</option>
                    <option value="TRANSFERRED" ${admission?.status === 'TRANSFERRED' ? 'selected' : ''}>Transferred</option>
                </select>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-adm-btn">
            ${isEdit ? 'Update Admission' : 'Confirm Admission'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'md' });

    modal.querySelector('#save-adm-btn').addEventListener('click', async () => {
        const patientIdVal = modal.querySelector('#adm-patient').value;
        const roomIdVal = modal.querySelector('#adm-room').value;
        const admissionDate = modal.querySelector('#adm-date').value;
        const dischargeDate = modal.querySelector('#adm-dis-date').value || null;
        const status = modal.querySelector('#adm-status').value;

        if (!patientIdVal) {
            showToast('Please select a patient', 'warning');
            modal.querySelector('#adm-patient').focus();
            return;
        }
        if (!roomIdVal) {
            showToast('Please select a room', 'warning');
            modal.querySelector('#adm-room').focus();
            return;
        }
        if (!admissionDate) {
            showToast('Admission date is required', 'warning');
            modal.querySelector('#adm-date').focus();
            return;
        }

        const payload = {
            patientId: Number(patientIdVal),
            roomId: Number(roomIdVal),
            admissionDate,
            dischargeDate,
            status
        };

        const saveBtn = modal.querySelector('#save-adm-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Processing...';

        try {
            if (isEdit) {
                await api.admissions.update(admission.admissionId, payload);
                showToast(`Admission #${admission.admissionId} updated`, 'success');
            } else {
                const created = await api.admissions.create(payload);
                showToast(`Patient admitted in Room #${created.roomNumber || created.roomId}`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-rooms-admissions');
            if (container) loadRoomsAndAdmissions(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Admission' : 'Confirm Admission';
            showToast(err.message, 'error');
        }
    });
}

export function openRoomModal(room = null) {
    const isEdit = !!room;
    const title = isEdit ? `Edit Room #RM-${room.roomId}` : 'Add New Hospital Room';

    const bodyHtml = `
        <form id="room-form">
            <div class="form-group">
                <label class="form-label">Room Number / Identifier <span class="req">*</span></label>
                <input type="text" class="form-control" id="rm-num" required value="${escapeHtml(room?.roomNumber || '')}" placeholder="e.g. 101, A-102, 201-ICU">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Room Type / Category</label>
                    <select class="form-control" id="rm-type">
                        <option value="General" ${room?.roomType === 'General' ? 'selected' : ''}>General Ward</option>
                        <option value="ICU" ${room?.roomType === 'ICU' ? 'selected' : ''}>Intensive Care Unit (ICU)</option>
                        <option value="VIP Suite" ${room?.roomType === 'VIP Suite' ? 'selected' : ''}>VIP Suite</option>
                        <option value="Semi-Private" ${room?.roomType === 'Semi-Private' ? 'selected' : ''}>Semi-Private</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Ward / Wing Location</label>
                    <input type="text" class="form-control" id="rm-ward" value="${escapeHtml(room?.ward || '')}" placeholder="e.g. East Wing, Critical Care">
                </div>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-rm-btn">
            ${isEdit ? 'Update Room' : 'Add Room'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'sm' });

    modal.querySelector('#save-rm-btn').addEventListener('click', async () => {
        const roomNumber = modal.querySelector('#rm-num').value.trim();
        const roomType = modal.querySelector('#rm-type').value;
        const ward = modal.querySelector('#rm-ward').value.trim() || null;

        if (!roomNumber) {
            showToast('Room number is required', 'warning');
            modal.querySelector('#rm-num').focus();
            return;
        }

        const payload = { roomNumber, roomType, ward };
        const saveBtn = modal.querySelector('#save-rm-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (isEdit) {
                await api.rooms.update(room.roomId, payload);
                showToast(`Room #${room.roomId} updated`, 'success');
            } else {
                const created = await api.rooms.create(payload);
                showToast(`Room "${created.roomNumber}" created`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-rooms-admissions');
            if (container) loadRoomsAndAdmissions(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Room' : 'Add Room';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeleteAdmission(adm, container) {
    showConfirm({
        title: 'Delete Admission Record',
        message: `Are you sure you want to delete admission #ADM-${adm.admissionId} for "${adm.patientName}"?`,
        confirmText: 'Delete Admission',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.admissions.delete(adm.admissionId);
            showToast(`Admission #ADM-${adm.admissionId} deleted`, 'success');
            await loadRoomsAndAdmissions(container);
        }
    });
}

function confirmDeleteRoom(room, container) {
    showConfirm({
        title: 'Delete Hospital Room',
        message: `Are you sure you want to delete room "${room.roomNumber}"?`,
        confirmText: 'Delete Room',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.rooms.delete(room.roomId);
            showToast(`Room #${room.roomId} deleted`, 'success');
            await loadRoomsAndAdmissions(container);
        }
    });
}
