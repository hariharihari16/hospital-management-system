/**
 * MediCore - System Settings & Diagnostics Module
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { showToast, refreshIcons } from '../ui.js';

export function renderSettings(container) {
    const currentBaseUrl = api.getBaseUrl();
    const currentCurrency = state.currency;
    const isDark = document.body.classList.contains('dark-theme');

    container.innerHTML = `
        <div class="animate-fade-in" style="max-width: 860px; display: flex; flex-direction: column; gap: 24px;">
            <!-- Backend API Configuration -->
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Spring Boot REST API Gateway</h3>
                        <span class="card-subtitle">Configure backend server endpoints and verify real-time connectivity</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">Backend API Base URL</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" class="form-control" id="cfg-api-url" value="${currentBaseUrl}" placeholder="http://localhost:8080/api">
                            <button class="btn btn-secondary" id="cfg-save-url-btn" style="white-space: nowrap;">
                                Save URL
                            </button>
                            <button class="btn btn-secondary" id="cfg-reset-url-btn" style="white-space: nowrap;">
                                Reset Default
                            </button>
                        </div>
                        <div class="form-hint">Default Spring Boot endpoint is <code>http://localhost:8080/api</code>.</div>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: var(--bg-main); border-radius: var(--radius-md); border: 1px solid var(--card-border); margin-top: 18px;">
                        <div>
                            <div style="font-weight: 600; font-size: 0.92rem; color: var(--text-primary);">Test Live Connection</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);" id="cfg-ping-status">Ping status not tested recently</div>
                        </div>
                        <button class="btn btn-primary btn-sm" id="cfg-test-ping-btn">
                            <i data-lucide="activity"></i> Run Connection Probe
                        </button>
                    </div>
                </div>
            </div>

            <!-- Localization & Financial Display -->
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Localization & Currency Preferences</h3>
                        <span class="card-subtitle">Format monetary billing values according to your hospital's jurisdiction</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="form-group" style="max-width: 320px;">
                        <label class="form-label">Active Currency Symbol</label>
                        <select class="form-control" id="cfg-currency-select">
                            <option value="₹" ${currentCurrency === '₹' ? 'selected' : ''}>₹ (Indian Rupee - INR)</option>
                            <option value="$" ${currentCurrency === '$' ? 'selected' : ''}>$ (US Dollar - USD)</option>
                            <option value="€" ${currentCurrency === '€' ? 'selected' : ''}>€ (Euro - EUR)</option>
                            <option value="£" ${currentCurrency === '£' ? 'selected' : ''}>£ (British Pound - GBP)</option>
                            <option value="AED " ${currentCurrency === 'AED ' ? 'selected' : ''}>AED (UAE Dirham)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Appearance & Theme -->
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Workspace Appearance</h3>
                        <span class="card-subtitle">Adjust color themes for clinical workstation lighting conditions</span>
                    </div>
                </div>
                <div class="card-body">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-weight: 600; font-size: 0.92rem; color: var(--text-primary);">Dark Theme Mode</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Switch between daylight clinical mode and deep dark mode</div>
                        </div>
                        <button class="btn btn-secondary" id="cfg-toggle-theme-btn">
                            <i data-lucide="${isDark ? 'sun' : 'moon'}"></i> ${isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Architecture & CORS Troubleshooting -->
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Architecture & System Diagnostics</h3>
                        <span class="card-subtitle">Deployment parameters and CORS configuration details</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Backend Architecture</div>
                            <div class="detail-value">Java 17, Spring Boot, Spring Data JPA</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Database Engine</div>
                            <div class="detail-value">PostgreSQL (Supabase Hosted)</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">CORS Mapping</div>
                            <div class="detail-value"><code>CorsConfig.java</code> (Allowed on localhost:*)</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Central API Gateway</div>
                            <div class="detail-value"><code>/api/*</code> Centralized Client (api.js)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    refreshIcons();

    // Event listeners
    container.querySelector('#cfg-save-url-btn').addEventListener('click', () => {
        const val = container.querySelector('#cfg-api-url').value.trim();
        if (val) {
            api.setBaseUrl(val);
            showToast(`Backend API URL updated to ${val}`, 'success');
            if (window.MediCore && window.MediCore.checkBackendHealth) {
                window.MediCore.checkBackendHealth();
            }
        }
    });

    container.querySelector('#cfg-reset-url-btn').addEventListener('click', () => {
        const def = api.resetBaseUrl();
        container.querySelector('#cfg-api-url').value = def;
        showToast(`Backend API URL reset to ${def}`, 'info');
        if (window.MediCore && window.MediCore.checkBackendHealth) {
            window.MediCore.checkBackendHealth();
        }
    });

    container.querySelector('#cfg-test-ping-btn').addEventListener('click', async () => {
        const statusEl = container.querySelector('#cfg-ping-status');
        const btn = container.querySelector('#cfg-test-ping-btn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-sm"></span> Testing Probe...';
        statusEl.textContent = 'Contacting backend...';

        const res = await api.ping();
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="activity"></i> Run Connection Probe';

        if (res.online) {
            statusEl.innerHTML = `<span style="color: var(--success); font-weight: 600;">✓ Connected successfully!</span> Latency: ${res.latency}ms to ${escapeHtml(res.baseUrl)}`;
            showToast(`Backend responding (${res.latency}ms)`, 'success');
        } else {
            statusEl.innerHTML = `<span style="color: var(--danger); font-weight: 600;">✗ Probe failed:</span> ${escapeHtml(res.error)}`;
            showToast('Unable to connect to backend', 'error');
        }
        refreshIcons();
    });

    container.querySelector('#cfg-currency-select').addEventListener('change', (e) => {
        state.setCurrency(e.target.value);
        showToast(`Currency format updated to ${e.target.value}`, 'success');
    });

    container.querySelector('#cfg-toggle-theme-btn').addEventListener('click', () => {
        const currentlyDark = document.body.classList.contains('dark-theme');
        if (currentlyDark) {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('medicore_theme', 'light');
            showToast('Switched to Light Theme', 'info');
        } else {
            document.body.classList.add('dark-theme');
            localStorage.setItem('medicore_theme', 'dark');
            showToast('Switched to Dark Theme', 'info');
        }
        renderSettings(container);
    });
}
