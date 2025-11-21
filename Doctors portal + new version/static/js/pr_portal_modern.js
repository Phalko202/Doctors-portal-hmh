// Modern PR Portal - Comprehensive Management System
class PRPortalModern {
    constructor() {
        this.state = {
            currentView: 'dashboard',
            staff: [],
            stations: { clinical: [], front: [] },
            customNames: { clinical: {}, front: {} },
            gopdConfig: { staff_count: 2, shifts: [] },
            shiftKnowledge: {},
            leaves: [],
            oneDriveConfig: { token: '', sheetId: '' },
            currentMonth: new Date().getMonth() + 1,
            currentYear: new Date().getFullYear()
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadAllData();
        this.updateDashboard();
        this.initMonthCalendar();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Staff search
        document.getElementById('staffSearchInput')?.addEventListener('input', () => {
            this.renderStaffCards();
        });
    }

    async loadAllData() {
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
        if (view === 'staff') this.renderStaffCards();
        else if (view === 'leaves') this.renderLeaveManagement();
        else if (view === 'ai-config') this.renderAIConfig();
        else if (view === 'integrations') this.renderIntegrations();
        else if (view === 'schedule') this.initMonthCalendar();
    }

    // Dashboard
    async refreshDashboard() {
        await this.loadAllData();
        this.updateDashboard();
    }

    updateDashboard() {
        const total = this.state.staff.length;
        const clinical = this.state.staff.filter(s => s.role === 'clinical').length;
        const front = this.state.staff.filter(s => s.role === 'front').length;
        const onLeave = 0; // TODO: Calculate from leaves

        document.getElementById('statTotalStaff').textContent = total;
        document.getElementById('statClinical').textContent = clinical;
        document.getElementById('statFront').textContent = front;
        document.getElementById('statOnLeave').textContent = onLeave;
    }

    // Staff Management
    renderStaffCards() {
        const container = document.getElementById('staffGrid');
        if (!container) return;

        const searchTerm = document.getElementById('staffSearchInput')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('staffRoleFilter')?.value || '';

        let filtered = this.state.staff.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm);
            const matchesRole = !roleFilter || s.role === roleFilter;
            return matchesSearch && matchesRole;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-text">No staff found</div>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(staff => {
            const initial = staff.name.charAt(0).toUpperCase();
            const leavesCount = 0; // TODO: Get from leaves
            const assignmentsCount = (staff.stations || []).length;

            return `
                <div class="staff-card-modern" onclick="prPortal.viewStaffDetails(${staff.id})">
                    <div class="staff-avatar-large">${initial}</div>
                    <div class="staff-name-large">${staff.name}</div>
                    <span class="staff-role-badge">${staff.role}</span>
                    <div style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">
                        ${(staff.stations || []).slice(0, 2).map(st => this.getCustomName(st, staff.role === 'front')).join(', ')}
                        ${(staff.stations || []).length > 2 ? `+${(staff.stations || []).length - 2} more` : ''}
                    </div>
                    <div class="staff-stats">
                        <div class="staff-stat">
                            <div class="staff-stat-value">${assignmentsCount}</div>
                            <div class="staff-stat-label">Stations</div>
                        </div>
                        <div class="staff-stat">
                            <div class="staff-stat-value">${leavesCount}</div>
                            <div class="staff-stat-label">Leaves</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getCustomName(stationName, isFront = false) {
        const type = isFront ? 'front' : 'clinical';
        return this.state.customNames[type]?.[stationName] || stationName;
    }

    openAddStaffModal() {
        this.populateStationCheckboxes();
        document.getElementById('addStaffModal').classList.add('active');
    }

    populateStationCheckboxes() {
        const role = document.getElementById('staffRole').value;
        const stations = role === 'front' ? this.state.stations.front : this.state.stations.clinical;
        const container = document.getElementById('stationsCheckboxes');

        container.innerHTML = stations.map(st => `
            <label style="display: flex; align-items: center; gap: 8px; padding: 8px; cursor: pointer;">
                <input type="checkbox" value="${st}" style="width: auto;">
                <span>${this.getCustomName(st, role === 'front')}</span>
            </label>
        `).join('');
    }

    toggleStaffFields() {
        this.populateStationCheckboxes();
    }

    async saveStaff() {
        const name = document.getElementById('staffName').value.trim();
        const role = document.getElementById('staffRole').value;
        
        if (!name) {
            alert('Please enter staff name');
            return;
        }

        const stations = Array.from(document.querySelectorAll('#stationsCheckboxes input:checked'))
            .map(cb => cb.value);

        if (stations.length === 0) {
            alert('Please select at least one station');
            return;
        }

        try {
            const res = await fetch('/api/pr/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, role, stations })
            });

            const data = await res.json();
            if (data.ok) {
                await this.loadAllData();
                this.renderStaffCards();
                this.updateDashboard();
                this.closeModal('addStaffModal');
                document.getElementById('staffName').value = '';
                alert('Staff added successfully!');
            } else {
                alert(data.error || 'Failed to add staff');
            }
        } catch (error) {
            console.error('Error saving staff:', error);
            alert('Failed to save staff');
        }
    }

    viewStaffDetails(staffId) {
        const staff = this.state.staff.find(s => s.id == staffId);
        if (!staff) return;

        alert(`Staff Details:\n\nName: ${staff.name}\nRole: ${staff.role}\nStations: ${(staff.stations || []).join(', ')}`);
        // TODO: Implement detailed modal
    }

    // GOPD Configuration
    renderGopdShifts() {
        const container = document.getElementById('gopdShiftsList');
        const shifts = this.state.gopdConfig.shifts || [];

        if (shifts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⏰</div>
                    <div class="empty-state-text">No shifts configured</div>
                </div>
            `;
            return;
        }

        container.innerHTML = shifts.map((shift, idx) => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${shift.name || 'Unnamed Shift'}</div>
                    <div class="list-item-meta">${shift.start} - ${shift.end}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="prPortal.editGopdShift(${idx})">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="prPortal.deleteGopdShift(${idx})">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    openAddGopdShiftModal() {
        document.getElementById('gopdShiftName').value = '';
        document.getElementById('gopdShiftStart').value = '';
        document.getElementById('gopdShiftEnd').value = '';
        document.getElementById('addGopdShiftModal').classList.add('active');
    }

    async saveGopdShift() {
        const name = document.getElementById('gopdShiftName').value.trim();
        const start = document.getElementById('gopdShiftStart').value;
        const end = document.getElementById('gopdShiftEnd').value;

        if (!name || !start || !end) {
            alert('Please fill all fields');
            return;
        }

        this.state.gopdConfig.shifts.push({ name, start, end });
        await this.saveGopdConfig();
        this.renderGopdShifts();
        this.closeModal('addGopdShiftModal');
    }

    async deleteGopdShift(idx) {
        if (!confirm('Delete this shift?')) return;
        this.state.gopdConfig.shifts.splice(idx, 1);
        await this.saveGopdConfig();
        this.renderGopdShifts();
    }

    async saveGopdConfig() {
        const staffCount = parseInt(document.getElementById('gopdStaffCount')?.value) || 2;
        this.state.gopdConfig.staff_count = staffCount;

        try {
            const res = await fetch('/api/pr/gopd-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.state.gopdConfig)
            });

            const data = await res.json();
            if (data.ok) {
                alert('GOPD configuration saved!');
            } else {
                alert(data.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Error saving GOPD config:', error);
            alert('Failed to save configuration');
        }
    }

    // Custom Names
    renderCustomNames() {
        const clinicalDiv = document.getElementById('clinicalCustomNames');
        const frontDiv = document.getElementById('frontCustomNames');

        clinicalDiv.innerHTML = this.state.stations.clinical.map(st => `
            <div class="form-group">
                <label style="font-size: 12px;">${st}</label>
                <input type="text" class="form-input" value="${this.state.customNames.clinical?.[st] || ''}" 
                       placeholder="Short name" data-station="${st}" data-type="clinical">
            </div>
        `).join('');

        frontDiv.innerHTML = this.state.stations.front.map(st => `
            <div class="form-group">
                <label style="font-size: 12px;">${st}</label>
                <input type="text" class="form-input" value="${this.state.customNames.front?.[st] || ''}" 
                       placeholder="Short name" data-station="${st}" data-type="front">
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
                alert('Custom names saved!');
            } else {
                alert(data.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Error saving custom names:', error);
            alert('Failed to save');
        }
    }

    // Shift Knowledge
    renderShiftKnowledge() {
        const container = document.getElementById('shiftKnowledgeList');
        const knowledge = this.state.shiftKnowledge;
        const specs = Object.keys(knowledge).sort();

        if (specs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🧠</div>
                    <div class="empty-state-text">No specialties configured</div>
                </div>
            `;
            return;
        }

        container.innerHTML = specs.map(spec => {
            const data = knowledge[spec];
            return `
                <div class="list-item">
                    <div class="list-item-content">
                        <div class="list-item-title">${spec}</div>
                        <div class="list-item-meta">
                            Shift 1: ${data.shift1?.start || 'N/A'} - ${data.shift1?.end || 'N/A'} (${data.shift1?.patients || 0} pts) | 
                            Shift 2: ${data.shift2?.start || 'N/A'} - ${data.shift2?.end || 'N/A'} (${data.shift2?.patients || 0} pts)
                        </div>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-secondary btn-sm" onclick="prPortal.editSpecialty('${spec}')">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="prPortal.deleteSpecialty('${spec}')">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openAddSpecialtyModal() {
        document.getElementById('specialtyName').value = '';
        document.getElementById('specialty_s1_start').value = '';
        document.getElementById('specialty_s1_end').value = '';
        document.getElementById('specialty_s1_pts').value = '';
        document.getElementById('specialty_s2_start').value = '';
        document.getElementById('specialty_s2_end').value = '';
        document.getElementById('specialty_s2_pts').value = '';
        document.getElementById('addSpecialtyModal').classList.add('active');
    }

    async saveSpecialty() {
        const name = document.getElementById('specialtyName').value.trim();
        if (!name) {
            alert('Please enter specialty name');
            return;
        }

        this.state.shiftKnowledge[name] = {
            shift1: {
                start: document.getElementById('specialty_s1_start').value,
                end: document.getElementById('specialty_s1_end').value,
                patients: parseInt(document.getElementById('specialty_s1_pts').value) || 0
            },
            shift2: {
                start: document.getElementById('specialty_s2_start').value,
                end: document.getElementById('specialty_s2_end').value,
                patients: parseInt(document.getElementById('specialty_s2_pts').value) || 0
            }
        };

        await this.saveShiftKnowledge();
        this.renderShiftKnowledge();
        this.closeModal('addSpecialtyModal');
    }

    async deleteSpecialty(spec) {
        if (!confirm(`Delete ${spec}?`)) return;
        delete this.state.shiftKnowledge[spec];
        await this.saveShiftKnowledge();
        this.renderShiftKnowledge();
    }

    async saveShiftKnowledge() {
        try {
            const res = await fetch('/api/shift-knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ knowledge: this.state.shiftKnowledge })
            });

            const data = await res.json();
            if (data.ok) {
                alert('Shift knowledge saved!');
            } else {
                alert(data.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Error saving shift knowledge:', error);
            alert('Failed to save');
        }
    }

    async saveAIRules() {
        const offset = parseInt(document.getElementById('staffStartOffset').value) || 30;
        const enableOnCall = document.getElementById('enableOnCallAdjust').checked;

        // TODO: Save to backend
        console.log('AI Rules:', { offset, enableOnCall });
        alert('AI Rules saved!');
    }

    // AI Configuration View
    renderAIConfig() {
        this.renderGopdShifts();
        this.renderCustomNames();
        this.renderShiftKnowledge();
    }

    // Month Calendar
    initMonthCalendar() {
        const now = new Date();
        this.state.currentMonth = now.getMonth() + 1;
        this.state.currentYear = now.getFullYear();
        
        document.getElementById('monthSelect').value = this.state.currentMonth;
        document.getElementById('yearInput').value = this.state.currentYear;
        
        this.loadMonthCalendar();
    }

    loadMonthCalendar() {
        this.state.currentMonth = parseInt(document.getElementById('monthSelect').value);
        this.state.currentYear = parseInt(document.getElementById('yearInput').value);
        
        this.renderMonthCalendar();
    }

    renderMonthCalendar() {
        const grid = document.getElementById('monthCalendarGrid');
        const year = this.state.currentYear;
        const month = this.state.currentMonth;

        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();

        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let html = dayHeaders.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            html += '<div></div>';
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            html += `
                <div class="calendar-day" onclick="prPortal.viewDaySchedule('${dateStr}')">
                    <div class="day-number">${day}</div>
                    <div class="day-staff-list">
                        <div style="font-size: 11px; color: var(--text-muted);">No assignments</div>
                    </div>
                </div>
            `;
        }

        grid.innerHTML = html;
    }

    prevMonth() {
        this.state.currentMonth--;
        if (this.state.currentMonth < 1) {
            this.state.currentMonth = 12;
            this.state.currentYear--;
        }
        document.getElementById('monthSelect').value = this.state.currentMonth;
        document.getElementById('yearInput').value = this.state.currentYear;
        this.renderMonthCalendar();
    }

    nextMonth() {
        this.state.currentMonth++;
        if (this.state.currentMonth > 12) {
            this.state.currentMonth = 1;
            this.state.currentYear++;
        }
        document.getElementById('monthSelect').value = this.state.currentMonth;
        document.getElementById('yearInput').value = this.state.currentYear;
        this.renderMonthCalendar();
    }

    viewDaySchedule(date) {
        alert(`Schedule for ${date}\n\nFeature coming soon!`);
    }

    // Schedule Management
    async loadSchedule() {
        const startDate = document.getElementById('scheduleStartDate').value;
        const endDate = document.getElementById('scheduleEndDate').value;

        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        // TODO: Load schedule data
        alert('Loading schedule...');
    }

    async generateAISchedule() {
        if (!confirm('Generate schedule with AI? This will use configured rules and shift knowledge.')) return;
        alert('AI Schedule Generation coming soon!');
    }

    async exportSchedule() {
        alert('Export feature coming soon!');
    }

    // Leave Management
    renderLeaveManagement() {
        this.renderLeaveHistory();
        this.renderTelegramUpdates();
    }

    renderLeaveHistory() {
        const container = document.getElementById('leaveHistory');
        // TODO: Load from backend
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">No leave records</div>
            </div>
        `;
    }

    renderTelegramUpdates() {
        // TODO: Integrate with Telegram API
    }

    openAddLeaveModal() {
        const select = document.getElementById('leaveStaffSelect');
        select.innerHTML = this.state.staff.map(s => 
            `<option value="${s.id}">${s.name}</option>`
        ).join('');
        document.getElementById('addLeaveModal').classList.add('active');
    }

    async saveLeave() {
        // TODO: Implement leave save
        alert('Leave save feature coming soon!');
        this.closeModal('addLeaveModal');
    }

    // Integrations
    renderIntegrations() {
        // Load saved config
        const token = document.getElementById('oneDriveToken');
        const sheetId = document.getElementById('oneDriveSheetId');
        
        if (this.state.oneDriveConfig.token) {
            token.value = this.state.oneDriveConfig.token;
            sheetId.value = this.state.oneDriveConfig.sheetId;
        }
    }

    async saveOneDriveConfig() {
        const token = document.getElementById('oneDriveToken').value.trim();
        const sheetId = document.getElementById('oneDriveSheetId').value.trim();

        this.state.oneDriveConfig = { token, sheetId };
        
        // TODO: Save to backend
        alert('OneDrive configuration saved!');
    }

    async testOneDriveConnection() {
        const token = document.getElementById('oneDriveToken').value.trim();
        if (!token) {
            alert('Please enter access token first');
            return;
        }

        alert('Testing connection...\n\nFeature coming soon!');
    }

    async syncTelegramUpdates() {
        alert('Syncing Telegram updates...\n\nFeature coming soon!');
    }

    // Utilities
    closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove('active');
    }
}

// Initialize
let prPortal;
document.addEventListener('DOMContentLoaded', () => {
    prPortal = new PRPortalModern();
    window.prPortal = prPortal;
});
