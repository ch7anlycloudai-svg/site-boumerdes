/**
 * Admin Dashboard JavaScript
 * Mauritanian Students Union Website
 *
 * This file contains common functions used across all admin pages
 */

// ======================
// AUTHENTICATION
// ======================

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        const data = await response.json();
        return data.authenticated;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

/**
 * Require authentication - redirect to login if not authenticated
 */
async function requireAuth() {
    const isAuth = await checkAuth();
    if (!isAuth) {
        window.location.href = '/admin/';
    }
}

/**
 * Logout user
 */
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    window.location.href = '/admin/';
}

// ======================
// UTILITY FUNCTIONS
// ======================

/**
 * Escape HTML to prevent XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeUrl(url) {
    if (!url) return '';
    if (/^(https?:\/\/|\/)/i.test(url)) return url;
    return '';
}

/**
 * Format date to Arabic format
 * @param {string} dateString
 * @returns {string}
 */
function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    return date.toLocaleDateString('ar-DZ', options);
}

/**
 * Format date to short format (date only)
 * @param {string} dateString
 * @returns {string}
 */
function formatDateShort(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    return date.toLocaleDateString('ar-DZ', options);
}

/**
 * Show toast notification
 * @param {string} message
 * @param {string} type - 'success', 'error', 'info'
 */
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    toast.style.background = colors[type] || colors.info;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Confirm action with dialog
 * @param {string} message
 * @returns {boolean}
 */
function confirmAction(message) {
    return confirm(message);
}

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ======================
// API HELPERS
// ======================

/**
 * Make API request
 * @param {string} url
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, mergedOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

/**
 * GET request
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function apiGet(url) {
    return apiRequest(url);
}

/**
 * POST request
 * @param {string} url
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function apiPost(url, data) {
    return apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * PUT request
 * @param {string} url
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function apiPut(url, data) {
    return apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

/**
 * DELETE request
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function apiDelete(url) {
    return apiRequest(url, {
        method: 'DELETE'
    });
}

/**
 * PATCH request
 * @param {string} url
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function apiPatch(url, data = {}) {
    return apiRequest(url, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// ======================
// MOBILE MENU
// ======================

/**
 * Toggle mobile sidebar
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
}

// Close sidebar on outside click (mobile)
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const menuButton = document.querySelector('.menu-toggle');

    if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && (!menuButton || !menuButton.contains(e.target))) {
            sidebar.classList.remove('open');
        }
    }
});

// ======================
// KEYBOARD SHORTCUTS
// ======================

document.addEventListener('keydown', (e) => {
    // ESC to close modals
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display !== 'none') {
                modal.style.display = 'none';
            }
        });
    }

    // Ctrl+S to save (if save function exists)
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (typeof saveAllChanges === 'function') {
            saveAllChanges();
        }
    }
});

// ======================
// CSS ANIMATIONS
// ======================

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ======================
// INITIALIZATION
// ======================

// Log that admin.js is loaded
console.log('Admin dashboard scripts loaded');
