const user = checkAuth('patient');
document.getElementById('user-name').textContent = `Hello, ${user.name}`;

let selectedDeptId = null;
let selectedDocId = null;
let selectedSlot = null;

function showSection(id) {
    document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');

    if (id === 'book-appointment') {
        loadDepartments();
    } else if (id === 'medical-history') {
        loadHistory();
    }
}

window.rebookAppointment = async function(deptId, docId) {
    document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));
    document.getElementById('book-appointment').classList.remove('hidden');

    await loadDepartments();
    
    const deptCard = Array.from(document.querySelectorAll('.department-card')).find(el => el.getAttribute('onclick').includes(deptId));
    if (deptCard) {
        await selectDepartment(deptId, deptCard);
        const docCard = Array.from(document.querySelectorAll('.doctor-card')).find(el => el.getAttribute('onclick').includes(docId));
        if (docCard) {
            selectDoctor(docId, docCard);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
};

async function loadDepartments() {
    try {
        const depts = await api.request('/patients/departments');
        const container = document.getElementById('departments-list');
        container.innerHTML = depts.map(d => `
            <div class="card department-card" onclick="selectDepartment('${d._id}', this)">
                <h4>${d.name}</h4>
                <p class="mt-1" style="font-size: 0.8rem">${d.description}</p>
            </div>
        `).join('');
    } catch (err) {}
}

async function selectDepartment(id, element) {
    document.querySelectorAll('.department-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedDeptId = id;
    
    document.getElementById('step-2').classList.remove('hidden');
    document.getElementById('step-3').classList.add('hidden');
    
    try {
        const docs = await api.request(`/patients/doctors?departmentId=${id}`);
        const container = document.getElementById('doctors-list');
        
        if (docs.length === 0) {
            container.innerHTML = '<p>No doctors available in this department.</p>';
            return;
        }

        container.innerHTML = docs.map(d => `
            <div class="card doctor-card" onclick="selectDoctor('${d._id}', this)">
                <h4>${d.name}</h4>
                <p class="mt-1" style="font-size: 0.8rem">${d.experienceYears} Years Experience</p>
            </div>
        `).join('');
    } catch (err) {}
}

function selectDoctor(id, element) {
    document.querySelectorAll('.doctor-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedDocId = id;
    
    document.getElementById('step-3').classList.remove('hidden');
    
    // Set min date to today
    const dateInput = document.getElementById('appointment-date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
    
    fetchSlots();
}

async function fetchSlots() {
    const date = document.getElementById('appointment-date').value;
    if (!date) return;

    try {
        const res = await api.request(`/patients/appointments/available-slots?doctorId=${selectedDocId}&date=${date}`);
        const container = document.getElementById('slots-list');
        
        container.innerHTML = res.availableSlots.map(slot => `
            <div class="slot-btn" onclick="selectSlot('${slot}', this)">
                ${slot}
            </div>
        `).join('');
        
        document.getElementById('book-btn').classList.add('hidden');
    } catch (err) {}
}

function selectSlot(slot, element) {
    document.querySelectorAll('.slot-btn').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedSlot = slot;
    document.getElementById('book-btn').classList.remove('hidden');
}

async function submitBooking() {
    const date = document.getElementById('appointment-date').value;
    
    const payload = {
        doctorId: selectedDocId,
        departmentId: selectedDeptId,
        date: date,
        timeSlot: selectedSlot
    };

    try {
        await api.request('/patients/appointments', 'POST', payload);
        showNotification('Appointment booked successfully!', 'success');
        
        // Reset selections
        selectedDeptId = null;
        selectedDocId = null;
        selectedSlot = null;
        document.getElementById('step-2').classList.add('hidden');
        document.getElementById('step-3').classList.add('hidden');
        document.querySelectorAll('.department-card').forEach(el => el.classList.remove('selected'));
        
        showSection('medical-history');
    } catch (err) {}
}

async function loadHistory() {
    try {
        const res = await api.request(`/patients/${user.id}/history`);
        const container = document.getElementById('history-list');
        
        if (res.appointments.length === 0) {
            container.innerHTML = '<div class="card"><p>No past appointments found.</p></div>';
            return;
        }

        container.innerHTML = res.appointments.map(app => {
            let badgeClass = app.status === 'completed' ? 'badge-success' : app.status === 'scheduled' ? 'badge-warning' : 'badge-danger';
            let recordHtml = '';
            
            if (app.record) {
                recordHtml = `
                    <div class="mt-4" style="background: var(--bg-main); padding: 1rem; border-radius: var(--radius-md);">
                        <h5 class="mb-2">Diagnosis:</h5>
                        <p class="mb-2">${app.record.diagnosis}</p>
                        <h5 class="mb-2">Prescription:</h5>
                        <p class="mb-2">${app.record.prescription}</p>
                        <h5 class="mb-2">Notes:</h5>
                        <p>${app.record.doctorNotes}</p>
                    </div>
                `;
            }

            let doctorName = app.doctor?.name || 'Doctor';
            if (!doctorName.startsWith('Dr.')) {
                doctorName = 'Dr. ' + doctorName;
            }

            return `
                <div class="card mb-4">
                    <div class="d-flex justify-between align-center mb-4">
                        <div>
                            <h3 class="mb-1">${app.department?.name || 'Department'} - ${doctorName}</h3>
                            <p>${app.date} | ${app.timeSlot}</p>
                        </div>
                        <div class="d-flex align-center gap-4">
                            <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="rebookAppointment('${app.department?._id}', '${app.doctor?._id}')">Book Appointment</button>
                            <span class="badge ${badgeClass}">${app.status.toUpperCase()}</span>
                        </div>
                    </div>
                    ${recordHtml}
                </div>
            `;
        }).join('');
    } catch (err) {}
}

// Initial Load
showSection('book-appointment');
