/**
 * MediCore Hospital Management System - Centralized API Client
 * Base URL defaults to http://localhost:8080/api
 */

export class ApiError extends Error {
    constructor(message, status = 0, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

const DEFAULT_BASE_URL = 'http://localhost:8080/api';

class ApiClient {
    constructor() {
        this.baseUrl = localStorage.getItem('medicore_api_url') || DEFAULT_BASE_URL;
        // Strip trailing slash if present
        if (this.baseUrl.endsWith('/')) {
            this.baseUrl = this.baseUrl.slice(0, -1);
        }
    }

    getBaseUrl() {
        return this.baseUrl;
    }

    setBaseUrl(url) {
        let clean = (url || DEFAULT_BASE_URL).trim();
        if (clean.endsWith('/')) clean = clean.slice(0, -1);
        this.baseUrl = clean;
        localStorage.setItem('medicore_api_url', clean);
    }

    resetBaseUrl() {
        this.baseUrl = DEFAULT_BASE_URL;
        localStorage.removeItem('medicore_api_url');
        return DEFAULT_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this.baseUrl}${path}`;

        const headers = {
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const fetchOptions = {
            ...options,
            headers,
            body: options.body && !(options.body instanceof FormData) 
                ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
                : options.body
        };

        let response;
        try {
            response = await fetch(url, fetchOptions);
        } catch (netErr) {
            console.error(`[API Network Error] ${options.method || 'GET'} ${url}:`, netErr);
            throw new ApiError(
                `Unable to connect to backend at ${this.baseUrl}. Please verify the Spring Boot service is running and accessible. (${netErr.message})`,
                0,
                netErr
            );
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return null;
        }

        // Check if response contains JSON
        const contentType = response.headers.get('content-type') || '';
        let responseData = null;

        if (contentType.includes('application/json')) {
            try {
                responseData = await response.json();
            } catch (jsonErr) {
                console.warn('[API JSON Parse Error]:', jsonErr);
            }
        } else {
            responseData = await response.text();
        }

        if (!response.ok) {
            let errorMsg = `Server error (${response.status})`;
            if (responseData && typeof responseData === 'object' && responseData.message) {
                errorMsg = responseData.message;
            } else if (typeof responseData === 'string' && responseData.trim().length > 0) {
                errorMsg = responseData.trim();
            } else if (response.statusText) {
                errorMsg = `${response.status} ${response.statusText}`;
            }

            console.error(`[API Error ${response.status}] ${options.method || 'GET'} ${url}:`, errorMsg, responseData);
            throw new ApiError(errorMsg, response.status, responseData);
        }

        return responseData;
    }

    // Health check
    async ping() {
        const startTime = performance.now();
        try {
            // Using /patients as a lightweight connectivity probe
            await this.request('/patients', { method: 'GET' });
            const latency = Math.round(performance.now() - startTime);
            return { online: true, latency, baseUrl: this.baseUrl };
        } catch (err) {
            return { online: false, error: err.message, baseUrl: this.baseUrl };
        }
    }

    // 1. PATIENTS
    patients = {
        getAll: () => this.request('/patients'),
        getById: (id) => this.request(`/patients/${id}`),
        create: (data) => this.request('/patients', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/patients/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/patients/${id}`, { method: 'DELETE' }),
    };

    // 2. DOCTORS
    doctors = {
        getAll: () => this.request('/doctors'),
        getById: (id) => this.request(`/doctors/${id}`),
        create: (data) => this.request('/doctors', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/doctors/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/doctors/${id}`, { method: 'DELETE' }),
    };

    // 3. DEPARTMENTS
    departments = {
        getAll: () => this.request('/departments'),
        getById: (id) => this.request(`/departments/${id}`),
        create: (data) => this.request('/departments', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/departments/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/departments/${id}`, { method: 'DELETE' }),
    };

    // 4. APPOINTMENTS
    appointments = {
        getAll: () => this.request('/appointments'),
        getById: (id) => this.request(`/appointments/${id}`),
        create: (data) => this.request('/appointments', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/appointments/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/appointments/${id}`, { method: 'DELETE' }),
    };

    // 5. MEDICAL RECORDS
    medicalRecords = {
        getAll: () => this.request('/medical-records'),
        getById: (id) => this.request(`/medical-records/${id}`),
        create: (data) => this.request('/medical-records', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/medical-records/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/medical-records/${id}`, { method: 'DELETE' }),
    };

    // 6. PRESCRIPTIONS
    prescriptions = {
        getAll: () => this.request('/prescriptions'),
        getById: (id) => this.request(`/prescriptions/${id}`),
        create: (data) => this.request('/prescriptions', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/prescriptions/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/prescriptions/${id}`, { method: 'DELETE' }),
    };

    // 7. MEDICINES
    medicines = {
        getAll: () => this.request('/medicines'),
        getById: (id) => this.request(`/medicines/${id}`),
        create: (data) => this.request('/medicines', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/medicines/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/medicines/${id}`, { method: 'DELETE' }),
    };

    // 8. LAB TESTS
    labTests = {
        getAll: () => this.request('/lab-tests'),
        getById: (id) => this.request(`/lab-tests/${id}`),
        create: (data) => this.request('/lab-tests', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/lab-tests/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/lab-tests/${id}`, { method: 'DELETE' }),
    };

    // 9. ROOMS
    rooms = {
        getAll: () => this.request('/rooms'),
        getById: (id) => this.request(`/rooms/${id}`),
        create: (data) => this.request('/rooms', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/rooms/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/rooms/${id}`, { method: 'DELETE' }),
    };

    // 10. ADMISSIONS
    admissions = {
        getAll: () => this.request('/admissions'),
        getById: (id) => this.request(`/admissions/${id}`),
        create: (data) => this.request('/admissions', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/admissions/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/admissions/${id}`, { method: 'DELETE' }),
    };

    // 11. BILLING
    bills = {
        getAll: () => this.request('/bills'),
        getById: (id) => this.request(`/bills/${id}`),
        create: (data) => this.request('/bills', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/bills/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/bills/${id}`, { method: 'DELETE' }),
    };

    // 12. PAYMENTS
    payments = {
        getAll: () => this.request('/payments'),
        getById: (id) => this.request(`/payments/${id}`),
        create: (data) => this.request('/payments', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/payments/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/payments/${id}`, { method: 'DELETE' }),
    };

    // 13. INSURANCE
    insurance = {
        getAll: () => this.request('/insurance'),
        getById: (id) => this.request(`/insurance/${id}`),
        create: (data) => this.request('/insurance', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/insurance/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/insurance/${id}`, { method: 'DELETE' }),
    };

    // 14. STAFF
    staff = {
        getAll: () => this.request('/staff'),
        getById: (id) => this.request(`/staff/${id}`),
        create: (data) => this.request('/staff', { method: 'POST', body: data }),
        update: (id, data) => this.request(`/staff/${id}`, { method: 'PUT', body: data }),
        delete: (id) => this.request(`/staff/${id}`, { method: 'DELETE' }),
    };

    // 15. AUTHENTICATION & USERS
    auth = {
        login: (credentials) => this.request('/auth/login', { method: 'POST', body: credentials }),
        getUsers: () => this.request('/auth/users'),
        getUserById: (id) => this.request(`/auth/users/${id}`),
        createUser: (data) => this.request('/auth/users', { method: 'POST', body: data }),
        updateUser: (id, data) => this.request(`/auth/users/${id}`, { method: 'PUT', body: data }),
        deleteUser: (id) => this.request(`/auth/users/${id}`, { method: 'DELETE' }),
    };
}

export const api = new ApiClient();
export default api;
