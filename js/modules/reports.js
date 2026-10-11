/**
 * MediCore - Operational & Clinical Reports Module
 * Strict calculation derived from live backend datasets.
 */

import { api } from '../api.js';
import { state } from '../state.js';
import {
    formatCurrency, formatDate, escapeHtml, refreshIcons,
    renderSkeletonTable, renderErrorState, showToast
} from '../ui.js';

let reportData = {
    bills: [],
    payments: [],
    patients: [],
    doctors: [],
    departments: [],
    rooms: [],
    admissions: [],
    medicines: []
};

export async function renderReports(container) {
    container.innerHTML = `
        <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 24px;">
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Hospital Operational & Financial Reports</h3>
                        <span class="card-subtitle">Real-time analytical metrics compiled across backend subsystems</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" id="refresh-reports-btn">
                            <i data-lucide="refresh-cw"></i> Refresh Data
                        </button>
                        <button class="btn btn-primary" id="print-report-btn">
                            <i data-lucide="printer"></i> Print Statement
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Section 1: Financial Summary -->
                    <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="receipt" style="color: var(--primary);"></i> Revenue & Patient Receivables Ledger
                    </h4>
                    <div class="table-responsive" style="margin-bottom: 28px;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Patient Name</th>
                                    <th>Total Billed</th>
                                    <th>Total Paid</th>
                                    <th>Remaining Balance</th>
                                    <th>Account Status</th>
                                </tr>
                            </thead>
                            <tbody id="rep-financial-tbody">
                                ${renderSkeletonTable(5, 4)}
                            </tbody>
                        </table>
                    </div>

                    <!-- Section 2: Clinical Departments & Doctor Staffing -->
                    <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="building-2" style="color: var(--primary);"></i> Department Staffing & Specialty Coverage
                    </h4>
                    <div class="table-responsive" style="margin-bottom: 28px;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th>Location</th>
                                    <th>Assigned Doctors</th>
                                    <th>Specialists on Duty</th>
                                </tr>
                            </thead>
                            <tbody id="rep-dept-tbody">
                                ${renderSkeletonTable(4, 4)}
                            </tbody>
                        </table>
                    </div>

                    <!-- Section 3: Pharmacy Stock Valuation -->
                    <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="pill" style="color: var(--primary);"></i> Pharmacy Inventory Valuation Report
                    </h4>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Medicine Name</th>
                                    <th>Dosage</th>
                                    <th>Unit Price</th>
                                    <th>Quantity In Stock</th>
                                    <th>Total Inventory Value</th>
                                </tr>
                            </thead>
                            <tbody id="rep-pharmacy-tbody">
                                ${renderSkeletonTable(5, 4)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    refreshIcons();

    container.querySelector('#refresh-reports-btn').addEventListener('click', () => loadReports(container));
    container.querySelector('#print-report-btn').addEventListener('click', () => {
        window.print();
    });

    await loadReports(container);
}

export async function loadReports(container) {
    try {
        const [bills, payments, patients, doctors, departments, rooms, admissions, medicines] = await Promise.all([
            api.bills.getAll().catch(() => []),
            api.payments.getAll().catch(() => []),
            api.patients.getAll().catch(() => []),
            api.doctors.getAll().catch(() => []),
            api.departments.getAll().catch(() => []),
            api.rooms.getAll().catch(() => []),
            api.admissions.getAll().catch(() => []),
            api.medicines.getAll().catch(() => [])
        ]);

        reportData = { bills, payments, patients, doctors, departments, rooms, admissions, medicines };
        renderReportTables(container);
    } catch (err) {
        container.innerHTML = renderErrorState(err.message, 'window.MediCore.reloadCurrentTab()');
        refreshIcons();
    }
}

function renderReportTables(container) {
    const { bills, payments, patients, doctors, departments, medicines } = reportData;

    // 1. Financial Ledger by Patient
    const finTbody = container.querySelector('#rep-financial-tbody');
    if (finTbody) {
        // Group by patient
        const patientLedger = {};
        patients.forEach(p => {
            patientLedger[p.patientId] = {
                name: p.name,
                billed: 0,
                paid: 0
            };
        });

        bills.forEach(b => {
            if (!patientLedger[b.patientId]) {
                patientLedger[b.patientId] = { name: b.patientName || `Patient #${b.patientId}`, billed: 0, paid: 0 };
            }
            patientLedger[b.patientId].billed += (Number(b.amount) || 0);
        });

        // Map bill to patient for payment distribution
        const billToPatient = new Map(bills.map(b => [b.billId, b.patientId]));
        payments.forEach(p => {
            const patientId = billToPatient.get(p.billId);
            if (patientId && patientLedger[patientId]) {
                patientLedger[patientId].paid += (Number(p.amount) || 0);
            }
        });

        const ledgerEntries = Object.values(patientLedger).filter(item => item.billed > 0 || item.paid > 0);

        if (ledgerEntries.length === 0) {
            finTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 18px;">No financial transaction history available.</td></tr>';
        } else {
            finTbody.innerHTML = ledgerEntries.map(entry => {
                const balance = Math.max(0, entry.billed - entry.paid);
                let badgeClass = 'badge-success';
                let status = 'Settled';
                if (balance > 0 && entry.paid > 0) {
                    badgeClass = 'badge-warning';
                    status = 'Partial';
                } else if (balance > 0) {
                    badgeClass = 'badge-danger';
                    status = 'Outstanding';
                }

                return `
                    <tr>
                        <td class="cell-bold">${escapeHtml(entry.name)}</td>
                        <td>${formatCurrency(entry.billed)}</td>
                        <td style="color: var(--success); font-weight: 600;">${formatCurrency(entry.paid)}</td>
                        <td style="font-weight: 700; color: ${balance > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${formatCurrency(balance)}</td>
                        <td><span class="badge ${badgeClass}">${status}</span></td>
                    </tr>
                `;
            }).join('');
        }
    }

    // 2. Department Coverage
    const deptTbody = container.querySelector('#rep-dept-tbody');
    if (deptTbody) {
        if (departments.length === 0) {
            deptTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 18px;">No departments registered.</td></tr>';
        } else {
            deptTbody.innerHTML = departments.map(d => {
                const deptDocs = doctors.filter(doc => doc.deptId === d.deptId);
                const docNames = deptDocs.map(doc => doc.name).join(', ') || 'No doctors assigned';

                return `
                    <tr>
                        <td class="cell-bold">${escapeHtml(d.deptName)}</td>
                        <td>${escapeHtml(d.location || 'Main Building')}</td>
                        <td><span class="badge badge-info">${deptDocs.length} Specialists</span></td>
                        <td><span class="cell-subtext" style="font-size: 0.85rem;">${escapeHtml(docNames)}</span></td>
                    </tr>
                `;
            }).join('');
        }
    }

    // 3. Pharmacy Stock Valuation
    const pharmTbody = container.querySelector('#rep-pharmacy-tbody');
    if (pharmTbody) {
        if (medicines.length === 0) {
            pharmTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 18px;">No pharmacy inventory records.</td></tr>';
        } else {
            let grandTotalValue = 0;
            const rows = medicines.map(m => {
                const stock = m.stock || 0;
                const price = Number(m.price) || 0;
                const val = stock * price;
                grandTotalValue += val;

                return `
                    <tr>
                        <td class="cell-bold">${escapeHtml(m.medicineName)}</td>
                        <td>${escapeHtml(m.dosage || '—')}</td>
                        <td>${formatCurrency(price)}</td>
                        <td class="cell-bold">${stock} units</td>
                        <td style="font-weight: 700; color: var(--primary);">${formatCurrency(val)}</td>
                    </tr>
                `;
            }).join('');

            pharmTbody.innerHTML = rows + `
                <tr style="background: var(--bg-main); font-weight: 700;">
                    <td colspan="4" style="text-align: right; text-transform: uppercase;">Total Pharmacy Inventory Asset Value:</td>
                    <td style="color: var(--primary); font-size: 1.05rem;">${formatCurrency(grandTotalValue)}</td>
                </tr>
            `;
        }
    }

    refreshIcons();
}
