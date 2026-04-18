const API_URL = 'http://localhost:5000/api';

const api = {
    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }
};

function showNotification(message, type = 'success') {
    let container = document.getElementById('notification-area');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-area';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

function checkAuth(requiredRole = null) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = '../index.html';
        return null;
    }

    const user = JSON.parse(userStr);
    
    if (requiredRole && user.role !== requiredRole) {
        window.location.href = '../index.html';
        return null;
    }

    return user;
}
