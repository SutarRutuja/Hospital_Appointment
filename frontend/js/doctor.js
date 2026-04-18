const user = checkAuth('doctor');
document.getElementById('user-name').textContent = `Hello, ${user.name}`;

// Set date filter to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('filter-date').value = today;

async function loadAppointments() {
    const date = document.getElementById('filter-date').value;
    try {
        const res = await api.request(`/doctors/${user.id}/appointments?date=${date}`);
        const container = document.getElementById('appointments-list');
        
        if (res.appointments.length === 0) {
            container.innerHTML = '<div class="card"><p>No appointments found for this date.</p></div>';
            return;
        }

        container.innerHTML = res.appointments.map(app => {
            let badgeClass = app.status === 'completed' ? 'badge-success' : app.status === 'scheduled' ? 'badge-warning' : 'badge-danger';
            let actionBtn = app.status === 'scheduled' 
                ? `<button class="btn btn-primary" onclick="openModal('${app._id}', '${app.patientId}')">Add Medical Record</button>`
                : `<span class="text-muted">Record Added</span>`;

            return `
                <div class="card mb-4" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 class="mb-1">Patient: ${app.patient?.name || 'Unknown'}</h3>
                        <p class="mb-2">Time: ${app.timeSlot} | Date: ${app.date}</p>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">
                            Age: ${app.patient?.age || 'N/A'} | Gender: ${app.patient?.gender || 'N/A'} | Contact: ${app.patient?.contact || 'N/A'}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <span class="badge ${badgeClass} mb-4" style="display: inline-block;">${app.status.toUpperCase()}</span>
                        <br>
                        ${actionBtn}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {}
}

function openModal(appId, patId) {
    document.getElementById('rec-app-id').value = appId;
    document.getElementById('rec-pat-id').value = patId;
    document.getElementById('record-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('record-modal').classList.add('hidden');
    document.getElementById('record-form').reset();
}

async function submitRecord(e) {
    e.preventDefault();
    
    const payload = {
        appointmentId: document.getElementById('rec-app-id').value,
        patientId: document.getElementById('rec-pat-id').value,
        diagnosis: document.getElementById('rec-diagnosis').value,
        prescription: document.getElementById('rec-prescription').value,
        doctorNotes: document.getElementById('rec-notes').value
    };

    try {
        await api.request('/doctors/records', 'POST', payload);
        showNotification('Record saved and appointment marked as completed', 'success');
        closeModal();
        loadAppointments();
    } catch (err) {}
}

loadAppointments();
