/* ========================================
   PR Portal - Clinical Duty Roster Management
   Enhanced with Wizard UI, Month View, Excel Sheet, 
   GOPD Config, and OPD Specialty Knowledge
   ======================================== */

class PRPortal {
    constructor() {
        this.staff = [];
        this.stations = { clinical: [], front: [] };
        this.doctorSpecialties = [];
        this.rosters = {};
        this.leaveTypes = {};
        this.gopdConfig = { staff_count: 2, shifts: [] };
        this.specialtyKnowledge = {}; // OPD specialty-based duty timing rules
        this.stationCustomNames = {}; // mapping full_name -> short_name
        this.currentView = 'clinical-roster';
        this.selectedDateRange = { start: null, end: null };
        this.currentMonth = new Date();
        this.wizardStep = 1;
        this.wizardData = {};
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.setDefaultDates();
    }

    /* ========================================
       Event Listeners
       ======================================== */
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item:not([disabled])').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.closest('.nav-item').dataset.view));
        });

        // Date controls
        document.getElementById('loadRosterBtn')?.addEventListener('click', () => this.loadRoster());
        document.getElementById('refreshRosterBtn')?.addEventListener('click', () => this.loadRoster());

        // ===== WIZARD STAFF ADDITION =====
        document.getElementById('addStaffBtn')?.addEventListener('click', () => this.openAddStaffWizard());
        document.getElementById('wizardNextBtn')?.addEventListener('click', () => this.wizardNext());
        document.getElementById('wizardPrevBtn')?.addEventListener('click', () => this.wizardPrev());
        document.getElementById('wizardFinishBtn')?.addEventListener('click', () => this.wizardFinish());

        // ===== EDIT STAFF =====
        document.getElementById('updateStaffBtn')?.addEventListener('click', () => this.saveEditedStaff());

        // ===== CLEAR SCHEDULE =====
        document.getElementById('clearStaffScheduleBtn')?.addEventListener('click', () => this.openClearScheduleModal());
        document.getElementById('confirmClearBtn')?.addEventListener('click', () => this.clearStaffSchedule());

        // ===== MONTH VIEW =====
        document.getElementById('prevMonthBtn')?.addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonthBtn')?.addEventListener('click', () => this.navigateMonth(1));
        document.getElementById('monthSelect')?.addEventListener('change', () => this.loadMonthView());
        document.getElementById('yearInput')?.addEventListener('change', () => this.loadMonthView());
        document.getElementById('loadMonthBtn')?.addEventListener('click', () => this.loadMonthView());

        // ===== SCHEDULE SHEET =====
        document.getElementById('loadSheetBtn')?.addEventListener('click', () => this.loadScheduleSheet());
        document.getElementById('saveSheetChangesBtn')?.addEventListener('click', () => this.saveScheduleSheet());

        // ===== GOPD CONFIGURATION =====
        document.getElementById('addGopdShiftBtn')?.addEventListener('click', () => this.addGopdShift());
        document.getElementById('saveGopdConfigBtn')?.addEventListener('click', () => this.saveGopdConfig());
        document.getElementById('loadGopdConfigBtn')?.addEventListener('click', () => this.loadGopdConfig());

        // ===== OPD SPECIALTY KNOWLEDGE =====
        document.getElementById('addSpecialtyKnowledgeBtn')?.addEventListener('click', () => this.openAddSpecialtyKnowledgeModal());
        document.getElementById('saveSpecialtyKnowledgeBtn')?.addEventListener('click', () => this.saveSpecialtyKnowledge());

        // ===== EXPORT EXCEL =====
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => this.exportExcel());

        // Station management
        document.getElementById('addStationBtn')?.addEventListener('click', () => this.openAddStationModal());
        document.getElementById('saveStationBtn')?.addEventListener('click', () => this.saveStation());

        // Custom station names
        document.getElementById('customNamesBtn')?.addEventListener('click', () => this.openCustomNamesModal());
        document.getElementById('saveCustomNamesBtn')?.addEventListener('click', () => this.saveCustomNames());

        // AI Generation
        document.getElementById('generateDutyBtn')?.addEventListener('click', () => this.openAIGenerateModal());
        document.getElementById('confirmAiGenerateBtn')?.addEventListener('click', () => this.generateDuty());

        // Roster editing
        document.getElementById('saveRosterBtn')?.addEventListener('click', () => this.saveRosterAssignment());
        document.getElementById('dutyTypeSelect')?.addEventListener('change', (e) => this.toggleDutyFields(e.target.value));

        // Modal close handlers
        document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modal || e.target.closest('[data-modal]')?.dataset.modal;
                if (modalId) this.closeModal(modalId);
            });
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });
    }

    /* ========================================
       Data Loading
       ======================================== */

    async loadInitialData() {
        try {
            // Load staff
            const staffRes = await fetch('/api/pr/staff');
            const staffData = await staffRes.json();
            if (staffData.ok) {
                this.staff = staffData.staff;
            }

            // Load stations
            const stationsRes = await fetch('/api/pr/stations');
            const stationsData = await stationsRes.json();
            if (stationsData.ok) {
                this.stations = stationsData.stations;
                this.doctorSpecialties = stationsData.doctor_specialties || [];
            }

            // Load leave types and extra config from pr_staff.json
            const prDataRes = await fetch('/data/pr_staff.json');
            const prData = await prDataRes.json();
            this.leaveTypes = prData.leave_types || {};
            this.stationCustomNames = prData.station_custom_names || {};

            this.renderStaffList();
            this.renderStations();
            this.renderLeaveLegend();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('Failed to load data', 'error');
        }
    }

    setDefaultDates() {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        document.getElementById('rosterStartDate').value = this.formatDate(today);
        document.getElementById('rosterEndDate').value = this.formatDate(nextWeek);
        
        document.getElementById('aiStartDate').value = this.formatDate(today);
        document.getElementById('aiEndDate').value = this.formatDate(nextWeek);
    }

    /* ========================================
       View Management
       ======================================== */

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

        // Update view panels with fade animation
        document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
        const target = document.getElementById(`${viewName}-view`);
        if (target) {
            target.classList.add('active');
        }

        this.currentView = viewName;

        // Refresh data for specific views
        if (viewName === 'staff-list') {
            this.renderStaffList();
        } else if (viewName === 'station-knowledge') {
            this.renderStations();
        }
    }

    /* ========================================
       Roster Management
       ======================================== */

    async loadRoster() {
        const startDate = document.getElementById('rosterStartDate').value;
        const endDate = document.getElementById('rosterEndDate').value;

        if (!startDate || !endDate) {
            this.showNotification('Please select date range', 'warning');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            this.showNotification('Start date must be before end date', 'error');
            return;
        }

        try {
            const res = await fetch(`/api/pr/roster/clinical?start_date=${startDate}&end_date=${endDate}`);
            const data = await res.json();
            
            if (data.ok) {
                this.rosters = data.rosters;
                this.selectedDateRange = { start: startDate, end: endDate };
                this.renderRosterCalendar();
            } else {
                this.showNotification('Failed to load roster', 'error');
            }
        } catch (error) {
            console.error('Load roster error:', error);
            this.showNotification('Failed to load roster', 'error');
        }
    }

    renderRosterCalendar() {
        const container = document.getElementById('rosterCalendar');
        
        if (this.staff.length === 0) {
            container.innerHTML = `
                <div class="roster-placeholder">
                    <div class="placeholder-icon">👥</div>
                    <p>No staff members found. Please add staff first.</p>
                </div>
            `;
            return;
        }

        // Generate dates array
        const dates = this.getDateRange(this.selectedDateRange.start, this.selectedDateRange.end);
        
        // Filter clinical staff
        const clinicalStaff = this.staff.filter(s => s.roles.includes('clinical') && s.active);

        let html = `
            <table class="roster-table">
                <thead>
                    <tr>
                        <th>Staff Member</th>
                        ${dates.map(date => {
                            const d = new Date(date);
                            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                            const dayNum = d.getDate();
                            const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                            return `
                                <th>
                                    <div class="date-header">
                                        <span class="date-day">${dayName}</span>
                                        <span class="date-number">${dayNum} ${monthName}</span>
                                    </div>
                                </th>
                            `;
                        }).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${clinicalStaff.map(staff => `
                        <tr>
                            <td>${this.escapeHtml(staff.name)}</td>
                            ${dates.map(date => {
                                const assignment = this.rosters[date]?.[staff.id];
                                return `
                                    <td>
                                        <div class="duty-cell" data-staff-id="${staff.id}" data-date="${date}" onclick="prPortal.editRosterCell('${staff.id}', '${date}')">
                                            ${this.renderDutyAssignment(assignment)}
                                        </div>
                                    </td>
                                `;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderDutyAssignment(assignment) {
        if (!assignment) {
            return '<div class="duty-assignment off-day">-</div>';
        }

        const dutyType = assignment.duty_type;
        
        if (dutyType === 'off') {
            return '<div class="duty-assignment off-day">OFF</div>';
        }
        
        if (dutyType === 'leave') {
            const leaveType = assignment.leave_type;
            const leaveInfo = this.leaveTypes[leaveType] || { name: leaveType, color: '#ccc' };
            return `
                <div class="duty-assignment leave" style="background-color: ${leaveInfo.color}">
                    ${leaveType}
                </div>
            `;
        }
        
        if (dutyType === 'duty') {
            const station = assignment.station_id || 'General';
            return `
                <div class="duty-assignment on-duty">
                    <div>ON DUTY</div>
                    <span class="duty-station">${this.escapeHtml(station)}</span>
                </div>
            `;
        }

        return '<div class="duty-assignment off-day">-</div>';
    }

    editRosterCell(staffId, date) {
        const staff = this.staff.find(s => s.id === staffId);
        const assignment = this.rosters[date]?.[staffId] || {};

        // Populate modal
        document.getElementById('editStaffName').textContent = staff.name;
        document.getElementById('editDate').textContent = this.formatDateDisplay(date);
        document.getElementById('dutyTypeSelect').value = assignment.duty_type || 'duty';
        
        // Populate stations dropdown
        this.populateStationSelect();
        document.getElementById('assignedStationSelect').value = assignment.station_id || '';

        // Populate leave types
        this.populateLeaveTypeSelect();
        document.getElementById('leaveTypeSelect').value = assignment.leave_type || '';

        this.toggleDutyFields(assignment.duty_type || 'duty');

        // Store current edit context
        this.currentEdit = { staffId, date };

        this.openModal('editRosterModal');
    }

    async saveRosterAssignment() {
        const { staffId, date } = this.currentEdit;
        const dutyType = document.getElementById('dutyTypeSelect').value;
        const stationId = document.getElementById('assignedStationSelect').value;
        const leaveType = document.getElementById('leaveTypeSelect').value;

        try {
            const res = await fetch('/api/pr/roster/clinical', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    staff_id: staffId,
                    duty_type: dutyType,
                    station_id: stationId,
                    leave_type: leaveType
                })
            });

            const data = await res.json();
            
            if (data.ok) {
                this.showNotification('Assignment saved successfully', 'success');
                this.closeModal('editRosterModal');
                await this.loadRoster();
            } else {
                this.showNotification('Failed to save assignment', 'error');
            }
        } catch (error) {
            console.error('Save roster error:', error);
            this.showNotification('Failed to save assignment', 'error');
        }
    }

    toggleDutyFields(dutyType) {
        const stationGroup = document.getElementById('stationSelectGroup');
        const leaveGroup = document.getElementById('leaveTypeGroup');

        if (dutyType === 'duty') {
            stationGroup.style.display = 'block';
            leaveGroup.style.display = 'none';
        } else if (dutyType === 'leave') {
            stationGroup.style.display = 'none';
            leaveGroup.style.display = 'block';
        } else {
            stationGroup.style.display = 'none';
            leaveGroup.style.display = 'none';
        }
    }

    populateStationSelect() {
        const select = document.getElementById('assignedStationSelect');
        const allStations = [
            ...this.doctorSpecialties.map(s => ({ name: s, type: 'from_doctors' })),
            ...this.stations.clinical.map(s => ({ name: s.name, type: 'custom' }))
        ];

        select.innerHTML = allStations.map(s => `
            <option value="${this.escapeHtml(s.name)}">${this.escapeHtml(s.name)}</option>
        `).join('');
    }

    populateLeaveTypeSelect() {
        const select = document.getElementById('leaveTypeSelect');
        select.innerHTML = Object.entries(this.leaveTypes).map(([code, info]) => `
            <option value="${code}">${code} - ${info.name}</option>
        `).join('');
    }

    /* ========================================
       AI Duty Generation
       ======================================== */

    openAIGenerateModal() {
        const startDate = document.getElementById('rosterStartDate').value;
        const endDate = document.getElementById('rosterEndDate').value;

        if (startDate && endDate) {
            document.getElementById('aiStartDate').value = startDate;
            document.getElementById('aiEndDate').value = endDate;
        }

        this.openModal('aiGenerateModal');
    }

    async generateDuty() {
        const startDate = document.getElementById('aiStartDate').value;
        const endDate = document.getElementById('aiEndDate').value;

        if (!startDate || !endDate) {
            this.showNotification('Please select date range', 'warning');
            return;
        }

        // Show loading state
        const btn = document.getElementById('confirmAiGenerateBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="icon">⏳</span> Generating...';
        btn.disabled = true;

        try {
            const res = await fetch('/api/pr/roster/clinical/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start_date: startDate, end_date: endDate })
            });

            const data = await res.json();
            
            if (data.ok) {
                this.showNotification(`Successfully generated ${data.stats.assignments} assignments for ${data.stats.dates} days`, 'success');
                this.closeModal('aiGenerateModal');
                
                // Update date range and reload
                document.getElementById('rosterStartDate').value = startDate;
                document.getElementById('rosterEndDate').value = endDate;
                await this.loadRoster();
            } else {
                this.showNotification(data.error || 'Failed to generate duty roster', 'error');
            }
        } catch (error) {
            console.error('Generate duty error:', error);
            this.showNotification('Failed to generate duty roster', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    /* ========================================
       Staff Management
       ======================================== */

    renderStaffList() {
        const container = document.getElementById('staffList');
        
        if (this.staff.length === 0) {
            container.innerHTML = `
                <div class="roster-placeholder">
                    <div class="placeholder-icon">👥</div>
                    <p>No staff members yet. Click "Add Staff Member" to get started.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.staff.map(staff => `
            <div class="staff-card">
                <div class="staff-card-header">
                    <div class="staff-name">${this.escapeHtml(staff.name)}</div>
                    <div class="staff-actions">
                        <button class="icon-btn" onclick="prPortal.editStaff('${staff.id}')" title="Edit">✏️</button>
                        <button class="icon-btn delete" onclick="prPortal.deleteStaff('${staff.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="staff-roles">
                    ${staff.roles.map(role => `<span class="role-badge ${role}">${role}</span>`).join('')}
                </div>
                <div class="staff-stations">
                    <strong>Stations:</strong> ${staff.stations.length > 0 ? staff.stations.join(', ') : 'None assigned'}
                </div>
            </div>
        `).join('');
    }

    /* ===== Wizard-based Add Staff ===== */

    openAddStaffWizard() {
        this.wizardStep = 1;
        this.wizardData = {
            name: '',
            role: null,
            stations: [],
            trainingDepartment: null
        };

        document.getElementById('staffNameInput').value = '';
        document.querySelectorAll('input[name="staffRole"]').forEach(r => r.checked = false);

        this.populateWizardStationCheckboxes();
        this.updateWizardUI();
        this.openModal('addStaffModal');
    }

    populateWizardStationCheckboxes() {
        const clinicalContainer = document.getElementById('clinicalStationsCheckboxes');
        const frontContainer = document.getElementById('frontStationsCheckboxes');

        const clinicalStations = [
            ...this.doctorSpecialties.map(s => ({ name: s })),
            ...(this.stations.clinical || []).map(s => ({ name: s.name }))
        ];

        const frontStations = (this.stations.front || []).map(s => ({ name: s.name }));

        clinicalContainer.innerHTML = clinicalStations.map(s => `
            <label class="checkbox-label">
                <input type="checkbox" value="${this.escapeHtml(s.name)}">
                <span>${this.escapeHtml(s.name)}</span>
            </label>
        `).join('');

        frontContainer.innerHTML = frontStations.map(s => `
            <label class="checkbox-label">
                <input type="checkbox" value="${this.escapeHtml(s.name)}">
                <span>${this.escapeHtml(s.name)}</span>
            </label>
        `).join('');
    }

    wizardNext() {
        if (this.wizardStep === 1) {
            const name = document.getElementById('staffNameInput').value.trim();
            if (!name) {
                this.showNotification('Please enter staff name', 'warning');
                return;
            }
            this.wizardData.name = name;
            this.wizardStep = 2;
        } else if (this.wizardStep === 2) {
            const selectedRole = document.querySelector('input[name="staffRole"]:checked');
            if (!selectedRole) {
                this.showNotification('Please select a role', 'warning');
                return;
            }
            this.wizardData.role = selectedRole.value;
            this.wizardStep = 3;
        } else if (this.wizardStep === 3) {
            // Collect stations or training department
            if (this.wizardData.role === 'clinical') {
                this.wizardData.stations = Array.from(document.querySelectorAll('#clinicalStationsCheckboxes input:checked')).map(cb => cb.value);
            } else if (this.wizardData.role === 'front') {
                this.wizardData.stations = Array.from(document.querySelectorAll('#frontStationsCheckboxes input:checked')).map(cb => cb.value);
            } else if (this.wizardData.role === 'training') {
                this.wizardData.trainingDepartment = document.getElementById('trainingDepartment').value;
            }
            this.buildWizardConfirmation();
            this.wizardStep = 4;
        }

        this.updateWizardUI();
    }

    wizardPrev() {
        if (this.wizardStep > 1) {
            this.wizardStep -= 1;
            this.updateWizardUI();
        }
    }

    buildWizardConfirmation() {
        document.getElementById('confirmName').textContent = this.wizardData.name;
        document.getElementById('confirmRole').textContent = this.wizardData.role;
        document.getElementById('confirmStations').textContent =
            this.wizardData.role === 'training'
                ? `Training in ${this.wizardData.trainingDepartment}`
                : (this.wizardData.stations.join(', ') || 'None');
    }

    updateWizardUI() {
        const titleEl = document.getElementById('wizardStepTitle');
        const prevBtn = document.getElementById('wizardPrevBtn');
        const nextBtn = document.getElementById('wizardNextBtn');
        const finishBtn = document.getElementById('wizardFinishBtn');

        // Steps visibility
        document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));

        if (this.wizardStep === 1) {
            titleEl.textContent = 'Step 1: Basic Info';
            document.querySelector('.wizard-step[data-step="1"]').classList.add('active');
        } else if (this.wizardStep === 2) {
            titleEl.textContent = 'Step 2: Role';
            document.querySelector('.wizard-step[data-step="2"]').classList.add('active');
        } else if (this.wizardStep === 3) {
            titleEl.textContent = 'Step 3: Stations / Training';
            if (this.wizardData.role === 'clinical') {
                document.querySelector('.wizard-step[data-step="3-clinical"]').classList.add('active');
            } else if (this.wizardData.role === 'front') {
                document.querySelector('.wizard-step[data-step="3-front"]').classList.add('active');
            } else {
                document.querySelector('.wizard-step[data-step="3-training"]').classList.add('active');
            }
        } else if (this.wizardStep === 4) {
            titleEl.textContent = 'Step 4: Confirm';
            document.querySelector('.wizard-step[data-step="4"]').classList.add('active');
        }

        // Buttons
        prevBtn.style.display = this.wizardStep > 1 ? 'inline-flex' : 'none';
        nextBtn.style.display = this.wizardStep < 4 ? 'inline-flex' : 'none';
        finishBtn.style.display = this.wizardStep === 4 ? 'inline-flex' : 'none';
    }

    async wizardFinish() {
        const payload = {
            name: this.wizardData.name,
            roles: [this.wizardData.role],
            stations: this.wizardData.role === 'training' ? [] : (this.wizardData.stations || []),
            training_department: this.wizardData.role === 'training' ? this.wizardData.trainingDepartment : null
        };

        try {
            const res = await fetch('/api/pr/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.ok) {
                this.showNotification('Staff member added successfully', 'success');
                this.closeModal('addStaffModal');
                await this.loadInitialData();
            } else {
                this.showNotification(data.error || 'Failed to add staff member', 'error');
            }
        } catch (err) {
            console.error('Wizard finish error:', err);
            this.showNotification('Failed to add staff member', 'error');
        }
    }

    /* ===== Edit Staff ===== */

    editStaff(staffId) {
        const staff = this.staff.find(s => s.id === staffId);
        if (!staff) return;

        this.currentEdit = { staffId };

        document.getElementById('editStaffNameInput').value = staff.name;
        document.getElementById('editRoleClinical').checked = staff.roles.includes('clinical');
        document.getElementById('editRoleFront').checked = staff.roles.includes('front');
        document.getElementById('editRoleTraining').checked = staff.roles.includes('training');

        // Build station checkboxes
        const container = document.getElementById('editStationCheckboxes');
        const allStations = [
            ...this.doctorSpecialties.map(s => ({ name: s })),
            ...(this.stations.clinical || []).map(s => ({ name: s.name })),
            ...(this.stations.front || []).map(s => ({ name: s.name }))
        ];

        container.innerHTML = allStations.map(st => `
            <label class="checkbox-label">
                <input type="checkbox" value="${this.escapeHtml(st.name)}" ${staff.stations.includes(st.name) ? 'checked' : ''}>
                <span>${this.escapeHtml(st.name)}</span>
            </label>
        `).join('');

        this.openModal('editStaffModal');
    }

    async saveEditedStaff() {
        if (!this.currentEdit?.staffId) return;
        const id = this.currentEdit.staffId;
        const name = document.getElementById('editStaffNameInput').value.trim();
        const roles = [];
        if (document.getElementById('editRoleClinical').checked) roles.push('clinical');
        if (document.getElementById('editRoleFront').checked) roles.push('front');
        if (document.getElementById('editRoleTraining').checked) roles.push('training');

        const stations = Array.from(document.querySelectorAll('#editStationCheckboxes input:checked')).map(cb => cb.value);

        if (!name) {
            this.showNotification('Please enter staff name', 'warning');
            return;
        }

        if (roles.length === 0) {
            this.showNotification('Select at least one role', 'warning');
            return;
        }

        try {
            const res = await fetch(`/api/pr/staff/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, roles, stations })
            });
            const data = await res.json();
            if (data.ok) {
                this.showNotification('Staff updated', 'success');
                this.closeModal('editStaffModal');
                await this.loadInitialData();
            } else {
                this.showNotification(data.error || 'Failed to update staff', 'error');
            }
        } catch (err) {
            console.error('Save edited staff error:', err);
            this.showNotification('Failed to update staff', 'error');
        }
    }

    async deleteStaff(staffId) {
        if (!confirm('Are you sure you want to delete this staff member?')) return;

        try {
            const res = await fetch(`/api/pr/staff/${staffId}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (data.ok) {
                this.showNotification('Staff member deleted', 'success');
                await this.loadInitialData();
            } else {
                this.showNotification('Failed to delete staff member', 'error');
            }
        } catch (error) {
            console.error('Delete staff error:', error);
            this.showNotification('Failed to delete staff member', 'error');
        }
    }

    /* ========================================
       Station Management
       ======================================== */

    renderStations() {
        this.renderClinicalStations();
        this.renderFrontStations();
    }

    renderClinicalStations() {
        const container = document.getElementById('clinicalStations');
        
        // Combine doctor specialties and custom stations
        const doctorStations = this.doctorSpecialties.map(s => ({
            name: s,
            displayName: this.stationCustomNames[s] || s,
            type: 'from_doctors',
            color: '#10b981'
        }));

        const customStations = this.stations.clinical || [];
        const allStations = [...doctorStations, ...customStations];

        if (allStations.length === 0) {
            container.innerHTML = '<p style="color: #6b7280;">No clinical stations available</p>';
            return;
        }

        container.innerHTML = allStations.map(station => `
            <div class="station-item">
                <div class="station-info">
                    <div class="station-color-dot" style="background-color: ${station.color || '#10b981'}"></div>
                    <span class="station-name">${this.escapeHtml(station.displayName || station.name)}</span>
                    ${station.type === 'from_doctors' 
                        ? '<span class="station-from-doctors">From Doctors</span>' 
                        : '<span class="station-type">Custom</span>'}
                </div>
                ${station.id ? `<button class="icon-btn delete" onclick="prPortal.deleteStation('${station.id}')" title="Delete">🗑️</button>` : ''}
            </div>
        `).join('');
    }

    renderFrontStations() {
        const container = document.getElementById('frontStations');
        const stations = this.stations.front || [];

        if (stations.length === 0) {
            container.innerHTML = '<p style="color: #6b7280;">No front desk stations yet</p>';
            return;
        }

        container.innerHTML = stations.map(station => `
            <div class="station-item">
                <div class="station-info">
                    <div class="station-color-dot" style="background-color: ${station.color || '#10b981'}"></div>
                    <span class="station-name">${this.escapeHtml(this.stationCustomNames[station.name] || station.name)}</span>
                    <span class="station-type">Custom</span>
                </div>
                <button class="icon-btn delete" onclick="prPortal.deleteStation('${station.id}')" title="Delete">🗑️</button>
            </div>
        `).join('');
    }

    openAddStationModal() {
        document.getElementById('stationNameInput').value = '';
        document.getElementById('stationTypeSelect').value = 'clinical';
        this.openModal('addStationModal');
    }

    async saveStation() {
        const name = document.getElementById('stationNameInput').value.trim();
        const type = document.getElementById('stationTypeSelect').value;

        if (!name) {
            this.showNotification('Please enter station name', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/pr/stations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type })
            });

            const data = await res.json();
            
            if (data.ok) {
                this.showNotification('Station added successfully', 'success');
                this.closeModal('addStationModal');
                await this.loadInitialData();
            } else {
                this.showNotification('Failed to add station', 'error');
            }
        } catch (error) {
            console.error('Save station error:', error);
            this.showNotification('Failed to add station', 'error');
        }
    }

    async deleteStation(stationId) {
        if (!confirm('Are you sure you want to delete this station?')) return;

        try {
            const res = await fetch(`/api/pr/stations/${stationId}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (data.ok) {
                this.showNotification('Station deleted', 'success');
                await this.loadInitialData();
            } else {
                this.showNotification('Failed to delete station', 'error');
            }
        } catch (error) {
            console.error('Delete station error:', error);
            this.showNotification('Failed to delete station', 'error');
        }
    }

    /* ========================================
       Leave Legend
       ======================================== */

    renderLeaveLegend() {
        const container = document.getElementById('leaveLegend');
        
        container.innerHTML = Object.entries(this.leaveTypes).map(([code, info]) => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${info.color}"></div>
                <span class="legend-name">${code}</span>
                <span class="legend-code">${info.name}</span>
            </div>
        `).join('');
    }

    /* ========================================
       Month View
       ======================================== */

    navigateMonth(direction) {
        const d = new Date(this.currentMonth);
        d.setMonth(d.getMonth() + direction);
        this.currentMonth = d;

        document.getElementById('monthSelect').value = d.getMonth() + 1;
        document.getElementById('yearInput').value = d.getFullYear();
        this.loadMonthView();
    }

    async loadMonthView() {
        const month = parseInt(document.getElementById('monthSelect').value, 10);
        const year = parseInt(document.getElementById('yearInput').value, 10);

        if (!month || !year) {
            this.showNotification('Select valid month and year', 'warning');
            return;
        }

        try {
            const res = await fetch(`/api/pr/roster/month?year=${year}&month=${month}`);
            const data = await res.json();
            if (data.ok) {
                this.renderMonthCalendar(data.rosters, year, month);
            } else {
                this.showNotification(data.error || 'Failed to load month view', 'error');
            }
        } catch (err) {
            console.error('Load month view error:', err);
            this.showNotification('Failed to load month view', 'error');
        }
    }

    renderMonthCalendar(rosters, year, month) {
        const container = document.getElementById('monthCalendar');
        const staffList = this.staff.filter(s => s.roles.includes('clinical') && s.active);

        if (staffList.length === 0) {
            container.innerHTML = `
                <div class="roster-placeholder">
                    <div class="placeholder-icon">👥</div>
                    <p>No staff members found.</p>
                </div>`;
            return;
        }

        // Build dates in month
        const first = new Date(year, month - 1, 1);
        const last = new Date(year, month, 0);
        const dates = [];
        for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
            dates.push(this.formatDate(d));
        }

        let html = `
            <table class="roster-table">
                <thead>
                    <tr>
                        <th>Staff</th>
                        ${dates.map(date => {
                            const d = new Date(date);
                            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                            const dayNum = d.getDate();
                            return `<th><div class="date-header"><span class="date-day">${dayName}</span><span class="date-number">${dayNum}</span></div></th>`;
                        }).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${staffList.map(staff => `
                        <tr>
                            <td>${this.escapeHtml(staff.name)}</td>
                            ${dates.map(date => {
                                const assignment = rosters[date]?.[staff.id];
                                return `
                                    <td>
                                        <div class="duty-cell" data-staff-id="${staff.id}" data-date="${date}" onclick="prPortal.editRosterCell('${staff.id}', '${date}')">
                                            ${this.renderDutyAssignment(assignment)}
                                        </div>
                                    </td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;

        container.innerHTML = html;
    }

    /* ========================================
       Schedule Sheet (Excel-like)
       ======================================== */

    async loadScheduleSheet() {
        const startDate = document.getElementById('sheetStartDate').value;
        const endDate = document.getElementById('sheetEndDate').value;

        if (!startDate || !endDate) {
            this.showNotification('Select sheet date range', 'warning');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            this.showNotification('Start date must be before end date', 'error');
            return;
        }

        try {
            const res = await fetch(`/api/pr/roster/clinical?start_date=${startDate}&end_date=${endDate}`);
            const data = await res.json();
            if (data.ok) {
                this.renderScheduleSheet(data.rosters, startDate, endDate);
            } else {
                this.showNotification(data.error || 'Failed to load sheet', 'error');
            }
        } catch (err) {
            console.error('Load sheet error:', err);
            this.showNotification('Failed to load sheet', 'error');
        }
    }

    renderScheduleSheet(rosters, startDate, endDate) {
        const container = document.getElementById('scheduleSheet');
        const staffList = this.staff.filter(s => s.roles.includes('clinical') && s.active);
        const dates = this.getDateRange(startDate, endDate);

        if (staffList.length === 0) {
            container.innerHTML = `
                <div class="roster-placeholder">
                    <div class="placeholder-icon">👥</div>
                    <p>No staff members found.</p>
                </div>`;
            return;
        }

        let html = `
            <table class="sheet-table">
                <thead>
                    <tr>
                        <th>Staff</th>
                        ${dates.map(d => `<th>${new Date(d).getDate()}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${staffList.map(staff => `
                        <tr>
                            <td>${this.escapeHtml(staff.name)}</td>
                            ${dates.map(date => {
                                const assignment = rosters[date]?.[staff.id];
                                const text = assignment?.duty_type === 'duty'
                                    ? (assignment.station_id || '')
                                    : assignment?.duty_type === 'leave'
                                        ? (assignment.leave_type || 'LEAVE')
                                        : assignment?.duty_type === 'off'
                                            ? 'OFF' : '';
                                return `<td><input class="sheet-cell" data-staff-id="${staff.id}" data-date="${date}" value="${this.escapeHtml(text)}"></td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;

        container.innerHTML = html;
    }

    async saveScheduleSheet() {
        const inputs = Array.from(document.querySelectorAll('.sheet-cell'));
        const changes = [];

        for (const input of inputs) {
            const value = input.value.trim();
            const staffId = input.dataset.staffId;
            const date = input.dataset.date;

            let duty_type = null;
            let station_id = null;
            let leave_type = null;

            if (!value) {
                duty_type = 'off';
            } else if (value.toUpperCase() === 'OFF') {
                duty_type = 'off';
            } else if (this.leaveTypes[value.toUpperCase()]) {
                duty_type = 'leave';
                leave_type = value.toUpperCase();
            } else {
                duty_type = 'duty';
                station_id = value;
            }

            changes.push({ date, staff_id: staffId, duty_type, station_id, leave_type });
        }

        try {
            const res = await fetch('/api/pr/roster/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ changes })
            });
            const data = await res.json();
            if (data.ok) {
                this.showNotification('Schedule sheet saved', 'success');
            } else {
                this.showNotification(data.error || 'Failed to save sheet', 'error');
            }
        } catch (err) {
            console.error('Save sheet error:', err);
            this.showNotification('Failed to save sheet', 'error');
        }
    }

    /* ========================================
       GOPD Configuration
       ======================================== */

    async loadGopdConfig() {
        try {
            const res = await fetch('/api/pr/gopd-config');
            const data = await res.json();
            if (data.ok) {
                this.gopdConfig = data.config || { staff_count: 2, shifts: [] };
                document.getElementById('gopdStaffCount').value = this.gopdConfig.staff_count || 2;
                this.renderGopdShifts();
            }
        } catch (err) {
            console.error('Load GOPD config error:', err);
        }
    }

    /* ========================================
       Custom Station Names
       ======================================== */

    openCustomNamesModal() {
        const container = document.getElementById('customNamesList');
        if (!container) return;

        const names = new Set();

        // doctor specialties
        this.doctorSpecialties.forEach(s => names.add(s));
        // clinical custom stations
        (this.stations.clinical || []).forEach(s => names.add(s.name));
        // front stations
        (this.stations.front || []).forEach(s => names.add(s.name));

        const rows = Array.from(names).sort().map(fullName => {
            const shortName = this.stationCustomNames[fullName] || '';
            return `
                <div class="custom-name-row">
                    <div class="full-name">${this.escapeHtml(fullName)}</div>
                    <input class="form-input" data-full-name="${this.escapeHtml(fullName)}" placeholder="Short name (optional)" value="${this.escapeHtml(shortName)}">
                </div>`;
        }).join('');

        container.innerHTML = rows || '<p style="color:#6b7280;">No stations available to customize yet.</p>';
        this.openModal('customNamesModal');
    }

    async saveCustomNames() {
        const inputs = Array.from(document.querySelectorAll('#customNamesList input[data-full-name]'));
        const mapping = {};

        inputs.forEach(input => {
            const fullName = input.dataset.fullName;
            const shortName = input.value.trim();
            if (shortName) {
                mapping[fullName] = shortName;
            }
        });

        try {
            const res = await fetch('/api/pr/station-custom-names', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ station_custom_names: mapping })
            });
            const data = await res.json();
            if (data.ok) {
                this.showNotification('Custom station names saved', 'success');
                this.stationCustomNames = mapping;
                this.closeModal('customNamesModal');
                this.renderStations();
            } else {
                this.showNotification(data.error || 'Failed to save custom names', 'error');
            }
        } catch (err) {
            console.error('Save custom names error:', err);
            this.showNotification('Failed to save custom names', 'error');
        }
    }

    renderGopdShifts() {
        const container = document.getElementById('gopdShiftsList');
        const shifts = this.gopdConfig.shifts || [];
        if (!container) return;

        container.innerHTML = shifts.map((s, idx) => `
            <div class="gopd-shift-row">
                <input class="form-input" data-idx="${idx}" data-field="name" placeholder="Shift name" value="${this.escapeHtml(s.name || '')}">
                <input class="form-input" data-idx="${idx}" data-field="time" placeholder="Time range" value="${this.escapeHtml(s.time || '')}">
            </div>
        `).join('');
    }

    addGopdShift() {
        this.gopdConfig.shifts = this.gopdConfig.shifts || [];
        this.gopdConfig.shifts.push({ name: '', time: '' });
        this.renderGopdShifts();
    }

    async saveGopdConfig() {
        const staffCount = parseInt(document.getElementById('gopdStaffCount').value, 10) || 1;
        const rows = Array.from(document.querySelectorAll('#gopdShiftsList .gopd-shift-row input'));
        const shifts = [];

        for (let i = 0; i < rows.length; i += 2) {
            const nameInput = rows[i];
            const timeInput = rows[i + 1];
            const name = nameInput.value.trim();
            const time = timeInput.value.trim();
            if (name || time) {
                shifts.push({ name, time });
            }
        }

        try {
            const res = await fetch('/api/pr/gopd-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_count: staffCount, shifts })
            });
            const data = await res.json();
            if (data.ok) {
                this.showNotification('GOPD configuration saved', 'success');
                this.gopdConfig = { staff_count: staffCount, shifts };
            } else {
                this.showNotification(data.error || 'Failed to save GOPD config', 'error');
            }
        } catch (err) {
            console.error('Save GOPD config error:', err);
            this.showNotification('Failed to save GOPD config', 'error');
        }
    }

    /* ========================================
       Export
       ======================================== */

    async exportExcel() {
        const start = document.getElementById('rosterStartDate').value;
        const end = document.getElementById('rosterEndDate').value;

        const params = new URLSearchParams();
        if (start) params.append('start_date', start);
        if (end) params.append('end_date', end);

        const url = `/api/pr/roster/export-excel?${params.toString()}`;
        try {
            const res = await fetch(url);
            if (!res.ok) {
                this.showNotification('Failed to export', 'error');
                return;
            }
            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'pr_roster_export.csv';
            document.body.appendChild(link);
            link.click();
            link.remove();
            this.showNotification('Export downloaded', 'success');
        } catch (err) {
            console.error('Export error:', err);
            this.showNotification('Failed to export', 'error');
        }
    }

    /* ========================================
       Clear Staff Schedule
       ======================================== */

    openClearScheduleModal() {
        const select = document.getElementById('clearStaffSelect');
        select.innerHTML = this.staff.map(s => `
            <option value="${s.id}">${this.escapeHtml(s.name)}</option>
        `).join('');

        // Pre-fill dates from roster range if available
        if (this.selectedDateRange.start && this.selectedDateRange.end) {
            document.getElementById('clearStartDate').value = this.selectedDateRange.start;
            document.getElementById('clearEndDate').value = this.selectedDateRange.end;
        }

        this.openModal('clearScheduleModal');
    }

    async clearStaffSchedule() {
        const staffId = document.getElementById('clearStaffSelect').value;
        const startDate = document.getElementById('clearStartDate').value;
        const endDate = document.getElementById('clearEndDate').value;

        if (!staffId || !startDate || !endDate) {
            this.showNotification('Select staff and date range', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/pr/roster/clear-staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffId, start_date: startDate, end_date: endDate })
            });
            const data = await res.json();
            if (data.ok) {
                this.showNotification('Schedule cleared', 'success');
                this.closeModal('clearScheduleModal');
                await this.loadRoster();
            } else {
                this.showNotification(data.error || 'Failed to clear schedule', 'error');
            }
        } catch (err) {
            console.error('Clear schedule error:', err);
            this.showNotification('Failed to clear schedule', 'error');
        }
    }

    /* ========================================
       Utility Functions
       ======================================== */

    openModal(modalId) {
        document.getElementById(modalId)?.classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove('active');
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 600;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDateDisplay(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    getDateRange(startDate, endDate) {
        const dates = [];
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            dates.push(this.formatDate(current));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
}

// Add slide animations
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

// Initialize on page load
let prPortal;
document.addEventListener('DOMContentLoaded', () => {
    prPortal = new PRPortal();
});
