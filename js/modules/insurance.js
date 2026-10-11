/**
 * MediCore - Patient Insurance Policies Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, formatDate, renderSkeletonTable,
    renderEmptyState, renderErrorState, refreshIcons
} from '../ui.js';

let insuranceData = [];
let searchQuery = '';

export async function renderInsurance(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="ins-search-input" placeholder="Search insurance by provider, policy number, patient..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-ins-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-ins-btn">
                        <i data-lucide="shield-plus"></i> Add Policy
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Policy ID</th>
                            <th>Insurance Provider</th>
                            <th>Policy Number</th>
                            <th>Beneficiary Patient</th>
                            <th>Coverage Terms</th>
                            <th>Expiry / Validity</th>
                            <th>Policy Status</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="ins-table-body">
                        ${renderSkeletonTable(8, 3)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination">
                <span id="ins-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#add-ins-btn').addEventListener('click', () => openInsuranceModal());
    container.querySelector('#refresh-ins-btn').addEventListener('click', () => loadInsurance(container));

    const searchInput = container.querySelector('#ins-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderInsuranceRows(container);
    });

    await loadInsurance(container);
}

export async function loadInsurance(container) {
    const tbody = container.querySelector('#ins-table-body');
    const countLabel = container.querySelector('#ins-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(8, 3);
        const [ins, patients] = await Promise.all([
            api.insurance.getAll(),
            api.patients.getAll().catch(() => [])
        ]);
        insuranceData = ins;
        state.updateCache('patients', patients);
        renderInsuranceRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderInsuranceRows(container) {
    const tbody = container.querySelector('#ins-table-body');
    const countLabel = container.querySelector('#ins-count-label');
    if (!tbody) return;

    const filtered = insuranceData.filter(i => {
        if (!searchQuery) return true;
        return (i.providerName && i.providerName.toLowerCase().includes(searchQuery)) ||
               (i.policyNumber && i.policyNumber.toLowerCase().includes(searchQuery)) ||
               (i.patientName && i.patientName.toLowerCase().includes(searchQuery)) ||
               (i.coverageDetails && i.coverageDetails.toLowerCase().includes(searchQuery)) ||
               (String(i.insuranceId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${insuranceData.length} insurance policies`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8">${renderEmptyState('No insurance records found', 'Link third-party health insurance policies to patient profiles.')}</td></tr>`;
        refreshIcons();
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    tbody.innerHTML = filtered.map(i => {
        const isExpired = i.validity && i.validity < todayStr;
        const statusBadge = isExpired
            ? '<span class="badge badge-danger">Expired</span>'
            : '<span class="badge badge-success">Active</span>';

        return `
            <tr>
                <td class="cell-bold">#INS-${i.insuranceId}</td>
                <td>
                    <div class="cell-bold">${escapeHtml(i.providerName)}</div>
                </td>
                <td>
                    <span class="badge badge-neutral">${escapeHtml(i.policyNumber || '—')}</span>
                </td>
                <td>
                    <div class="cell-bold">${escapeHtml(i.patientName || `Patient #${i.patientId}`)}</div>
                </td>
                <td>
                    <div style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.84rem;">
                        ${escapeHtml(i.coverageDetails || 'Standard coverage')}
                    </div>
                </td>
                <td>${formatDate(i.validity)}</td>
                <td>${statusBadge}</td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-icon-only edit-ins-btn" data-id="${i.insuranceId}" title="Edit Policy">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon-only text-danger delete-ins-btn" data-id="${i.insuranceId}" title="Delete Policy">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    refreshIcons();

    tbody.querySelectorAll('.edit-ins-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const ins = insuranceData.find(i => i.insuranceId === id);
            if (ins) openInsuranceModal(ins);
        });
    });

    tbody.querySelectorAll('.delete-ins-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const ins = insuranceData.find(i => i.insuranceId === id);
            if (ins) confirmDeleteInsurance(ins, container);
        });
    });
}

export async function openInsuranceModal(insurance = null) {
    const isEdit = !!insurance;
    const title = isEdit ? `Edit Policy #INS-${insurance.insuranceId}` : 'Register Health Insurance Policy';

    let patients = state.cache.patients;
    if (!patients || patients.length === 0) {
        patients = await api.patients.getAll().catch(() => []);
        state.updateCache('patients', patients);
    }

    const patientOptions = patients.map(p => 
        `<option value="${p.patientId}" ${insurance && insurance.patientId === p.patientId ? 'selected' : ''}>#${p.patientId} - ${escapeHtml(p.name)}</option>`
    ).join('');

    const bodyHtml = `
        <form id="ins-form">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Beneficiary Patient <span class="req">*</span></label>
                    <select class="form-control" id="ins-patient" required>
                        <option value="">Select Patient...</option>
                        ${patientOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Insurance Provider <span class="req">*</span></label>
                    <input type="text" class="form-control" id="ins-provider" required value="${escapeHtml(insurance?.providerName || '')}" placeholder="e.g. Star Health, BlueCross, Medicare">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Policy Number</label>
                    <input type="text" class="form-control" id="ins-policy-no" value="${escapeHtml(insurance?.policyNumber || '')}" placeholder="e.g. STAR-POL-98214">
                </div>
                <div class="form-group">
                    <label class="form-label">Valid Until</label>
                    <input type="date" class="form-control" id="ins-validity" value="${insurance?.validity || ''}">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Coverage Details & Limit</label>
                <textarea class="form-control" id="ins-coverage" rows="2" placeholder="e.g. Inpatient hospitalization up to 500,000 INR, cashless network">${escapeHtml(insurance?.coverageDetails || '')}</textarea>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-ins-btn">
            ${isEdit ? 'Update Policy' : 'Save Policy'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'md' });

    modal.querySelector('#save-ins-btn').addEventListener('click', async () => {
        const patientIdVal = modal.querySelector('#ins-patient').value;
        const providerName = modal.querySelector('#ins-provider').value.trim();
        const policyNumber = modal.querySelector('#ins-policy-no').value.trim() || null;
        const validity = modal.querySelector('#ins-validity').value || null;
        const coverageDetails = modal.querySelector('#ins-coverage').value.trim() || null;

        if (!patientIdVal) {
            showToast('Please select a patient', 'warning');
            modal.querySelector('#ins-patient').focus();
            return;
        }
        if (!providerName) {
            showToast('Provider name is required', 'warning');
            modal.querySelector('#ins-provider').focus();
            return;
        }

        const payload = {
            patientId: Number(patientIdVal),
            providerName,
            policyNumber,
            validity,
            coverageDetails
        };

        const saveBtn = modal.querySelector('#save-ins-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (isEdit) {
                await api.insurance.update(insurance.insuranceId, payload);
                showToast(`Policy #INS-${insurance.insuranceId} updated`, 'success');
            } else {
                const created = await api.insurance.create(payload);
                showToast(`Policy #INS-${created.insuranceId} registered`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-insurance');
            if (container) loadInsurance(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Policy' : 'Save Policy';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeleteInsurance(ins, container) {
    showConfirm({
        title: 'Delete Insurance Policy',
        message: `Are you sure you want to delete policy #${ins.insuranceId} (${ins.providerName}) for "${ins.patientName}"?`,
        confirmText: 'Delete Policy',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.insurance.delete(ins.insuranceId);
            showToast(`Policy #INS-${ins.insuranceId} deleted`, 'success');
            await loadInsurance(container);
        }
    });
}
