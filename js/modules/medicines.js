/**
 * MediCore - Medicines & Pharmacy Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, formatCurrency, renderSkeletonTable,
    renderEmptyState, renderErrorState, refreshIcons
} from '../ui.js';

let medicinesData = [];
let searchQuery = '';

export async function renderMedicines(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="med-search-input" placeholder="Search medicines by name, dosage..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-meds-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-med-btn">
                        <i data-lucide="plus-circle"></i> Add Medicine
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Medicine ID</th>
                            <th>Medicine Name</th>
                            <th>Dosage / Strength</th>
                            <th>Unit Price</th>
                            <th>Inventory Stock</th>
                            <th>Stock Status</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="meds-table-body">
                        ${renderSkeletonTable(7, 4)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination">
                <span id="meds-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#add-med-btn').addEventListener('click', () => openMedicineModal());
    container.querySelector('#refresh-meds-btn').addEventListener('click', () => loadMedicines(container));

    const searchInput = container.querySelector('#med-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderMedicinesRows(container);
    });

    await loadMedicines(container);
}

export async function loadMedicines(container) {
    const tbody = container.querySelector('#meds-table-body');
    const countLabel = container.querySelector('#meds-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(7, 4);
        medicinesData = await api.medicines.getAll();
        state.updateCache('medicines', medicinesData);
        renderMedicinesRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderMedicinesRows(container) {
    const tbody = container.querySelector('#meds-table-body');
    const countLabel = container.querySelector('#meds-count-label');
    if (!tbody) return;

    const filtered = medicinesData.filter(m => {
        if (!searchQuery) return true;
        return (m.medicineName && m.medicineName.toLowerCase().includes(searchQuery)) ||
               (m.dosage && m.dosage.toLowerCase().includes(searchQuery)) ||
               (String(m.medicineId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${medicinesData.length} medicines in inventory`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">${renderEmptyState('No medicines found', 'Add medications to the hospital pharmacy registry.')}</td></tr>`;
        refreshIcons();
        return;
    }

    tbody.innerHTML = filtered.map(m => {
        const stock = m.stock !== null && m.stock !== undefined ? m.stock : 0;
        let stockBadge = '<span class="badge badge-success">In Stock</span>';
        if (stock === 0) {
            stockBadge = '<span class="badge badge-danger">Out of Stock</span>';
        } else if (stock < 50) {
            stockBadge = '<span class="badge badge-warning">Low Stock</span>';
        }

        return `
            <tr>
                <td class="cell-bold">#MED-${m.medicineId}</td>
                <td>
                    <div class="cell-bold">${escapeHtml(m.medicineName)}</div>
                </td>
                <td>
                    <span class="badge badge-neutral">${escapeHtml(m.dosage || 'Standard')}</span>
                </td>
                <td class="cell-bold">${formatCurrency(m.price)}</td>
                <td>
                    <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${stock} units</span>
                </td>
                <td>${stockBadge}</td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-icon-only edit-med-btn" data-id="${m.medicineId}" title="Edit Medicine">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon-only text-danger delete-med-btn" data-id="${m.medicineId}" title="Delete Medicine">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    refreshIcons();

    tbody.querySelectorAll('.edit-med-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const med = medicinesData.find(m => m.medicineId === id);
            if (med) openMedicineModal(med);
        });
    });

    tbody.querySelectorAll('.delete-med-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const med = medicinesData.find(m => m.medicineId === id);
            if (med) confirmDeleteMedicine(med, container);
        });
    });
}

export function openMedicineModal(medicine = null) {
    const isEdit = !!medicine;
    const title = isEdit ? `Edit Medicine #MED-${medicine.medicineId}` : 'Add Medicine to Inventory';

    const bodyHtml = `
        <form id="med-form">
            <div class="form-group">
                <label class="form-label">Medicine Name <span class="req">*</span></label>
                <input type="text" class="form-control" id="m-name" required value="${escapeHtml(medicine?.medicineName || '')}" placeholder="e.g. Amoxicillin, Paracetamol">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Dosage / Strength</label>
                    <input type="text" class="form-control" id="m-dosage" value="${escapeHtml(medicine?.dosage || '')}" placeholder="e.g. 500mg, 10ml syrup">
                </div>
                <div class="form-group">
                    <label class="form-label">Unit Price (${state.currency})</label>
                    <input type="number" step="0.01" min="0" class="form-control" id="m-price" value="${medicine?.price !== undefined ? medicine.price : ''}" placeholder="e.g. 25.00">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Initial Stock Units <span class="req">*</span></label>
                <input type="number" min="0" class="form-control" id="m-stock" required value="${medicine?.stock !== undefined ? medicine.stock : 100}">
                <div class="form-hint">Backend requires non-negative quantity.</div>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-med-btn">
            ${isEdit ? 'Update Medicine' : 'Save to Inventory'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'sm' });

    modal.querySelector('#save-med-btn').addEventListener('click', async () => {
        const medicineName = modal.querySelector('#m-name').value.trim();
        const dosage = modal.querySelector('#m-dosage').value.trim() || null;
        const priceVal = modal.querySelector('#m-price').value;
        const stockVal = modal.querySelector('#m-stock').value;

        if (!medicineName) {
            showToast('Medicine name is required', 'warning');
            modal.querySelector('#m-name').focus();
            return;
        }

        const price = priceVal !== '' ? Number(priceVal) : null;
        const stock = stockVal !== '' ? Number(stockVal) : 0;

        if (stock < 0) {
            showToast('Stock quantity cannot be negative', 'warning');
            return;
        }

        const payload = { medicineName, dosage, price, stock };
        const saveBtn = modal.querySelector('#save-med-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Saving...';

        try {
            if (isEdit) {
                await api.medicines.update(medicine.medicineId, payload);
                showToast(`Medicine #${medicine.medicineId} updated`, 'success');
            } else {
                const created = await api.medicines.create(payload);
                showToast(`Medicine "${created.medicineName}" added`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-medicines');
            if (container) loadMedicines(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Medicine' : 'Save to Inventory';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeleteMedicine(medicine, container) {
    showConfirm({
        title: 'Delete Medicine',
        message: `Are you sure you want to delete "${medicine.medicineName}" from inventory?`,
        confirmText: 'Delete Medicine',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.medicines.delete(medicine.medicineId);
            showToast(`Medicine #${medicine.medicineId} deleted`, 'success');
            await loadMedicines(container);
        }
    });
}
