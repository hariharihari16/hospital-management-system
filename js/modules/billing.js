/**
 * MediCore - Patient Billing Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, formatDate, formatCurrency, renderStatusBadge,
    renderSkeletonTable, renderEmptyState, renderErrorState, refreshIcons
} from '../ui.js';
import { openPaymentModal } from './payments.js';

let billsData = [];
let paymentsData = [];
let searchQuery = '';

export async function renderBilling(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="bill-search-input" placeholder="Search bills by patient, service details..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-bills-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-bill-btn">
                        <i data-lucide="receipt"></i> Generate New Bill
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Patient Name</th>
                            <th>Billing Date</th>
                            <th>Services Rendered</th>
                            <th>Total Billed</th>
                            <th>Amount Paid</th>
                            <th>Balance Due</th>
                            <th>Payment Status</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="bills-table-body">
                        ${renderSkeletonTable(9, 4)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination">
                <span id="bills-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#add-bill-btn').addEventListener('click', () => openBillModal());
    container.querySelector('#refresh-bills-btn').addEventListener('click', () => loadBilling(container));

    const searchInput = container.querySelector('#bill-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderBillsRows(container);
    });

    await loadBilling(container);
}

export async function loadBilling(container) {
    const tbody = container.querySelector('#bills-table-body');
    const countLabel = container.querySelector('#bills-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(9, 4);
        const [bills, payments, patients] = await Promise.all([
            api.bills.getAll(),
            api.payments.getAll().catch(() => []),
            api.patients.getAll().catch(() => [])
        ]);
        billsData = bills;
        paymentsData = payments;
        state.updateCache('bills', bills);
        state.updateCache('patients', patients);
        renderBillsRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderBillsRows(container) {
    const tbody = container.querySelector('#bills-table-body');
    const countLabel = container.querySelector('#bills-count-label');
    if (!tbody) return;

    const filtered = billsData.filter(b => {
        if (!searchQuery) return true;
        return (b.patientName && b.patientName.toLowerCase().includes(searchQuery)) ||
               (b.serviceDetails && b.serviceDetails.toLowerCase().includes(searchQuery)) ||
               (String(b.billId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${billsData.length} patient bills`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9">${renderEmptyState('No invoices found', 'Create hospital billing statements for patient procedures and consultations.')}</td></tr>`;
        refreshIcons();
        return;
    }

    tbody.innerHTML = filtered.map(b => {
        // Calculate total payments for this bill
        const billPayments = paymentsData.filter(p => p.billId === b.billId);
        const totalPaid = billPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const totalBill = Number(b.amount) || 0;
        const balance = Math.max(0, totalBill - totalPaid);

        let statusText = 'UNPAID';
        if (totalPaid >= totalBill && totalBill > 0) {
            statusText = 'PAID';
        } else if (totalPaid > 0) {
            statusText = 'PARTIAL';
        }

        return `
            <tr>
                <td class="cell-bold">#INV-${b.billId}</td>
                <td>
                    <div class="cell-bold">${escapeHtml(b.patientName || `Patient #${b.patientId}`)}</div>
                </td>
                <td>${formatDate(b.billDate)}</td>
                <td>
                    <div style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.84rem;">
                        ${escapeHtml(b.serviceDetails || 'Medical consultation and care')}
                    </div>
                </td>
                <td class="cell-bold">${formatCurrency(totalBill)}</td>
                <td style="color: var(--success); font-weight: 600;">${formatCurrency(totalPaid)}</td>
                <td style="font-weight: 700; color: ${balance > 0 ? 'var(--danger)' : 'var(--text-muted)'};">
                    ${formatCurrency(balance)}
                </td>
                <td>${renderStatusBadge(statusText)}</td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        ${balance > 0 ? `
                            <button class="btn btn-sm btn-primary pay-bill-btn" data-id="${b.billId}" data-balance="${balance}" title="Collect Payment">
                                <i data-lucide="credit-card"></i> Pay
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-icon-only edit-bill-btn" data-id="${b.billId}" title="Edit Invoice">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon-only text-danger delete-bill-btn" data-id="${b.billId}" title="Delete Invoice">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    refreshIcons();

    tbody.querySelectorAll('.pay-bill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const billId = Number(btn.dataset.id);
            const balance = Number(btn.dataset.balance);
            openPaymentModal(null, billId, balance);
        });
    });

    tbody.querySelectorAll('.edit-bill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const bill = billsData.find(b => b.billId === id);
            if (bill) openBillModal(bill);
        });
    });

    tbody.querySelectorAll('.delete-bill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const bill = billsData.find(b => b.billId === id);
            if (bill) confirmDeleteBill(bill, container);
        });
    });
}

export async function openBillModal(bill = null) {
    const isEdit = !!bill;
    const title = isEdit ? `Edit Invoice #INV-${bill.billId}` : 'Generate Patient Bill';

    let patients = state.cache.patients;
    if (!patients || patients.length === 0) {
        patients = await api.patients.getAll().catch(() => []);
        state.updateCache('patients', patients);
    }

    const patientOptions = patients.map(p => 
        `<option value="${p.patientId}" ${bill && bill.patientId === p.patientId ? 'selected' : ''}>#${p.patientId} - ${escapeHtml(p.name)}</option>`
    ).join('');

    const today = new Date().toISOString().split('T')[0];
    const billDate = bill?.billDate || today;

    const bodyHtml = `
        <form id="bill-form">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Patient <span class="req">*</span></label>
                    <select class="form-control" id="b-patient" required>
                        <option value="">Select Patient...</option>
                        ${patientOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Total Amount (${state.currency}) <span class="req">*</span></label>
                    <input type="number" step="0.01" min="0" class="form-control" id="b-amount" required value="${bill?.amount !== undefined ? bill.amount : ''}" placeholder="e.g. 5000.00">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Billing Date</label>
                <input type="date" class="form-control" id="b-date" value="${billDate}">
            </div>

            <div class="form-group">
                <label class="form-label">Service Details & Itemized Charges</label>
                <textarea class="form-control" id="b-services" rows="3" placeholder="e.g. Inpatient Ward Stay (3 Days) + Specialist Consultation + Lab Tests">${escapeHtml(bill?.serviceDetails || '')}</textarea>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-bill-btn">
            ${isEdit ? 'Update Bill' : 'Issue Invoice'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'md' });

    modal.querySelector('#save-bill-btn').addEventListener('click', async () => {
        const patientIdVal = modal.querySelector('#b-patient').value;
        const amountVal = modal.querySelector('#b-amount').value;
        const billDate = modal.querySelector('#b-date').value || null;
        const serviceDetails = modal.querySelector('#b-services').value.trim() || null;

        if (!patientIdVal) {
            showToast('Please select a patient', 'warning');
            modal.querySelector('#b-patient').focus();
            return;
        }
        if (!amountVal || isNaN(amountVal) || Number(amountVal) <= 0) {
            showToast('Valid bill amount is required', 'warning');
            modal.querySelector('#b-amount').focus();
            return;
        }

        const payload = {
            patientId: Number(patientIdVal),
            amount: Number(amountVal),
            billDate,
            serviceDetails
        };

        const saveBtn = modal.querySelector('#save-bill-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Processing...';

        try {
            if (isEdit) {
                await api.bills.update(bill.billId, payload);
                showToast(`Invoice #INV-${bill.billId} updated`, 'success');
            } else {
                const created = await api.bills.create(payload);
                showToast(`Invoice #INV-${created.billId} generated`, 'success');
            }
            closeActiveModal();
            const container = document.getElementById('tab-billing');
            if (container) loadBilling(container);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Bill' : 'Issue Invoice';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeleteBill(bill, container) {
    showConfirm({
        title: 'Delete Invoice',
        message: `Are you sure you want to delete invoice #INV-${bill.billId} for "${bill.patientName}"? All linked payments will also be deleted.`,
        confirmText: 'Delete Invoice',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.bills.delete(bill.billId);
            showToast(`Invoice #INV-${bill.billId} deleted`, 'success');
            await loadBilling(container);
        }
    });
}
