/**
 * MediCore Hospital Management System - Reusable UI Components & Helpers
 */

import { state } from './state.js';

export function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

// -------------------------------------------------------------
// Toast Notifications
// -------------------------------------------------------------
let toastContainer = null;

function ensureToastContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
        toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    }
    return toastContainer;
}

export function showToast(message, type = 'info', duration = 4500) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-in`;

    const iconMap = {
        success: 'check-circle-2',
        error: 'alert-triangle',
        warning: 'alert-circle',
        info: 'info'
    };

    const iconName = iconMap[type] || 'info';

    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${iconName}"></i>
        </div>
        <div class="toast-body">
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" aria-label="Close">
            <i data-lucide="x"></i>
        </button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    container.appendChild(toast);
    refreshIcons();

    let autoTimer = setTimeout(() => removeToast(toast), duration);

    toast.addEventListener('mouseenter', () => clearTimeout(autoTimer));
    toast.addEventListener('mouseleave', () => {
        autoTimer = setTimeout(() => removeToast(toast), 2000);
    });

    return toast;
}

function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
}

// -------------------------------------------------------------
// Dynamic Modal Helper
// -------------------------------------------------------------
let activeModal = null;

export function showModal({ title, bodyHtml, footerHtml = '', size = 'md', onClose = null }) {
    closeActiveModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop animate-fade-in';
    overlay.id = 'dynamic-modal-overlay';

    const modal = document.createElement('div');
    modal.className = `modal-dialog modal-${size} animate-scale-up`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
        <div class="modal-header">
            <h3 class="modal-title">${escapeHtml(title)}</h3>
            <button class="modal-close-btn" aria-label="Close dialog">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="modal-body">
            ${bodyHtml}
        </div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    activeModal = { overlay, onClose };

    const closeBtn = modal.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => closeActiveModal());

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeActiveModal();
    });

    const escListener = (e) => {
        if (e.key === 'Escape') {
            closeActiveModal();
            document.removeEventListener('keydown', escListener);
        }
    };
    document.addEventListener('keydown', escListener);

    refreshIcons();
    return modal;
}

export function closeActiveModal() {
    if (activeModal && activeModal.overlay && activeModal.overlay.parentNode) {
        if (typeof activeModal.onClose === 'function') {
            activeModal.onClose();
        }
        activeModal.overlay.parentNode.removeChild(activeModal.overlay);
        activeModal = null;
    }
}

// -------------------------------------------------------------
// Confirmation Dialog
// -------------------------------------------------------------
export function showConfirm({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    confirmClass = 'btn-danger',
    onConfirm
}) {
    const bodyHtml = `
        <div class="confirm-modal-body">
            <div class="confirm-icon ${confirmClass.includes('danger') ? 'text-danger' : 'text-primary'}">
                <i data-lucide="alert-triangle"></i>
            </div>
            <div class="confirm-text">
                <p>${escapeHtml(message)}</p>
            </div>
        </div>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-secondary" id="confirm-cancel-btn">Cancel</button>
        <button type="button" class="btn ${confirmClass}" id="confirm-ok-btn">${escapeHtml(confirmText)}</button>
    `;

    const modal = showModal({
        title,
        bodyHtml,
        footerHtml,
        size: 'sm'
    });

    modal.querySelector('#confirm-cancel-btn').addEventListener('click', () => closeActiveModal());
    modal.querySelector('#confirm-ok-btn').addEventListener('click', async () => {
        const okBtn = modal.querySelector('#confirm-ok-btn');
        okBtn.disabled = true;
        okBtn.innerHTML = '<span class="spinner-sm"></span> Processing...';
        try {
            if (onConfirm) await onConfirm();
            closeActiveModal();
        } catch (err) {
            okBtn.disabled = false;
            okBtn.innerHTML = escapeHtml(confirmText);
            showToast(err.message || 'Operation failed', 'error');
        }
    });

    refreshIcons();
}

// -------------------------------------------------------------
// Formatters & Utility Functions
// -------------------------------------------------------------
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const parts = String(dateStr).split('T')[0].split('-');
        if (parts.length === 3) {
            const date = new Date(parts[0], parts[1] - 1, parts[2]);
            return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        }
        return dateStr;
    } catch {
        return dateStr;
    }
}

export function formatTime(timeStr) {
    if (!timeStr) return '—';
    try {
        const parts = String(timeStr).split(':');
        if (parts.length >= 2) {
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1];
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours}:${minutes} ${ampm}`;
        }
        return timeStr;
    } catch {
        return timeStr;
    }
}

export function formatDateTime(dateStr, timeStr) {
    if (!dateStr && !timeStr) return '—';
    const d = formatDate(dateStr);
    const t = formatTime(timeStr);
    if (d !== '—' && t !== '—') return `${d} at ${t}`;
    return d !== '—' ? d : t;
}

export function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '—';
    const sym = state.currency || '₹';
    const num = Number(amount);
    return `${sym}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateAge(dobStr) {
    if (!dobStr) return '—';
    try {
        const dob = new Date(dobStr);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age >= 0 ? `${age} yrs` : '—';
    } catch {
        return '—';
    }
}

// -------------------------------------------------------------
// Badges & Status Indicators
// -------------------------------------------------------------
export function renderStatusBadge(status) {
    if (!status) return '<span class="badge badge-neutral">—</span>';
    const s = String(status).toUpperCase();

    let badgeClass = 'badge-neutral';
    if (['SCHEDULED', 'PENDING', 'PARTIAL', 'IN_PROGRESS', 'AWAITING'].includes(s)) {
        badgeClass = 'badge-warning';
    } else if (['COMPLETED', 'ACTIVE', 'ADMITTED', 'PAID', 'DISCHARGED_CLEARED', 'SUCCESS'].includes(s)) {
        badgeClass = 'badge-success';
    } else if (['CANCELLED', 'OVERDUE', 'FAILED', 'OCCUPIED'].includes(s)) {
        badgeClass = 'badge-danger';
    } else if (['DISCHARGED', 'INACTIVE', 'CLOSED'].includes(s)) {
        badgeClass = 'badge-info';
    }

    return `<span class="badge ${badgeClass}">${escapeHtml(status)}</span>`;
}

// -------------------------------------------------------------
// Table Skeleton & Empty States
// -------------------------------------------------------------
export function renderSkeletonTable(columns = 5, rows = 4) {
    let html = '';
    for (let i = 0; i < rows; i++) {
        html += '<tr class="skeleton-row">';
        for (let j = 0; j < columns; j++) {
            html += `<td><div class="skeleton-bar" style="width: ${50 + (j * 10) % 40}%;"></div></td>`;
        }
        html += '</tr>';
    }
    return html;
}

export function renderEmptyState(title = 'No Records Found', subtitle = 'Get started by creating a new entry.', actionBtnHtml = '') {
    return `
        <div class="empty-state animate-fade-in">
            <div class="empty-icon">
                <i data-lucide="folder-search"></i>
            </div>
            <h4 class="empty-title">${escapeHtml(title)}</h4>
            <p class="empty-subtitle">${escapeHtml(subtitle)}</p>
            ${actionBtnHtml ? `<div class="empty-actions">${actionBtnHtml}</div>` : ''}
        </div>
    `;
}

export function renderErrorState(message = 'Failed to load data', retryAction = null) {
    return `
        <div class="error-state animate-fade-in">
            <div class="error-icon">
                <i data-lucide="alert-circle"></i>
            </div>
            <h4 class="error-title">Connection Error</h4>
            <p class="error-message">${escapeHtml(message)}</p>
            ${retryAction ? `<button class="btn btn-secondary mt-3" onclick="${retryAction}"><i data-lucide="refresh-cw"></i> Retry</button>` : ''}
        </div>
    `;
}
