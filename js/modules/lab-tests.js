/**
 * MediCore - Diagnostic Lab Tests Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, formatDate, renderStatusBadge, renderSkeletonTable,
    renderEmptyState, renderErrorState, refreshIcons
} from '../ui.js';

let labTestsData = [];
let searchQuery = '';

export async function renderLabTests(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="test-search-input" placeholder="Search lab tests by name, patient, result..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-tests-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-test-btn">
                        <i data-lucide="flask-conical"></i> Order Lab Test
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Test ID</th>
                            <th>Test Name</th>
                            <th>Patient Name</th>
                            <th>Test Date</th>
                            <th>Status</th>
                            <th>Diagnostic Result Findings</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="tests-table-body">
                        ${renderSkeletonTable(7, 4)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination">
                <span id="tests-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#add-test-btn').addEventListener('click', () => openLabTestModal());
    container.querySelector('#refresh-tests-btn').addEventListener('click', () => loadLabTests(container));

    const searchInput = container.querySelector('#test-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderLabTestsRows(container);
    });

    await loadLabTests(container);
}

export async function loadLabTests(container) {
    const tbody = container.querySelector('#tests-table-body');
    const countLabel = container.querySelector('#tests-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(7, 4);
        const [tests, patients] = await Promise.all([
            api.labTests.getAll(),
            api.patients.getAll().catch(() => [])
        ]);
        labTestsData = tests;
        state.updateCache('patients', patients);
        renderLabTestsRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderLabTestsRows(container) {
    const tbody = container.querySelector('#tests-table-body');
    const countLabel = container.querySelector('#tests-count-label');
    if (!tbody) return;

    const filtered = labTestsData.filter(t => {
        if (!searchQuery) return true;
        return (t.testName && t.testName.toLowerCase().includes(searchQuery)) ||
               (t.patientName && t.patientName.toLowerCase().includes(searchQuery)) ||
               (t.result && t.result.toLowerCase().includes(searchQuery)) ||
               (t.status && t.status.toLowerCase().includes(searchQuery)) ||
               (String(t.testId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${labTestsData.length} laboratory investigations`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">${renderEmptyState('No lab tests found', 'Order blood work, scans, or pathology panels for patients.')}</td></tr>`;
        refreshIcons();
        return;
    }

    tbody.innerHTML = filtered.map(t => `
        <tr>
            <td class="cell-bold">#LAB-${t.testId}</td>
            <td>
                <div class="cell-bold">${escapeHtml(t.testName)}</div>
            </td>
            <td>
                <div class="cell-bold">${escapeHtml(t.patientName || `Patient #${t.patientId}`)}</div>
            </td>
            <td>${formatDate(t.testDate)}</td>
            <td>${renderStatusBadge(t.status)}</td>
            <td>
                <div style="max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.84rem;">
                    ${escapeHtml(t.result || 'Awaiting laboratory result report')}
                </div>
            </td>
            <td style="text-align: right;">
                <div class="table-actions" style="justify-content: flex-end;">
                    <button class="btn btn-secondary btn-icon-only edit-test-btn" data-id="${t.testId}" title="Edit / Update Result">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn btn-secondary btn-icon-only text-danger delete-test-btn" data-id="${t.testId}" title="Delete Test">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    refreshIcons();

    tbody.querySelectorAll('.edit-test-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const test = labTestsData.find(t => t.testId === id);
            if (test) openLabTestModal(test);
        });
    });

    tbody.querySelectorAll('.delete-test-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const test = labTestsData.find(t => t.testId === id);
            if (test) confirmDeleteLabTest(test, container);
        });
    });
}

export async function openLabTestModal(test = null) {
    const isEdit = !!test;
    const title = isEdit ? `Update Lab Test #LAB-${test.testId}` : 'Order New Diagnostic Test';

    let patients = state.cache.patients;
    if (!patients || patients.length === 0) {
        patients = await api.patients.getAll().catch(() => []);
        state.updateCache('patients', patients);
    }

    const patientOptions = patients.map(p => 
        `<option value="${p.patientId}" ${test && test.patientId === p.patientId ? 'selected' : ''}>#${p.patientId} - ${escapeHtml(p.name)}</option>`
    ).join('');

    const today = new Date().toISOString().split('T')[0];
    const dateVal = test?.testDate || today;

    const bodyHtml = `
        <form id="lab-test-form">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Patient <span class="req">*</span></label>
                    <select class="form-control" id="lt-patient" required>
                        <option value="">Select Patient...</option>
                        ${patientOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Test Name <span class="req">*</span></label>
                    <input type="text" class="form-control" id="lt-name" required value="${escapeHtml(test?.testName || '')}" placeholder="e.g. Complete Blood Count, Lipid Profile, ECG">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Test Date</label>
                    <input type="date" class="form-control" id="lt-date" value="${dateVal}">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" id="lt-status">
                        <option value="PENDING" ${test?.status === 'PENDING' || test?.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="IN_PROGRESS" ${test?.status === 'IN_PROGRESS' || test?.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="COMPLETED" ${test?.status === 'COMPLETED' || test?.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Diagnostic Findings & Results</label>
                <textarea class="form-control" id="lt-result" rows="3" placeholder="Pathology findings, numerical values, normal range comparisons...">${escapeHtml(test?.result || '')}</textarea>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-lt-btn">
            ${isEdit ? 'Update Test' : 'Order Test'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'md' });

    modal.querySelector('#save-lt-btn').addEventListener('click', async () => {
        const patientIdVal = modal.querySelector('#lt-patient').value;
        const testName = modal.querySelector('#lt-name').value.trim();
        const testDate = modal.querySelector('#lt-date').value || null;
        const status = modal.querySelector('#lt-status').value;
        const result = modal.querySelector('#lt-result').value.trim() || null;

        if (!patientIdVal) {
            showToast('Please select a patient', 'warning');
            modal.querySelector('#lt-patient').focus();
            return;
        }
        if (!testName) {
            showToast('Test name is required', 'warning');
            modal.querySelector('#lt-name').focus();
            return;
        }

        const payload = {
            patientId: Number(patientIdVal),
            testName,
            testDate,
            status,
            result
        };

        const saveBtn = modal.querySelector('#save-lt-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (isEdit) {
                await api.labTests.update(test.testId, payload);
                showToast(`Lab test #LAB-${test.testId} updated`, 'success');
            } else {
                const created = await api.labTests.create(payload);
                showToast(`Lab test #LAB-${created.testId} ordered`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-lab-tests');
            if (container) loadLabTests(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Test' : 'Order Test';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeleteLabTest(test, container) {
    showConfirm({
        title: 'Delete Lab Test',
        message: `Are you sure you want to delete lab investigation #LAB-${test.testId} (${test.testName})?`,
        confirmText: 'Delete Test',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.labTests.delete(test.testId);
            showToast(`Lab test #LAB-${test.testId} deleted`, 'success');
            await loadLabTests(container);
        }
    });
}
