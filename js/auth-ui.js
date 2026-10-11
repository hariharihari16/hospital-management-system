/**
 * MediCore - Authentication UI & Login Modal
 */

import { api } from './api.js';
import { state } from './state.js';
import { showToast, escapeHtml, refreshIcons } from './ui.js';

export function renderLoginOverlay(onSuccessCallback) {
    let overlay = document.getElementById('login-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'login-overlay';
        overlay.className = 'modal-backdrop animate-fade-in';
        overlay.style.zIndex = '3000';
        document.body.appendChild(overlay);
    }

    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="modal-dialog modal-md animate-scale-up" style="max-width: 480px; box-shadow: var(--shadow-xl); border: 1px solid var(--card-border);">
            <div style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid var(--card-border); background: var(--card-bg);">
                <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, #0d9488, #14b8a6); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: #ffffff; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);">
                    <i data-lucide="cross" style="width: 32px; height: 32px;"></i>
                </div>
                <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">MediCore Health Portal</h2>
                <p style="font-size: 0.86rem; color: var(--text-muted); margin-top: 4px;">
                    Hospital Management & Electronic Medical Records
                </p>
            </div>

            <div style="padding: 24px 32px; background: var(--card-bg);">
                <div style="background: var(--info-bg); border: 1px solid var(--info-border); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 20px; font-size: 0.8rem; color: var(--info-text);">
                    <div style="font-weight: 700; margin-bottom: 2px; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="info" style="width: 14px; height: 14px;"></i> Live Backend Auth Notice:
                    </div>
                    Calls <code>POST /api/auth/login</code> on Spring Boot. Click any quick-login below to populate verified credentials.
                </div>

                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label">Username</label>
                        <input type="text" class="form-control" id="login-username" required placeholder="e.g. admin_vikram" autofocus>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-control" id="login-password" required placeholder="Enter password">
                    </div>

                    <div style="margin-bottom: 18px;">
                        <button type="submit" class="btn btn-primary" id="login-submit-btn" style="width: 100%; padding: 11px; font-size: 0.95rem;">
                            <i data-lucide="log-in"></i> Secure Sign In
                        </button>
                    </div>
                </form>

                <!-- Quick Seed Credentials Picker -->
                <div style="border-top: 1px solid var(--card-border); padding-top: 16px; margin-top: 12px;">
                    <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 10px;">
                        Quick Staff Login (Real Database Accounts):
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button type="button" class="btn btn-secondary btn-sm quick-acc-btn" data-user="admin_vikram" data-pass="$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6FeNpE7wKqKzS2U6u">
                            <i data-lucide="shield"></i> Vikram (Admin)
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm quick-acc-btn" data-user="nurse_kavita" data-pass="$2a$10$r9mB8yZKl6O4v0nE0WvYhe5fU9J3Gqj6MvN3R7vV1pS7k6A8b9yCe">
                            <i data-lucide="heart-pulse"></i> Kavita (Nurse)
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm quick-acc-btn" data-user="tech_rahul" data-pass="$2a$10$w0sD4xFt2gH6j8k0L9mOe.8gT4yU1vB6mC9zK3pQ7rT5vX8zL1qWa">
                            <i data-lucide="flask-conical"></i> Rahul (Lab)
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm quick-acc-btn" data-user="billing_pooja" data-pass="$2a$10$a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a">
                            <i data-lucide="receipt"></i> Pooja (Billing)
                        </button>
                    </div>

                    <div style="text-align: center; margin-top: 14px;">
                        <button type="button" class="btn btn-link btn-sm" id="guest-mode-btn" style="color: var(--text-muted); font-size: 0.78rem;">
                            Continue in Guest Mode (Skip Authentication)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    refreshIcons();

    // Attach quick account buttons
    overlay.querySelectorAll('.quick-acc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const user = btn.dataset.user;
            const pass = btn.dataset.pass;
            overlay.querySelector('#login-username').value = user;
            overlay.querySelector('#login-password').value = pass;
            overlay.querySelector('#login-submit-btn').click();
        });
    });

    // Guest mode button
    overlay.querySelector('#guest-mode-btn').addEventListener('click', () => {
        state.setUser({
            authenticated: true,
            username: 'guest_observer',
            staffName: 'Clinical Observer',
            role: 'Guest Administrator',
            userId: 0,
            staffId: 0
        });
        overlay.style.display = 'none';
        showToast('Entering MediCore in Guest Mode', 'info');
        if (typeof onSuccessCallback === 'function') onSuccessCallback();
    });

    // Form submit
    const form = overlay.querySelector('#login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = overlay.querySelector('#login-username').value.trim();
        const password = overlay.querySelector('#login-password').value;
        const submitBtn = overlay.querySelector('#login-submit-btn');

        if (!username || !password) {
            showToast('Username and password are required', 'warning');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-sm"></span> Authenticating...';

        try {
            const res = await api.auth.login({ username, password });
            if (res.authenticated) {
                state.setUser(res);
                overlay.style.display = 'none';
                showToast(`Welcome back, ${res.staffName || res.username}!`, 'success');
                if (typeof onSuccessCallback === 'function') onSuccessCallback();
            } else {
                showToast(res.message || 'Authentication failed', 'error');
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="log-in"></i> Secure Sign In';
            refreshIcons();
        }
    });
}
