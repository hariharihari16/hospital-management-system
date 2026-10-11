/**
 * MediCore - Prescriptions Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, formatDate, renderSkeletonTable,
    renderEmptyState, renderErrorState, refreshIcons
} from '../ui.js';

let prescriptionsData = [];
let searchQuery = '';

export async function renderPrescriptions(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="rx-search-input" placeholder="Search by patient, doctor, instructions..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-rx-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-rx-btn">
                        <i data-lucide="clipboard-pen"></i> New Prescription
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Rx ID</th>
                            <th>Patient Name</th>
                            <th>Prescribing Doctor</th>
                            <th>Date Issued</th>
                            <th>Medicines Prescribed</th>
                            <th>Dosage & Instructions</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="rx-table-body">
                        ${renderSkeletonTable(7, 3)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination">
                <span id="rx-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#add-rx-btn').addEventListener('click', () => openPrescriptionModal());
    container.querySelector('#refresh-rx-btn').addEventListener('click', () => loadPrescriptions(container));

    const searchInput = container.querySelector('#rx-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderPrescriptionsRows(container);
    });

    await loadPrescriptions(container);
}

export async function loadPrescriptions(container) {
    const tbody = container.querySelector('#rx-table-body');
    const countLabel = container.querySelector('#rx-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(7, 3);
        const [rxs, patients, docs, meds] = await Promise.all([
            api.prescriptions.getAll(),
            api.patients.getAll().catch(() => []),
            api.doctors.getAll().catch(() => []),
            api.medicines.getAll().catch(() => [])
        ]);
        prescriptionsData = rxs;
        state.updateCache('patients', patients);
        state.updateCache('doctors', docs);
        state.updateCache('medicines', meds);
        renderPrescriptionsRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderPrescriptionsRows(container) {
    const tbody = container.querySelector('#rx-table-body');
    const countLabel = container.querySelector('#rx-count-label');
    if (!tbody) return;

    const filtered = prescriptionsData.filter(rx => {
        if (!searchQuery) return true;
        return (rx.patientName && rx.patientName.toLowerCase().includes(searchQuery)) ||
               (rx.doctorName && rx.doctorName.toLowerCase().includes(searchQuery)) ||
               (rx.instructions && rx.instructions.toLowerCase().includes(searchQuery)) ||
               (String(rx.prescriptionId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${prescriptionsData.length} prescriptions`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">${renderEmptyState('No prescriptions found', 'Issue digital prescriptions with medications and instructions.')}</td></tr>`;
        refreshIcons();
        return;
    }

    tbody.innerHTML = filtered.map(rx => {
        const medCount = rx.medicines ? rx.medicines.length : 0;
        const medSummary = rx.medicines && rx.medicines.length > 0 
            ? rx.medicines.map(m => `${m.medicineName} (${m.quantity})`).join(', ')
            : 'No medications attached';

        return `
            <tr>
                <td class="cell-bold">#RX-${rx.prescriptionId}</td>
                <td>
                    <div class="cell-bold">${escapeHtml(rx.patientName || `Patient #${rx.patientId}`)}</div>
                </td>
                <td>
                    <div class="cell-bold">${escapeHtml(rx.doctorName || `Doctor #${rx.doctorId}`)}</div>
                </td>
                <td>${formatDate(rx.prescriptionDate)}</td>
                <td>
                    <span class="badge ${medCount > 0 ? 'badge-success' : 'badge-neutral'}">${medCount} Items</span>
                    <span class="cell-subtext" style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(medSummary)}</span>
                </td>
                <td>
                    <div style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${escapeHtml(rx.instructions || 'Standard dosage')}
                    </div>
                </td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-icon-only view-rx-btn" data-id="${rx.prescriptionId}" title="View Prescription">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon-only edit-rx-btn" data-id="${rx.prescriptionId}" title="Edit Prescription">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon-only text-danger delete-rx-btn" data-id="${rx.prescriptionId}" title="Delete Prescription">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    refreshIcons();

    tbody.querySelectorAll('.view-rx-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const rx = prescriptionsData.find(r => r.prescriptionId === id);
            if (rx) openPrescriptionDetailModal(rx);
        });
    });

    tbody.querySelectorAll('.edit-rx-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const rx = prescriptionsData.find(r => r.prescriptionId === id);
            if (rx) openPrescriptionModal(rx);
        });
    });

    tbody.querySelectorAll('.delete-rx-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const rx = prescriptionsData.find(r => r.prescriptionId === id);
            if (rx) confirmDeletePrescription(rx, container);
        });
    });
}

export function openPrescriptionDetailModal(rx) {
    const medsHtml = rx.medicines && rx.medicines.length > 0 
        ? rx.medicines.map(m => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-main); border-radius: var(--radius-md); border: 1px solid var(--card-border); margin-bottom: 8px;">
                <div style="font-weight: 600; color: var(--text-primary);"><i data-lucide="pill" style="width: 15px; height: 15px; color: var(--primary);"></i> ${escapeHtml(m.medicineName || `Medicine #${m.medicineId}`)}</div>
                <div class="badge badge-info">Qty: ${m.quantity}</div>
            </div>
        `).join('')
        : '<p style="color: var(--text-muted); font-size: 0.88rem;">No medicine items listed in this prescription.</p>';

    const bodyHtml = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">Prescription ID</div>
                <div class="detail-value">#RX-${rx.prescriptionId}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Date Issued</div>
                <div class="detail-value">${formatDate(rx.prescriptionDate)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Patient</div>
                <div class="detail-value">${escapeHtml(rx.patientName || `Patient #${rx.patientId}`)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Prescribing Doctor</div>
                <div class="detail-value">${escapeHtml(rx.doctorName || `Doctor #${rx.doctorId}`)}</div>
            </div>
        </div>

        <div style="margin-bottom: 20px;">
            <div class="detail-label" style="margin-bottom: 8px;">Medication Orders</div>
            <div>${medsHtml}</div>
        </div>

        <div style="margin-bottom: 24px;">
            <div class="detail-label">Physician Instructions</div>
            <div style="background: var(--bg-main); padding: 14px; border-radius: var(--radius-md); color: var(--text-secondary); margin-top: 4px;">
                ${escapeHtml(rx.instructions || 'Follow standard pharmacy dispensary directions.')}
            </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Close</button>
            <button class="btn btn-primary" id="edit-from-rx-btn">
                <i data-lucide="pencil"></i> Edit Prescription
            </button>
        </div>
    `;

    const modal = showModal({
        title: `Medical Prescription #RX-${rx.prescriptionId}`,
        bodyHtml,
        size: 'md'
    });

    modal.querySelector('#edit-from-rx-btn')?.addEventListener('click', () => {
        closeActiveModal();
        openPrescriptionModal(rx);
    });
}

export async function openPrescriptionModal(rx = null) {
    const isEdit = !!rx;
    const title = isEdit ? `Edit Prescription #RX-${rx.prescriptionId}` : 'Issue New Prescription';

    let [patients, docs, meds] = [state.cache.patients, state.cache.doctors, state.cache.medicines];
    if (!patients || patients.length === 0) patients = await api.patients.getAll().catch(() => []);
    if (!docs || docs.length === 0) docs = await api.doctors.getAll().catch(() => []);
    if (!meds || meds.length === 0) meds = await api.medicines.getAll().catch(() => []);

    const patientOptions = patients.map(p => 
        `<option value="${p.patientId}" ${rx && rx.patientId === p.patientId ? 'selected' : ''}>#${p.patientId} - ${escapeHtml(p.name)}</option>`
    ).join('');

    const doctorOptions = docs.map(d => 
        `<option value="${d.doctorId}" ${rx && rx.doctorId === d.doctorId ? 'selected' : ''}>Dr. ${escapeHtml(d.name)}</option>`
    ).join('');

    const today = new Date().toISOString().split('T')[0];
    const dateVal = rx?.prescriptionDate || today;

    // Build initial medicine items
    let initialMeds = rx?.medicines || [];

    const bodyHtml = `
        <form id="rx-form">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Patient <span class="req">*</span></label>
                    <select class="form-control" id="rx-patient" required>
                        <option value="">Select Patient...</option>
                        ${patientOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Doctor <span class="req">*</span></label>
                    <select class="form-control" id="rx-doctor" required>
                        <option value="">Select Doctor...</option>
                        ${doctorOptions}
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Prescription Date</label>
                <input type="date" class="form-control" id="rx-date" value="${dateVal}">
            </div>

            <div class="form-group">
                <label class="form-label">Clinical Instructions / Dosage Directives</label>
                <textarea class="form-control" id="rx-instructions" rows="2" placeholder="e.g. Take 1 tablet daily with water before bedtime">${escapeHtml(rx?.instructions || '')}</textarea>
            </div>

            <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <label class="form-label" style="margin-bottom: 0;">Prescribed Medications</label>
                    <button type="button" class="btn btn-sm btn-secondary" id="add-med-row-btn">
                        <i data-lucide="plus"></i> Add Medication
                    </button>
                </div>
                <div id="rx-meds-rows-container" style="display: flex; flex-direction: column; gap: 8px;">
                    <!-- dynamic med rows go here -->
                </div>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-rx-btn">
            ${isEdit ? 'Update Prescription' : 'Issue Prescription'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'lg' });
    const medsContainer = modal.querySelector('#rx-meds-rows-container');

    function appendMedicineRow(selectedMedId = null, qty = 1) {
        const row = document.createElement('div');
        row.className = 'rx-med-row';
        row.style.cssText = 'display: grid; grid-template-columns: 1fr 100px 40px; gap: 8px; align-items: center;';

        const medSelectHtml = meds.map(m => `
            <option value="${m.medicineId}" ${selectedMedId === m.medicineId ? 'selected' : ''}>
                ${escapeHtml(m.medicineName)} (${escapeHtml(m.dosage || 'Standard')})
            </option>
        `).join('');

        row.innerHTML = `
            <select class="form-control med-select" required>
                <option value="">Select Medicine...</option>
                ${medSelectHtml}
            </select>
            <input type="number" class="form-control med-qty" min="1" value="${qty}" placeholder="Qty" required>
            <button type="button" class="btn btn-secondary btn-icon-only text-danger remove-med-btn" title="Remove">
                <i data-lucide="trash-2"></i>
            </button>
        `;

        row.querySelector('.remove-med-btn').addEventListener('click', () => {
            row.remove();
        });

        medsContainer.appendChild(row);
        refreshIcons();
    }

    modal.querySelector('#add-med-row-btn').addEventListener('click', () => {
        appendMedicineRow();
    });

    // Populate existing meds or add one empty row
    if (initialMeds.length > 0) {
        initialMeds.forEach(m => appendMedicineRow(m.medicineId, m.quantity));
    } else {
        appendMedicineRow();
    }

    modal.querySelector('#save-rx-btn').addEventListener('click', async () => {
        const patientIdVal = modal.querySelector('#rx-patient').value;
        const doctorIdVal = modal.querySelector('#rx-doctor').value;
        const prescriptionDate = modal.querySelector('#rx-date').value || null;
        const instructions = modal.querySelector('#rx-instructions').value.trim() || null;

        if (!patientIdVal) {
            showToast('Please select a patient', 'warning');
            modal.querySelector('#rx-patient').focus();
            return;
        }
        if (!doctorIdVal) {
            showToast('Please select a doctor', 'warning');
            modal.querySelector('#rx-doctor').focus();
            return;
        }

        // Collect medicines
        const medRows = medsContainer.querySelectorAll('.rx-med-row');
        const medicinesList = [];
        for (const row of medRows) {
            const medId = row.querySelector('.med-select').value;
            const qty = row.querySelector('.med-qty').value;
            if (medId) {
                medicinesList.push({
                    medicineId: Number(medId),
                    quantity: Number(qty) || 1
                });
            }
        }

        const payload = {
            patientId: Number(patientIdVal),
            doctorId: Number(doctorIdVal),
            prescriptionDate,
            instructions,
            medicines: medicinesList
        };

        const saveBtn = modal.querySelector('#save-rx-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (isEdit) {
                await api.prescriptions.update(rx.prescriptionId, payload);
                showToast(`Prescription #RX-${rx.prescriptionId} updated`, 'success');
            } else {
                const created = await api.prescriptions.create(payload);
                showToast(`Prescription #RX-${created.prescriptionId} issued`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-prescriptions');
            if (container) loadPrescriptions(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Prescription' : 'Issue Prescription';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeletePrescription(rx, container) {
    showConfirm({
        title: 'Delete Prescription',
        message: `Are you sure you want to delete prescription #RX-${rx.prescriptionId}? Linked dispensary items will be unlinked.`,
        confirmText: 'Delete Prescription',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.prescriptions.delete(rx.prescriptionId);
            showToast(`Prescription #RX-${rx.prescriptionId} deleted`, 'success');
            await loadPrescriptions(container);
        }
    });
}
