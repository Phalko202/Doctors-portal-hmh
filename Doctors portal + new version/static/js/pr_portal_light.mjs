// @ts-nocheck
// PR Portal Light - Modern Management System with all fixes
// Last Updated: November 16, 2025

class PRPortalLight {
    constructor() {
        this.state = {
            staff: [],
            stations: { clinical: [], front: [] },
            customNames: { clinical: {}, front: {} },
            gopdConfig: { staff_count: 2, shifts: [] },
            shiftKnowledge: {},
            doctors: [],
            specialties: [],
            roster: {},
            leaves: {},
            currentRosterMonth: new Date(),
            currentLeaveDate: new Date(),
            telegramConnected: false
        };
        this.init();
    }

    async init() {
        this.attachEventListeners();
        await this.loadData();
        this.renderDashboard();
        this.checkTelegramStatus();
        const today = new Date().toISOString().split('T')[0];
        const leaveDateEl = document.getElementById('leaveDate');
        if (leaveDateEl) leaveDateEl.value = today;
        this.renderLeaveManagement();
    }

    attachEventListeners() {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.currentTarget.dataset.view));
        });
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
        });
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });
        const staffSearch = document.getElementById('staffSearch');
        if (staffSearch) staffSearch.addEventListener('input', (e) => this.filterStaff(e.target.value));
        const leaveDate = document.getElementById('leaveDate');
        if (leaveDate) {
            leaveDate.addEventListener('change', (e) => {
                this.currentLeaveDate = new Date(e.target.value);
                this.renderLeaveManagement();
            });
        }
        const exportType = document.getElementById('exportLeaveType');
        if (exportType) exportType.addEventListener('change', (e) => this.updateExportFields(e.target.value));
    }

    switchView(viewName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });
        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${viewName}-view`);
        });
        switch(viewName) {
            case 'dashboard': this.renderDashboard(); break;
            case 'schedule': this.renderSchedule(); break;
            case 'staff': this.renderStaffDirectory(); break;
            case 'leaves': this.renderLeaveManagement(); break;
            case 'ai-config': this.renderAIConfig(); break;
            case 'integrations': this.renderIntegrations(); break;
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });
        switch(tabName) {
            case 'custom-names': this.renderCustomNames(); break;
            case 'gopd': this.renderGopdConfig(); break;
            case 'shift-knowledge': this.renderShiftKnowledge(); break;
            case 'stations': this.renderStationsManagement(); break;
        }
    }

    async loadData() {
        try {
            const [staffRes, stationsRes, gopdRes, knowledgeRes, doctorsRes] = await Promise.all([
                fetch('/api/pr/staff'),
                fetch('/api/pr/stations'),
                fetch('/api/pr/gopd-config'),
                fetch('/api/shift-knowledge'),
                fetch('/api/doctors')
            ]);
            if (staffRes.ok) {
                const data = await staffRes.json();
                this.state.staff = data.staff || [];
            }
            if (stationsRes.ok) {
                const data = await stationsRes.json();
                this.state.stations = data.stations || { clinical: [], front: [] };
                this.state.customNames = data.station_custom_names || { clinical: {}, front: {} };
                this.state.specialties = data.doctor_specialties || [];
            }
            if (gopdRes.ok) this.state.gopdConfig = await gopdRes.json();
            if (knowledgeRes.ok) {
                const knowledge = await knowledgeRes.json();
                this.state.shiftKnowledge = knowledge || {};
            }
            if (doctorsRes.ok) {
                this.state.doctors = await doctorsRes.json();
                // Extract unique specialties from doctors
                this.state.specialties = [...new Set(
                    this.state.doctors.filter(d => d.specialty).map(d => d.specialty.trim())
                )].sort();
                console.log('Loaded specialties:', this.state.specialties);
            }
            await this.loadRosterData();
            await this.loadLeaveData();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Error loading data', 'danger');
        }
    }

    async loadRosterData() {
        try {
            const res = await fetch('/api/pr/roster/all');
            if (res.ok) this.state.roster = await res.json();
        } catch (error) {
            console.error('Error loading roster:', error);
        }
    }

    async loadLeaveData() {
        try {
            const res = await fetch('/api/pr/leaves/all');
            if (res.ok) this.state.leaves = await res.json();
        } catch (error) {
            console.error('Error loading leaves:', error);
        }
    }

    renderDashboard() {
        try {
            const totalStaff = this.state.staff.filter(s => s.active !== false).length;
            const clinicalStaff = this.state.staff.filter(s => s.active !== false && s.role === 'clinical').length;
            const frontStaff = this.state.staff.filter(s => s.active !== false && s.role === 'front').length;
            const today = new Date().toISOString().split('T')[0];
            const todayLeaves = (this.state.leaves[today] || []).length;
            
            const statTotal = document.getElementById('statTotalStaff');
            const statClin = document.getElementById('statClinical');
            const statFrontEl = document.getElementById('statFront');
            const statLeave = document.getElementById('statOnLeave');
            
            if (statTotal) statTotal.textContent = totalStaff;
            if (statClin) statClin.textContent = clinicalStaff;
            if (statFrontEl) statFrontEl.textContent = frontStaff;
            if (statLeave) statLeave.textContent = todayLeaves;
        } catch (error) {
            console.error('Error rendering dashboard:', error);
        }
    }

    async refreshDashboard() {
        await this.loadData();
        this.renderDashboard();
        this.showNotification('Dashboard refreshed', 'success');
    }

    // ===== SCHEDULE (16th-15th cycle) =====
    getRosterPeriod(date) {
        const d = new Date(date);
        const day = d.getDate();
        if (day >= 16) {
            const startMonth = d.getMonth();
            const startYear = d.getFullYear();
            const endMonth = (startMonth + 1) % 12;
            const endYear = endMonth === 0 ? startYear + 1 : startYear;
            return {
                start: new Date(startYear, startMonth, 16),
                end: new Date(endYear, endMonth, 15),
                label: `${this.getMonthName(startMonth)} 16 - ${this.getMonthName(endMonth)} 15, ${startYear}`
            };
        } else {
            const endMonth = d.getMonth();
            const endYear = d.getFullYear();
            const startMonth = endMonth === 0 ? 11 : endMonth - 1;
            const startYear = startMonth === 11 ? endYear - 1 : endYear;
            return {
                start: new Date(startYear, startMonth, 16),
                end: new Date(endYear, endMonth, 15),
                label: `${this.getMonthName(startMonth)} 16 - ${this.getMonthName(endMonth)} 15, ${startYear}`
            };
        }
    }

    getMonthName(month) {
        return ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'][month];
    }

    prevRoster() {
        this.state.currentRosterMonth.setMonth(this.state.currentRosterMonth.getMonth() - 1);
        this.renderSchedule();
    }

    nextRoster() {
        this.state.currentRosterMonth.setMonth(this.state.currentRosterMonth.getMonth() + 1);
        this.renderSchedule();
    }

    renderSchedule() {
        const period = this.getRosterPeriod(this.state.currentRosterMonth);
        document.getElementById('scheduleTitle').textContent = `Schedule: ${period.label}`;
        const dates = [];
        let currentDate = new Date(period.start);
        while (currentDate <= period.end) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        const table = document.getElementById('rosterTable');
        const thead = table.querySelector('thead tr');
        thead.innerHTML = '<th style="padding: 14px; border: 2px solid var(--border); font-weight: 800; text-align: left; min-width: 150px; background: var(--primary); color: white; position: sticky; left: 0; z-index: 11;">Staff Name</th>';
        dates.forEach(date => {
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            const dateNum = date.getDate();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            thead.innerHTML += `
                <th style="padding: 10px; border: 2px solid var(--border); font-weight: 700; text-align: center; min-width: 90px; background: ${isWeekend ? '#fee2e2' : 'var(--bg)'}; font-size: 12px;">
                    <div>${dayName}</div>
                    <div style="font-size: 16px; color: var(--primary);">${dateNum}</div>
                </th>
            `;
        });
        const tbody = document.getElementById('rosterBody');
        tbody.innerHTML = '';
        this.state.staff.filter(s => s.active !== false).forEach(staff => {
            const row = document.createElement('tr');
            row.style.cssText = 'transition: all 0.3s;';
            row.onmouseover = () => row.style.background = 'var(--hover)';
            row.onmouseout = () => row.style.background = 'transparent';
            const nameCell = document.createElement('td');
            nameCell.style.cssText = 'padding: 14px; border: 2px solid var(--border); font-weight: 700; background: var(--panel); position: sticky; left: 0; z-index: 9; cursor: pointer;';
            nameCell.innerHTML = `<div style="display: flex; align-items: center; gap: 8px;"><span>${staff.role === 'clinical' ? '🏥' : '🎯'}</span><span>${staff.name}</span></div>`;
            nameCell.onclick = () => this.showStaffDetails(staff.id);
            row.appendChild(nameCell);
            dates.forEach(date => {
                const dateStr = date.toISOString().split('T')[0];
                const assignment = this.state.roster[staff.id]?.[dateStr] || {};
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const cell = document.createElement('td');
                cell.style.cssText = `padding: 8px; border: 2px solid var(--border); text-align: center; cursor: pointer; font-size: 12px; font-weight: 600; background: ${isWeekend ? '#fef2f2' : 'white'};`;
                if (assignment.leave) {
                    cell.style.background = this.getLeaveColor(assignment.leave);
                    cell.innerHTML = `<div style="color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${assignment.leave}</div>`;
                } else if (assignment.station) {
                    const stationName = this.getStationName(assignment.station);
                    cell.innerHTML = `<div style="color: var(--primary);">${stationName}</div>`;
                } else {
                    cell.innerHTML = '<div style="color: var(--text-muted);">--</div>';
                }
                cell.onclick = () => this.editRosterCell(staff.id, staff.name, dateStr);
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
    }

    getStationName(stationId) {
        if (this.state.customNames.clinical[stationId]) return this.state.customNames.clinical[stationId];
        if (this.state.customNames.front[stationId]) return this.state.customNames.front[stationId];
        const clinical = this.state.stations.clinical.find(s => s.id === stationId);
        if (clinical) return clinical.name.substring(0, 8);
        const front = this.state.stations.front.find(s => s.id === stationId);
        if (front) return front.name.substring(0, 8);
        return stationId;
    }

    getLeaveColor(leaveType) {
        const colors = {
            'AL': 'linear-gradient(135deg, #10b981, #059669)',
            'SL': 'linear-gradient(135deg, #ef4444, #dc2626)',
            'ML': 'linear-gradient(135deg, #f59e0b, #d97706)',
            'CL': 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
        return colors[leaveType] || 'linear-gradient(135deg, #64748b, #475569)';
    }

    editRosterCell(staffId, staffName, date) {
        this.editingCell = { staffId, staffName, date };
        document.getElementById('editCellTitle').textContent = `Edit: ${staffName} - ${date}`;
        const stationSelect = document.getElementById('editCellStation');
        stationSelect.innerHTML = '<option value="">-- No Assignment --</option>';
        this.state.stations.clinical.forEach(s => {
            stationSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
        this.state.stations.front.forEach(s => {
            stationSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
        const existing = this.state.roster[staffId]?.[date] || {};
        document.getElementById('editCellStation').value = existing.station || '';
        document.getElementById('editCellLeave').value = existing.leave || '';
        document.getElementById('editCellNotes').value = existing.notes || '';
        this.openModal('editRosterCellModal');
    }

    async saveRosterCell() {
        const { staffId, date } = this.editingCell;
        const station = document.getElementById('editCellStation').value;
        const leave = document.getElementById('editCellLeave').value;
        const notes = document.getElementById('editCellNotes').value;
        if (!this.state.roster[staffId]) this.state.roster[staffId] = {};
        this.state.roster[staffId][date] = { station, leave, notes };
        try {
            await fetch('/api/pr/roster/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffId, date: date, assignment: { station, leave, notes } })
            });
            if (leave) await this.updateLeaveRecord(staffId, date, leave, notes);
            this.renderSchedule();
            this.closeModal('editRosterCellModal');
            this.showNotification('Assignment saved', 'success');
        } catch (error) {
            console.error('Error saving assignment:', error);
            this.showNotification('Error saving assignment', 'danger');
        }
    }

    async updateLeaveRecord(staffId, date, leaveType, notes) {
        const staff = this.state.staff.find(s => s.id === staffId);
        if (!staff) return;
        if (!this.state.leaves[date]) this.state.leaves[date] = [];
        this.state.leaves[date] = this.state.leaves[date].filter(l => l.staff_id !== staffId);
        if (leaveType) {
            this.state.leaves[date].push({ staff_id: staffId, staff_name: staff.name, leave_type: leaveType, notes: notes });
        }
        try {
            await fetch('/api/pr/leaves/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.state.leaves)
            });
        } catch (error) {
            console.error('Error updating leaves:', error);
        }
    }

    async exportRoster() {
        const period = this.getRosterPeriod(this.state.currentRosterMonth);
        window.open(`/api/pr/roster/export?start=${period.start.toISOString().split('T')[0]}&end=${period.end.toISOString().split('T')[0]}`, '_blank');
    }

    // ===== STAFF DIRECTORY =====
    renderStaffDirectory() {
        const grid = document.getElementById('staffGrid');
        if (!grid) return;
        grid.innerHTML = this.state.staff.filter(s => s.active !== false).map(staff => {
            const roles = Array.isArray(staff.roles) ? staff.roles : [staff.role];
            const roleIcons = roles.map(r => r === 'clinical' ? '🏥' : r === 'trainer' ? '🎓' : '🎯').join('');
            const roleText = roles.join(', ').replace(/clinical/g, 'Clinical').replace(/front/g, 'Front').replace(/trainer/g, 'Trainer');
            return `
            <div class="stat-card" style="cursor: pointer; padding: 16px;" onclick="prPortal.showStaffDetails('${staff.id}')">
                <div style="font-size: 32px; margin-bottom: 8px;">${roleIcons}</div>
                <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px; color: var(--text);">${staff.name}</div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: capitalize;">${roleText}</div>
                <div style="margin-top: 8px; font-size: 11px; color: var(--primary); font-weight: 600;">
                    ${staff.stations ? staff.stations.length : 0} Station(s)
                </div>
            </div>
        `}).join('');
    }

    filterStaff(query) {
        const filtered = this.state.staff.filter(s => 
            s.active !== false && s.name.toLowerCase().includes(query.toLowerCase())
        );
        this.renderFilteredStaff(filtered);
    }

    filterStaffByRole(role) {
        // Update button styles
        ['filterAll', 'filterClinical', 'filterFront', 'filterTrainer'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.background = '';
                btn.style.color = '';
                btn.className = 'btn btn-secondary';
            }
        });
        const activeBtn = document.getElementById('filter' + role.charAt(0).toUpperCase() + role.slice(1));
        if (activeBtn) {
            activeBtn.style.background = 'var(--primary)';
            activeBtn.style.color = 'white';
        }
        
        const filtered = role === 'all' ? this.state.staff.filter(s => s.active !== false) :
            this.state.staff.filter(s => {
                if (s.active === false) return false;
                const roles = Array.isArray(s.roles) ? s.roles : [s.role];
                return roles.includes(role);
            });
        this.renderFilteredStaff(filtered);
    }

    renderFilteredStaff(staffList) {
        const grid = document.getElementById('staffGrid');
        if (!grid) return;
        grid.innerHTML = staffList.map(staff => {
            const roles = Array.isArray(staff.roles) ? staff.roles : [staff.role];
            const roleIcons = roles.map(r => r === 'clinical' ? '🏥' : r === 'trainer' ? '🎓' : '🎯').join('');
            const roleText = roles.join(', ').replace(/clinical/g, 'Clinical').replace(/front/g, 'Front').replace(/trainer/g, 'Trainer');
            return `
            <div class="stat-card" style="cursor: pointer; padding: 16px;" onclick="prPortal.showStaffDetails('${staff.id}')">
                <div style="font-size: 32px; margin-bottom: 8px;">${roleIcons}</div>
                <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px; color: var(--text);">${staff.name}</div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: capitalize;">${roleText}</div>
                <div style="margin-top: 8px; font-size: 11px; color: var(--primary); font-weight: 600;">
                    ${staff.stations ? staff.stations.length : 0} Station(s)
                </div>
            </div>
        `}).join('');
    }

    showStaffDetails(staffId) {
        const staff = this.state.staff.find(s => s.id === staffId);
        if (!staff) return;
        document.getElementById('staffDetailsName').textContent = `👤 ${staff.name}`;
        
        // Calculate leave breakdown by type
        const leaveBreakdown = { AL: 0, SL: 0, ML: 0, FRL: 0, Other: 0 };
        Object.values(this.state.leaves).forEach(dayLeaves => {
            dayLeaves.filter(l => l.staff_id === staffId).forEach(leave => {
                const type = leave.leave_type || 'Other';
                if (leaveBreakdown[type] !== undefined) {
                    leaveBreakdown[type]++;
                } else {
                    leaveBreakdown.Other++;
                }
            });
        });
        const totalLeaves = Object.values(leaveBreakdown).reduce((a, b) => a + b, 0);
        
        const roles = Array.isArray(staff.roles) ? staff.roles : [staff.role];
        const roleText = roles.join(', ').replace(/clinical/g, 'Clinical').replace(/front/g, 'Front').replace(/trainer/g, 'Trainer');
        const roleIcons = roles.map(r => r === 'clinical' ? '🏥' : r === 'trainer' ? '🎓' : '🎯').join(' ');
        const stationNames = (staff.stations || []).map(sid => this.getStationName(sid)).join(', ');
        
        const content = document.getElementById('staffDetailsContent');
        content.innerHTML = `
            <div style="display: grid; gap: 20px;">
                <div style="text-align: center; padding: 20px; background: var(--bg); border-radius: 12px;">
                    <div style="font-size: 64px; margin-bottom: 12px;">${roleIcons}</div>
                    <div style="font-size: 24px; font-weight: 800; color: var(--text);">${staff.name}</div>
                    <div style="font-size: 14px; color: var(--text-muted); text-transform: capitalize; margin-top: 4px;">${roleText}</div>
                </div>
                <div style="background: var(--bg); padding: 20px; border-radius: 12px;">
                    <div style="font-weight: 700; margin-bottom: 12px; color: var(--primary);">📋 Information</div>
                    <div style="display: grid; gap: 12px; font-size: 14px;">
                        <div><strong>Employee ID:</strong> ${staff.id}</div>
                        <div><strong>Role(s):</strong> <span style="text-transform: capitalize;">${roleText}</span></div>
                        <div><strong>Status:</strong> <span style="color: var(--success); font-weight: 700;">Active</span></div>
                    </div>
                </div>
                <div style="background: var(--bg); padding: 20px; border-radius: 12px;">
                    <div style="font-weight: 700; margin-bottom: 12px; color: var(--primary);">🏥 Assigned Stations</div>
                    <div style="font-size: 14px; color: var(--text);">${stationNames || 'No stations assigned'}</div>
                </div>
                <div style="background: var(--bg); padding: 20px; border-radius: 12px;">
                    <div style="font-weight: 700; margin-bottom: 12px; color: var(--primary);">🏛️ Leave Summary</div>
                    <div style="display: grid; gap: 10px; font-size: 14px;">
                        <div style="display: flex; justify-content: space-between;"><span><strong>Total Leaves Taken:</strong></span> <span style="font-weight: 700; color: var(--danger);">${totalLeaves}</span></div>
                        ${leaveBreakdown.AL > 0 ? `<div style="display: flex; justify-content: space-between; padding-left: 16px;"><span>🏛️ Annual Leave (AL):</span> <span style="font-weight: 700;">${leaveBreakdown.AL}</span></div>` : ''}
                        ${leaveBreakdown.SL > 0 ? `<div style="display: flex; justify-content: space-between; padding-left: 16px;"><span>🩺 Sick Leave (SL):</span> <span style="font-weight: 700;">${leaveBreakdown.SL}</span></div>` : ''}
                        ${leaveBreakdown.ML > 0 ? `<div style="display: flex; justify-content: space-between; padding-left: 16px;"><span>🏜️ Medical Leave (ML):</span> <span style="font-weight: 700;">${leaveBreakdown.ML}</span></div>` : ''}
                        ${leaveBreakdown.FRL > 0 ? `<div style="display: flex; justify-content: space-between; padding-left: 16px;"><span>🎉 Family Leave (FRL):</span> <span style="font-weight: 700;">${leaveBreakdown.FRL}</span></div>` : ''}
                    </div>
                </div>
            </div>
        `;
        this.openModal('staffDetailsModal');
    }
    }

    openAddStaffModal() {
        document.getElementById('newStaffName').value = '';
        
        // Clear role checkboxes
        document.querySelectorAll('.role-checkbox').forEach(cb => cb.checked = false);
        
        // Render station checkboxes
        const stationsContainer = document.getElementById('newStaffStations');
        if (stationsContainer && this.state.stations.length > 0) {
            let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
            this.state.stations.forEach(station => {
                html += `
                    <label style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg); border-radius: 6px; cursor: pointer;">
                        <input type="checkbox" value="${station.id}" class="station-checkbox" style="width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-size: 14px; font-weight: 500;">${station.name}</span>
                    </label>
                `;
            });
            html += '</div>';
            stationsContainer.innerHTML = html;
        } else {
            stationsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 12px; text-align: center;">No stations available. Add stations in AI Configuration first.</p>';
        }
        
        this.openModal('addStaffModal');
    }

    async saveNewStaff() {
        const name = document.getElementById('newStaffName').value.trim();
        
        // Collect selected roles
        const roleCheckboxes = document.querySelectorAll('.role-checkbox:checked');
        const roles = Array.from(roleCheckboxes).map(cb => cb.value);
        
        if (!name || roles.length === 0) {
            this.showNotification('Please fill name and select at least one role', 'danger');
            return;
        }
        
        // Collect selected stations
        const stationCheckboxes = document.querySelectorAll('.station-checkbox:checked');
        const stations = Array.from(stationCheckboxes).map(cb => cb.value);
        
        const newStaff = { 
            id: 'staff_' + Date.now(), 
            name, 
            roles, // Store as array
            role: roles[0], // Keep first role for backward compatibility
            stations, 
            active: true 
        };
        
        try {
            const res = await fetch('/api/pr/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStaff)
            });
            if (res.ok) {
                this.state.staff.push(newStaff);
                this.renderStaffDirectory();
                this.closeModal('addStaffModal');
                this.showNotification(`Staff added: ${roles.join(', ')} with ${stations.length} station(s)`, 'success');
            }
        } catch (error) {
            console.error('Error adding staff:', error);
            this.showNotification('Error adding staff', 'danger');
        }
    }

    // ===== LEAVE MANAGEMENT (FIXED) =====
    jumpToToday() {
        this.currentLeaveDate = new Date();
        document.getElementById('leaveDate').value = this.currentLeaveDate.toISOString().split('T')[0];
        this.renderLeaveManagement();
    }

    prevDay() {
        this.currentLeaveDate.setDate(this.currentLeaveDate.getDate() - 1);
        document.getElementById('leaveDate').value = this.currentLeaveDate.toISOString().split('T')[0];
        this.renderLeaveManagement();
    }

    nextDay() {
        const today = new Date();
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 30);
        const nextDate = new Date(this.currentLeaveDate);
        nextDate.setDate(nextDate.getDate() + 1);
        if (nextDate <= maxDate) {
            this.currentLeaveDate = nextDate;
            document.getElementById('leaveDate').value = this.currentLeaveDate.toISOString().split('T')[0];
            this.renderLeaveManagement();
        } else {
            this.showNotification('Cannot go beyond 30 days in the future', 'danger');
        }
    }

    renderLeaveManagement() {
        const dateStr = this.currentLeaveDate.toISOString().split('T')[0];
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][this.currentLeaveDate.getDay()];
        const today = new Date().toISOString().split('T')[0];
        const isToday = dateStr === today;
        document.getElementById('leaveDateDisplay').textContent = `Leaves for ${dayName}, ${dateStr}${isToday ? ' (Today)' : ''}`;
        const leaves = this.state.leaves[dateStr] || [];
        const container = document.getElementById('leavesList');
        if (leaves.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <div class="empty-state-text">No leaves on this day</div>
                </div>
            `;
            return;
        }
        container.innerHTML = leaves.map(leave => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${leave.staff_name}</div>
                    <div class="list-item-meta">
                        <span style="padding: 4px 12px; background: ${this.getLeaveColor(leave.leave_type)}; color: white; border-radius: 6px; font-weight: 700; font-size: 12px;">${leave.leave_type}</span>
                        ${leave.notes ? `<span style="margin-left: 12px; color: var(--text-muted);">${leave.notes}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    openExportLeaveModal() {
        const select = document.getElementById('exportStaffSelect');
        select.innerHTML = '<option value="">Select staff member...</option>' +
            this.state.staff.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        this.openModal('exportLeaveModal');
    }

    updateExportFields(type) {
        document.getElementById('exportDateRangeFields').style.display = type === 'dateRange' ? 'block' : 'none';
        document.getElementById('exportStaffField').style.display = type === 'staff' ? 'block' : 'none';
    }

    async exportLeaveReport() {
        const type = document.getElementById('exportLeaveType').value;
        const format = document.getElementById('exportFormat').value;
        let params = new URLSearchParams({ type, format });
        if (type === 'dateRange') {
            const start = document.getElementById('exportStartDate').value;
            const end = document.getElementById('exportEndDate').value;
            if (!start || !end) {
                this.showNotification('Please select date range', 'danger');
                return;
            }
            params.append('start', start);
            params.append('end', end);
        } else if (type === 'staff') {
            const staffId = document.getElementById('exportStaffSelect').value;
            if (!staffId) {
                this.showNotification('Please select a staff member', 'danger');
                return;
            }
            params.append('staff_id', staffId);
        }
        window.open(`/api/pr/leaves/export?${params.toString()}`, '_blank');
        this.closeModal('exportLeaveModal');
        this.showNotification('Generating report...', 'success');
    }

    // ===== AI CONFIGURATION (FIXED) =====
    renderAIConfig() {
        this.renderCustomNames();
        this.renderGopdConfig();
        this.renderShiftKnowledge();
        this.renderStationsManagement();
    }

    renderCustomNames() {
        const clinicalDiv = document.getElementById('clinicalCustomNames');
        if (!clinicalDiv) return;
        clinicalDiv.innerHTML = this.state.stations.clinical.map(station => {
            const customName = this.state.customNames.clinical?.[station.id] || '';
            return `
                <div class="form-group">
                    <label>${station.name}</label>
                    <input type="text" class="form-input" data-station-type="clinical" data-station-id="${station.id}" placeholder="Short name" value="${customName}">
                </div>
            `;
        }).join('');
        const frontDiv = document.getElementById('frontCustomNames');
        if (!frontDiv) return;
        frontDiv.innerHTML = this.state.stations.front.map(station => {
            const customName = this.state.customNames.front?.[station.id] || '';
            return `
                <div class="form-group">
                    <label>${station.name}</label>
                    <input type="text" class="form-input" data-station-type="front" data-station-id="${station.id}" placeholder="Short name" value="${customName}">
                </div>
            `;
        }).join('');
    }

    async saveCustomNames() {
        const customNames = { clinical: {}, front: {} };
        document.querySelectorAll('#clinicalCustomNames input').forEach(input => {
            const id = input.dataset.stationId;
            const value = input.value.trim();
            if (value) customNames.clinical[id] = value;
        });
        document.querySelectorAll('#frontCustomNames input').forEach(input => {
            const id = input.dataset.stationId;
            const value = input.value.trim();
            if (value) customNames.front[id] = value;
        });
        try {
            const res = await fetch('/api/pr/station-custom-names', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customNames)
            });
            if (res.ok) {
                this.state.customNames = customNames;
                await this.loadData();
                this.showNotification('Custom names saved successfully', 'success');
            } else {
                this.showNotification('Error saving custom names', 'danger');
            }
        } catch (error) {
            console.error('Error saving custom names:', error);
            this.showNotification('Error saving custom names', 'danger');
        }
    }

    renderGopdConfig() {
        const staffCountInput = document.getElementById('gopdStaffCount');
        if (staffCountInput) staffCountInput.value = this.state.gopdConfig.staff_count || 2;
        const shiftsDiv = document.getElementById('gopdShiftsList');
        if (!shiftsDiv) return;
        const shifts = this.state.gopdConfig.shifts || [];
        if (shifts.length === 0) {
            shiftsDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No shifts configured</div></div>';
            return;
        }
        shiftsDiv.innerHTML = shifts.map((shift, index) => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${shift.name}</div>
                    <div class="list-item-meta">${shift.start} - ${shift.end}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-danger btn-sm" onclick="prPortal.deleteGopdShift(${index})">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    openAddGopdShiftModal() {
        document.getElementById('gopdShiftName').value = '';
        document.getElementById('gopdShiftStart').value = '';
        document.getElementById('gopdShiftEnd').value = '';
        this.openModal('addGopdShiftModal');
    }

    saveGopdShift() {
        const name = document.getElementById('gopdShiftName').value.trim();
        const start = document.getElementById('gopdShiftStart').value;
        const end = document.getElementById('gopdShiftEnd').value;
        if (!name || !start || !end) {
            this.showNotification('Please fill all fields', 'danger');
            return;
        }
        this.state.gopdConfig.shifts.push({ name, start, end });
        this.renderGopdConfig();
        this.closeModal('addGopdShiftModal');
        this.showNotification('Shift added successfully', 'success');
    }

    deleteGopdShift(index) {
        if (confirm('Delete this shift?')) {
            this.state.gopdConfig.shifts.splice(index, 1);
            this.renderGopdConfig();
            this.showNotification('Shift deleted', 'success');
        }
    }

    async saveGopdConfig() {
        const staffCount = parseInt(document.getElementById('gopdStaffCount').value);
        this.state.gopdConfig.staff_count = staffCount;
        try {
            const res = await fetch('/api/pr/gopd-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.state.gopdConfig)
            });
            if (res.ok) this.showNotification('GOPD configuration saved', 'success');
        } catch (error) {
            console.error('Error saving GOPD config:', error);
            this.showNotification('Error saving GOPD configuration', 'danger');
        }
    }

    // FIXED: Shift Knowledge auto-populated from doctors portal
    renderShiftKnowledge() {
        const container = document.getElementById('shiftKnowledgeList');
        if (!container) return;
        const knowledge = this.state.shiftKnowledge;
        const specialties = Object.keys(knowledge);
        if (specialties.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🧠</div><div class="empty-state-text">No shift knowledge configured. Add specialties from your doctor portal!</div></div>';
            return;
        }
        container.innerHTML = specialties.map(specialty => {
            const data = knowledge[specialty];
            const shift1 = data.shift1 || {};
            const shift2 = data.shift2 || {};
            return `
                <div class="list-item">
                    <div class="list-item-content">
                        <div class="list-item-title">${specialty}</div>
                        <div class="list-item-meta">
                            <strong>Shift 1:</strong> ${shift1.start || '--'} to ${shift1.end || '--'} (${shift1.patients || 0} pts) | 
                            <strong>Shift 2:</strong> ${shift2.start || '--'} to ${shift2.end || '--'} (${shift2.patients || 0} pts)
                        </div>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-secondary btn-sm" onclick="prPortal.editSpecialty('${specialty.replace(/'/g, "\\'")}')">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="prPortal.deleteSpecialty('${specialty.replace(/'/g, "\\'")}')">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openAddSpecialtyModal() {
        const select = document.getElementById('specialtyName');
        if (select) {
            select.innerHTML = '<option value="">Select specialty...</option>' +
                this.state.specialties.map(s => `<option value="${s}">${s}</option>`).join('') +
                '<option value="__custom__">➕ Add Custom Specialty</option>';
        }
        document.getElementById('specialty_s1_start').value = '';
        document.getElementById('specialty_s1_end').value = '';
        document.getElementById('specialty_s1_pts').value = '';
        document.getElementById('specialty_s2_start').value = '';
        document.getElementById('specialty_s2_end').value = '';
        document.getElementById('specialty_s2_pts').value = '';
        this.editingSpecialty = null;
        this.openModal('addSpecialtyModal');
    }

    // NEW: Edit existing specialty
    editSpecialty(specialty) {
        const data = this.state.shiftKnowledge[specialty];
        if (!data) return;
        this.editingSpecialty = specialty;
        const select = document.getElementById('specialtyName');
        if (select) {
            select.innerHTML = `<option value="${specialty}" selected>${specialty}</option>`;
            select.disabled = true;
        }
        const shift1 = data.shift1 || {};
        const shift2 = data.shift2 || {};
        document.getElementById('specialty_s1_start').value = shift1.start || '';
        document.getElementById('specialty_s1_end').value = shift1.end || '';
        document.getElementById('specialty_s1_pts').value = shift1.patients || '';
        document.getElementById('specialty_s2_start').value = shift2.start || '';
        document.getElementById('specialty_s2_end').value = shift2.end || '';
        document.getElementById('specialty_s2_pts').value = shift2.patients || '';
        this.openModal('addSpecialtyModal');
    }

    saveSpecialty() {
        let specialty = document.getElementById('specialtyName').value;
        if (specialty === '__custom__') {
            specialty = prompt('Enter custom specialty name:');
            if (!specialty) return;
        }
        if (!specialty) {
            this.showNotification('Please select a specialty', 'danger');
            return;
        }
        const shift1 = {
            start: document.getElementById('specialty_s1_start').value,
            end: document.getElementById('specialty_s1_end').value,
            patients: parseInt(document.getElementById('specialty_s1_pts').value) || 0
        };
        const shift2 = {
            start: document.getElementById('specialty_s2_start').value,
            end: document.getElementById('specialty_s2_end').value,
            patients: parseInt(document.getElementById('specialty_s2_pts').value) || 0
        };
        this.state.shiftKnowledge[specialty] = { shift1, shift2 };
        this.renderShiftKnowledge();
        this.closeModal('addSpecialtyModal');
        const select = document.getElementById('specialtyName');
        if (select) select.disabled = false;
        this.editingSpecialty = null;
        this.showNotification(this.editingSpecialty ? 'Specialty updated' : 'Specialty knowledge added', 'success');
    }

    deleteSpecialty(specialty) {
        if (confirm(`Delete knowledge for ${specialty}?`)) {
            delete this.state.shiftKnowledge[specialty];
            this.renderShiftKnowledge();
            this.showNotification('Specialty deleted', 'success');
        }
    }

    async saveShiftKnowledge() {
        try {
            const res = await fetch('/api/shift-knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.state.shiftKnowledge)
            });
            if (res.ok) this.showNotification('Shift knowledge saved successfully', 'success');
        } catch (error) {
            console.error('Error saving shift knowledge:', error);
            this.showNotification('Error saving shift knowledge', 'danger');
        }
    }

    // NEW: Stations Management Tab
    renderStationsManagement() {
        const container = document.getElementById('stationsManagementContent');
        if (!container) return;
        
        const clinicalStations = this.state.stations.clinical || [];
        const frontStations = this.state.stations.front || [];
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 28px;">
                <div>
                    <h4 style="margin-bottom: 16px; color: var(--primary); font-size: 18px; font-weight: 700;">Clinical Stations</h4>
                    <div id="clinicalStationsList">
                        ${clinicalStations.map((station, index) => `
                            <div class="list-item">
                                <div class="list-item-content">
                                    <div class="list-item-title">${station.name}</div>
                                    <div class="list-item-meta">ID: ${station.id}</div>
                                </div>
                                <div class="list-item-actions">
                                    <button class="btn btn-danger btn-sm" onclick="prPortal.deleteStation('clinical', ${index})">🗑️ Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary btn-sm" style="margin-top: 12px;" onclick="prPortal.addStation('clinical')">
                        ➕ Add Clinical Station
                    </button>
                </div>
                <div>
                    <h4 style="margin-bottom: 16px; color: var(--secondary); font-size: 18px; font-weight: 700;">Front Stations</h4>
                    <div id="frontStationsList">
                        ${frontStations.map((station, index) => `
                            <div class="list-item">
                                <div class="list-item-content">
                                    <div class="list-item-title">${station.name}</div>
                                    <div class="list-item-meta">ID: ${station.id}</div>
                                </div>
                                <div class="list-item-actions">
                                    <button class="btn btn-danger btn-sm" onclick="prPortal.deleteStation('front', ${index})">🗑️ Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary btn-sm" style="margin-top: 12px;" onclick="prPortal.addStation('front')">
                        ➕ Add Front Station
                    </button>
                </div>
            </div>
            <button class="btn btn-success" style="margin-top: 24px;" onclick="prPortal.saveStations()">
                💾 Save All Stations
            </button>
        `;
    }

    addStation(type) {
        const name = prompt(`Enter ${type} station name:`);
        if (!name) return;
        const id = name.toLowerCase().replace(/\s+/g, '_');
        if (this.state.stations[type].find(s => s.id === id)) {
            this.showNotification('Station already exists', 'danger');
            return;
        }
        this.state.stations[type].push({ id, name });
        this.renderStationsManagement();
        this.showNotification(`${type} station added`, 'success');
    }

    deleteStation(type, index) {
        if (confirm('Delete this station?')) {
            this.state.stations[type].splice(index, 1);
            this.renderStationsManagement();
            this.showNotification('Station deleted', 'success');
        }
    }

    async saveStations() {
        try {
            const res = await fetch('/api/pr/stations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stations: this.state.stations })
            });
            if (res.ok) {
                await this.loadData();
                this.showNotification('Stations saved successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving stations:', error);
            this.showNotification('Error saving stations', 'danger');
        }
    }

    async saveAIRules() {
        this.showNotification('AI rules saved', 'success');
    }

    // ===== INTEGRATIONS =====
    renderIntegrations() {
        this.checkTelegramStatus();
    }

    async checkTelegramStatus() {
        try {
            const res = await fetch('/api/telegram/status');
            if (res.ok) {
                const data = await res.json();
                const statusEl = document.getElementById('telegramStatus');
                if (statusEl) {
                    if (data.running) {
                        statusEl.textContent = 'CONNECTED';
                        statusEl.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                        statusEl.style.color = 'white';
                        this.state.telegramConnected = true;
                    } else {
                        statusEl.textContent = 'NOT CONNECTED';
                        statusEl.style.background = 'linear-gradient(135deg, #64748b, #475569)';
                        statusEl.style.color = 'white';
                        this.state.telegramConnected = false;
                    }
                }
                const lastSyncEl = document.getElementById('telegramLastSync');
                if (lastSyncEl) lastSyncEl.textContent = data.last_sync || 'Never';
            }
        } catch (error) {
            console.error('Error checking Telegram status:', error);
            const statusEl = document.getElementById('telegramStatus');
            if (statusEl) {
                statusEl.textContent = 'NOT CONNECTED';
                statusEl.style.background = 'linear-gradient(135deg, #64748b, #475569)';
                statusEl.style.color = 'white';
            }
        }
    }

    async saveOneDrive() {
        const token = document.getElementById('oneDriveToken').value.trim();
        const sheetId = document.getElementById('oneDriveSheetId').value.trim();
        if (!token || !sheetId) {
            this.showNotification('Please fill all OneDrive fields', 'danger');
            return;
        }
        try {
            await fetch('/api/onedrive/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, sheet_id: sheetId })
            });
            this.showNotification('OneDrive configuration saved', 'success');
        } catch (error) {
            this.showNotification('Error saving OneDrive config', 'danger');
        }
    }

    async testOneDrive() {
        this.showNotification('Testing OneDrive connection...', 'info');
        try {
            const res = await fetch('/api/onedrive/test');
            const data = await res.json();
            if (data.ok) {
                this.showNotification('OneDrive connection successful!', 'success');
            } else {
                this.showNotification('OneDrive connection failed', 'danger');
            }
        } catch (error) {
            this.showNotification('Error testing OneDrive', 'danger');
        }
    }

    async saveTelegram() {
        const token = document.getElementById('telegramBotToken').value.trim();
        const groupId = document.getElementById('telegramGroupId').value.trim();
        if (!token || !groupId) {
            this.showNotification('Please fill all Telegram fields', 'danger');
            return;
        }
        try {
            await fetch('/api/telegram/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bot_token: token, group_id: groupId })
            });
            this.showNotification('Telegram configuration saved', 'success');
            this.checkTelegramStatus();
        } catch (error) {
            this.showNotification('Error saving Telegram config', 'danger');
        }
    }

    async testTelegram() {
        this.showNotification('Testing Telegram connection...', 'info');
        try {
            const res = await fetch('/api/telegram/test');
            const data = await res.json();
            if (data.ok) {
                this.showNotification('Telegram connection successful!', 'success');
                this.checkTelegramStatus();
            } else {
                this.showNotification('Telegram connection failed', 'danger');
            }
        } catch (error) {
            this.showNotification('Error testing Telegram', 'danger');
        }
    }

    async syncTelegram() {
        this.showNotification('Syncing Telegram...', 'info');
        try {
            const res = await fetch('/api/telegram/sync', { method: 'POST' });
            const data = await res.json();
            if (data.ok) {
                this.showNotification('Telegram synced successfully!', 'success');
                this.checkTelegramStatus();
            } else {
                this.showNotification('Telegram sync failed', 'danger');
            }
        } catch (error) {
            this.showNotification('Error syncing Telegram', 'danger');
        }
    }

    // ===== UTILITY =====
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
        const select = document.getElementById('specialtyName');
        if (select) select.disabled = false;
    }

    // ===== AI ROSTER GENERATION =====
    openAIGeneratorModal() {
        // Set default dates to current roster period
        const period = this.getRosterPeriod(new Date());
        const startInput = document.getElementById('aiGenStartDate');
        const endInput = document.getElementById('aiGenEndDate');
        const today = new Date().toISOString().split('T')[0];
        
        if (startInput) {
            startInput.value = period.start.toISOString().split('T')[0];
            startInput.min = today; // Prevent past dates
        }
        if (endInput) {
            endInput.value = period.end.toISOString().split('T')[0];
            endInput.min = today; // Prevent past dates
        }
        
        // Set doctor view date to today and set minimum date
        const doctorViewInput = document.getElementById('doctorViewDate');
        if (doctorViewInput) {
            doctorViewInput.value = today;
            doctorViewInput.min = today; // Prevent selecting past dates
        }
        
        this.openModal('aiGeneratorModal');
        
        // Auto-load today's doctor schedule
        setTimeout(() => this.loadDoctorScheduleForDate(), 300);
    }

    async loadDoctorScheduleForDate() {
        const dateInput = document.getElementById('doctorViewDate');
        const listContainer = document.getElementById('doctorScheduleList');
        
        if (!dateInput || !dateInput.value) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">Please select a date</p>';
            return;
        }
        
        const selectedDate = dateInput.value;
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">Loading...</p>';
        
        try {
            const res = await fetch(`/api/pr/roster/clinical?start_date=${selectedDate}&end_date=${selectedDate}`);
            const data = await res.json();
            
            if (data.ok && data.rosters && data.rosters[selectedDate]) {
                const schedules = data.rosters[selectedDate];
                
                if (schedules.length === 0) {
                    listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">No doctors scheduled for this date</p>';
                    return;
                }
                
                let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
                
                schedules.forEach(schedule => {
                    const doctorName = schedule.doctor_name || 'Unknown';
                    const specialty = schedule.specialty || 'General';
                    const shift = schedule.shift || 'Day';
                    const status = schedule.status || 'duty';
                    
                    const statusColors = {
                        'duty': '#10b981',
                        'leave': '#ef4444',
                        'off': '#6b7280'
                    };
                    const statusColor = statusColors[status] || '#3b82f6';
                    
                    html += `
                        <div style="background: var(--card); padding: 12px 16px; border-radius: 8px; border-left: 4px solid ${statusColor}; display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <div style="font-weight: 700; color: var(--text); font-size: 14px; margin-bottom: 4px;">👨‍⚕️ ${doctorName}</div>
                                <div style="font-size: 12px; color: var(--text-muted);">
                                    <span style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 2px 8px; border-radius: 4px; margin-right: 6px;">${specialty}</span>
                                    <span style="background: var(--bg); padding: 2px 8px; border-radius: 4px;">${shift}</span>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                                    ${status}
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
                
                // Add summary at the top
                const dutyCount = schedules.filter(s => s.status === 'duty').length;
                const specialties = [...new Set(schedules.map(s => s.specialty))].join(', ');
                
                const summaryHtml = `
                    <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                        <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">📊 Summary</div>
                        <div style="font-size: 13px; opacity: 0.95;">${dutyCount} doctor(s) on duty</div>
                        <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">Specialties: ${specialties || 'None'}</div>
                    </div>
                `;
                
                listContainer.innerHTML = summaryHtml + html;
                
            } else {
                listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">No doctors scheduled for this date</p>';
            }
            
        } catch (error) {
            console.error('Error loading doctor schedule:', error);
            listContainer.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 20px; font-size: 13px;">Error loading schedule. Please try again.</p>';
        }
    }

    async generateRoster() {
        const startDate = document.getElementById('aiGenStartDate').value;
        const endDate = document.getElementById('aiGenEndDate').value;
        
        if (!startDate || !endDate) {
            this.showNotification('Please select start and end dates', 'danger');
            return;
        }
        
        if (new Date(endDate) < new Date(startDate)) {
            this.showNotification('End date must be after start date', 'danger');
            return;
        }
        
        if (!confirm(`⚠️ This will generate/overwrite roster from ${startDate} to ${endDate}. Continue?`)) {
            return;
        }
        
        this.showNotification('🤖 Generating roster... Please wait', 'info');
        this.closeModal('aiGeneratorModal');
        
        try {
            const res = await fetch('/api/pr/generate-roster', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start_date: startDate, end_date: endDate })
            });
            
            const data = await res.json();
            
            if (data.ok) {
                this.state.roster = data.roster;
                await this.loadRosterData(); // Reload to ensure sync
                this.renderSchedule();
                this.showNotification(`✅ ${data.message}! Total days: ${data.stats.total_days}`, 'success');
            } else {
                this.showNotification(`❌ Error: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error generating roster:', error);
            this.showNotification('Error generating roster. Check console for details.', 'danger');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 24px; right: 24px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 
                        type === 'danger' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                        'linear-gradient(135deg, #3b82f6, #2563eb)'};
            color: white; padding: 16px 24px; border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2); font-weight: 700; font-size: 15px;
            z-index: 10000; animation: slideIn 0.3s ease;
            display: flex; align-items: center; gap: 10px;
        `;
        const icon = type === 'success' ? '✅' : type === 'danger' ? '❌' : 'ℹ️';
        notification.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize
const prPortal = new PRPortalLight();
