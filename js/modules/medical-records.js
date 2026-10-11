/**
 * MediCore - Electronic Medical Records (EMR) Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, formatDate, renderSkeletonTable,
    renderEmptyState, renderErrorState, refreshIcons
} from '../ui.js';

let recordsData = [];
let searchQuery = '';

export async function renderMedicalRecords(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="record-search-input" placeholder="Search diagnosis, treatment, patient, doctor..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-records-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-record-btn">
                        <i data-lucide="file-plus"></i> New Medical Record
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Record ID</th>
                            <th>Patient Name</th>
                            <th>Attending Doctor</th>
                            <th>Date</th>
                            <th>Clinical Diagnosis</th>
                            <th>Prescribed Treatment</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="records-table-body">
                        ${renderSkeletonTable(7, 3)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination">
                <span id="records-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#add-record-btn').addEventListener('click', () => openRecordModal());
    container.querySelector('#refresh-records-btn').addEventListener('click', () => loadRecords(container));

    const searchInput = container.querySelector('#record-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderRecordsRows(container);
    });

    await loadRecords(container);
}

export async function loadRecords(container) {
    const tbody = container.querySelector('#records-table-body');
    const countLabel = container.querySelector('#records-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(7, 3);
        const [recs, patients, docs] = await Promise.all([
            api.medicalRecords.getAll(),
            api.patients.getAll().catch(() => []),
            api.doctors.getAll().catch(() => [])
        ]);
        recordsData = recs;
        state.updateCache('patients', patients);
        state.updateCache('doctors', docs);
        renderRecordsRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderRecordsRows(container) {
    const tbody = container.querySelector('#records-table-body');
    const countLabel = container.querySelector('#records-count-label');
    if (!tbody) return;

    const filtered = recordsData.filter(r => {
        if (!searchQuery) return true;
        return (r.diagnosis && r.diagnosis.toLowerCase().includes(searchQuery)) ||
               (r.treatment && r.treatment.toLowerCase().includes(searchQuery)) ||
               (r.patientName && r.patientName.toLowerCase().includes(searchQuery)) ||
               (r.doctorName && r.doctorName.toLowerCase().includes(searchQuery)) ||
               (r.notes && r.notes.toLowerCase().includes(searchQuery)) ||
               (String(r.recordId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${recordsData.length} electronic medical records`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">${renderEmptyState('No medical records found', 'Document diagnostic and treatment summaries for patients.')}</td></tr>`;
        refreshIcons();
        return;
    }

    tbody.innerHTML = filtered.map(r => `
        <tr>
            <td class="cell-bold">#EMR-${r.recordId}</td>
            <td>
                <div class="cell-bold">${escapeHtml(r.patientName || `Patient #${r.patientId}`)}</div>
            </td>
            <td>
                <div class="cell-bold">${escapeHtml(r.doctorName || `Doctor #${r.doctorId}`)}</div>
            </td>
            <td>${formatDate(r.recordDate)}</td>
            <td>
                <div style="font-weight: 600; color: var(--text-primary); max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHtml(r.diagnosis || '—')}
                </div>
            </td>
            <td>
                <div style="max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHtml(r.treatment || '—')}
                </div>
            </td>
            <td style="text-align: right;">
                <div class="table-actions" style="justify-content: flex-end;">
                    <button class="btn btn-secondary btn-icon-only view-record-btn" data-id="${r.recordId}" title="View Details">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-icon-only edit-record-btn" data-id="${r.recordId}" title="Edit Record">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn btn-secondary btn-icon-only text-danger delete-record-btn" data-id="${r.recordId}" title="Delete Record">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    refreshIcons();

    tbody.querySelectorAll('.view-record-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const record = recordsData.find(r => r.recordId === id);
            if (record) openRecordDetailModal(record);
        });
    });

    tbody.querySelectorAll('.edit-record-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const record = recordsData.find(r => r.recordId === id);
            if (record) openRecordModal(record);
        });
    });

    tbody.querySelectorAll('.delete-record-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const record = recordsData.find(r => r.recordId === id);
            if (record) confirmDeleteRecord(record, container);
        });
    });
}

export function openRecordDetailModal(record) {
    const bodyHtml = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">Record Reference</div>
                <div class="detail-value">#EMR-${record.recordId}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Examination Date</div>
                <div class="detail-value">${formatDate(record.recordDate)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Patient</div>
                <div class="detail-value">${escapeHtml(record.patientName || `Patient #${record.patientId}`)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Attending Physician</div>
                <div class="detail-value">${escapeHtml(record.doctorName || `Doctor #${record.doctorId}`)}</div>
            </div>
        </div>

        <div style="margin-bottom: 18px;">
            <div class="detail-label">Clinical Diagnosis</div>
            <div style="background: var(--bg-main); padding: 14px; border-radius: var(--radius-md); border-left: 4px solid var(--primary); font-weight: 600; color: var(--text-primary); margin-top: 4px;">
                ${escapeHtml(record.diagnosis || 'No specific diagnosis noted.')}
            </div>
        </div>

        <div style="margin-bottom: 18px;">
            <div class="detail-label">Recommended Treatment & Therapy</div>
            <div style="background: var(--bg-main); padding: 14px; border-radius: var(--radius-md); color: var(--text-secondary); margin-top: 4px;">
                ${escapeHtml(record.treatment || 'No treatment prescribed.')}
            </div>
        </div>

        <div style="margin-bottom: 24px;">
            <div class="detail-label">Clinical Notes & Observations</div>
            <div style="background: var(--bg-main); padding: 14px; border-radius: var(--radius-md); color: var(--text-secondary); margin-top: 4px; font-family: var(--font-sans);">
                ${escapeHtml(record.notes || 'No extra clinical notes.')}
            </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Close</button>
            <button class="btn btn-primary" id="edit-from-emr-btn">
                <i data-lucide="pencil"></i> Edit Medical Record
            </button>
        </div>
    `;

    const modal = showModal({
        title: `EMR Clinical Summary #${record.recordId}`,
        bodyHtml,
        size: 'lg'
    });

    modal.querySelector('#edit-from-emr-btn')?.addEventListener('click', () => {
        closeActiveModal();
        openRecordModal(record);
    });
}

export async function openRecordModal(record = null) {
    const isEdit = !!record;
    const title = isEdit ? `Edit Medical Record #EMR-${record.recordId}` : 'Create Electronic Medical Record';

    let [patients, docs] = [state.cache.patients, state.cache.doctors];
    if (!patients || patients.length === 0) patients = await api.patients.getAll().catch(() => []);
    if (!docs || docs.length === 0) docs = await api.doctors.getAll().catch(() => []);

    const patientOptions = patients.map(p => 
        `<option value="${p.patientId}" ${record && record.patientId === p.patientId ? 'selected' : ''}>#${p.patientId} - ${escapeHtml(p.name)}</option>`
    ).join('');

    const doctorOptions = docs.map(d => 
        `<option value="${d.doctorId}" ${record && record.doctorId === d.doctorId ? 'selected' : ''}>Dr. ${escapeHtml(d.name)}</option>`
    ).join('');

    const today = new Date().toISOString().split('T')[0];
    const dateVal = record?.recordDate || today;

    const bodyHtml = `
        <form id="record-form">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Patient <span class="req">*</span></label>
                    <select class="form-control" id="emr-patient" required>
                        <option value="">Select Patient...</option>
                        ${patientOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Attending Doctor <span class="req">*</span></label>
                    <select class="form-control" id="emr-doctor" required>
                        <option value="">Select Doctor...</option>
                        ${doctorOptions}
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Record Date</label>
                <input type="date" class="form-control" id="emr-date" value="${dateVal}">
            </div>

            <div class="form-group">
                <label class="form-label">Diagnosis</label>
                <input type="text" class="form-control" id="emr-diag" value="${escapeHtml(record?.diagnosis || '')}" placeholder="e.g. Hypertension, Acute Bronchitis, Type 2 Diabetes">
            </div>

            <div class="form-group">
                <label class="form-label">Prescribed Treatment</label>
                <textarea class="form-control" id="emr-treat" rows="2" placeholder="e.g. Antibiotic regimen for 7 days, daily BP monitoring">${escapeHtml(record?.treatment || '')}</textarea>
            </div>

            <div class="form-group">
                <label class="form-label">Clinical Observations & Progress Notes</label>
                <textarea class="form-control" id="emr-notes" rows="3" placeholder="Blood pressure, vitals, allergy notes, follow-up instructions...">${escapeHtml(record?.notes || '')}</textarea>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-emr-btn">
            ${isEdit ? 'Update Medical Record' : 'Save Record'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'md' });

    modal.querySelector('#save-emr-btn').addEventListener('click', async () => {
        const patientIdVal = modal.querySelector('#emr-patient').value;
        const doctorIdVal = modal.querySelector('#emr-doctor').value;
        const recordDate = modal.querySelector('#emr-date').value || null;
        const diagnosis = modal.querySelector('#emr-diag').value.trim() || null;
        const treatment = modal.querySelector('#emr-treat').value.trim() || null;
        const notes = modal.querySelector('#emr-notes').value.trim() || null;

        if (!patientIdVal) {
            showToast('Please select a patient', 'warning');
            modal.querySelector('#emr-patient').focus();
            return;
        }
        if (!doctorIdVal) {
            showToast('Please select a doctor', 'warning');
            modal.querySelector('#emr-doctor').focus();
            return;
        }

        const payload = {
            patientId: Number(patientIdVal),
            doctorId: Number(doctorIdVal),
            recordDate,
            diagnosis,
            treatment,
            notes
        };

        const saveBtn = modal.querySelector('#save-emr-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (isEdit) {
                await api.medicalRecords.update(record.recordId, payload);
                showToast(`Record #EMR-${record.recordId} updated`, 'success');
            } else {
                const created = await api.medicalRecords.create(payload);
                showToast(`Record #EMR-${created.recordId} created`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-medical-records');
            if (container) loadRecords(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Medical Record' : 'Save Record';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeleteRecord(record, container) {
    showConfirm({
        title: 'Delete Medical Record',
        message: `Are you sure you want to delete medical record #EMR-${record.recordId} for "${record.patientName}"? This action cannot be undone.`,
        confirmText: 'Delete Record',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.medicalRecords.delete(record.recordId);
            showToast(`Medical record #EMR-${record.recordId} deleted`, 'success');
            await loadRecords(container);
        }
    });
}
