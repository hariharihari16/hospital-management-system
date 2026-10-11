/* ==========================================================================
   ApexCare Hospital Management System - Interactive JavaScript Application
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // Global State & Data Store
    const state = {
        appointments: [
            { id: 1, name: 'Eleanor Brooks', age: 45, gender: 'Female', ptId: 'PT-1042', doctor: 'Dr. Sarah Jenkins', dept: 'Cardiology', date: 'Aug 05, 2026', time: '09:30 AM', status: 'Completed', avatarBg: 'bg-blue', initials: 'EB' },
            { id: 2, name: 'Robert Hawkins', age: 62, gender: 'Male', ptId: 'PT-1089', doctor: 'Dr. Michael Chen', dept: 'Neurology', date: 'Aug 05, 2026', time: '11:00 AM', status: 'Scheduled', avatarBg: 'bg-purple', initials: 'RH' },
            { id: 3, name: 'Sophia Martinez', age: 8, gender: 'Female', ptId: 'PT-1104', doctor: 'Dr. Emily Rodriguez', dept: 'Pediatrics', date: 'Aug 05, 2026', time: '01:45 PM', status: 'Pending', avatarBg: 'bg-teal', initials: 'SL' },
            { id: 4, name: 'David Anderson', age: 34, gender: 'Male', ptId: 'PT-0982', doctor: 'Dr. James Wilson', dept: 'Orthopedics', date: 'Aug 05, 2026', time: '02:30 PM', status: 'Completed', avatarBg: 'bg-amber', initials: 'DA' },
            { id: 5, name: 'Clara Taylor', age: 29, gender: 'Female', ptId: 'PT-1150', doctor: 'Dr. Priya Patel', dept: 'General Surgery', date: 'Aug 05, 2026', time: '04:15 PM', status: 'Cancelled', avatarBg: 'bg-rose', initials: 'CL' }
        ],
        stats: {
            patients: 1250,
            doctors: 85,
            appointments: 42,
            availableRooms: 18
        },
        currentTab: 'dashboard',
        currentApptFilter: 'all',
        chartInstance: null
    };

    // Initialize App Components
    initLiveClock();
    initThemeToggle();
    initSidebarNavigation();
    initGlobalSearch();
    initDropdowns();
    initRevenueChart();
    initTableFilters();
    initDoctorFilter();
    initModals();
    initCounterAnimations();

    // ==========================================
    // 1. LIVE CLOCK FUNCTION
    // ==========================================
    function initLiveClock() {
        const clockEl = document.getElementById('liveClock');
        function updateClock() {
            const now = new Date();
            const options = { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' };
            const dateStr = now.toLocaleDateString('en-US', options);
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            if (clockEl) {
                clockEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${dateStr} | ${timeStr}`;
            }
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    // ==========================================
    // 2. THEME TOGGLE (LIGHT / DARK)
    // ==========================================
    function initThemeToggle() {
        const themeBtn = document.getElementById('themeToggleBtn');
        const themeIcon = document.getElementById('themeIcon');
        
        // Check saved preference or default
        const savedTheme = localStorage.getItem('apexcare_theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.replace('light-theme', 'dark-theme');
            if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
        }

        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const isDark = document.body.classList.contains('dark-theme');
                if (isDark) {
                    document.body.classList.replace('dark-theme', 'light-theme');
                    themeIcon.className = 'fa-solid fa-moon';
                    localStorage.setItem('apexcare_theme', 'light');
                    showToast('Switched to Light Theme', 'info');
                } else {
                    document.body.classList.replace('light-theme', 'dark-theme');
                    themeIcon.className = 'fa-solid fa-sun';
                    localStorage.setItem('apexcare_theme', 'dark');
                    showToast('Switched to Dark Theme', 'info');
                }
                updateChartColors();
            });
        }
    }

    // ==========================================
    // 3. SIDEBAR & MOBILE DRAWER NAVIGATION
    // ==========================================
    function initSidebarNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const tabViews = document.querySelectorAll('.tab-view');
        const pageTitle = document.getElementById('pageTitle');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        // Tab Switching
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = link.getAttribute('data-tab');
                
                // Active State
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // View Switching
                tabViews.forEach(view => {
                    if (view.id === `view-${targetTab}`) {
                        view.classList.add('active');
                    } else {
                        view.classList.remove('active');
                    }
                });

                // Title Update
                const tabTitles = {
                    dashboard: 'Hospital Overview',
                    patients: 'Patient Directory',
                    doctors: 'Doctors Roster',
                    appointments: 'Appointments Calendar',
                    pharmacy: 'Pharmacy Inventory',
                    laboratory: 'Pathology & Diagnostics',
                    billing: 'Billing & Accounting',
                    settings: 'System Preferences'
                };
                if (pageTitle) pageTitle.textContent = tabTitles[targetTab] || 'Dashboard';
                state.currentTab = targetTab;

                // Close mobile sidebar if open
                closeMobileSidebar();
            });
        });

        // Mobile Sidebar Controls
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.add('mobile-open');
                sidebarOverlay.classList.add('active');
            });
        }

        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', closeMobileSidebar);
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', closeMobileSidebar);
        }

        function closeMobileSidebar() {
            sidebar.classList.remove('mobile-open');
            sidebarOverlay.classList.remove('active');
        }

        // System Help Modal Trigger
        const quickHelpBtn = document.getElementById('quickHelpBtn');
        if (quickHelpBtn) {
            quickHelpBtn.addEventListener('click', () => {
                showToast('ApexCare HMS Hotline: +1 (800) 911-CARE (24/7 Support Available)', 'info');
            });
        }
    }

    // ==========================================
    // 4. SEARCH FUNCTIONALITY (GLOBAL & HOTKEY)
    // ==========================================
    function initGlobalSearch() {
        const globalSearch = document.getElementById('globalSearchInput');

        // Press '/' hotkey to focus search bar
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== globalSearch && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                if (globalSearch) globalSearch.focus();
            }
        });

        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                filterAppointmentsTable(query, state.currentApptFilter);
                filterDoctors(query);
            });
        }
    }

    // ==========================================
    // 5. DROPDOWN MENUS (NOTIFICATIONS & PROFILE)
    // ==========================================
    function initDropdowns() {
        const notifBtn = document.getElementById('notificationBtn');
        const notifDropdown = document.getElementById('notificationDropdown');
        const notifBadge = document.getElementById('notifBadge');
        const markAllReadBtn = document.getElementById('markAllReadBtn');

        const profileTrigger = document.getElementById('adminProfileTrigger');
        const profileDropdown = document.getElementById('profileDropdown');

        // Toggle Notifications
        if (notifBtn && notifDropdown) {
            notifBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notifDropdown.classList.toggle('show');
                profileDropdown.classList.remove('show');
            });
        }

        // Toggle Admin Profile
        if (profileTrigger && profileDropdown) {
            profileTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
                notifDropdown.classList.remove('show');
            });
        }

        // Close on Click Outside
        document.addEventListener('click', () => {
            if (notifDropdown) notifDropdown.classList.remove('show');
            if (profileDropdown) profileDropdown.classList.remove('show');
        });

        // Mark Notifications Read
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                const unreadItems = document.querySelectorAll('.notif-item.unread');
                unreadItems.forEach(item => item.classList.remove('unread'));
                if (notifBadge) {
                    notifBadge.style.display = 'none';
                }
                showToast('All notifications marked as read', 'success');
            });
        }

        // Logout action mock
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('Sign out simulated. Re-authenticating session...', 'info');
            });
        }
    }

    // ==========================================
    // 6. CHART.JS REVENUE ANALYTICS CHART
    // ==========================================
    function initRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const isDark = document.body.classList.contains('dark-theme');
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

        const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyRevenue = [120000, 135000, 128000, 142000, 160000, 155000, 172000, 184250, 190000, 195000, 205000, 220000];
        const monthlyExpenses = [55000, 58000, 52000, 61000, 64000, 60000, 66000, 68400, 71000, 73000, 75000, 80000];

        const chartConfig = {
            type: 'line',
            data: {
                labels: monthlyLabels,
                datasets: [
                    {
                        label: 'Hospital Revenue ($)',
                        data: monthlyRevenue,
                        borderColor: '#2563eb',
                        backgroundColor: (context) => {
                            const chart = context.chart;
                            const {ctx, chartArea} = chart;
                            if (!chartArea) return null;
                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
                            gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
                            return gradient;
                        },
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#2563eb',
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Operational Expenses ($)',
                        data: monthlyExpenses,
                        borderColor: '#94a3b8',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: '#94a3b8',
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: { family: 'Plus Jakarta Sans', weight: '600', size: 12 },
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
                        bodyFont: { family: 'Plus Jakarta Sans' },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: $${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            font: { family: 'Plus Jakarta Sans', size: 11 },
                            callback: function(value) {
                                return '$' + (value / 1000) + 'k';
                            }
                        }
                    }
                }
            }
        };

        state.chartInstance = new Chart(ctx, chartConfig);

        // Time Range Pills Toggle
        const timePills = document.querySelectorAll('#revenueTimePills .pill-btn');
        timePills.forEach(pill => {
            pill.addEventListener('click', () => {
                timePills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const range = pill.getAttribute('data-range');

                if (range === 'quarterly') {
                    state.chartInstance.data.labels = ['Q1', 'Q2', 'Q3', 'Q4'];
                    state.chartInstance.data.datasets[0].data = [383000, 457000, 546250, 620000];
                    state.chartInstance.data.datasets[1].data = [165000, 185000, 195400, 228000];
                } else if (range === 'yearly') {
                    state.chartInstance.data.labels = ['2023', '2024', '2025', '2026 (YTD)'];
                    state.chartInstance.data.datasets[0].data = [1420000, 1680000, 1950000, 2150000];
                    state.chartInstance.data.datasets[1].data = [620000, 710000, 810000, 890000];
                } else {
                    state.chartInstance.data.labels = monthlyLabels;
                    state.chartInstance.data.datasets[0].data = monthlyRevenue;
                    state.chartInstance.data.datasets[1].data = monthlyExpenses;
                }
                state.chartInstance.update();
                showToast(`Revenue view updated to ${range.toUpperCase()}`, 'info');
            });
        });

        // Export Data Trigger
        const exportBtn = document.getElementById('btnExportRevenue');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                showToast('Financial Revenue PDF report generated successfully!', 'success');
            });
        }
    }

    function updateChartColors() {
        if (!state.chartInstance) return;
        const isDark = document.body.classList.contains('dark-theme');
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

        state.chartInstance.options.scales.x.ticks.color = textColor;
        state.chartInstance.options.scales.y.ticks.color = textColor;
        state.chartInstance.options.scales.x.grid.color = gridColor;
        state.chartInstance.options.scales.y.grid.color = gridColor;
        state.chartInstance.options.plugins.legend.labels.color = textColor;
        state.chartInstance.update();
    }

    // ==========================================
    // 7. RECENT APPOINTMENTS TABLE FILTERS
    // ==========================================
    function initTableFilters() {
        const filterPills = document.querySelectorAll('#apptStatusPills .filter-pill');
        const tableSearch = document.getElementById('tableSearchInput');

        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const status = pill.getAttribute('data-status');
                state.currentApptFilter = status;
                const searchVal = tableSearch ? tableSearch.value.toLowerCase().trim() : '';
                filterAppointmentsTable(searchVal, status);
            });
        });

        if (tableSearch) {
            tableSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                filterAppointmentsTable(query, state.currentApptFilter);
            });
        }
    }

    function filterAppointmentsTable(query = '', statusFilter = 'all') {
        const rows = document.querySelectorAll('#appointmentsTbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const rowStatus = row.getAttribute('data-status');

            const matchesQuery = !query || text.includes(query);
            const matchesStatus = (statusFilter === 'all') || (rowStatus.toLowerCase() === statusFilter.toLowerCase());

            if (matchesQuery && matchesStatus) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Update Pagination Count
        const countInfo = document.getElementById('tablePaginationInfo');
        if (countInfo) {
            countInfo.innerHTML = `Showing <strong>1 - ${visibleCount}</strong> of <strong>${visibleCount}</strong> matching entries`;
        }
    }

    // ==========================================
    // 8. DOCTOR AVAILABILITY DEPARTMENT FILTER
    // ==========================================
    function initDoctorFilter() {
        const deptSelect = document.getElementById('docDeptSelect');
        if (deptSelect) {
            deptSelect.addEventListener('change', (e) => {
                const selectedDept = e.target.value;
                filterDoctors('', selectedDept);
            });
        }

        const viewAllDocsBtn = document.getElementById('viewAllDocsBtn');
        if (viewAllDocsBtn) {
            viewAllDocsBtn.addEventListener('click', () => {
                const docNav = document.getElementById('nav-doctors');
                if (docNav) docNav.click();
            });
        }
    }

    function filterDoctors(query = '', dept = 'all') {
        const docItems = document.querySelectorAll('.doctor-item');
        docItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const itemDept = item.getAttribute('data-dept');

            const matchesQuery = !query || text.includes(query);
            const matchesDept = (dept === 'all') || (itemDept.toLowerCase() === dept.toLowerCase());

            if (matchesQuery && matchesDept) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // ==========================================
    // 9. MODALS & FORMS HANDLING
    // ==========================================
    function initModals() {
        // New Appointment Modal
        const btnOpenNew = document.getElementById('btnOpenNewApptModal');
        const btnOpenNewTable = document.getElementById('btnAddNewApptTable');
        const modalNew = document.getElementById('newApptModal');
        const btnCloseNew = document.getElementById('closeNewApptModal');
        const btnCancelNew = document.getElementById('btnCancelModal');
        const newForm = document.getElementById('newApptForm');

        function openNewModal() {
            if (modalNew) {
                modalNew.classList.add('show');
                // Set default date to today
                const today = new Date().toISOString().split('T')[0];
                const dateInput = document.getElementById('modalDate');
                if (dateInput) dateInput.value = today;
            }
        }

        function closeNewModal() {
            if (modalNew) modalNew.classList.remove('show');
            if (newForm) newForm.reset();
        }

        if (btnOpenNew) btnOpenNew.addEventListener('click', openNewModal);
        if (btnOpenNewTable) btnOpenNewTable.addEventListener('click', openNewModal);
        if (btnCloseNew) btnCloseNew.addEventListener('click', closeNewModal);
        if (btnCancelNew) btnCancelNew.addEventListener('click', closeNewModal);

        // Submit New Appointment Form
        if (newForm) {
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('modalPatientName').value;
                const age = document.getElementById('modalPatientAge').value;
                const gender = document.getElementById('modalPatientGender').value;
                const dept = document.getElementById('modalDept').value;
                const doctor = document.getElementById('modalDoctor').value;
                const date = document.getElementById('modalDate').value;
                const time = document.getElementById('modalTime').value;
                const status = document.getElementById('modalStatus').value;

                // Create Appt Object
                const newId = state.appointments.length + 1;
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                const bgColors = ['bg-blue', 'bg-purple', 'bg-teal', 'bg-amber', 'bg-rose'];
                const randBg = bgColors[Math.floor(Math.random() * bgColors.length)];
                const ptId = `PT-${Math.floor(1000 + Math.random() * 9000)}`;

                const newAppt = {
                    id: newId,
                    name, age, gender, ptId, doctor, dept,
                    date, time, status,
                    avatarBg: randBg,
                    initials
                };

                state.appointments.unshift(newAppt);
                addNewRowToTable(newAppt);
                
                // Update Appt Count Stat
                state.stats.appointments += 1;
                const statApptsEl = document.getElementById('statAppts');
                const navBadgeEl = document.getElementById('apptsNavBadge');
                if (statApptsEl) statApptsEl.textContent = state.stats.appointments;
                if (navBadgeEl) navBadgeEl.textContent = state.stats.appointments;

                closeNewModal();
                showToast(`Appointment successfully booked for ${name}!`, 'success');
            });
        }

        // View Patient Details Modal
        const modalPatient = document.getElementById('patientDetailsModal');
        const btnClosePtDetails = document.getElementById('closePatientDetailsModal');
        const btnClosePtView = document.getElementById('btnClosePtView');
        const btnPrintPt = document.getElementById('btnPrintPtFile');

        function closePtModal() {
            if (modalPatient) modalPatient.classList.remove('show');
        }

        if (btnClosePtDetails) btnClosePtDetails.addEventListener('click', closePtModal);
        if (btnClosePtView) btnClosePtView.addEventListener('click', closePtModal);
        if (btnPrintPt) {
            btnPrintPt.addEventListener('click', () => {
                showToast('Printing patient medical record...', 'info');
            });
        }

        // Attach event delegation for table dynamic rows
        const tbody = document.getElementById('appointmentsTbody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const btnView = e.target.closest('.btn-view-patient');
                const btnEdit = e.target.closest('.btn-edit-appt');

                if (btnView) {
                    const row = btnView.closest('tr');
                    const ptName = row.querySelector('.patient-name').textContent;
                    const ptSub = row.querySelector('.patient-sub').textContent;
                    const docName = row.querySelector('.doc-cell strong').textContent;
                    const dept = row.querySelector('.dept-badge').textContent;
                    const dateTxt = row.querySelector('.date-txt').textContent;
                    const timeTxt = row.querySelector('.time-txt').textContent;
                    const statusPill = row.querySelector('.status-pill').outerHTML;

                    document.getElementById('viewPtName').textContent = ptName;
                    document.getElementById('viewPtId').textContent = ptSub.split('•')[0].trim();
                    document.getElementById('viewPtDoc').textContent = docName;
                    document.getElementById('viewPtDept').textContent = dept;
                    document.getElementById('viewPtTime').textContent = `${dateTxt} at ${timeTxt}`;
                    document.getElementById('viewPtStatus').outerHTML = statusPill;

                    if (modalPatient) modalPatient.classList.add('show');
                }

                if (btnEdit) {
                    const row = btnEdit.closest('tr');
                    const currentStatus = row.getAttribute('data-status');
                    const statuses = ['Scheduled', 'Completed', 'Pending', 'Cancelled'];
                    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

                    row.setAttribute('data-status', nextStatus);
                    const statusCell = row.querySelector('td:nth-child(5)');

                    const statusHTMLMap = {
                        Completed: `<span class="status-pill status-completed"><i class="fa-solid fa-circle-check"></i> Completed</span>`,
                        Scheduled: `<span class="status-pill status-scheduled"><i class="fa-solid fa-calendar"></i> Scheduled</span>`,
                        Pending: `<span class="status-pill status-pending"><i class="fa-regular fa-clock"></i> Pending</span>`,
                        Cancelled: `<span class="status-pill status-cancelled"><i class="fa-solid fa-ban"></i> Cancelled</span>`
                    };

                    statusCell.innerHTML = statusHTMLMap[nextStatus];
                    showToast(`Updated status to "${nextStatus}"`, 'info');
                }
            });
        }
    }

    function addNewRowToTable(appt) {
        const tbody = document.getElementById('appointmentsTbody');
        if (!tbody) return;

        const tr = document.createElement('tr');
        tr.setAttribute('data-id', appt.id);
        tr.setAttribute('data-status', appt.status);
        tr.setAttribute('data-dept', appt.dept);

        const statusHTMLMap = {
            Completed: `<span class="status-pill status-completed"><i class="fa-solid fa-circle-check"></i> Completed</span>`,
            Scheduled: `<span class="status-pill status-scheduled"><i class="fa-solid fa-calendar"></i> Scheduled</span>`,
            Pending: `<span class="status-pill status-pending"><i class="fa-regular fa-clock"></i> Pending</span>`,
            Cancelled: `<span class="status-pill status-cancelled"><i class="fa-solid fa-ban"></i> Cancelled</span>`
        };

        tr.innerHTML = `
            <td>
                <div class="patient-cell">
                    <div class="avatar-circle-sm ${appt.avatarBg}">${appt.initials}</div>
                    <div class="patient-info">
                        <strong class="patient-name">${appt.name}</strong>
                        <span class="patient-sub">ID: #${appt.ptId} &bull; ${appt.age} Yrs, ${appt.gender}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="doc-cell">
                    <strong>${appt.doctor}</strong>
                    <span class="doc-spec">${appt.dept}</span>
                </div>
            </td>
            <td>
                <div class="date-cell">
                    <span class="date-txt">${appt.date}</span>
                    <span class="time-txt">${appt.time}</span>
                </div>
            </td>
            <td><span class="dept-badge">${appt.dept}</span></td>
            <td>${statusHTMLMap[appt.status]}</td>
            <td class="text-right">
                <div class="action-btn-group">
                    <button class="btn-icon btn-view-patient" data-id="${appt.id}" title="View Details"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn-icon btn-edit-appt" data-id="${appt.id}" title="Update Status"><i class="fa-solid fa-pen"></i></button>
                </div>
            </td>
        `;

        tbody.prepend(tr);
    }

    // ==========================================
    // 10. STAT COUNTER ANIMATION
    // ==========================================
    function initCounterAnimations() {
        const counters = [
            { id: 'statPatients', target: 1250, suffix: '' },
            { id: 'statDoctors', target: 85, suffix: '' },
            { id: 'statAppts', target: 42, suffix: '' }
        ];

        counters.forEach(c => {
            const el = document.getElementById(c.id);
            if (!el) return;
            let current = 0;
            const step = Math.ceil(c.target / 30);
            const timer = setInterval(() => {
                current += step;
                if (current >= c.target) {
                    current = c.target;
                    clearInterval(timer);
                }
                el.innerHTML = current.toLocaleString() + c.suffix;
            }, 30);
        });
    }

    // ==========================================
    // 11. TOAST NOTIFICATION HELPER
    // ==========================================
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-msg ${type}`;
        
        const icons = {
            success: '<i class="fa-solid fa-circle-check text-success"></i>',
            danger: '<i class="fa-solid fa-triangle-exclamation text-danger"></i>',
            info: '<i class="fa-solid fa-circle-info text-primary"></i>'
        };

        toast.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

});
