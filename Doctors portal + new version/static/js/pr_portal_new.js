// Modern PR Portal JavaScript
class PRPortal {
    constructor() {
        this.state = {
            staff: [],
            stations: { clinical: [], front: [] },
            customNames: { clinical: {}, front: {} },
            gopdConfig: { staff_count: 2, shifts: [] },
            shiftKnowledge: {},
            currentView: 'dashboard',
            viewMode: 'grid', // grid, list, table
            searchTerm: '',
            roleFilter: ''
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.updateDashboard();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // View mode switcher
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchViewMode(mode);
            });
        });

        // Staff Management
        document.getElementById('addStaffBtn')?.addEventListener('click', () => this.openAddStaffModal());
        document.getElementById('saveStaffBtn')?.addEventListener('click', () => this.saveStaff());
        document.getElementById('staffSearchInput')?.addEventListener('input', (e) => {
            this.state.searchTerm = e.target.value;
            this.renderStaffView();
        });
        document.getElementById('staffRoleFilter')?.addEventListener('change', (e) => {
            this.state.roleFilter = e.target.value;
            this.renderStaffView();
        });
        document.getElementById('staffRoleInput')?.addEventListener('change', (e) => {
            this.toggleStationFields(e.target.value);
        });

        // GOPD Config
        document.getElementById('addGopdShiftBtn')?.addEventListener('click', () => this.addGopdShift());
        document.getElementById('saveGopdConfigBtn')?.addEventListener('click', () => this.saveGopdConfig());

        // Custom Names
        document.getElementById('saveCustomNamesBtn')?.addEventListener('click', () => this.saveCustomNames());

        // Shift Knowledge
        document.getElementById('addSpecialtyBtn')?.addEventListener('click', () => this.addSpecialty());
        document.getElementById('saveShiftKnowledgeBtn')?.addEventListener('click', () => this.saveShiftKnowledge());

        // AI Rules
        document.getElementById('saveAiRulesBtn')?.addEventListener('click', () => this.saveAiRules());

        // Month View
        document.getElementById('loadMonthViewBtn')?.addEventListener('click', () => this.loadMonthView());
        document.getElementById('prevMonthBtn')?.addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonthBtn')?.addEventListener('click', () => this.navigateMonth(1));

        // Schedule View
        document.getElementById('loadScheduleViewBtn')?.addEventListener('click', () => this.loadScheduleView());
        document.getElementById('exportScheduleBtn')?.addEventListener('click', () => this.exportSchedule());
        document.getElementById('clearScheduleBtn')?.addEventListener('click', () => this.clearSchedule());
    }

    async loadData() {
        try {
            const [staffRes, stationsRes, gopdRes, knowledgeRes] = await Promise.all([
                fetch('/api/pr/staff'),
                fetch('/api/pr/stations'),
                fetch('/api/pr/gopd-config'),
                fetch('/api/shift-knowledge')
            ]);

            const staffData = await staffRes.json();
            const stationsData = await stationsRes.json();
            const gopdData = await gopdRes.json();
            const knowledgeData = await knowledgeRes.json();

            if (staffData.ok) this.state.staff = staffData.staff || [];
            if (stationsData.ok) {
                this.state.stations = stationsData.stations || { clinical: [], front: [] };
                this.state.customNames = stationsData.station_custom_names || { clinical: {}, front: {} };
            }
            if (gopdData.ok) this.state.gopdConfig = gopdData.config || { staff_count: 2, shifts: [] };
            if (knowledgeData.ok) this.state.shiftKnowledge = knowledgeData.knowledge || {};

        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    switchView(view) {
        this.state.currentView = view;
        
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Update panels
        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${view}-view`)?.classList.add('active');

        // Load view-specific data
        if (view === 'staff-management') {
            this.renderStaffView();
        } else if (view === 'ai-knowledge') {
            this.renderAIKnowledge();
        }
    }

    switchViewMode(mode) {
        this.state.viewMode = mode;
        
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        const container = document.getElementById('staffContainer');
        container.className = mode === 'grid' ? 'grid-view' : 'list-view';
        
        this.renderStaffView();
    }

    updateDashboard() {
        const total = this.state.staff.length;
        const clinical = this.state.staff.filter(s => s.role === 'clinical').length;
        const front = this.state.staff.filter(s => s.role === 'front').length;
        const training = this.state.staff.filter(s => s.role === 'training').length;

        document.getElementById('statTotalStaff').textContent = total;
        document.getElementById('statClinical').textContent = clinical;
        document.getElementById('statFront').textContent = front;
        document.getElementById('statTraining').textContent = training;
    }

    // Staff Management
    renderStaffView() {
        const container = document.getElementById('staffContainer');
        if (!container) return;

        let filtered = this.state.staff;

        // Apply search filter
        if (this.state.searchTerm) {
            const term = this.state.searchTerm.toLowerCase();
            filtered = filtered.filter(s => 
                s.name.toLowerCase().includes(term) ||
                s.role.toLowerCase().includes(term) ||
                (s.stations || []).some(st => st.toLowerCase().includes(term))
            );
        }

        // Apply role filter
        if (this.state.roleFilter) {
            filtered = filtered.filter(s => s.role === this.state.roleFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 48px; color: var(--text-muted);">No staff found</div>';
            return;
        }

        if (this.state.viewMode === 'grid') {
            container.innerHTML = filtered.map(staff => this.renderStaffCard(staff)).join('');
        } else if (this.state.viewMode === 'list') {
            container.innerHTML = filtered.map(staff => this.renderStaffListItem(staff)).join('');
        } else {
            container.innerHTML = this.renderStaffTable(filtered);
        }

        // Add click handlers
        container.querySelectorAll('.staff-card, .staff-list-item').forEach((el, idx) => {
            el.addEventListener('click', () => this.viewStaffDetails(filtered[idx]));
        });
    }

    renderStaffCard(staff) {
        const initial = staff.name.charAt(0).toUpperCase();
        const stations = (staff.stations || []).slice(0, 3);
        const moreCount = Math.max(0, (staff.stations || []).length - 3);

        return `
            <div class="staff-card" data-id="${staff.id}">
                <div class="staff-card-header">
                    <div style="flex: 1;">
                        <div class="staff-name">${staff.name}</div>
                        <span class="staff-role ${staff.role}">${staff.role}</span>
                    </div>
                    <div class="staff-avatar">${initial}</div>
                </div>
                <div class="staff-stations">
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">
                        ${staff.role === 'training' ? 'Training At:' : 'Stations:'}
                    </div>
                    <div class="station-tags">
                        ${stations.map(st => `<span class="station-tag">${this.getCustomName(st, staff.role === 'front')}</span>`).join('')}
                        ${moreCount > 0 ? `<span class="station-tag">+${moreCount} more</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderStaffListItem(staff) {
        const initial = staff.name.charAt(0).toUpperCase();
        const stations = (staff.stations || []).map(st => this.getCustomName(st, staff.role === 'front')).join(', ');

        return `
            <div class="staff-list-item" data-id="${staff.id}">
                <div class="staff-avatar">${initial}</div>
                <div class="staff-list-info">
                    <div>
                        <div class="staff-name">${staff.name}</div>
                    </div>
                    <div>
                        <span class="staff-role ${staff.role}">${staff.role}</span>
                    </div>
                    <div style="font-size: 13px; color: var(--text-muted);">
                        ${stations || 'No stations assigned'}
                    </div>
                    <div>
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderStaffTable(staff) {
        return `
            <div class="schedule-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Stations/Training</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${staff.map(s => `
                            <tr>
                                <td><strong>${s.name}</strong></td>
                                <td><span class="staff-role ${s.role}">${s.role}</span></td>
                                <td>${(s.stations || []).map(st => this.getCustomName(st, s.role === 'front')).join(', ')}</td>
                                <td>
                                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="prPortal.viewStaffDetails(${JSON.stringify(s).replace(/"/g, '&quot;')})">
                                        View
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getCustomName(stationName, isFront = false) {
        const type = isFront ? 'front' : 'clinical';
        return this.state.customNames[type]?.[stationName] || stationName;
    }

    openAddStaffModal() {
        document.getElementById('addStaffModal').classList.add('active');
        this.populateStationOptions();
    }

    populateStationOptions() {
        const role = document.getElementById('staffRoleInput').value;
        const stations = role === 'front' ? this.state.stations.front : this.state.stations.clinical;
        
        const checkboxesDiv = document.getElementById('stationsCheckboxes');
        const trainingSelect = document.getElementById('trainingAtInput');

        checkboxesDiv.innerHTML = stations.map(st => `
            <label style="display: flex; align-items: center; gap: 8px; padding: 6px;">
                <input type="checkbox" value="${st}">
                <span>${this.getCustomName(st, role === 'front')}</span>
            </label>
        `).join('');

        trainingSelect.innerHTML = stations.map(st => 
            `<option value="${st}">${this.getCustomName(st, role === 'front')}</option>`
        ).join('');

        this.toggleStationFields(role);
    }

    toggleStationFields(role) {
        const stationsGroup = document.getElementById('stationsGroup');
        const trainingGroup = document.getElementById('trainingAtGroup');
        
        if (role === 'training') {
            stationsGroup.style.display = 'none';
            trainingGroup.style.display = 'block';
        } else {
            stationsGroup.style.display = 'block';
            trainingGroup.style.display = 'none';
        }
    }

    async saveStaff() {
        const name = document.getElementById('staffNameInput').value.trim();
        const role = document.getElementById('staffRoleInput').value;
        
        if (!name) {
            alert('Please enter staff name');
            return;
        }

        let stations = [];
        if (role === 'training') {
            stations = [document.getElementById('trainingAtInput').value];
        } else {
            stations = Array.from(document.querySelectorAll('#stationsCheckboxes input:checked'))
                .map(cb => cb.value);
        }

        try {
            const res = await fetch('/api/pr/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, role, stations })
            });

            const data = await res.json();
            if (data.ok) {
                await this.loadData();
                this.updateDashboard();
                this.renderStaffView();
                closeModal('addStaffModal');
                document.getElementById('staffNameInput').value = '';
            } else {
                alert(data.error || 'Failed to add staff');
            }
        } catch (error) {
            console.error('Error saving staff:', error);
            alert('Failed to save staff');
        }
    }

    viewStaffDetails(staff) {
        alert(`Staff Details:\n\nName: ${staff.name}\nRole: ${staff.role}\nStations: ${(staff.stations || []).join(', ')}`);
        // TODO: Implement detailed view modal
    }

    // AI Knowledge
    renderAIKnowledge() {
        this.renderGopdShifts();
        this.renderCustomNames();
        this.renderShiftKnowledge();
    }

    renderGopdShifts() {
        const container = document.getElementById('gopdShiftsList');
        document.getElementById('gopdStaffCount').value = this.state.gopdConfig.staff_count || 2;
        
        const shifts = this.state.gopdConfig.shifts || [];
        container.innerHTML = shifts.map((shift, idx) => `
            <div style="display: flex; gap: 12px; align-items: center;">
                <input type="text" class="form-input" value="${shift.name || ''}" placeholder="Shift name (e.g., Morning)" data-idx="${idx}" data-field="name" style="flex: 1;">
                <input type="time" class="form-input" value="${shift.start || ''}" placeholder="Start" data-idx="${idx}" data-field="start" style="width: 120px;">
                <input type="time" class="form-input" value="${shift.end || ''}" placeholder="End" data-idx="${idx}" data-field="end" style="width: 120px;">
                <button class="btn btn-danger" style="padding: 8px 12px;" onclick="prPortal.removeGopdShift(${idx})">✕</button>
            </div>
        `).join('');
    }

    addGopdShift() {
        this.state.gopdConfig.shifts.push({ name: '', start: '', end: '' });
        this.renderGopdShifts();
    }

    removeGopdShift(idx) {
        this.state.gopdConfig.shifts.splice(idx, 1);
        this.renderGopdShifts();
    }

    async saveGopdConfig() {
        const staffCount = parseInt(document.getElementById('gopdStaffCount').value) || 2;
        const shifts = [];
        
        document.querySelectorAll('#gopdShiftsList input').forEach(input => {
            const idx = parseInt(input.dataset.idx);
            const field = input.dataset.field;
            if (!shifts[idx]) shifts[idx] = {};
            shifts[idx][field] = input.value;
        });

        try {
            const res = await fetch('/api/pr/gopd-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_count: staffCount, shifts })
            });

            const data = await res.json();
            if (data.ok) {
                this.state.gopdConfig = { staff_count: staffCount, shifts };
                alert('GOPD Configuration saved successfully!');
            } else {
                alert(data.error || 'Failed to save configuration');
            }
        } catch (error) {
            console.error('Error saving GOPD config:', error);
            alert('Failed to save configuration');
        }
    }

    renderCustomNames() {
        const clinicalDiv = document.getElementById('clinicalCustomNames');
        const frontDiv = document.getElementById('frontCustomNames');

        clinicalDiv.innerHTML = this.state.stations.clinical.map(st => `
            <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" class="form-input" value="${st}" readonly style="flex: 1; background: var(--card);">
                <span style="color: var(--text-muted);">→</span>
                <input type="text" class="form-input" value="${this.state.customNames.clinical?.[st] || ''}" placeholder="Short name" data-station="${st}" data-type="clinical" style="flex: 1;">
            </div>
        `).join('');

        frontDiv.innerHTML = this.state.stations.front.map(st => `
            <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" class="form-input" value="${st}" readonly style="flex: 1; background: var(--card);">
                <span style="color: var(--text-muted);">→</span>
                <input type="text" class="form-input" value="${this.state.customNames.front?.[st] || ''}" placeholder="Short name" data-station="${st}" data-type="front" style="flex: 1;">
            </div>
        `).join('');
    }

    async saveCustomNames() {
        const customNames = { clinical: {}, front: {} };

        document.querySelectorAll('#clinicalCustomNames input[data-station]').forEach(input => {
            const station = input.dataset.station;
            const shortName = input.value.trim();
            if (shortName) customNames.clinical[station] = shortName;
        });

        document.querySelectorAll('#frontCustomNames input[data-station]').forEach(input => {
            const station = input.dataset.station;
            const shortName = input.value.trim();
            if (shortName) customNames.front[station] = shortName;
        });

        try {
            const res = await fetch('/api/pr/station-custom-names', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ station_custom_names: customNames })
            });

            const data = await res.json();
            if (data.ok) {
                this.state.customNames = customNames;
                alert('Custom names saved successfully!');
            } else {
                alert(data.error || 'Failed to save custom names');
            }
        } catch (error) {
            console.error('Error saving custom names:', error);
            alert('Failed to save custom names');
        }
    }

    renderShiftKnowledge() {
        const container = document.getElementById('specialtyKnowledgeContainer');
        const knowledge = this.state.shiftKnowledge;

        container.innerHTML = Object.keys(knowledge).map(specialty => {
            const data = knowledge[specialty];
            return `
                <div class="card" style="margin-bottom: 16px;">
                    <h4>${specialty}</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
                        <div>
                            <strong>Shift 1</strong>
                            <div style="display: flex; gap: 8px; margin-top: 8px;">
                                <input type="time" class="form-input" value="${data.shift1?.start || ''}" placeholder="Start" data-specialty="${specialty}" data-shift="shift1" data-field="start">
                                <input type="time" class="form-input" value="${data.shift1?.end || ''}" placeholder="End" data-specialty="${specialty}" data-shift="shift1" data-field="end">
                                <input type="number" class="form-input" value="${data.shift1?.patients || ''}" placeholder="Patients" data-specialty="${specialty}" data-shift="shift1" data-field="patients" style="width: 100px;">
                            </div>
                        </div>
                        <div>
                            <strong>Shift 2</strong>
                            <div style="display: flex; gap: 8px; margin-top: 8px;">
                                <input type="time" class="form-input" value="${data.shift2?.start || ''}" placeholder="Start" data-specialty="${specialty}" data-shift="shift2" data-field="start">
                                <input type="time" class="form-input" value="${data.shift2?.end || ''}" placeholder="End" data-specialty="${specialty}" data-shift="shift2" data-field="end">
                                <input type="number" class="form-input" value="${data.shift2?.patients || ''}" placeholder="Patients" data-specialty="${specialty}" data-shift="shift2" data-field="patients" style="width: 100px;">
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    addSpecialty() {
        const specialty = prompt('Enter specialty name (e.g., Cardiology):');
        if (!specialty) return;

        this.state.shiftKnowledge[specialty] = {
            shift1: { start: '', end: '', patients: 0 },
            shift2: { start: '', end: '', patients: 0 }
        };
        this.renderShiftKnowledge();
    }

    async saveShiftKnowledge() {
        const knowledge = {};

        document.querySelectorAll('#specialtyKnowledgeContainer input[data-specialty]').forEach(input => {
            const specialty = input.dataset.specialty;
            const shift = input.dataset.shift;
            const field = input.dataset.field;
            
            if (!knowledge[specialty]) knowledge[specialty] = { shift1: {}, shift2: {} };
            knowledge[specialty][shift][field] = field === 'patients' ? parseInt(input.value) || 0 : input.value;
        });

        try {
            const res = await fetch('/api/shift-knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ knowledge })
            });

            const data = await res.json();
            if (data.ok) {
                this.state.shiftKnowledge = knowledge;
                alert('Shift knowledge saved successfully!');
            } else {
                alert(data.error || 'Failed to save shift knowledge');
            }
        } catch (error) {
            console.error('Error saving shift knowledge:', error);
            alert('Failed to save shift knowledge');
        }
    }

    async saveAiRules() {
        const offset = parseInt(document.getElementById('staffStartOffset').value) || 30;
        const enableOnCall = document.getElementById('enableOnCallAdjust').checked;

        // TODO: Save AI rules to backend
        console.log('AI Rules:', { offset, enableOnCall });
        alert('AI Rules saved! (Feature coming soon)');
    }

    // Month View
    async loadMonthView() {
        const month = document.getElementById('monthSelect').value;
        const year = document.getElementById('yearInput').value;

        // TODO: Fetch month data from backend
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('monthViewTitle').textContent = `${monthNames[month - 1]} ${year}`;
        document.getElementById('monthViewContainer').style.display = 'block';

        this.renderMonthCalendar(parseInt(year), parseInt(month));
    }

    renderMonthCalendar(year, month) {
        const grid = document.getElementById('monthCalendarGrid');
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();

        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let html = dayHeaders.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            html += '<div></div>';
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            html += `
                <div class="calendar-day">
                    <div class="day-number">${day}</div>
                    <div class="day-staff-count">0 staff assigned</div>
                </div>
            `;
        }

        grid.innerHTML = html;
    }

    navigateMonth(delta) {
        const monthSelect = document.getElementById('monthSelect');
        const yearInput = document.getElementById('yearInput');
        
        let month = parseInt(monthSelect.value) + delta;
        let year = parseInt(yearInput.value);
        
        if (month > 12) {
            month = 1;
            year++;
        } else if (month < 1) {
            month = 12;
            year--;
        }
        
        monthSelect.value = month;
        yearInput.value = year;
    }

    // Schedule View
    async loadScheduleView() {
        const date = document.getElementById('scheduleFilterDate').value;
        if (!date) {
            alert('Please select a date');
            return;
        }

        // TODO: Fetch schedule data from backend
        const container = document.getElementById('scheduleViewContainer');
        container.innerHTML = `
            <div class="schedule-table">
                <table>
                    <thead>
                        <tr>
                            <th>Staff Name</th>
                            <th>Role</th>
                            <th>Station</th>
                            <th>Shift Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">
                                No schedule data for selected date
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    async exportSchedule() {
        alert('Export feature coming soon!');
    }

    async clearSchedule() {
        if (!confirm('Are you sure you want to clear the schedule?')) return;
        alert('Clear schedule feature coming soon!');
    }
}

// Helper functions
function switchView(view) {
    window.prPortal.switchView(view);
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

// Initialize
let prPortal;
document.addEventListener('DOMContentLoaded', () => {
    prPortal = new PRPortal();
    window.prPortal = prPortal; // Make available globally
});
