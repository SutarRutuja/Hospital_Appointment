const user = checkAuth('admin');

function showSection(id) {
    document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');

    if (id === 'stats-section') loadStats();
    if (id === 'add-doc-section') populateDeptDropdown();
}

async function loadStats() {
    try {
        const res = await api.request('/admin/stats');
        document.getElementById('stat-patients').textContent = res.patientCount;
        document.getElementById('stat-doctors').textContent = res.doctorCount;
        document.getElementById('stat-appointments').textContent = res.appointmentCount;

        const deptContainer = document.getElementById('dept-stats');
        deptContainer.innerHTML = res.appointmentsByDept.map(d => `
            <div class="card" style="padding: 1.5rem;">
                <h4>${d.departmentName}</h4>
                <p class="mt-2" style="font-size: 1.5rem; color: var(--primary-color); font-weight: bold;">${d.count} Appts</p>
            </div>
        `).join('');
    } catch (err) {}
}

async function populateDeptDropdown() {
    try {
        const depts = await api.request('/patients/departments'); // We can reuse patient's unauthenticated route
        const dropdown = document.getElementById('doc-dept');
        dropdown.innerHTML = depts.map(d => `<option value="${d._id}">${d.name}</option>`).join('');
    } catch (err) {}
}

async function addDepartment(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('dept-name').value,
        description: document.getElementById('dept-desc').value,
        icon: 'default-icon'
    };

    try {
        await api.request('/admin/departments', 'POST', payload);
        showNotification('Department added successfully', 'success');
        document.getElementById('dept-name').value = '';
        document.getElementById('dept-desc').value = '';
    } catch (err) {}
}

async function addDoctor(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('doc-name').value,
        email: document.getElementById('doc-email').value,
        password: document.getElementById('doc-pass').value,
        experienceYears: Number(document.getElementById('doc-exp').value),
        departmentId: document.getElementById('doc-dept').value
    };

    try {
        await api.request('/admin/doctors', 'POST', payload);
        showNotification('Doctor added successfully', 'success');
        e.target.reset(); // Reset form
    } catch (err) {}
}

// Initial Load
showSection('stats-section');
