/**
 * MediCore - Payments Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    showToast, showModal, closeActiveModal, showConfirm,
    escapeHtml, formatDate, formatCurrency, renderStatusBadge,
    renderSkeletonTable, renderEmptyState, renderErrorState, refreshIcons
} from '../ui.js';

let paymentsData = [];
let billsData = [];
let searchQuery = '';

export async function renderPayments(container) {
    container.innerHTML = `
        <div class="card table-card animate-fade-in">
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <div class="filter-input-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="pay-search-input" placeholder="Search payments by bill ID, method, status..." value="${escapeHtml(searchQuery)}">
                    </div>
                </div>
                <div class="table-toolbar-right">
                    <button class="btn btn-secondary" id="refresh-pay-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="add-pay-btn">
                        <i data-lucide="credit-card"></i> Record Payment
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Linked Invoice</th>
                            <th>Patient Name</th>
                            <th>Payment Date</th>
                            <th>Amount Paid</th>
                            <th>Payment Channel</th>
                            <th>Transaction Status</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="pay-table-body">
                        ${renderSkeletonTable(8, 4)}
                    </tbody>
                </table>
            </div>

            <div class="table-pagination">
                <span id="pay-count-label">Loading records...</span>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#add-pay-btn').addEventListener('click', () => openPaymentModal());
    container.querySelector('#refresh-pay-btn').addEventListener('click', () => loadPayments(container));

    const searchInput = container.querySelector('#pay-search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderPaymentsRows(container);
    });

    await loadPayments(container);
}

export async function loadPayments(container) {
    const tbody = container.querySelector('#pay-table-body');
    const countLabel = container.querySelector('#pay-count-label');
    if (!tbody) return;

    try {
        tbody.innerHTML = renderSkeletonTable(8, 4);
        const [payments, bills] = await Promise.all([
            api.payments.getAll(),
            api.bills.getAll().catch(() => [])
        ]);
        paymentsData = payments;
        billsData = bills;
        state.updateCache('bills', bills);
        renderPaymentsRows(container);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8">${renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()')}</td></tr>`;
        if (countLabel) countLabel.textContent = 'Error loading records';
        refreshIcons();
    }
}

function renderPaymentsRows(container) {
    const tbody = container.querySelector('#pay-table-body');
    const countLabel = container.querySelector('#pay-count-label');
    if (!tbody) return;

    const billsMap = new Map(billsData.map(b => [b.billId, b]));

    const filtered = paymentsData.filter(p => {
        if (!searchQuery) return true;
        const linkedBill = billsMap.get(p.billId);
        const patientName = linkedBill ? linkedBill.patientName : '';
        return (p.paymentMethod && p.paymentMethod.toLowerCase().includes(searchQuery)) ||
               (p.status && p.status.toLowerCase().includes(searchQuery)) ||
               (patientName && patientName.toLowerCase().includes(searchQuery)) ||
               (String(p.paymentId).includes(searchQuery)) ||
               (String(p.billId).includes(searchQuery));
    });

    if (countLabel) {
        countLabel.textContent = `Showing ${filtered.length} of ${paymentsData.length} recorded payments`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8">${renderEmptyState('No payments found', 'Record collections against open hospital invoices.')}</td></tr>`;
        refreshIcons();
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const linkedBill = billsMap.get(p.billId);
        const patientName = linkedBill ? linkedBill.patientName : '—';

        return `
            <tr>
                <td class="cell-bold">#PAY-${p.paymentId}</td>
                <td>
                    <span class="badge badge-info">#INV-${p.billId}</span>
                </td>
                <td>
                    <div class="cell-bold">${escapeHtml(patientName)}</div>
                </td>
                <td>${formatDate(p.paymentDate)}</td>
                <td class="cell-bold" style="color: var(--success); font-size: 0.95rem;">
                    ${formatCurrency(p.amount)}
                </td>
                <td>
                    <span class="badge badge-neutral"><i data-lucide="wallet" style="width: 12px; height: 12px;"></i> ${escapeHtml(p.paymentMethod || 'Cash')}</span>
                </td>
                <td>${renderStatusBadge(p.status)}</td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-icon-only edit-pay-btn" data-id="${p.paymentId}" title="Edit Payment">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon-only text-danger delete-pay-btn" data-id="${p.paymentId}" title="Delete Payment">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    refreshIcons();

    tbody.querySelectorAll('.edit-pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const payment = paymentsData.find(p => p.paymentId === id);
            if (payment) openPaymentModal(payment);
        });
    });

    tbody.querySelectorAll('.delete-pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const payment = paymentsData.find(p => p.paymentId === id);
            if (payment) confirmDeletePayment(payment, container);
        });
    });
}

export async function openPaymentModal(payment = null, preselectedBillId = null, prefilledAmount = null) {
    const isEdit = !!payment;
    const title = isEdit ? `Edit Payment #PAY-${payment.paymentId}` : 'Record Customer Payment';

    let bills = state.cache.bills;
    if (!bills || bills.length === 0) {
        bills = await api.bills.getAll().catch(() => []);
        state.updateCache('bills', bills);
    }

    const billOptions = bills.map(b => {
        const isSelected = (payment && payment.billId === b.billId) || (preselectedBillId && preselectedBillId === b.billId);
        return `<option value="${b.billId}" ${isSelected ? 'selected' : ''}>
            #INV-${b.billId} - ${escapeHtml(b.patientName || `Patient #${b.patientId}`)} (Total: ${formatCurrency(b.amount)})
        </option>`;
    }).join('');

    const today = new Date().toISOString().split('T')[0];
    const payDate = payment?.paymentDate || today;
    const defaultAmount = payment?.amount !== undefined 
        ? payment.amount 
        : (prefilledAmount !== null ? prefilledAmount : '');

    const bodyHtml = `
        <form id="pay-form">
            <div class="form-group">
                <label class="form-label">Hospital Invoice <span class="req">*</span></label>
                <select class="form-control" id="pay-bill" required>
                    <option value="">Select Invoice...</option>
                    ${billOptions}
                </select>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Payment Amount (${state.currency}) <span class="req">*</span></label>
                    <input type="number" step="0.01" min="0.01" class="form-control" id="pay-amount" required value="${defaultAmount}" placeholder="e.g. 2000.00">
                </div>
                <div class="form-group">
                    <label class="form-label">Payment Date</label>
                    <input type="date" class="form-control" id="pay-date" value="${payDate}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Payment Method</label>
                    <select class="form-control" id="pay-method">
                        <option value="Credit Card" ${payment?.paymentMethod === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
                        <option value="Debit Card" ${payment?.paymentMethod === 'Debit Card' ? 'selected' : ''}>Debit Card</option>
                        <option value="Cash" ${payment?.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                        <option value="UPI" ${payment?.paymentMethod === 'UPI' ? 'selected' : ''}>UPI / QR</option>
                        <option value="Insurance Claim" ${payment?.paymentMethod === 'Insurance Claim' ? 'selected' : ''}>Insurance Claim</option>
                        <option value="Net Banking" ${payment?.paymentMethod === 'Net Banking' ? 'selected' : ''}>Net Banking / Wire</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" id="pay-status">
                        <option value="Completed" ${payment?.status === 'Completed' || payment?.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                        <option value="Pending" ${payment?.status === 'Pending' || payment?.status === 'PENDING' ? 'selected' : ''}>Pending Verification</option>
                    </select>
                </div>
            </div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="window.MediCore.closeActiveModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-pay-btn">
            ${isEdit ? 'Update Payment' : 'Process Payment'}
        </button>
    `;

    const modal = showModal({ title, bodyHtml, footerHtml, size: 'md' });

    modal.querySelector('#save-pay-btn').addEventListener('click', async () => {
        const billIdVal = modal.querySelector('#pay-bill').value;
        const amountVal = modal.querySelector('#pay-amount').value;
        const paymentDate = modal.querySelector('#pay-date').value || null;
        const paymentMethod = modal.querySelector('#pay-method').value;
        const status = modal.querySelector('#pay-status').value;

        if (!billIdVal) {
            showToast('Please select a bill', 'warning');
            modal.querySelector('#pay-bill').focus();
            return;
        }
        if (!amountVal || isNaN(amountVal) || Number(amountVal) <= 0) {
            showToast('Valid payment amount is required', 'warning');
            modal.querySelector('#pay-amount').focus();
            return;
        }

        const payload = {
            billId: Number(billIdVal),
            amount: Number(amountVal),
            paymentDate,
            paymentMethod,
            status
        };

        const saveBtn = modal.querySelector('#save-pay-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Processing...';

        try {
            if (isEdit) {
                await api.payments.update(payment.paymentId, payload);
                showToast(`Payment #PAY-${payment.paymentId} updated`, 'success');
            } else {
                const created = await api.payments.create(payload);
                showToast(`Payment #PAY-${created.paymentId} recorded successfully`, 'success');
            }
            closeActiveModal();
            // Refresh payments tab or billing tab if open
            const payContainer = document.getElementById('tab-payments');
            if (payContainer) loadPayments(payContainer);
            const billContainer = document.getElementById('tab-billing');
            if (billContainer && window.MediCore.loadBilling) window.MediCore.loadBilling(billContainer);
        } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = isEdit ? 'Update Payment' : 'Process Payment';
            showToast(err.message, 'error');
        }
    });
}

function confirmDeletePayment(payment, container) {
    showConfirm({
        title: 'Delete Payment',
        message: `Are you sure you want to delete payment #PAY-${payment.paymentId} for ${formatCurrency(payment.amount)}? The bill balance will be updated accordingly.`,
        confirmText: 'Delete Payment',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
            await api.payments.delete(payment.paymentId);
            showToast(`Payment #PAY-${payment.paymentId} removed`, 'success');
            await loadPayments(container);
        }
    });
}
