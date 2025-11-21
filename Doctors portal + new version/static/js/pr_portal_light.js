// @ts-nocheck
// PR Portal Light - Modern Management System with all fixes
// Last Updated: November 16, 2025

console.log('PR Portal JavaScript file loaded!');

// Maldives timezone helper (UTC+5)
function getMaldivesToday() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const maldivesTime = new Date(utc + (3600000 * 5)); // UTC+5
    return maldivesTime.toISOString().split('T')[0];
}

class PRPortalLight {
    constructor() {
        this.state = {
            staff: [],
            stations: { clinical: [], front: [] },
            customNames: { clinical: {}, front: {} },
            gopdConfig: { staff_count: 2, shifts: [] },
            doctorOpd: {},
            prShiftTemplates: this.buildDefaultPrShiftTemplates(),
            activePrShiftTeam: 'clinical',
            activeFridayTeam: 'clinical',
            doctors: [],
            specialties: [],
            roster: {},
            leaves: {},
            closures: {},
            currentRosterMonth: new Date(),
            currentLeaveDate: new Date(),
            telegramConnected: false,
            specialtyTotal: 0,
            specialtyLastAdded: 0
        };
        this.editingStaffId = null;
        this.editingSpecialty = null;
        this.newStaffWizard = this.createDefaultWizardState();
        this.shiftKnowledgeExtras = {};
        this.staffFilters = {
            search: '',
            role: 'all',
            status: 'all',
            station: 'any',
            pool: 'any'
        };
        this.init();
    }

    async init() {
        console.log('PR Portal initializing...');
        this.attachEventListeners();
        console.log('Event listeners attached');
        await this.loadData();
        console.log('Data loaded');
        await this.loadAIRules();
        console.log('AI Rules loaded');
        this.renderDashboard();
        console.log('Dashboard rendered');
        const leaveBreakdown = stats.leave_breakdown || { AL: 0, SL: 0, ML: 0 };
        this.renderStaffDirectory();
        this.checkTelegramStatus();
        const today = getMaldivesToday(); // Maldives time (UTC+5)
        const leaveDateEl = document.getElementById('leaveDate');
        if (leaveDateEl) leaveDateEl.value = today;
        
        // AUTO-SET doctor view dates to TODAY
        const aiDoctorDateEl = document.getElementById('aiDoctorViewDate');
        const doctorDateEl = document.getElementById('doctorViewDate');
        if (aiDoctorDateEl) aiDoctorDateEl.value = today;
        if (doctorDateEl) doctorDateEl.value = today;
        
        // AUTO-LOAD doctor schedule on page load
        setTimeout(() => {
            this.loadDoctorScheduleForDate();
        }, 500);
        
        this.renderLeaveManagement();
        console.log('PR Portal initialized successfully! Doctor dates set to TODAY:', today);
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
        const roleFilter = document.getElementById('staffRoleFilter');
        if (roleFilter) roleFilter.addEventListener('change', (e) => this.setStaffFilter('role', e.target.value));
        const statusFilter = document.getElementById('staffStatusFilter');
        if (statusFilter) statusFilter.addEventListener('change', (e) => this.setStaffFilter('status', e.target.value));
        const stationFilter = document.getElementById('staffStationFilter');
        if (stationFilter) stationFilter.addEventListener('change', (e) => this.setStaffFilter('station', e.target.value));
        const leaveDate = document.getElementById('leaveDate');
        if (leaveDate) {
            leaveDate.addEventListener('change', (e) => {
                this.currentLeaveDate = new Date(e.target.value);
                this.renderLeaveManagement();
            });
        }
        const exportType = document.getElementById('exportLeaveType');
        if (exportType) exportType.addEventListener('change', (e) => this.updateExportFields(e.target.value));
        
        // Wizard button listeners
        const wizardNextBtn = document.getElementById('wizardNextBtn');
        if (wizardNextBtn) wizardNextBtn.addEventListener('click', () => this.wizardNext());
        const wizardPrevBtn = document.getElementById('wizardPrevBtn');
        if (wizardPrevBtn) wizardPrevBtn.addEventListener('click', () => this.wizardPrev());
        const wizardFinishBtn = document.getElementById('wizardFinishBtn');
        if (wizardFinishBtn) wizardFinishBtn.addEventListener('click', () => this.finishAddStaff());
        
        // Wizard role card selection
        document.querySelectorAll('.role-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.type === 'checkbox') return; // Let checkbox handle itself
                const checkbox = card.querySelector('.wizard-role-input');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    card.classList.toggle('selected', checkbox.checked);
                }
            });
        });
        
        document.querySelectorAll('.wizard-role-input').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const card = e.target.closest('.role-card');
                if (card) card.classList.toggle('selected', e.target.checked);
            });
        });
        
        // Pool selection limit (max 2)
        this.setupPoolLimiters('.wizard-pool-input', 'wizardPoolError');
        this.setupPoolLimiters('.edit-pool-input', 'editPoolError');
    }
    
    setupPoolLimiters(selector, errorId) {
        document.addEventListener('change', (e) => {
            if (e.target.matches(selector)) {
                const checkboxes = document.querySelectorAll(selector);
                const checked = Array.from(checkboxes).filter(cb => cb.checked);
                const errorEl = document.getElementById(errorId);
                
                if (checked.length > 2) {
                    e.target.checked = false;
                    if (errorEl) errorEl.style.display = 'block';
                    this.showNotification('⚠️ Maximum 2 pools allowed', 'danger');
                } else if (checked.length === 2) {
                    if (errorEl) errorEl.style.display = 'none';
                }
            }
        });
    }

    switchView(viewName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });
        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${viewName}-view`);
        });
        
        // Hide legend when not in schedule view
        const legendEl = document.getElementById('scheduleLegend');
        if (legendEl) {
            legendEl.style.display = viewName === 'schedule' ? 'block' : 'none';
        }
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            switch(viewName) {
                case 'dashboard': this.renderDashboard(); break;
                case 'ai-generator': this.renderAIGenerator(); break;
                case 'schedule': this.renderSchedule(); break;
                case 'staff': this.renderStaffDirectory(); break;
                case 'leaves': 
                    // Ensure date is set before rendering
                    if (!this.currentLeaveDate || isNaN(this.currentLeaveDate.getTime())) {
                        this.currentLeaveDate = new Date();
                    }
                    this.renderLeaveManagement(); 
                    break;
                case 'ai-config': this.renderAIConfig(); break;
                case 'integrations': this.renderIntegrations(); break;
            }
        }, 50);
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });
        switch(tabName) {
            case 'gopd': this.renderGopdConfig(); break;
            case 'shift-knowledge': this.renderShiftKnowledge(); break;
            case 'stations': this.renderStationsManagement(); break;
            case 'ai-rules': break; // AI Rules has no dynamic rendering
        }
    }

    staffHasRole(staff, role) {
        if (!staff || !role) return false;
        const roles = Array.isArray(staff.roles) ? staff.roles : [staff.role].filter(Boolean);
        return roles.includes(role);
    }

    getAllStations() {
        const stations = this.state.stations || {};
        return [
            ...(stations.clinical || []),
            ...(stations.front || [])
        ];
    }

    getStaffRoles(staff) {
        if (!staff) return [];
        const roles = Array.isArray(staff.roles) ? staff.roles : [staff.role];
        return roles.filter(Boolean);
    }

    getActiveStaff() {
        return (this.state.staff || []).filter(staff => staff && staff.active !== false);
    }

    normalizeStationKey(value) {
        if (value === undefined || value === null) return '';
        return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    escapeHtml(value) {
        if (value === undefined || value === null) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    createDefaultWizardState() {
        return {
            step: 1,
            name: '',
            roles: [],
            stations: [],
            training: {
                focus: 'clinical',
                preference: 'prompt',
                notes: ''
            }
        };
    }

    buildDefaultPrShiftTemplates() {
        return {
            clinical: {
                regular: this.defaultShiftRows('clinical'),
                friday: this.defaultFridayRows('clinical')
            },
            front: {
                regular: this.defaultShiftRows('front'),
                friday: this.defaultFridayRows('front')
            }
        };
    }

    defaultShiftRows(team) {
        const baseShifts = [
            { name: 'Morning Shift', start: '08:00', end: '14:00' },
            { name: 'Evening Shift', start: '14:00', end: '20:00' },
            { name: 'Night Shift', start: '20:00', end: '08:00' }
        ];
        const defaultMin = team === 'front' ? 2 : 2;
        return baseShifts.map((cfg, index) => this.createShiftTemplate(cfg.name, cfg.start, cfg.end, defaultMin, false, `${team}-${index}`));
    }

    defaultFridayRows(team) {
        const base = [
            { name: 'Friday Morning', start: '08:00', end: '13:00' },
            { name: 'Friday Evening', start: '13:00', end: '18:00' },
            { name: 'Friday Night', start: '18:00', end: '22:00' }
        ];
        const defaultMin = team === 'front' ? 2 : 2;
        return base.map((cfg, index) => this.createShiftTemplate(cfg.name, cfg.start, cfg.end, defaultMin, false, `fri-${team}-${index}`));
    }

    createShiftTemplate(name, start, end, minStaff, custom = false, seed = '') {
        const idSeed = seed || `${name}-${Date.now()}-${Math.random()}`;
        return {
            id: this.normalizeStationKey(idSeed || name),
            name,
            start: start || '',
            end: end || '',
            min_staff: typeof minStaff === 'number' ? minStaff : 1,
            custom: custom === true
        };
    }

    cloneShiftTemplate(template) {
        if (!template) return this.createShiftTemplate('Custom Shift', '', '', 1, true);
        return {
            id: template.id || this.normalizeStationKey(`${template.name}-${Date.now()}`),
            name: template.name || 'Custom Shift',
            start: template.start || '',
            end: template.end || '',
            min_staff: typeof template.min_staff === 'number' ? template.min_staff : 1,
            custom: template.custom === true
        };
    }

    hydrateShiftKnowledge(knowledge) {
        const defaults = this.buildDefaultPrShiftTemplates();
        const incoming = knowledge && typeof knowledge === 'object' ? knowledge : {};
        const prSource = incoming.pr || incoming.pr_shifts || {};
        const normalized = { clinical: { regular: [], friday: [] }, front: { regular: [], friday: [] } };

        ['clinical', 'front'].forEach(team => {
            const teamData = prSource?.[team] || {};
            const regular = Array.isArray(teamData.regular) ? teamData.regular : [];
            const friday = Array.isArray(teamData.friday) ? teamData.friday : (Array.isArray(teamData.fridays) ? teamData.fridays : []);
            const defaultRegular = defaults[team].regular.map(item => this.cloneShiftTemplate(item));
            const defaultFriday = defaults[team].friday.map(item => this.cloneShiftTemplate(item));

            normalized[team].regular = regular.length
                ? regular.map(item => this.cloneShiftTemplate(item))
                : defaultRegular;
            normalized[team].friday = friday.length
                ? friday.map(item => this.cloneShiftTemplate(item))
                : defaultFriday;
        });

        this.state.prShiftTemplates = normalized;
        if (!this.state.activePrShiftTeam || !normalized[this.state.activePrShiftTeam]) {
            this.state.activePrShiftTeam = 'clinical';
        }
        if (!this.state.activeFridayTeam || !normalized[this.state.activeFridayTeam]) {
            this.state.activeFridayTeam = 'clinical';
        }

        const doctorOpdSource = incoming.doctor_opd || incoming.specialties || incoming.shiftKnowledge || {};
        this.state.doctorOpd = this.ensureDoctorOpdStructure(doctorOpdSource);

        const extras = { ...incoming };
        delete extras.pr;
        delete extras.pr_shifts;
        delete extras.doctor_opd;
        delete extras.specialties;
        delete extras.shiftKnowledge;
        this.shiftKnowledgeExtras = extras;
    }

    ensureDoctorOpdStructure(source) {
        if (!source || typeof source !== 'object') return {};
        const sanitized = {};
        const parsePatients = (value) => {
            const num = parseInt(value, 10);
            return Number.isFinite(num) && num >= 0 ? num : 0;
        };
        Object.keys(source).forEach(key => {
            const entry = source[key];
            if (!entry || typeof entry !== 'object') return;
            const shift1 = entry.shift1 || {};
            const shift2 = entry.shift2 || {};
            sanitized[key] = {
                shift1: {
                    start: shift1.start || '',
                    end: shift1.end || '',
                    patients: parsePatients(shift1.patients)
                },
                shift2: {
                    start: shift2.start || '',
                    end: shift2.end || '',
                    patients: parsePatients(shift2.patients)
                }
            };
        });
        return sanitized;
    }

    renderStationSelector(containerId, selected = [], filterType = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const stations = this.state.stations || {};
        let clinical = stations.clinical || [];
        let front = stations.front || [];
        
        // Filter out stations marked as "don't allow AI assignment"
        clinical = clinical.filter(s => s.allow_ai_assignment !== false);
        front = front.filter(s => s.allow_ai_assignment !== false);
        
        // If filterType specified, only show that type
        if (filterType === 'clinical') {
            front = [];
        } else if (filterType === 'front') {
            clinical = [];
        }

        const selectedSet = new Set();
        (selected || []).forEach(val => {
            if (val === undefined || val === null) return;
            const raw = String(val).trim();
            if (!raw) return;
            selectedSet.add(raw);
            selectedSet.add(raw.toLowerCase());
            selectedSet.add(raw.replace(/\s+/g, '-').toLowerCase());
        });

        const renderGroup = (title, items) => {
            if (!items.length) return '';
            return `
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">${title}</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${items.map(station => {
                            const namesToCheck = [station.id, station.name, station.specialty].filter(Boolean).map(v => String(v));
                            const isChecked = namesToCheck.some(val => selectedSet.has(val) || selectedSet.has(val.toLowerCase()) || selectedSet.has(val.replace(/\s+/g, '-').toLowerCase()));
                            return `
                                <label style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg); border-radius: 6px; cursor: pointer;">
                                    <input type="checkbox" value="${station.id}" class="station-checkbox" ${isChecked ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                                    <span style="font-size: 14px; font-weight: 500;">${station.name}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        };

        const groups = [
            renderGroup('Clinical Stations', clinical),
            renderGroup('Front Desk Stations', front)
        ].filter(Boolean).join('');

        container.innerHTML = groups || '<p style="color: var(--text-muted); font-size: 13px; padding: 12px; text-align: center;">No stations available. Add stations in AI Configuration first.</p>';
    }

    async loadData() {
        try {
            const [staffRes, stationsRes, gopdRes, knowledgeRes, doctorsRes, closuresRes, opdInfoRes] = await Promise.all([
                fetch('/api/pr/staff'),
                fetch('/api/pr/stations'),
                fetch('/api/pr/gopd-config'),
                fetch('/api/shift-knowledge'),
                fetch('/api/doctors'),
                fetch('/api/closures'),
                fetch('/api/opdinfo')
            ]);
            if (staffRes.ok) {
                const data = await staffRes.json();
                this.state.staff = data.staff || [];
                console.log('Loaded staff from API:', this.state.staff.length, 'members');
            } else {
                console.error('Failed to load staff, status:', staffRes.status);
            }
            if (stationsRes.ok) {
                const data = await stationsRes.json();
                if (data.ok === false) {
                    console.warn('Stations API error:', data.error);
                } else {
                    this.state.stations = data.stations || { clinical: [], front: [] };
                    this.state.customNames = data.station_custom_names || { clinical: {}, front: {} };
                    this.state.specialties = data.doctor_specialties || [];
                    this.state.specialtyTotal = (data.doctor_specialties || []).length;
                    this.state.specialtyLastAdded = data.auto_specialties_added || 0;
                }
            }
            if (gopdRes.ok) this.state.gopdConfig = await gopdRes.json();
            if (knowledgeRes.ok) {
                const knowledgePayload = await knowledgeRes.json();
                const knowledge = knowledgePayload?.knowledge ?? knowledgePayload ?? {};
                this.hydrateShiftKnowledge(knowledge);
            }
            if (doctorsRes.ok) {
                const doctorsPayload = await doctorsRes.json();
                const doctorList = doctorsPayload.doctors || doctorsPayload || [];
                this.state.doctors = doctorList;
                const specialtySet = new Set(this.state.specialties);
                doctorList.forEach(doc => {
                    if (doc && doc.specialty) {
                        specialtySet.add(doc.specialty.trim());
                    }
                });
                this.state.specialties = [...specialtySet].filter(Boolean).sort();
                this.state.specialtyTotal = this.state.specialties.length;
                console.log('Loaded specialties:', this.state.specialties);
            }
            if (closuresRes.ok) {
                const closuresData = await closuresRes.json();
                this.state.closures = closuresData.closures || {};
                console.log('Loaded closures:', this.state.closures);
            }
            if (opdInfoRes.ok) {
                const opdData = await opdInfoRes.json();
                this.state.doctorOpd = opdData.data || {};
                console.log('Loaded OPD info:', this.state.doctorOpd);
            }
            await this.loadRosterData();
            await this.loadLeaveData();
            this.updateAIGeneratorInsights();
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
            const clinicalStaff = this.state.staff.filter(s => s.active !== false && this.staffHasRole(s, 'clinical')).length;
            const frontStaff = this.state.staff.filter(s => s.active !== false && this.staffHasRole(s, 'front')).length;
            const today = getMaldivesToday(); // Maldives time
            const todayLeaves = (this.state.leaves[today] || []).length;
            
            const statTotal = document.getElementById('statTotalStaff');
            const statClin = document.getElementById('statClinical');
            const statFrontEl = document.getElementById('statFront');
            const statLeave = document.getElementById('statOnLeave');
            const statSpecTotal = document.getElementById('statSpecialistTotal');
            const statSpecMorning = document.getElementById('statSpecialistMorning');
            const statSpecEvening = document.getElementById('statSpecialistEvening');
            const statSpecNotes = document.getElementById('statSpecialistNotes');
            
            if (statTotal) statTotal.textContent = totalStaff;
            if (statClin) statClin.textContent = clinicalStaff;
            if (statFrontEl) statFrontEl.textContent = frontStaff;
            if (statLeave) statLeave.textContent = todayLeaves;

            const specialistSummary = this.getSpecialistDutySummary();
            if (statSpecTotal) statSpecTotal.textContent = specialistSummary.total;
            if (statSpecMorning) statSpecMorning.textContent = specialistSummary.morning;
            if (statSpecEvening) statSpecEvening.textContent = specialistSummary.evening;
            if (statSpecNotes) {
                if (specialistSummary.specialties.length) {
                    const visible = specialistSummary.specialties.slice(0, 4).join(', ');
                    const extra = specialistSummary.specialties.length > 4
                        ? ` +${specialistSummary.specialties.length - 4} more`
                        : '';
                    statSpecNotes.textContent = `Specialties: ${visible}${extra}`;
                } else {
                    statSpecNotes.textContent = 'Specialties: None scheduled';
                }
            }
        } catch (error) {
            console.error('Error rendering dashboard:', error);
        }
    }

    getSpecialistDutySummary() {
        const doctors = Array.isArray(this.state.doctors) ? this.state.doctors : [];
        const summary = { total: 0, morning: 0, evening: 0, specialties: new Set() };
        doctors.forEach(doc => {
            if (!doc) return;
            const rawStatus = (doc.status || doc.today_status || '').toString().toUpperCase();
            const normalized = rawStatus.replace(/[^A-Z]/g, '');
            if (!normalized) return;
            const isOnDuty = normalized.includes('DUTY') || normalized.includes('ONDUTY') || normalized.includes('OPD') || normalized.includes('ONCALL');
            if (!isOnDuty) return;
            summary.total += 1;
            let hour = null;
            if (typeof doc.start_time === 'string') {
                const match = doc.start_time.match(/(\d{1,2}):(\d{2})/);
                if (match) hour = parseInt(match[1], 10);
            }
            if (hour === null && Array.isArray(doc.opd) && doc.opd.length) {
                const firstSlot = doc.opd[0]?.range || '';
                const match = typeof firstSlot === 'string' ? firstSlot.match(/(\d{1,2}):(\d{2})/) : null;
                if (match) hour = parseInt(match[1], 10);
            }
            if (!Number.isFinite(hour)) hour = 9;
            if (hour < 13) summary.morning += 1; else summary.evening += 1;
            if (doc.specialty) summary.specialties.add(doc.specialty);
        });
        const specialties = Array.from(summary.specialties).sort((a, b) => a.localeCompare(b));
        return { total: summary.total, morning: summary.morning, evening: summary.evening, specialties };
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
        
        // Add legend before rendering table
        this.renderScheduleLegend();
        
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
            const dateStr = date.toISOString().split('T')[0];
            const isFriday = date.getDay() === 5;
            const isClosed = this.state.closures[dateStr] || isFriday;
            const bgColor = isClosed ? 'linear-gradient(135deg, #fed7aa, #fecaca)' : 'var(--bg)';
            const mosqueEmoji = isFriday ? '<div style="font-size:20px;margin-top:4px">🕌</div>' : '';
            thead.innerHTML += `
                <th style="padding: 10px; border: 2px solid var(--border); font-weight: 700; text-align: center; min-width: 90px; background: ${bgColor}; font-size: 12px;">
                    <div>${dayName}</div>
                    <div style="font-size: 16px; color: var(--primary);">${dateNum}</div>
                    ${mosqueEmoji}
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
            const roles = Array.isArray(staff.roles) ? staff.roles : [staff.role];
            const icon = roles.includes('clinical') ? '🏥' : roles.includes('front') ? '🎯' : roles.includes('trainer') ? '🎓' : '👤';
            nameCell.innerHTML = `<div style="display: flex; align-items: center; gap: 8px;"><span>${icon}</span><span>${staff.name}</span></div>`;
            nameCell.onclick = () => this.showStaffDetails(staff.id);
            row.appendChild(nameCell);
            dates.forEach(date => {
                const dateStr = date.toISOString().split('T')[0];
                const assignment = this.state.roster[staff.id]?.[dateStr] || {};
                const isFriday = date.getDay() === 5;
                const isClosed = this.state.closures[dateStr] || isFriday;
                const cell = document.createElement('td');
                const bgColor = isClosed ? 'linear-gradient(135deg, #fed7aa, #fecaca)' : 'white';
                cell.style.cssText = `padding: 8px; border: 2px solid var(--border); text-align: center; cursor: pointer; font-size: 12px; font-weight: 600; background: ${bgColor};`;
                
                // Check if this clinical is freed due to doctor leave
                const isFreedClinical = this.checkIfClinicalFreedByDoctorLeave(staff, dateStr, assignment);
                
                if (assignment.leave) {
                    cell.style.background = this.getLeaveColor(assignment.leave);
                    cell.innerHTML = `<div style="color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${assignment.leave}</div>`;
                } else if (assignment.station) {
                    const stationName = this.getStationName(assignment.station);
                    // Apply purple color for freed clinicals
                    const textColor = isFreedClinical ? '#9333ea' : 'var(--primary)';
                    const freeIcon = isFreedClinical ? ' 🆓' : '';
                    
                    // Display shift timings if available
                    const shiftTiming = (assignment.shift_start && assignment.shift_end) 
                        ? `<div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">${assignment.shift_start}-${assignment.shift_end}</div>` 
                        : '';
                    
                    cell.innerHTML = `<div style="color: ${textColor}; font-weight: ${isFreedClinical ? '800' : '600'};">${stationName}${freeIcon}${shiftTiming}</div>`;
                    if (isFreedClinical) {
                        cell.style.borderColor = '#9333ea';
                        cell.style.borderWidth = '3px';
                        cell.title = 'Freed Clinical - Doctor on leave, manually reassignable';
                    }
                } else {
                    cell.innerHTML = '<div style="color: var(--text-muted);">--</div>';
                }
                cell.onclick = () => this.editRosterCell(staff.id, staff.name, dateStr);
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
    }

    renderScheduleLegend() {
        // ONLY show legend in schedule view and fullscreen mode
        const scheduleContainer = document.querySelector('[data-view="schedule"]');
        const isFullscreen = document.body.classList.contains('fullscreen-mode');
        
        let legendEl = document.getElementById('schedule-legend');
        
        // If not in schedule view OR fullscreen, remove legend if it exists
        if (!scheduleContainer && !isFullscreen) {
            if (legendEl) {
                legendEl.remove();
            }
            return;
        }
        
        // Create legend if doesn't exist
        if (!legendEl) {
            legendEl = document.createElement('div');
            legendEl.id = 'schedule-legend';
            legendEl.style.cssText = 'position: fixed; top: 120px; right: 0; padding: 16px; background: var(--panel); border-radius: 12px 0 0 12px; border: 2px solid var(--border); border-right: none; box-shadow: -4px 4px 16px rgba(0, 0, 0, 0.1); width: 260px; z-index: 1000;';
            
            document.body.appendChild(legendEl);
        }
        
        // Show legend when in schedule view (collapsed by default)
        legendEl.style.display = 'block';
        if (!legendEl.dataset.initialized) {
            legendEl.classList.add('collapsed');
            legendEl.dataset.initialized = 'true';
        }
        
        const leaveTypes = [
            {code: 'PML', name: 'Paternity/Maternity Leave', color: '#FFB6C1'},
            {code: 'AL', name: 'Annual Leave', color: '#90EE90'},
            {code: 'FRL', name: 'Family Leave', color: '#FFA07A'},
            {code: 'EXC', name: 'Exam Leave', color: '#FF8C00'},
            {code: 'HI', name: 'Home Isolation', color: '#FF0000'},
            {code: 'OR', name: 'Official Release', color: '#9ACD32'},
            {code: 'SWP', name: 'Swap Request', color: '#4169E1'},
            {code: 'SWPL', name: 'Leave After A Swap', color: '#1E90FF'},
            {code: 'NP', name: 'No Pay', color: '#DDA0DD'},
            {code: 'AB', name: 'Absent', color: '#DC143C'},
            {code: 'SL', name: 'Sick Leave', color: '#FFD700'},
            {code: 'ML', name: 'Medical Leave', color: '#8B4513'},
            {code: 'OC', name: 'On Call', color: '#DA70D6'},
            {code: 'AC', name: 'Absent On-Call', color: '#00BFFF'}
        ];
        
        legendEl.innerHTML = `
            <div class="legend-toggle" onclick="prPortal.toggleLegendSidebar()" style="position: absolute; left: -32px; top: 12px; width: 32px; height: 48px; background: var(--card-bg); border: 2px solid var(--border); border-right: none; border-radius: 8px 0 0 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease;">
                <span class="legend-arrow" style="font-size: 18px; transition: transform 0.3s ease;">◀</span>
            </div>
            <div class="legend-content" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 8px;">
                    <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--text);">📋 Legend</h4>
                    <button onclick="prPortal.openLegendDrawer()" class="btn btn-sm" style="padding: 4px 12px; font-size: 11px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">View All</button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">Leave Types (First 5)</div>
                    ${leaveTypes.slice(0, 5).map(lt => `
                        <div style="display: flex; align-items: center; gap: 8px;" title="${lt.name}">
                            <div style="width: 18px; height: 18px; border-radius: 4px; background: ${lt.color}; flex-shrink: 0;"></div>
                            <span style="font-size: 11px; font-weight: 600;">${lt.code}</span>
                            <span style="font-size: 10px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${lt.name}</span>
                        </div>
                    `).join('')}
                    <div style="font-size: 10px; color: var(--text-muted); font-style: italic; text-align: center; padding: 4px;">+${leaveTypes.length - 5} more types</div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #90EE90;"></div>
                        <span style="font-size: 11px; font-weight: 600;">AL</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #FFB6C1;"></div>
                        <span style="font-size: 11px; font-weight: 600;">FRL</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #FF6347;"></div>
                        <span style="font-size: 11px; font-weight: 600;">EXC</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #FF0000; color: white;"></div>
                        <span style="font-size: 11px; font-weight: 600;">HI</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #FFA500;"></div>
                        <span style="font-size: 11px; font-weight: 600;">OR</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #87CEEB;"></div>
                        <span style="font-size: 11px; font-weight: 600;">SWP</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #4682B4;"></div>
                        <span style="font-size: 11px; font-weight: 600;">SWPL</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #DDA0DD;"></div>
                        <span style="font-size: 11px; font-weight: 600;">NP</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #FF69B4;"></div>
                        <span style="font-size: 11px; font-weight: 600;">AB</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #FFD700;"></div>
                        <span style="font-size: 11px; font-weight: 600;">SL</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #FFA07A;"></div>
                        <span style="font-size: 11px; font-weight: 600;">ML</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: #DA70D6;"></div>
                        <span style="font-size: 11px; font-weight: 600;">OC</span>
                    </div>
                    <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-top: 8px;">Assignments</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 18px; height: 18px; border-radius: 4px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; flex-shrink: 0;">ST</div>
                        <span style="font-size: 11px; font-weight: 600;">Station Assignment</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; border: 2px solid #9333ea; padding: 4px 6px; border-radius: 6px; background: rgba(147, 51, 234, 0.1);">
                        <span style="font-size: 11px; font-weight: 800; color: #9333ea; flex-shrink: 0;">🆓</span>
                        <span style="font-size: 10px; font-weight: 600;">Freed Clinical</span>
                    </div>
                </div>
            </div>
        `;
        
        // Store leave types for modal access
        this.leaveTypesData = leaveTypes;
    }

    checkIfClinicalFreedByDoctorLeave(staff, dateStr, assignment) {
        // Check if this clinical staff's assigned doctor is on leave
        // This makes the clinical "free" and manually reassignable
        if (!assignment.station) return false;
        
        const roles = Array.isArray(staff.roles) ? staff.roles : [staff.role];
        if (!roles.includes('clinical')) return false;
        
        // Check if there's AI-generated assignment metadata
        const aiMeta = assignment.ai_assigned_doctor || assignment.assigned_to_doctor;
        if (!aiMeta) return false;
        
        // Check if that doctor is on leave on this date
        const doctorId = aiMeta.doctor_id;
        if (!doctorId) return false;
        
        const doctorLeaves = this.state.leaves[dateStr] || [];
        const doctorOnLeave = doctorLeaves.find(l => l.staff_id === doctorId || l.doctor_id === doctorId);
        
        return !!doctorOnLeave;
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
            'ML': 'linear-gradient(135deg, #f59e0b, #d97706)'
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

    openClearScheduleModal() {
        // Populate staff dropdown
        const staffSelect = document.getElementById('clearStaffSelect');
        if (staffSelect) {
            staffSelect.innerHTML = '<option value="">-- Select Staff --</option>';
            this.state.staff.forEach(staff => {
                const option = document.createElement('option');
                option.value = staff.id;
                option.textContent = staff.name;
                staffSelect.appendChild(option);
            });
        }
        
        // Set default date to today
        const dateInput = document.getElementById('clearDayDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Setup radio button listeners
        document.querySelectorAll('input[name="clearType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const daySection = document.getElementById('clearDaySection');
                const staffSection = document.getElementById('clearStaffSection');
                
                if (daySection) daySection.style.display = e.target.value === 'day' ? 'block' : 'none';
                if (staffSection) staffSection.style.display = e.target.value === 'staff' ? 'block' : 'none';
            });
        });
        
        this.openModal('clearScheduleModal');
    }

    async executeClearSchedule() {
        const clearType = document.querySelector('input[name="clearType"]:checked')?.value;
        
        if (!clearType) {
            this.showNotification('Please select a clear option', 'danger');
            return;
        }
        
        let confirmMessage = '';
        let clearData = { type: clearType };
        
        if (clearType === 'day') {
            const date = document.getElementById('clearDayDate')?.value;
            if (!date) {
                this.showNotification('Please select a date', 'danger');
                return;
            }
            clearData.date = date;
            confirmMessage = `Clear all assignments for ${date}?`;
        } else if (clearType === 'staff') {
            const staffId = document.getElementById('clearStaffSelect')?.value;
            if (!staffId) {
                this.showNotification('Please select a staff member', 'danger');
                return;
            }
            const staff = this.state.staff.find(s => s.id === staffId);
            clearData.staff_id = staffId;
            confirmMessage = `Clear all assignments for ${staff?.name || 'this staff member'}?`;
        } else if (clearType === 'all') {
            confirmMessage = '⚠️ WARNING: This will delete ALL roster data. Are you absolutely sure?';
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            const res = await fetch('/api/pr/roster/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clearData)
            });
            
            const data = await res.json();
            
            if (data.ok) {
                this.showNotification(`✅ ${data.message}`, 'success');
                await this.loadRosterData();
                this.renderSchedule();
                this.closeModal('clearScheduleModal');
            } else {
                this.showNotification(`❌ Error: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error clearing schedule:', error);
            this.showNotification('❌ Error clearing schedule', 'danger');
        }
    }

    renderAIGenerator() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const period = this.getRosterPeriod(today);

        const startInput = document.getElementById('aiGenStartDate');
        const endInput = document.getElementById('aiGenEndDate');
        if (startInput) {
            startInput.value = period.start.toISOString().split('T')[0];
            startInput.min = todayStr;
            if (!startInput.dataset.bound) {
                startInput.addEventListener('change', () => {
                    if (!endInput) return;
                    const startVal = startInput.value || todayStr;
                    endInput.min = startVal;
                    if (endInput.value && new Date(endInput.value) < new Date(startVal)) {
                        endInput.value = startVal;
                    }
                });
                startInput.dataset.bound = '1';
            }
        }

        if (endInput) {
            endInput.value = period.end.toISOString().split('T')[0];
            endInput.min = period.start.toISOString().split('T')[0];
        }

        const doctorInput = document.getElementById('aiDoctorViewDate');
        if (doctorInput) {
            if (!doctorInput.value) doctorInput.value = todayStr;
            doctorInput.min = todayStr;
            if (!doctorInput.dataset.bound) {
                doctorInput.addEventListener('change', () => this.loadDoctorScheduleForDate());
                doctorInput.dataset.bound = '1';
            }
        }

        const listContainer = document.getElementById('doctorScheduleList');
        if (listContainer) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">Loading doctors...</p>';
        }

        const summaryContainer = document.getElementById('aiGeneratorSummary');
        if (summaryContainer && !summaryContainer.innerHTML.trim()) {
            summaryContainer.innerHTML = '<div class="coverage-empty">Calculating readiness…</div>';
        }
        const alertsContainer = document.getElementById('aiGeneratorAlerts');
        if (alertsContainer && !alertsContainer.innerHTML.trim()) {
            alertsContainer.innerHTML = '';
        }
        const coverageContainer = document.getElementById('aiCoverageList');
        if (coverageContainer && !coverageContainer.innerHTML.trim()) {
            coverageContainer.innerHTML = '<div class="coverage-empty">Mapping specialty coverage…</div>';
        }

        this.updateAIGeneratorInsights();
        this.loadDoctorScheduleForDate();
    }

    getStationAssignments() {
        const assignments = new Map();
        this.getActiveStaff().forEach(staff => {
            (staff.stations || []).forEach(stationId => {
                const key = this.normalizeStationKey(stationId);
                if (!key) return;
                if (!assignments.has(key)) assignments.set(key, []);
                assignments.get(key).push(staff);
            });
        });
        return assignments;
    }

    updateAIGeneratorInsights() {
        const summaryEl = document.getElementById('aiGeneratorSummary');
        const alertsEl = document.getElementById('aiGeneratorAlerts');
        const coverageEl = document.getElementById('aiCoverageList');
        const metaEl = document.getElementById('aiSpecialtyMeta');

        if (!summaryEl && !alertsEl && !coverageEl && !metaEl) {
            return;
        }

        const activeStaff = this.getActiveStaff();
        const totalStaff = activeStaff.length;
        const clinicalStaff = activeStaff.filter(staff => this.staffHasRole(staff, 'clinical')).length;
        const frontStaff = activeStaff.filter(staff => this.staffHasRole(staff, 'front')).length;
        const trainerStaff = activeStaff.filter(staff => this.staffHasRole(staff, 'trainer')).length;

        const clinicalStations = (this.state.stations?.clinical || []).filter(Boolean);
        const aiStations = clinicalStations.filter(station => station.allow_ai_assignment !== false);
        const assignments = this.getStationAssignments();

        const coverageEntries = clinicalStations.map(station => {
            const keys = [station.id, station.name, station.specialty];
            const uniqueStaff = [];
            const seen = new Set();
            keys.forEach(value => {
                const normalized = this.normalizeStationKey(value);
                if (!normalized) return;
                const entries = assignments.get(normalized) || [];
                entries.forEach(staff => {
                    if (!seen.has(staff.id)) {
                        seen.add(staff.id);
                        uniqueStaff.push(staff);
                    }
                });
            });
            const allowAi = station.allow_ai_assignment !== false;
            const status = allowAi ? (uniqueStaff.length ? 'ok' : 'warn') : 'off';
            const statusLabel = allowAi ? (uniqueStaff.length ? 'Ready' : 'Needs Staff') : 'AI Off';
            const displayName = station.specialty || station.name || station.id;
            return {
                station,
                staff: uniqueStaff,
                allowAi,
                status,
                statusLabel,
                displayName
            };
        });

        const aiReadyCount = coverageEntries.filter(entry => entry.allowAi && entry.status === 'ok').length;
        const aiTotalCount = aiStations.length;
        const coverageScore = aiTotalCount ? Math.round((aiReadyCount / aiTotalCount) * 100) : 0;
        const uncoveredEntries = coverageEntries.filter(entry => entry.allowAi && entry.status === 'warn');

        if (summaryEl) {
            const summaryCards = [
                { icon: '👥', label: 'Active Staff', value: totalStaff, hint: `${clinicalStaff} clinical · ${frontStaff} front` },
                { icon: '🏥', label: 'Clinical Coverage', value: `${aiReadyCount}/${aiTotalCount}`, hint: 'AI-ready specialties' },
                { icon: '🎯', label: 'Front Desk', value: frontStaff, hint: `${trainerStaff} trainer${trainerStaff === 1 ? '' : 's'} available` },
                { icon: '🤖', label: 'AI Readiness', value: `${coverageScore}%`, hint: aiTotalCount ? 'Coverage score' : 'No AI stations yet' }
            ];
            summaryEl.innerHTML = summaryCards.map(card => `
                <div class="ai-summary-card">
                    <div class="ai-summary-icon">${card.icon}</div>
                    <strong>${card.value}</strong>
                    <span>${card.label}</span>
                    <small>${card.hint}</small>
                </div>
            `).join('');
        }

        if (metaEl) {
            const totalSpecialties = this.state.specialtyTotal || 0;
            const doctorCount = (this.state.doctors || []).length;
            const lastAdded = this.state.specialtyLastAdded || 0;
            const lastSyncText = lastAdded ? `Last sync added ${lastAdded}` : 'No new stations last sync';
            metaEl.textContent = `Tracking ${totalSpecialties} specialties • ${doctorCount} doctor${doctorCount === 1 ? '' : 's'} loaded • ${lastSyncText}`;
        }

        if (alertsEl) {
            const alerts = [];
            if (!clinicalStaff) {
                alerts.push({ type: 'warning', message: 'No clinical staff active. AI generator needs clinical staff with specialties.' });
            }
            if (frontStaff < 2) {
                alerts.push({ type: 'warning', message: `Only ${frontStaff} front desk staff available. AI roster allocates two per day.` });
            }
            if (uncoveredEntries.length) {
                const uncoveredPreview = uncoveredEntries.slice(0, 4).map(entry => entry.displayName).join(', ');
                const remaining = uncoveredEntries.length > 4 ? ` +${uncoveredEntries.length - 4} more` : '';
                alerts.push({ type: 'warning', message: `Assign staff to: ${uncoveredPreview}${remaining}` });
            }

            if (!alerts.length && aiTotalCount) {
                alerts.push({ type: 'success', message: 'AI roster is ready to run. All critical specialties have coverage.' });
            }

            alertsEl.innerHTML = alerts.map(alert => `
                <div class="ai-alert ${alert.type}">
                    <span>${alert.type === 'success' ? '✅' : '⚠️'}</span>
                    <div>${alert.message}</div>
                </div>
            `).join('');
        }

        if (coverageEl) {
            if (!coverageEntries.length) {
                coverageEl.innerHTML = '<div class="coverage-empty">No clinical specialties found. Sync doctor specialties to populate AI stations.</div>';
            } else {
                const order = { warn: 0, ok: 1, off: 2 };
                coverageEntries.sort((a, b) => {
                    const orderDiff = (order[a.status] ?? 99) - (order[b.status] ?? 99);
                    if (orderDiff !== 0) return orderDiff;
                    return a.displayName.localeCompare(b.displayName);
                });

                coverageEl.innerHTML = coverageEntries.map(entry => {
                    const staffBadges = entry.staff.length
                        ? entry.staff.slice(0, 6).map(s => `<span>${s.name}</span>`).join('')
                        : '<span class="staff-card-empty">No staff assigned</span>';
                    const extraCount = entry.staff.length > 6 ? `<span class="staff-card-empty">+${entry.staff.length - 6} more</span>` : '';
                    return `
                        <div class="coverage-item">
                            <div class="coverage-header">
                                <div class="coverage-title">${entry.displayName}</div>
                                <span class="coverage-status ${entry.status}">${entry.statusLabel}</span>
                            </div>
                            <div class="coverage-meta">
                                <span>AI ${entry.allowAi ? 'enabled' : 'disabled'}</span>
                                <span>${entry.staff.length} staff assigned</span>
                            </div>
                            <div class="coverage-staff">${staffBadges}${extraCount}</div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // ===== STAFF DIRECTORY =====
    renderStaffDirectory() {
        console.log('Rendering staff directory, staff count:', this.state.staff?.length || 0);
        this.syncStaffFilterControls();
        this.populateStaffStationFilter();
        this.populateStaffPoolFilter();
        this.renderFilteredStaff();
        this.updateAIGeneratorInsights();
    }

    populateStaffStationFilter() {
        const select = document.getElementById('staffStationFilter');
        if (!select) return;
        const current = this.staffFilters?.station || 'any';
        const stations = this.getAllStations();
        const options = ['<option value="any">All stations</option>'];
        const seen = new Set();
        stations.forEach(station => {
            if (!station) return;
            const value = station.id || station.name;
            if (!value || seen.has(value)) return;
            seen.add(value);
            const label = station.displayName || station.name || value;
            options.push(`<option value="${this.escapeHtml(value)}">${this.escapeHtml(label)}</option>`);
        });
        const markup = options.join('');
        if (select.innerHTML !== markup) {
            select.innerHTML = markup;
        }
        if (!seen.has(current) && current !== 'any') {
            this.staffFilters.station = 'any';
        }
        select.value = this.staffFilters.station;
    }
    
    populateStaffPoolFilter() {
        const select = document.getElementById('staffPoolFilter');
        if (!select) return;
        const current = this.staffFilters?.pool || 'any';
        const options = [
            '<option value="any">All pools</option>',
            '<option value="A">Pool A</option>',
            '<option value="B">Pool B</option>',
            '<option value="C">Pool C</option>',
            '<option value="D">Pool D</option>'
        ];
        select.innerHTML = options.join('');
        select.value = current;
    }

    setStaffFilter(key, rawValue) {
        if (!this.staffFilters) {
            this.staffFilters = { search: '', role: 'all', status: 'active', station: 'any', pool: 'any' };
        }
        let value = rawValue;
        if ((key === 'station' || key === 'pool') && (!value || value === '')) value = 'any';
        this.staffFilters[key] = value;
        this.syncStaffFilterControls();
        this.renderFilteredStaff();
    }

    syncStaffFilterControls() {
        const roleFilter = document.getElementById('staffRoleFilter');
        if (roleFilter && roleFilter.value !== this.staffFilters.role) {
            roleFilter.value = this.staffFilters.role;
        }
        const statusFilter = document.getElementById('staffStatusFilter');
        if (statusFilter && statusFilter.value !== this.staffFilters.status) {
            statusFilter.value = this.staffFilters.status;
        }
        const stationFilter = document.getElementById('staffStationFilter');
        if (stationFilter && stationFilter.value !== this.staffFilters.station) {
            stationFilter.value = this.staffFilters.station;
        }
        const poolFilter = document.getElementById('staffPoolFilter');
        if (poolFilter && poolFilter.value !== this.staffFilters.pool) {
            poolFilter.value = this.staffFilters.pool;
        }
    }

    filterStaff(query) {
        this.staffFilters.search = query || '';
        this.renderFilteredStaff();
    }

    filterStaffByRole(role) {
        this.setStaffFilter('role', role);
    }

    getFilteredStaff() {
        const filters = this.staffFilters || { search: '', role: 'all', status: 'all', station: 'any', pool: 'any' };
        const searchTerm = (filters.search || '').trim().toLowerCase();
        const staffList = (this.state.staff || []).slice().sort((a, b) => a.name.localeCompare(b.name));
        return staffList.filter(staff => {
            if (!staff) return false;
            const isActive = staff.active !== false;
            if (filters.status === 'active' && !isActive) return false;
            if (filters.status === 'inactive' && isActive) return false;
            if (filters.role !== 'all') {
                const roles = this.getStaffRoles(staff);
                if (!roles.includes(filters.role)) return false;
            }
            if (filters.station !== 'any') {
                const stations = Array.isArray(staff.stations) ? staff.stations : [];
                if (!stations.includes(filters.station)) return false;
            }
            if (filters.pool !== 'any') {
                const pools = Array.isArray(staff.pools) ? staff.pools : [];
                if (!pools.includes(filters.pool)) return false;
            }
            if (searchTerm) {
                const poolText = (staff.pools || []).join(' ');
                const haystack = `${staff.name || ''} ${this.getStaffRoles(staff).join(' ')} ${(staff.stations || []).join(' ')} ${poolText}`.toLowerCase();
                if (!haystack.includes(searchTerm)) return false;
            }
            return true;
        });
    }

    renderFilteredStaff(staffList) {
        const grid = document.getElementById('staffGrid');
        if (!grid) return;
        const list = Array.isArray(staffList) ? staffList : this.getFilteredStaff();
        console.log('Rendering filtered staff:', list.length, 'of', this.state.staff?.length || 0);
        console.log('Current filters:', this.staffFilters);
        if (list.length) {
            grid.innerHTML = list.map(staff => this.buildStaffCard(staff)).join('');
        } else {
            const total = (this.state.staff || []).length;
            const icon = total ? '🔍' : '👥';
            const message = total ? 'No staff match the current filters' : 'No staff members found';
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">${icon}</div>
                    <div class="empty-state-text">${message}</div>
                </div>
            `;
        }
        this.updateStaffResultsMeta(list.length);
    }

    updateStaffResultsMeta(count) {
        const meta = document.getElementById('staffResultsMeta');
        if (!meta) return;
        const total = (this.state.staff || []).length;
        meta.textContent = `${count} of ${total} staff shown`;
    }

    buildStaffCard(staff) {
        const roles = this.getStaffRoles(staff);
        const roleIcons = roles.length
            ? roles.map(role => role === 'clinical' ? '🏥' : role === 'trainer' ? '🎓' : '🎯').join('')
            : '👤';
        const roleText = roles.length
            ? roles.join(', ').replace(/clinical/g, 'Clinical').replace(/front/g, 'Front').replace(/trainer/g, 'Trainer')
            : 'Unassigned';
        const stationCount = Array.isArray(staff.stations) ? staff.stations.length : 0;
        const stationsPreview = (staff.stations || [])
            .slice(0, 3)
            .map(id => this.getStationName(id) || id)
            .filter(Boolean);
        const active = staff.active !== false;
        const statusClass = active ? 'active' : 'inactive';
        const statusLabel = active ? 'Active' : 'Inactive';
        const extraStations = stationCount > stationsPreview.length ? ` +${stationCount - stationsPreview.length} more` : '';
        
        // Display pools with gradient colors
        const pools = staff.pools || [];
        const poolColors = {
            A: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            B: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            C: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            D: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        };
        const poolBadges = pools.length > 0
            ? pools.map(pool => `<span style="background: ${poolColors[pool]}; color: white; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;">Pool ${pool}</span>`).join('')
            : '<span style="color: var(--text-muted); font-size: 11px;">No pools</span>';

        return `
            <article class="staff-card" tabindex="0" onclick="prPortal.showStaffDetails('${staff.id}')">
                <div class="staff-card-header">
                    <div class="staff-card-icon">${roleIcons}</div>
                    <div>
                        <div class="staff-card-name">${staff.name}</div>
                        <div class="staff-card-role">${roleText}</div>
                    </div>
                    <div class="staff-card-active ${statusClass}">${statusLabel}</div>
                </div>
                <div class="staff-card-stations">
                    ${stationsPreview.length
                        ? stationsPreview.map(name => `<span class="staff-card-chip">${name}</span>`).join('')
                        : '<span class="staff-card-empty">No stations assigned</span>'}
                    ${extraStations ? `<span class="staff-card-empty">${extraStations}</span>` : ''}
                </div>
                <div class="staff-card-footer">
                    <div style="display: flex; gap: 6px; align-items: center;">${poolBadges}</div>
                    <span class="staff-card-link">View Profile →</span>
                </div>
            </article>
        `;
    }

    showStaffDetails(staffId) {
        const staff = this.state.staff.find(s => s.id === staffId);
        if (!staff) return;
        this.editingStaffId = staffId;
        document.getElementById('staffDetailsName').textContent = `👤 ${staff.name}`;
        
        // Calculate leave breakdown by type
        const leaveBreakdown = { AL: 0, SL: 0, ML: 0, CL: 0, FRL: 0, Other: 0 };
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
        const stationChips = (staff.stations || []).map(sid => {
            const name = this.getStationName(sid) || sid;
            return `<span style="background: rgba(37, 99, 235, 0.12); color: #1d4ed8; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;">${name}</span>`;
        }).join(' ');
        
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
                    <div style="font-size: 14px; color: var(--text); display: flex; flex-wrap: wrap; gap: 8px;">${stationChips || '<span style="color: var(--text-muted);">No stations assigned</span>'}</div>
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
        const editBtn = document.getElementById('staffDetailsEditButton');
        if (editBtn) {
            editBtn.onclick = () => this.openEditStaffModal(staffId);
        }
        this.openModal('staffDetailsModal');
    }

    openAddStaffModal() {
        // Reset wizard state
        this.newStaffWizard = this.createDefaultWizardState();
        
        // Reset all wizard fields
        const nameInput = document.getElementById('wizardStaffName');
        if (nameInput) nameInput.value = '';
        
        // Clear all role selections
        document.querySelectorAll('.wizard-role-input').forEach(cb => {
            cb.checked = false;
            const card = cb.closest('.role-card');
            if (card) card.classList.remove('selected');
        });
        
        // Go to step 1
        this.wizardGoToStep(1);
        
        this.openModal('addStaffModal');
    }

    wizardGoToStep(step) {
        this.newStaffWizard.step = step;
        
        // Update step visibility
        document.querySelectorAll('.wizard-step').forEach(stepEl => {
            stepEl.classList.toggle('active', parseInt(stepEl.dataset.step) === step);
        });
        
        // Update title
        const titles = {
            1: 'Step 1: Basic Info',
            2: 'Step 2: Select Roles',
            3: 'Step 3: Configure Assignments',
            4: 'Step 4: Review'
        };
        const titleEl = document.getElementById('wizardStepTitle');
        if (titleEl) titleEl.textContent = titles[step] || `Step ${step}`;
        
        // Update buttons
        const prevBtn = document.getElementById('wizardPrevBtn');
        const nextBtn = document.getElementById('wizardNextBtn');
        const finishBtn = document.getElementById('wizardFinishBtn');
        
        if (prevBtn) prevBtn.style.display = step > 1 ? 'inline-block' : 'none';
        if (nextBtn) nextBtn.style.display = step < 4 ? 'inline-block' : 'none';
        if (finishBtn) finishBtn.style.display = step === 4 ? 'inline-block' : 'none';
        
        // Step-specific logic
        if (step === 3) this.wizardUpdateStep3();
        if (step === 4) this.wizardUpdateStep4();
    }

    wizardNext() {
        const step = this.newStaffWizard.step;
        
        // Validate current step
        if (step === 1) {
            const name = document.getElementById('wizardStaffName')?.value?.trim();
            if (!name) {
                this.showNotification('Please enter staff name', 'danger');
                return;
            }
            this.newStaffWizard.name = name;
        }
        
        if (step === 2) {
            const selected = Array.from(document.querySelectorAll('.wizard-role-input:checked')).map(cb => cb.value);
            if (selected.length === 0) {
                this.showNotification('Please select at least one role', 'danger');
                return;
            }
            this.newStaffWizard.roles = selected;
        }
        
        if (step === 3) {
            // Collect stations
            const stationClinical = Array.from(document.querySelectorAll('#wizardClinicalStations .station-checkbox:checked')).map(cb => cb.value);
            const stationFront = Array.from(document.querySelectorAll('#wizardFrontStations .station-checkbox:checked')).map(cb => cb.value);
            this.newStaffWizard.stations = [...stationClinical, ...stationFront];
            
            // Collect training info if trainer role
            if (this.newStaffWizard.roles.includes('trainer')) {
                const focus = document.getElementById('wizardTrainingFocus')?.value;
                const preference = document.querySelector('input[name="wizardTrainingPreference"]:checked')?.value;
                const notes = document.getElementById('wizardTrainingNotes')?.value?.trim();
                this.newStaffWizard.training = { focus, preference, notes };
            }
            
            // Validate pools - must select exactly 2
            const selectedPools = Array.from(document.querySelectorAll('.wizard-pool-input:checked')).map(cb => cb.value);
            const poolError = document.getElementById('wizardPoolError');
            if (selectedPools.length !== 2) {
                if (poolError) poolError.style.display = 'block';
                this.showNotification('⚠️ Please select exactly 2 pools', 'danger');
                return;
            }
            if (poolError) poolError.style.display = 'none';
            this.newStaffWizard.pools = selectedPools;
        }
        
        this.wizardGoToStep(step + 1);
    }

    wizardPrev() {
        this.wizardGoToStep(this.newStaffWizard.step - 1);
    }

    wizardUpdateStep3() {
        const roles = this.newStaffWizard.roles || [];
        const hasClinical = roles.includes('clinical');
        const hasFront = roles.includes('front');
        const hasTrainer = roles.includes('trainer');
        
        // Show/hide sections
        const clinicalSection = document.getElementById('wizardClinicalSection');
        const frontSection = document.getElementById('wizardFrontSection');
        const trainingSection = document.getElementById('wizardTrainingSection');
        const notice = document.getElementById('wizardStationNotice');
        
        if (clinicalSection) clinicalSection.style.display = hasClinical ? 'block' : 'none';
        if (frontSection) frontSection.style.display = hasFront ? 'block' : 'none';
        if (trainingSection) trainingSection.style.display = hasTrainer ? 'block' : 'none';
        
        if (notice) {
            if (!hasClinical && !hasFront) {
                notice.style.display = 'block';
                notice.textContent = '✨ Trainer-only role selected. No station assignment needed unless they also work shifts.';
            } else {
                notice.style.display = 'none';
            }
        }
        
        // Render station lists
        if (hasClinical) {
            this.renderStationSelector('wizardClinicalStations', [], 'clinical');
        }
        if (hasFront) {
            this.renderStationSelector('wizardFrontStations', [], 'front');
        }
    }

    wizardUpdateStep4() {
        // Populate summary
        const nameEl = document.getElementById('wizardSummaryName');
        const rolesEl = document.getElementById('wizardSummaryRoles');
        const stationsEl = document.getElementById('wizardSummaryStations');
        const trainingCard = document.getElementById('wizardSummaryTrainingCard');
        const trainingEl = document.getElementById('wizardSummaryTraining');
        const poolsEl = document.getElementById('wizardSummaryPools');
        
        if (nameEl) nameEl.textContent = this.newStaffWizard.name || '—';
        
        const roleLabels = {
            clinical: '🏥 Clinical',
            front: '🎯 Front Desk',
            trainer: '🎓 Trainer'
        };
        if (rolesEl) {
            const roles = (this.newStaffWizard.roles || []).map(r => roleLabels[r] || r).join(', ');
            rolesEl.textContent = roles || '—';
        }
        
        if (stationsEl) {
            const stations = this.newStaffWizard.stations || [];
            if (stations.length) {
                stationsEl.innerHTML = stations.map(id => {
                    const name = this.getStationName(id) || id;
                    return `<span style="background: rgba(37, 99, 235, 0.12); color: #1d4ed8; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;">${name}</span>`;
                }).join('');
            } else {
                stationsEl.innerHTML = '<span style="color: var(--text-muted);">No stations assigned</span>';
            }
        }
        
        // Display pools
        if (poolsEl) {
            const pools = this.newStaffWizard.pools || [];
            const poolColors = {
                A: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                B: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                C: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                D: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
            };
            if (pools.length === 2) {
                poolsEl.innerHTML = pools.map(pool => 
                    `<span style="background: ${poolColors[pool]}; color: white; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                        Pool ${pool}
                    </span>`
                ).join('');
            } else {
                poolsEl.innerHTML = '<span style="color: var(--text-muted);">No pools assigned</span>';
            }
        }
        
        const isTrainer = (this.newStaffWizard.roles || []).includes('trainer');
        if (trainingCard) trainingCard.style.display = isTrainer ? 'block' : 'none';
        if (trainingEl && isTrainer) {
            const t = this.newStaffWizard.training || {};
            const focusLabels = { clinical: 'Clinical exposure', front: 'Front desk exposure', hybrid: 'Hybrid / cross-training' };
            const prefLabels = { prompt: 'Ask during AI generation', omit: 'Skip automatically' };
            trainingEl.innerHTML = `
                <div><strong>Focus:</strong> ${focusLabels[t.focus] || t.focus || '—'}</div>
                <div><strong>AI Assignment:</strong> ${prefLabels[t.preference] || t.preference || '—'}</div>
                ${t.notes ? `<div><strong>Notes:</strong> ${t.notes}</div>` : ''}
            `;
        }
    }

    async finishAddStaff() {
        const wizard = this.newStaffWizard;
        
        const payload = {
            name: wizard.name,
            roles: wizard.roles,
            stations: wizard.stations,
            pools: wizard.pools || [],
            active: true
        };
        
        // Add training profile if trainer role
        if (wizard.roles.includes('trainer')) {
            payload.training = wizard.training;
        }
        
        try {
            const res = await fetch('/api/pr/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok || data.ok === false) {
                throw new Error(data.error || 'Failed to add staff');
            }
            await this.loadData();
            this.renderStaffDirectory();
            this.renderDashboard();
            this.renderSchedule();
            this.closeModal('addStaffModal');
            this.showNotification(`✅ Staff added: ${data.staff.name}`, 'success');
        } catch (error) {
            console.error('Error adding staff:', error);
            this.showNotification('❌ Error adding staff', 'danger');
        }
    }

    openEditStaffModal(staffId) {
        const targetId = staffId || this.editingStaffId;
        const staff = this.state.staff.find(s => s.id === targetId);
        if (!staff) {
            this.showNotification('Unable to load staff details', 'danger');
            return;
        }
        this.editingStaffId = staff.id;
        document.getElementById('editStaffName').value = staff.name;
        document.querySelectorAll('.edit-role-checkbox').forEach(cb => {
            cb.checked = this.staffHasRole(staff, cb.value);
        });
        this.renderStationSelector('editStaffStations', staff.stations || []);
        
        // Set pools
        const staffPools = staff.pools || [];
        document.querySelectorAll('.edit-pool-input').forEach(cb => {
            cb.checked = staffPools.includes(cb.value);
        });
        
        const activeToggle = document.getElementById('editStaffActive');
        if (activeToggle) activeToggle.checked = staff.active !== false;
        this.openModal('editStaffModal');
    }

    async saveStaffEdits() {
        const staffId = this.editingStaffId;
        if (!staffId) {
            this.showNotification('No staff selected for editing', 'danger');
            return;
        }
        const name = document.getElementById('editStaffName').value.trim();
        const roles = Array.from(document.querySelectorAll('.edit-role-checkbox:checked')).map(cb => cb.value);
        const stations = Array.from(document.querySelectorAll('#editStaffStations .station-checkbox:checked')).map(cb => cb.value);
        const pools = Array.from(document.querySelectorAll('.edit-pool-input:checked')).map(cb => cb.value);
        const active = document.getElementById('editStaffActive').checked;

        if (!name || roles.length === 0) {
            this.showNotification('Please provide a name and at least one role', 'danger');
            return;
        }
        
        // Validate pools
        if (pools.length !== 2) {
            const poolError = document.getElementById('editPoolError');
            if (poolError) poolError.style.display = 'block';
            this.showNotification('⚠️ Please select exactly 2 pools', 'danger');
            return;
        }

        try {
            const res = await fetch(`/api/pr/staff/${staffId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, roles, stations, pools, active })
            });
            const data = await res.json();
            if (!res.ok || data.ok === false) {
                throw new Error(data.error || 'Failed to save staff');
            }
            await this.loadData();
            this.renderStaffDirectory();
            this.renderDashboard();
            this.renderSchedule();
            this.closeModal('editStaffModal');
            this.closeModal('staffDetailsModal');
            this.editingStaffId = null;
            this.showNotification('Staff updated successfully', 'success');
        } catch (error) {
            console.error('Error updating staff:', error);
            this.showNotification('Error updating staff details', 'danger');
        }
    }

    async refreshStaffDirectoryFromServer() {
        try {
            await this.loadData();
            this.renderStaffDirectory();
            this.renderDashboard();
            this.renderSchedule();
            this.updateAIGeneratorInsights();
            this.showNotification('Staff directory refreshed from server', 'success');
        } catch (error) {
            console.error('Error refreshing staff directory:', error);
            this.showNotification('Failed to refresh staff directory', 'danger');
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
        const today = getMaldivesToday(); // Maldives time
        const isToday = dateStr === today;
        
        const displayEl = document.getElementById('leaveDateDisplay');
        if (displayEl) displayEl.textContent = `Leaves for ${dayName}, ${dateStr}${isToday ? ' (Today)' : ''}`;
        
        const leaveDateInput = document.getElementById('leaveDate');
        if (leaveDateInput && leaveDateInput.value !== dateStr) {
            leaveDateInput.value = dateStr;
        }
        
        const leaves = this.state.leaves[dateStr] || [];
        const container = document.getElementById('leavesList');
        if (!container) return;
        
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
        // Initialize the active tab (default to GOPD)
        const activeTab = document.querySelector('.tab.active[data-tab]');
        const activeTabName = activeTab ? activeTab.dataset.tab : 'gopd';
        
        // Render based on active tab
        switch(activeTabName) {
            case 'gopd': this.renderGopdConfig(); break;
            case 'shift-knowledge': this.renderShiftKnowledge(); break;
            case 'stations': this.renderStationsManagement(); break;
            case 'ai-rules': break; // AI Rules has no dynamic rendering
            default: this.renderGopdConfig();
        }
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
        // NEW CATEGORIZED SYSTEM - Load categories instead of flat shifts
        this.loadGopdConfig();
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

    // ===== SHIFT KNOWLEDGE =====
    renderShiftKnowledge() {
        // NEW CATEGORIZED SYSTEM for staff shift templates
        this.loadPrShiftTemplates();
        
        // Keep other shift knowledge sections (Friday shifts, Doctor OPD)
        this.renderFridayShiftTemplates();
        
        // RENDER Doctor OPD Information
        console.log('🏥 Rendering Doctor OPD Information...');
        console.log('Doctor OPD Data:', this.state.doctorOpd);
        this.renderDoctorOpdInfo();
    }

    switchPrShiftTeam(team) {
        // OLD FUNCTION - Kept for backward compatibility, but redirects to new categorized system
        if (!['clinical', 'front'].includes(team)) return;
        this.state.activePrShiftTeam = team;
        // NEW: Use categorized system
        this.switchStaffTeam(team);
    }

    switchFridayTeam(team) {
        if (!['clinical', 'front'].includes(team)) return;
        this.state.activeFridayTeam = team;
        this.renderFridayShiftTemplates();
    }

    renderPrShiftTemplates() {
        // OLD FUNCTION - Replaced by categorized system
        // Redirect to new load function
        this.loadPrShiftTemplates();
    }

    renderFridayShiftTemplates() {
        const team = this.state.activeFridayTeam || 'clinical';
        const tabClinical = document.getElementById('fridayClinicalTab');
        const tabFront = document.getElementById('fridayFrontTab');
        if (tabClinical) tabClinical.classList.toggle('active', team === 'clinical');
        if (tabFront) tabFront.classList.toggle('active', team === 'front');

        const container = document.getElementById('fridayShiftList');
        if (!container) return;

        const fridayShifts = this.state.prShiftTemplates?.[team]?.friday || [];
        if (!fridayShifts.length) {
            container.innerHTML = '<div class="shift-empty">No Friday coverage defined. Add at least one shift to ensure mosque-day operations are staffed.</div>';
            return;
        }

        container.innerHTML = fridayShifts.map((shift, index) => this.buildShiftRowMarkup(team, 'friday', shift, index)).join('');
    }

    buildShiftRowMarkup(team, scope, shift, index) {
        const safeName = this.escapeHtml(shift.name || '');
        const safeStart = this.escapeHtml(shift.start || '');
        const safeEnd = this.escapeHtml(shift.end || '');
        const minStaff = typeof shift.min_staff === 'number' ? shift.min_staff : 1;
        const labelPrefix = scope === 'friday' ? 'Friday' : 'Shift';
        return `
            <div class="shift-row">
                <div>
                    <label style="display:block; font-size:12px; font-weight:700; color: var(--text-muted);">${labelPrefix} Name</label>
                    <input type="text" class="form-input" value="${safeName}" oninput="prPortal.updatePrShiftField('${team}','${scope}',${index},'name', this.value)">
                </div>
                <div>
                    <label style="display:block; font-size:12px; font-weight:700; color: var(--text-muted);">Start Time</label>
                    <input type="time" class="form-input" value="${safeStart}" onchange="prPortal.updatePrShiftField('${team}','${scope}',${index},'start', this.value)">
                </div>
                <div>
                    <label style="display:block; font-size:12px; font-weight:700; color: var(--text-muted);">End Time</label>
                    <input type="time" class="form-input" value="${safeEnd}" onchange="prPortal.updatePrShiftField('${team}','${scope}',${index},'end', this.value)">
                </div>
                <div>
                    <label style="display:block; font-size:12px; font-weight:700; color: var(--text-muted);">Minimum Staff</label>
                    <input type="number" class="form-input" value="${minStaff}" min="0" onchange="prPortal.updatePrShiftField('${team}','${scope}',${index},'min_staff', this.value)">
                </div>
                <div class="shift-row-actions">
                    <button class="btn btn-danger btn-sm" onclick="prPortal.removePrShift('${team}','${scope}',${index})">🗑️ Remove</button>
                </div>
            </div>
        `;
    }

    updatePrShiftField(team, scope, index, field, value) {
        const collection = this.state.prShiftTemplates?.[team]?.[scope];
        if (!collection || !collection[index]) return;
        if (field === 'min_staff') {
            const num = parseInt(value, 10);
            collection[index][field] = Number.isFinite(num) && num >= 0 ? num : 0;
            if (scope === 'friday') {
                this.renderFridayShiftTemplates();
            } else {
                this.renderPrShiftTemplates();
            }
        } else {
            collection[index][field] = value;
        }
    }

    addPrShift(scope = 'regular') {
        const team = scope === 'friday' ? (this.state.activeFridayTeam || 'clinical') : (this.state.activePrShiftTeam || 'clinical');
        if (!this.state.prShiftTemplates?.[team]?.[scope]) return;
        const newShift = this.createShiftTemplate('Custom Shift', '', '', 1, true);
        this.state.prShiftTemplates[team][scope].push(newShift);
        if (scope === 'friday') {
            this.renderFridayShiftTemplates();
        } else {
            this.renderPrShiftTemplates();
        }
    }

    removePrShift(team, scope, index) {
        const collection = this.state.prShiftTemplates?.[team]?.[scope];
        if (!collection) return;
        if (collection.length === 1) {
            this.showNotification('At least one shift must remain. Add a replacement before deleting this shift.', 'danger');
            return;
        }
        collection.splice(index, 1);
        if (scope === 'friday') {
            this.renderFridayShiftTemplates();
        } else {
            this.renderPrShiftTemplates();
        }
    }

    renderDoctorOpdInfo() {
        const container = document.getElementById('doctorOpdList');
        if (!container) {
            console.warn('❌ doctorOpdList container not found in DOM');
            return;
        }
        
        // Ensure doctorOpd exists
        if (!this.state.doctorOpd) {
            this.state.doctorOpd = {};
        }
        
        const knowledge = this.state.doctorOpd || {};
        const specialties = Object.keys(knowledge);
        
        console.log('📋 Doctor OPD Specialties:', specialties);
        
        if (!specialties.length) {
            container.innerHTML = '<div class="shift-empty">No doctor OPD profiles added yet. Use "Add OPD Profile" to define specialty timings.</div>';
            return;
        }
        
        container.innerHTML = specialties.sort((a, b) => a.localeCompare(b)).map(specialty => {
            const data = knowledge[specialty] || {};
            const shift1 = data.shift1 || {};
            const shift2 = data.shift2 || {};
            
            // Find matching clinical shifts for each OPD shift
            const s1Match = this.findBestClinicalShift(shift1.start);
            const s2Match = this.findBestClinicalShift(shift2.start);
            
            const shift1Text = `${shift1.start || '--'} to ${shift1.end || '--'} (${shift1.patients || 0} patients)`;
            const shift2Text = `${shift2.start || '--'} to ${shift2.end || '--'} (${shift2.patients || 0} patients)`;
            const s1Clinical = s1Match ? `<br><span style="color: #10b981; font-size: 11px;">📌 Best Clinical: ${s1Match}</span>` : '';
            const s2Clinical = s2Match ? `<br><span style="color: #10b981; font-size: 11px;">📌 Best Clinical: ${s2Match}</span>` : '';
            
            const safeSpec = this.escapeHtml(specialty);
            const encodedSpec = specialty.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
            return `
                <div class="doctor-opd-card">
                    <div>
                        <h4>${safeSpec}</h4>
                        <div class="doctor-opd-meta">
                            <span><strong>Shift 1:</strong> ${this.escapeHtml(shift1Text)}${s1Clinical}</span>
                            <span><strong>Shift 2:</strong> ${this.escapeHtml(shift2Text)}${s2Clinical}</span>
                        </div>
                    </div>
                    <div class="doctor-opd-actions">
                        <button class="btn btn-secondary btn-sm" onclick="prPortal.editDoctorOpd('${encodedSpec}')">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="prPortal.deleteDoctorOpd('${encodedSpec}')">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Doctor OPD Information rendered successfully');
    }

    findBestClinicalShift(doctorStartTime) {
        // Find the best clinical shift that starts 30-60 mins before doctor
        if (!doctorStartTime || !this.staffShiftCategories) return null;
        
        const doctorMinutes = this.timeToMinutes(doctorStartTime);
        let bestMatch = null;
        let bestDiff = 999;
        
        ['clinical', 'front'].forEach(team => {
            const categories = this.staffShiftCategories[team] || {};
            Object.keys(categories).forEach(cat => {
                const shifts = categories[cat] || [];
                shifts.forEach(shift => {
                    if (shift.start) {
                        const shiftMinutes = this.timeToMinutes(shift.start);
                        const diff = doctorMinutes - shiftMinutes;
                        // Looking for 30-90 min offset
                        if (diff >= 30 && diff <= 90 && Math.abs(diff - 30) < bestDiff) {
                            bestDiff = Math.abs(diff - 30);
                            bestMatch = `${shift.name} (${shift.start})`;
                        }
                    }
                });
            });
        });
        
        return bestMatch;
    }

    openDoctorOpdModal() {
        const select = document.getElementById('specialtyName');
        if (select) {
            select.disabled = false;
            // Ensure specialties are loaded
            const specialties = this.state.specialties || [];
            console.log('📋 Available specialties for OPD:', specialties);
            
            if (specialties.length === 0) {
                select.innerHTML = '<option value="">No specialties available</option>' +
                    '<option value="__custom__">➕ Add Custom Specialty</option>';
            } else {
                select.innerHTML = '<option value="">Select specialty...</option>' +
                    specialties.map(s => `<option value="${this.escapeHtml(s)}">${this.escapeHtml(s)}</option>`).join('') +
                    '<option value="__custom__">➕ Add Custom Specialty</option>';
            }
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

    editDoctorOpd(specialty) {
        const record = this.state.doctorOpd?.[specialty];
        if (!record) {
            this.showNotification('Unable to load OPD profile', 'danger');
            return;
        }
        this.editingSpecialty = specialty;
        const select = document.getElementById('specialtyName');
        if (select) {
            select.innerHTML = `<option value="${this.escapeHtml(specialty)}" selected>${this.escapeHtml(specialty)}</option>`;
            select.disabled = true;
        }
        const shift1 = record.shift1 || {};
        const shift2 = record.shift2 || {};
        document.getElementById('specialty_s1_start').value = shift1.start || '';
        document.getElementById('specialty_s1_end').value = shift1.end || '';
        document.getElementById('specialty_s1_pts').value = shift1.patients || '';
        document.getElementById('specialty_s2_start').value = shift2.start || '';
        document.getElementById('specialty_s2_end').value = shift2.end || '';
        document.getElementById('specialty_s2_pts').value = shift2.patients || '';
        this.openModal('addSpecialtyModal');
    }

    saveDoctorOpd() {
        let specialty = document.getElementById('specialtyName').value;
        if (specialty === '__custom__') {
            const custom = prompt('Enter custom specialty name:');
            if (!custom) return;
            specialty = custom.trim();
        }
        if (!specialty) {
            this.showNotification('Please select a specialty', 'danger');
            return;
        }
        const shift1 = {
            start: document.getElementById('specialty_s1_start').value,
            end: document.getElementById('specialty_s1_end').value,
            patients: parseInt(document.getElementById('specialty_s1_pts').value, 10) || 0
        };
        const shift2 = {
            start: document.getElementById('specialty_s2_start').value,
            end: document.getElementById('specialty_s2_end').value,
            patients: parseInt(document.getElementById('specialty_s2_pts').value, 10) || 0
        };
        this.state.doctorOpd[specialty] = { shift1, shift2 };
        if (!this.state.specialties.includes(specialty)) {
            this.state.specialties.push(specialty);
            this.state.specialties.sort((a, b) => a.localeCompare(b));
        }
        const select = document.getElementById('specialtyName');
        if (select) select.disabled = false;
        this.closeModal('addSpecialtyModal');
        this.renderDoctorOpdInfo();
        this.showNotification(this.editingSpecialty ? 'Doctor OPD profile updated' : 'Doctor OPD profile added', 'success');
        this.editingSpecialty = null;
    }

    deleteDoctorOpd(specialty) {
        if (!this.state.doctorOpd?.[specialty]) return;
        if (confirm(`Remove ${specialty} OPD profile?`)) {
            delete this.state.doctorOpd[specialty];
            this.renderDoctorOpdInfo();
            this.showNotification('Doctor OPD profile removed', 'success');
        }
    }

    async saveShiftKnowledge() {
        try {
            const payload = {
                knowledge: {
                    ...this.shiftKnowledgeExtras,
                    pr: this.state.prShiftTemplates,
                    doctor_opd: this.state.doctorOpd
                }
            };
            const res = await fetch('/api/shift-knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                this.showNotification('Shift knowledge saved successfully', 'success');
            } else {
                this.showNotification('Failed to save shift knowledge', 'danger');
            }
        } catch (error) {
            console.error('Error saving shift knowledge:', error);
            this.showNotification('Error saving shift knowledge', 'danger');
        }
    }

    // NEW: Stations Management Tab
    renderStationsManagement() {
        const container = document.getElementById('stationsManagementContent');
        if (!container) return;
        
        const clinicalStations = this.state.stations?.clinical || [];
        const frontStations = this.state.stations?.front || [];

        const specialtySummary = this.state.specialtyLastAdded > 0
            ? `${this.state.specialtyLastAdded} new specialty station${this.state.specialtyLastAdded === 1 ? '' : 's'} added from the doctor portal.`
            : 'No new specialty stations detected in the latest sync.';

        const renderClinicalList = () => {
            if (clinicalStations.length === 0) {
                return '<div class="empty-state"><div class="empty-state-icon">🏥</div><div class="empty-state-text">No clinical stations yet. Sync with the doctor portal or add a custom station.</div></div>';
            }
            return clinicalStations.map(station => {
                const safeId = (station.id || '').replace(/'/g, "\\'");
                const isAllowed = station.allow_ai_assignment !== false;
                const isAuto = station.auto_generated === true;
                const badges = [];
                badges.push(`<span style="background: ${isAuto ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)'}; color: ${isAuto ? '#047857' : '#4338ca'}; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;">${isAuto ? 'Auto from Doctors' : 'Custom Station'}</span>`);
                if (!isAllowed) {
                    badges.push('<span style="background: rgba(239,68,68,0.15); color: #b91c1c; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;">AI Allocation Disabled</span>');
                }
                const metaBits = [];
                if (station.specialty && station.specialty !== station.name) {
                    metaBits.push(`Specialty: ${station.specialty}`);
                }
                metaBits.push(`ID: ${station.id}`);
                return `
                    <div class="list-item" style="align-items: flex-start;">
                        <div class="list-item-content" style="gap: 6px;">
                            <div class="list-item-title">${station.name}</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 6px;">${badges.join('')}</div>
                            <div class="list-item-meta">${metaBits.join(' • ')}</div>
                        </div>
                        <div class="list-item-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted);">
                                <input type="checkbox" ${isAllowed ? 'checked' : ''} onchange="prPortal.toggleStationAssignment('clinical','${safeId}', this.checked)" style="width: auto;">
                                <span>Allow AI clinical assignment</span>
                            </label>
                            ${isAuto ? '' : `<button class="btn btn-danger btn-sm" onclick="prPortal.deleteStation('clinical','${safeId}')">🗑️ Delete</button>`}
                        </div>
                    </div>
                `;
            }).join('');
        };

        const renderFrontList = () => {
            if (frontStations.length === 0) {
                return '<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-text">No front desk stations configured yet.</div></div>';
            }
            return frontStations.map(station => {
                const safeId = (station.id || '').replace(/'/g, "\\'");
                const minStaff = station.min_staff || 1;
                const fridayEnabled = station.friday_enabled !== false;
                const fridayMinStaff = station.friday_min_staff || 1;
                return `
                    <div class="list-item" style="align-items: flex-start;">
                        <div class="list-item-content" style="gap: 12px;">
                            <div class="list-item-title">${station.name}</div>
                            <div class="list-item-meta">ID: ${station.id}</div>
                            
                            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); min-width: 120px;">Min Staff Required:</label>
                                    <input type="number" min="1" max="10" value="${minStaff}" 
                                        onchange="prPortal.updateStationMinStaff('${safeId}', this.value)"
                                        style="width: 70px; padding: 4px 8px; border: 2px solid var(--border); border-radius: 6px; font-weight: 600;">
                                    <span style="font-size: 11px; color: var(--text-muted);">staff per day</span>
                                </div>
                                
                                <div style="border-top: 1px solid var(--border); padding-top: 8px;">
                                    <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
                                        <input type="checkbox" ${fridayEnabled ? 'checked' : ''} 
                                            onchange="prPortal.toggleStationFriday('${safeId}', this.checked)" 
                                            style="width: auto;">
                                        <span>🕌 Open on Friday</span>
                                    </label>
                                    ${fridayEnabled ? `
                                        <div style="display: flex; align-items: center; gap: 8px; margin-left: 24px;">
                                            <label style="font-size: 11px; color: var(--text-muted); min-width: 100px;">Friday Min Staff:</label>
                                            <input type="number" min="1" max="10" value="${fridayMinStaff}" 
                                                onchange="prPortal.updateStationFridayMin('${safeId}', this.value)"
                                                style="width: 60px; padding: 3px 6px; border: 2px solid var(--border); border-radius: 6px; font-size: 11px; font-weight: 600;">
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="list-item-actions">
                            <button class="btn btn-danger btn-sm" onclick="prPortal.deleteStation('front','${safeId}')">🗑️ Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
        };

        container.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.08)); padding: 18px 20px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
                <div>
                    <div style="font-weight: 700; font-size: 16px; color: var(--primary);">Doctor Specialty Sync</div>
                    <div style="font-size: 13px; color: var(--text-muted); margin-top: 6px;">Tracking ${this.state.specialtyTotal} specialty station${this.state.specialtyTotal === 1 ? '' : 's'}. ${specialtySummary}</div>
                </div>
                <button class="btn btn-secondary" onclick="prPortal.syncDoctorSpecialties()">🔄 Sync with Doctor Portal</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 28px;">
                <div>
                    <h4 style="margin-bottom: 16px; color: var(--primary); font-size: 18px; font-weight: 700;">Clinical Stations</h4>
                    <div id="clinicalStationsList">${renderClinicalList()}</div>
                    <button class="btn btn-secondary btn-sm" style="margin-top: 12px;" onclick="prPortal.addStation('clinical')">
                        ➕ Add Clinical Station
                    </button>
                </div>
                <div>
                    <h4 style="margin-bottom: 16px; color: var(--secondary); font-size: 18px; font-weight: 700;">Front Stations</h4>
                    <div id="frontStationsList">${renderFrontList()}</div>
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

    async addStation(type) {
        const name = prompt(`Enter ${type} station name:`);
        if (!name) return;
        if (!this.state.stations[type]) this.state.stations[type] = [];
        const existing = this.state.stations[type].find(s => (s.name || '').toLowerCase() === name.toLowerCase());
        if (existing) {
            this.showNotification('Station already exists', 'danger');
            return;
        }
        const station = {
            id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name,
            type,
            color: type === 'clinical' ? '#10b981' : '#0ea5e9',
            source: 'custom',
            auto_generated: false
        };
        if (type === 'clinical') station.allow_ai_assignment = true;
        this.state.stations[type].push(station);
        await this.persistStations(`${type === 'clinical' ? 'Clinical' : 'Front'} station added`);
    }

    async deleteStation(type, stationId) {
        if (!stationId) return;
        const stations = this.state.stations[type] || [];
        const station = stations.find(s => s.id === stationId);
        if (!station) return;
        if (station.auto_generated) {
            this.showNotification('Auto-imported specialties cannot be deleted. Disable AI assignment instead.', 'danger');
            return;
        }
        if (confirm('Delete this station?')) {
            this.state.stations[type] = stations.filter(s => s.id !== stationId);
            await this.persistStations('Station deleted');
        }
    }

    async saveStations() {
        await this.persistStations('Stations saved successfully');
    }

    async persistStations(successMessage = 'Stations updated') {
        try {
            const res = await fetch('/api/pr/stations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stations: this.state.stations })
            });
            const data = await res.json();
            if (!res.ok || data.ok === false) {
                throw new Error(data.error || 'Failed to save stations');
            }
            this.state.stations = data.stations || this.state.stations;
            this.state.specialties = data.doctor_specialties || this.state.specialties;
            this.state.specialtyTotal = (data.doctor_specialties || []).length;
            this.state.specialtyLastAdded = data.auto_specialties_added || 0;
            this.renderStationsManagement();
            this.renderCustomNames();
            this.updateAIGeneratorInsights();
            if (successMessage) this.showNotification(successMessage, 'success');
        } catch (error) {
            console.error('Error saving stations:', error);
            this.showNotification('Error saving stations', 'danger');
        }
    }

    async toggleStationAssignment(type, stationId, allowed) {
        if (type !== 'clinical') return;
        const stations = this.state.stations[type] || [];
        const station = stations.find(s => s.id === stationId);
        if (!station) return;
        station.allow_ai_assignment = allowed;
        await this.persistStations(allowed ? 'AI assignment enabled for station' : 'Station excluded from AI roster');
    }

    async syncDoctorSpecialties() {
        try {
            const res = await fetch('/api/pr/stations/sync', { method: 'POST' });
            const data = await res.json();
            if (!res.ok || data.ok === false) {
                throw new Error(data.error || 'Failed to sync specialties');
            }
            this.state.stations = data.stations || this.state.stations;
            this.state.specialties = data.doctor_specialties || this.state.specialties;
            this.state.specialtyTotal = (data.doctor_specialties || []).length;
            this.state.specialtyLastAdded = data.added || 0;
            this.renderStationsManagement();
            this.renderCustomNames();
            this.updateAIGeneratorInsights();
            const added = data.added || 0;
            this.showNotification(added ? `Synced ${added} new specialty station${added === 1 ? '' : 's'}` : 'Specialty list already up to date', 'success');
        } catch (error) {
            console.error('Error syncing specialties:', error);
            this.showNotification('Error syncing specialties', 'danger');
        }
    }

    async saveAIRules() {
        const aiRules = {
            minWeeklyOffs: parseInt(document.getElementById('minWeeklyOffs')?.value || 2),
            maxConsecutiveDays: parseInt(document.getElementById('maxConsecutiveDays')?.value || 6),
            allowEDAssignment: document.getElementById('allowEDAssignment')?.checked || false,
            maxEDPerWeek: parseInt(document.getElementById('maxEDPerWeek')?.value || 1),
            noRepeatedED: document.getElementById('noRepeatedED')?.checked || false,
            noEDAfterOff: document.getElementById('noEDAfterOff')?.checked || false,
            noEDOnFriday: document.getElementById('noEDOnFriday')?.checked || false,
            staffStartOffset: parseInt(document.getElementById('staffStartOffset')?.value || 30),
            minBreakHours: parseInt(document.getElementById('minBreakHours')?.value || 12),
            enableOnCallAdjust: document.getElementById('enableOnCallAdjust')?.checked || false,
            balanceWorkload: document.getElementById('balanceWorkload')?.checked || false,
            respectPreferences: document.getElementById('respectPreferences')?.checked || false
        };

        try {
            const res = await fetch('/api/pr/ai-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiRules)
            });

            if (res.ok) {
                this.state.aiRules = aiRules;
                this.showNotification('AI rules configuration saved successfully', 'success');
            } else {
                this.showNotification('Error saving AI rules', 'danger');
            }
        } catch (error) {
            console.error('Error saving AI rules:', error);
            this.showNotification('Error saving AI rules', 'danger');
        }
    }

    async loadAIRules() {
        try {
            const res = await fetch('/api/pr/ai-rules');
            if (res.ok) {
                const rules = await res.json();
                this.state.aiRules = rules;

                // Populate form fields
                if (document.getElementById('minWeeklyOffs')) document.getElementById('minWeeklyOffs').value = rules.minWeeklyOffs || 2;
                if (document.getElementById('maxConsecutiveDays')) document.getElementById('maxConsecutiveDays').value = rules.maxConsecutiveDays || 6;
                if (document.getElementById('allowEDAssignment')) document.getElementById('allowEDAssignment').checked = rules.allowEDAssignment !== false;
                if (document.getElementById('maxEDPerWeek')) document.getElementById('maxEDPerWeek').value = rules.maxEDPerWeek || 1;
                if (document.getElementById('noRepeatedED')) document.getElementById('noRepeatedED').checked = rules.noRepeatedED !== false;
                if (document.getElementById('noEDAfterOff')) document.getElementById('noEDAfterOff').checked = rules.noEDAfterOff !== false;
                if (document.getElementById('noEDOnFriday')) document.getElementById('noEDOnFriday').checked = rules.noEDOnFriday || false;
                if (document.getElementById('staffStartOffset')) document.getElementById('staffStartOffset').value = rules.staffStartOffset || 30;
                if (document.getElementById('minBreakHours')) document.getElementById('minBreakHours').value = rules.minBreakHours || 12;
                if (document.getElementById('enableOnCallAdjust')) document.getElementById('enableOnCallAdjust').checked = rules.enableOnCallAdjust !== false;
                if (document.getElementById('balanceWorkload')) document.getElementById('balanceWorkload').checked = rules.balanceWorkload !== false;
                if (document.getElementById('respectPreferences')) document.getElementById('respectPreferences').checked = rules.respectPreferences !== false;
            }
        } catch (error) {
            console.error('Error loading AI rules:', error);
        }
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
    openLegendDrawer() {
        const leaveTypes = this.leaveTypesData || [
            {code: 'PML', name: 'Paternity/Maternity Leave', color: '#FFB6C1'},
            {code: 'AL', name: 'Annual Leave', color: '#90EE90'},
            {code: 'FRL', name: 'Family Leave', color: '#FFA07A'},
            {code: 'EXC', name: 'Exam Leave', color: '#FF8C00'},
            {code: 'HI', name: 'Home Isolation', color: '#FF0000'},
            {code: 'OR', name: 'Official Release', color: '#9ACD32'},
            {code: 'SWP', name: 'Swap Request', color: '#4169E1'},
            {code: 'SWPL', name: 'Leave After A Swap', color: '#1E90FF'},
            {code: 'NP', name: 'No Pay', color: '#DDA0DD'},
            {code: 'CL', name: 'Circumcision Leave', color: '#7FFF00'},
            {code: 'AB', name: 'Absent', color: '#DC143C'},
            {code: 'SL', name: 'Sick Leave', color: '#FFD700'},
            {code: 'ML', name: 'Medical Leave', color: '#8B4513'},
            {code: 'OC', name: 'On Call', color: '#DA70D6'},
            {code: 'AC', name: 'Absent On-Call', color: '#00BFFF'}
        ];
        
        const drawerHtml = `
            <div id="legendDrawer" class="legend-drawer active">
                <div class="legend-drawer-overlay" onclick="prPortal.closeLegendDrawer()"></div>
                <div class="legend-drawer-content">
                    <div class="legend-drawer-header">
                        <h2>📋 Leave Types Legend</h2>
                        <button class="drawer-close-btn" onclick="prPortal.closeLegendDrawer()">×</button>
                    </div>
                    <div class="legend-drawer-body">
                        <div style="display: grid; gap: 10px;">
                            ${leaveTypes.map(lt => `
                                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--card-bg); border-radius: 6px; border-left: 4px solid ${lt.color};">
                                    <div style="width: 35px; height: 35px; border-radius: 6px; background: ${lt.color}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">${lt.code}</div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 13px; font-weight: 700; color: var(--text);">${lt.name}</div>
                                    </div>
                                </div>
                            `).join('')}
                            
                            <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid var(--border);">
                                <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: var(--secondary);">Assignment Types</h3>
                                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--card-bg); border-radius: 6px; border-left: 4px solid var(--primary);">
                                    <div style="width: 35px; height: 35px; border-radius: 6px; background: var(--primary); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 12px;">ST</div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 13px; font-weight: 700; color: var(--text);">Station Assignment</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(147, 51, 234, 0.05); border-radius: 6px; border-left: 4px solid #9333ea; margin-top: 8px;">
                                    <div style="width: 35px; height: 35px; border-radius: 6px; background: #9333ea; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px;">🆓</div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 13px; font-weight: 700; color: #9333ea;">Freed Clinical</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing drawer if any
        const existing = document.getElementById('legendDrawer');
        if (existing) existing.remove();
        
        // Add drawer to body
        document.body.insertAdjacentHTML('beforeend', drawerHtml);
    }
    
    closeLegendDrawer() {
        const drawer = document.getElementById('legendDrawer');
        if (drawer) {
            drawer.classList.remove('active');
            setTimeout(() => drawer.remove(), 300);
        }
    }
    
    toggleLegendSidebar() {
        const legendEl = document.getElementById('schedule-legend');
        const arrow = legendEl.querySelector('.legend-arrow');
        
        if (legendEl.classList.contains('collapsed')) {
            legendEl.classList.remove('collapsed');
            arrow.innerHTML = '◀';
        } else {
            legendEl.classList.add('collapsed');
            arrow.innerHTML = '▶';
        }
    }
    
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
    async loadDoctorScheduleForDate() {
        const dateInput = document.getElementById('aiDoctorViewDate') || document.getElementById('doctorViewDate');
        const listContainer = document.getElementById('doctorScheduleList');
        if (!listContainer) return;
        
        // ALWAYS get today's date FRESH - Maldives time (UTC+5)
        const today = getMaldivesToday();
        
        // FORCE set to today if empty or page just loaded
        if (dateInput && !dateInput.value) {
            dateInput.value = today;
        }
        
        // Get selected date - MUST read from input AFTER setting
        const selectedDate = dateInput ? dateInput.value : today;
        
        console.log('🔍 Loading doctors for date:', selectedDate); // Debug log
        
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">🔄 Loading doctors for ' + selectedDate + '...</p>';
        
        try {
            // Use /api/doctors with FRESH date and cache busting
            const timestamp = Date.now();
            const res = await fetch(`/api/doctors?date=${encodeURIComponent(selectedDate)}&_t=${timestamp}`, { 
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            const data = await res.json();
            
            console.log('📊 Received doctors data:', data.doctors?.length || 0, 'doctors'); // Debug log
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch doctor schedule');
            }
            
            // Filter doctors who are on duty for the selected date
            const doctors = data.doctors || [];
            const onDutyDoctors = doctors.filter(doc => {
                const status = (doc.status || '').toLowerCase();
                return status === 'on_duty' || status === 'duty' || status === 'on duty';
            });
            
            if (onDutyDoctors.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">❌ No doctors on duty for ' + selectedDate + '</p>';
                return;
            }
            
            // If more than 5 doctors, show expand button
            const showExpandButton = onDutyDoctors.length > 5;
            const displayLimit = showExpandButton ? 3 : onDutyDoctors.length;
            
            let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
            
            onDutyDoctors.slice(0, displayLimit).forEach(doc => {
                const doctorName = doc.name || 'Unknown';
                const specialty = doc.specialty || 'General';
                const startTime = doc.start_time || '';
                const shift = startTime ? (parseInt(startTime.split(':')[0]) < 13 ? 'Morning' : 'Evening') : 'Day';
                const status = (doc.status || 'duty').toLowerCase();
                
                const statusColors = {
                    'duty': '#10b981',
                    'on_duty': '#10b981',
                    'on duty': '#10b981',
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
                                <span style="background: var(--bg); padding: 2px 8px; border-radius: 4px;">${shift}${startTime ? ` (${startTime})` : ''}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                                ON DUTY
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            
            // Add expand button if truncated
            if (showExpandButton) {
                const remainingCount = onDutyDoctors.length - displayLimit;
                html += `
                    <button onclick="prPortal.expandDoctorsList(${JSON.stringify(onDutyDoctors).replace(/"/g, '&quot;')}, '${selectedDate}')" 
                            style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; width: 100%; transition: all 0.3s; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                        🔍 Expand to see all ${onDutyDoctors.length} doctors (+${remainingCount} more)
                    </button>
                `;
            }
            
            // Add summary at the top
            const dutyCount = onDutyDoctors.length;
            const specialties = [...new Set(onDutyDoctors.map(d => d.specialty).filter(Boolean))].join(', ');
            
            const summaryHtml = `
                    <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                        <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">📊 Summary for ${selectedDate}</div>
                        <div style="font-size: 13px; opacity: 0.95;">${dutyCount} doctor(s) on duty</div>
                        <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">Specialties: ${specialties || 'None'}</div>
                    </div>
                `;
            
            listContainer.innerHTML = summaryHtml + html;
            
        } catch (error) {
            console.error('Error loading doctor schedule:', error);
            listContainer.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 20px; font-size: 13px;">Error loading schedule. Please try again.</p>';
        }
    }

    expandDoctorsList(doctors, selectedDate) {
        // Redirect to comprehensive doctor search modal
        this.showComprehensiveDoctorSearch(selectedDate);
    }
    
    showComprehensiveDoctorSearch(initialDate = null) {
        const today = getMaldivesToday();
        const searchDate = initialDate || today;
        
        const modal = document.createElement('div');
        modal.id = 'comprehensiveDoctorModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(10px);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000; animation: fadeIn 0.3s ease;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: var(--panel); border-radius: 24px; width: 92%; max-width: 1400px;
            max-height: 92vh; overflow: hidden; box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
            display: flex; flex-direction: column;
        `;
        
        modalContent.innerHTML = `
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 28px 36px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="color: white; margin: 0 0 10px 0; font-size: 32px; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">🔍 Doctor Search Engine</h2>
                    <p style="color: rgba(255,255,255,0.95); margin: 0; font-size: 15px; font-weight: 500;">Comprehensive doctor schedule viewer with advanced filtering</p>
                </div>
                <button onclick="document.getElementById('comprehensiveDoctorModal').remove()" 
                        style="background: rgba(255,255,255,0.25); border: 2px solid rgba(255,255,255,0.3); color: white; font-size: 32px; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; transition: all 0.3s; font-weight: 300;" 
                        onmouseover="this.style.background='rgba(255,255,255,0.35)'" 
                        onmouseout="this.style.background='rgba(255,255,255,0.25)'">
                    ×
                </button>
            </div>
            
            <div style="padding: 24px 36px; background: linear-gradient(180deg, var(--bg) 0%, var(--panel) 100%); border-bottom: 3px solid var(--border);">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr auto; gap: 18px; align-items: end;">
                    <div>
                        <label style="display: block; font-weight: 800; margin-bottom: 10px; color: var(--text); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">📅 Date</label>
                        <input type="date" id="compDoctorSearchDate" value="${searchDate}" 
                               style="width: 100%; padding: 14px; border: 2px solid var(--border); border-radius: 10px; font-size: 14px; background: white; font-weight: 600; transition: all 0.3s;" 
                               onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(99, 102, 241, 0.1)'" 
                               onblur="this.style.borderColor='var(--border)'; this.style.boxShadow='none'" />
                    </div>
                    <div>
                        <label style="display: block; font-weight: 800; margin-bottom: 10px; color: var(--text); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">🏥 Specialty</label>
                        <select id="compDoctorSearchSpecialty" 
                                style="width: 100%; padding: 14px; border: 2px solid var(--border); border-radius: 10px; font-size: 14px; background: white; font-weight: 600; cursor: pointer; transition: all 0.3s;" 
                                onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(99, 102, 241, 0.1)'" 
                                onblur="this.style.borderColor='var(--border)'; this.style.boxShadow='none'">
                            <option value="all">All Specialties</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-weight: 800; margin-bottom: 10px; color: var(--text); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">🔎 Search Doctor</label>
                        <input type="text" id="compDoctorSearchName" placeholder="Type doctor name..." 
                               style="width: 100%; padding: 14px 16px 14px 40px; border: 2px solid var(--border); border-radius: 10px; font-size: 14px; background: white url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"%236b7280\" viewBox=\"0 0 16 16\"><path d=\"M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z\"/></svg>') no-repeat 14px center; font-weight: 500; transition: all 0.3s;" 
                               onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(99, 102, 241, 0.1)'" 
                               onblur="this.style.borderColor='var(--border)'; this.style.boxShadow='none'" />
                    </div>
                    <button onclick="prPortal.performComprehensiveSearch()" 
                            style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 14px 32px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 14px; transition: all 0.3s; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35); text-transform: uppercase; letter-spacing: 0.5px;" 
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(99, 102, 241, 0.45)'" 
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(99, 102, 241, 0.35)'">
                        🔍 Search
                    </button>
                </div>
            </div>
            
            <div id="compDoctorSearchResults" style="flex: 1; overflow-y: auto; padding: 28px 36px; background: var(--bg);">
                <p style="text-align: center; color: var(--text-muted); padding: 60px; font-size: 15px;">🔄 Loading doctors...</p>
            </div>
            
            <div style="padding: 20px 36px; border-top: 3px solid var(--border); background: var(--panel); display: flex; justify-content: space-between; align-items: center;">
                <div id="compDoctorSearchStats" style="font-size: 14px; color: var(--text); font-weight: 700;"></div>
                <div style="display: flex; gap: 12px;">
                    <button onclick="prPortal.exportDoctorResults()" 
                            style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; transition: all 0.3s;">
                        📥 Export Results
                    </button>
                    <button onclick="document.getElementById('comprehensiveDoctorModal').remove()" 
                            style="background: var(--text-muted); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; transition: all 0.3s;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('compDoctorSearchDate').addEventListener('change', () => this.performComprehensiveSearch());
        document.getElementById('compDoctorSearchSpecialty').addEventListener('change', () => this.performComprehensiveSearch());
        document.getElementById('compDoctorSearchName').addEventListener('input', () => this.performComprehensiveSearch());
        
        // Close on backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Initial search
        this.performComprehensiveSearch();
    }
    
    async performComprehensiveSearch() {
        const dateInput = document.getElementById('compDoctorSearchDate');
        const specialtySelect = document.getElementById('compDoctorSearchSpecialty');
        const nameInput = document.getElementById('compDoctorSearchName');
        const resultsContainer = document.getElementById('compDoctorSearchResults');
        const statsContainer = document.getElementById('compDoctorSearchStats');
        
        if (!dateInput || !resultsContainer) return;
        
        const selectedDate = dateInput.value;
        const selectedSpecialty = specialtySelect ? specialtySelect.value : 'all';
        const searchName = nameInput ? nameInput.value.toLowerCase().trim() : '';
        
        resultsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 60px; font-size: 15px;">🔄 Searching...</p>';
        
        try {
            const timestamp = Date.now();
            const res = await fetch(`/api/doctors?date=${encodeURIComponent(selectedDate)}&_t=${timestamp}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to fetch');
            
            let doctors = data.doctors || [];
            
            // Populate specialty dropdown
            if (specialtySelect && specialtySelect.options.length === 1) {
                const specialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))].sort();
                specialties.forEach(spec => {
                    const option = document.createElement('option');
                    option.value = spec;
                    option.textContent = spec;
                    specialtySelect.appendChild(option);
                });
            }
            
            // Filter on duty
            doctors = doctors.filter(doc => {
                const status = (doc.status || '').toLowerCase();
                return status === 'on_duty' || status === 'duty' || status === 'on duty';
            });
            
            // Filter by specialty
            if (selectedSpecialty && selectedSpecialty !== 'all') {
                doctors = doctors.filter(doc => doc.specialty === selectedSpecialty);
            }
            
            // Filter by name
            if (searchName) {
                doctors = doctors.filter(doc => (doc.name || '').toLowerCase().includes(searchName));
            }
            
            // Store for export
            this.currentDoctorResults = doctors;
            
            // Update stats
            if (statsContainer) {
                const specialtyCount = new Set(doctors.map(d => d.specialty)).size;
                statsContainer.innerHTML = `📊 <strong>${doctors.length}</strong> doctor(s) • <strong>${specialtyCount}</strong> specialt${specialtyCount === 1 ? 'y' : 'ies'}`;
            }
            
            if (doctors.length === 0) {
                resultsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 60px; font-size: 15px;">❌ No doctors found matching criteria</p>';
                return;
            }
            
            // Group by specialty
            const bySpecialty = {};
            doctors.forEach(doc => {
                const spec = doc.specialty || 'General';
                if (!bySpecialty[spec]) bySpecialty[spec] = [];
                bySpecialty[spec].push(doc);
            });
            
            let html = '';
            
            Object.keys(bySpecialty).sort().forEach(specialty => {
                const specDoctors = bySpecialty[specialty];
                html += `
                    <div style="margin-bottom: 28px;">
                        <div style="background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; padding: 14px 20px; border-radius: 12px; font-weight: 800; font-size: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                            <span>🏥 ${specialty}</span>
                            <span style="background: rgba(255,255,255,0.25); padding: 6px 14px; border-radius: 999px; font-size: 13px;">${specDoctors.length} doctor${specDoctors.length === 1 ? '' : 's'}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px;">
                `;
                
                specDoctors.forEach(doc => {
                    const startTime = doc.start_time || 'TBD';
                    const endTime = doc.end_time || 'TBD';
                    const shift = startTime !== 'TBD' ? (parseInt(startTime.split(':')[0]) < 13 ? '☀️ Morning' : '🌙 Evening') : '📅 Day';
                    const opd = Array.isArray(doc.opd) ? doc.opd.join(', ') : (doc.opd || 'N/A');
                    const room = doc.room || 'N/A';
                    
                    html += `
                        <div style="background: white; border: 2px solid var(--border); border-radius: 14px; padding: 20px; transition: all 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer;" 
                             onmouseover="this.style.borderColor='#6366f1'; this.style.boxShadow='0 10px 30px rgba(99, 102, 241, 0.2)'; this.style.transform='translateY(-2px)';" 
                             onmouseout="this.style.borderColor='var(--border)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'; this.style.transform='translateY(0)';">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 14px;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 900; font-size: 18px; color: var(--text); margin-bottom: 6px;">👨‍⚕️ ${doc.name}</div>
                                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 600;">${shift}</div>
                                </div>
                                <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 8px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">ON DUTY</div>
                            </div>
                            <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px 14px; font-size: 14px; padding-top: 14px; border-top: 2px solid var(--border);">
                                <div style="color: var(--text-muted); font-weight: 700;">⏰ Time:</div>
                                <div style="color: var(--text); font-weight: 700;">${startTime}${endTime !== 'TBD' ? ' - ' + endTime : ''}</div>
                                <div style="color: var(--text-muted); font-weight: 700;">🏥 OPD:</div>
                                <div style="color: var(--text); font-weight: 600;">${opd}</div>
                                <div style="color: var(--text-muted); font-weight: 700;">🚪 Room:</div>
                                <div style="color: var(--text); font-weight: 600;">${room}</div>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            });
            
            resultsContainer.innerHTML = html;
            
        } catch (err) {
            console.error('Error:', err);
            resultsContainer.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 60px; font-size: 15px;">❌ Error loading doctors</p>';
            if (statsContainer) {
                statsContainer.textContent = 'Error';
            }
        }
    }
    
    exportDoctorResults() {
        if (!this.currentDoctorResults || this.currentDoctorResults.length === 0) {
            alert('No results to export');
            return;
        }
        
        const csvContent = 'data:text/csv;charset=utf-8,' +
            'Name,Specialty,Start Time,End Time,OPD,Room,Status\\n' +
            this.currentDoctorResults.map(d => 
                `"${d.name}","${d.specialty || ''}","${d.start_time || ''}","${d.end_time || ''}","${Array.isArray(d.opd) ? d.opd.join('; ') : (d.opd || '')}","${d.room || ''}","${d.status || ''}"`
            ).join('\\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `doctors_${getMaldivesToday()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    renderExpandedDoctors(doctors) {
        const container = document.getElementById('expandedDoctorsList');
        if (!container) return;
        
        if (doctors.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 40px; font-size: 14px;">No doctors match your search</p>';
            return;
        }
        
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px;">';
        
        doctors.forEach(doc => {
            const doctorName = doc.name || 'Unknown';
            const specialty = doc.specialty || 'General';
            const startTime = doc.start_time || '';
            const endTime = doc.end_time || '';
            const room = doc.room || '';
            const patientCount = doc.patient_count || '';
            const shift = startTime ? (parseInt(startTime.split(':')[0]) < 13 ? 'Morning' : 'Evening') : 'Day';
            
            html += `
                <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 16px; transition: all 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.05);" onmouseover="this.style.boxShadow='0 8px 24px rgba(99,102,241,0.2)'; this.style.borderColor='#6366f1';" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'; this.style.borderColor='#e5e7eb';">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #1f2937;">👨‍⚕️ ${doctorName}</h3>
                            <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;">${specialty}</div>
                        </div>
                        <div style="background: #10b981; color: white; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase;">ON DUTY</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                        ${startTime ? `<div style="font-size: 13px; color: #6b7280;"><strong style="color: #374151;">⏰ Time:</strong> ${startTime}${endTime ? ' - ' + endTime : ''} <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; margin-left: 6px; font-size: 11px;">${shift}</span></div>` : ''}
                        ${room ? `<div style="font-size: 13px; color: #6b7280;"><strong style="color: #374151;">🏥 Room:</strong> ${room}</div>` : ''}
                        ${patientCount ? `<div style="font-size: 13px; color: #6b7280;"><strong style="color: #374151;">👥 Patients:</strong> ${patientCount}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    filterDoctorsInModal() {
        const modal = document.getElementById('expandedDoctorsModal');
        if (!modal || !modal.doctorsData) return;
        
        const searchInput = document.getElementById('doctorSearchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        const filtered = modal.doctorsData.filter(doc => {
            const name = (doc.name || '').toLowerCase();
            const specialty = (doc.specialty || '').toLowerCase();
            return name.includes(searchTerm) || specialty.includes(searchTerm);
        });
        
        this.renderExpandedDoctors(filtered);
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
        const generateButton = document.getElementById('aiGenerateButton');
        const originalLabel = generateButton ? generateButton.innerHTML : '';
        if (generateButton) {
            generateButton.disabled = true;
            generateButton.innerHTML = '⏳ Generating...';
        }

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
                
                // Build detailed success message
                const stats = data.stats || {};
                const info = data.info || {};
                let message = `✅ Roster generated successfully!\n\n`;
                message += `📅 ${stats.total_days} days (${data.info.date_range})\n`;
                message += `👥 Clinical: ${stats.clinical_assigned} assignments\n`;
                message += `🎯 Front Desk: ${stats.front_assigned} assignments\n`;
                
                if (stats.days_with_doctors > 0) {
                    message += `\n🏥 ${stats.days_with_doctors} days matched to doctor schedules`;
                }
                if (stats.days_without_doctors > 0) {
                    message += `\n📋 ${stats.days_without_doctors} days auto-filled (no doctors)`;
                }
                
                this.showNotification(message, 'success');
            } else {
                this.showNotification(`❌ Error: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error generating roster:', error);
            this.showNotification('❌ Error generating roster. Check console for details.', 'danger');
        } finally {
            if (generateButton) {
                generateButton.disabled = false;
                generateButton.innerHTML = originalLabel || '🤖 Generate Roster';
            }
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

    // ===== GOPD CATEGORIZATION SYSTEM =====
    gopdCategories = {}; // {Morning: [{name, start, end, min_staff}], Evening: [...], Night: [...]}
    activeGopdCategory = null;

    async loadGopdConfig() {
        try {
            const response = await fetch('/api/pr/gopd-config');
            const data = await response.json();
            
            if (data.ok) {
                const config = data.gopd_config || {};
                // Handle both old format {shifts: [...]} and new format {categories: {...}}
                if (config.categories) {
                    this.gopdCategories = config.categories;
                } else if (config.shifts) {
                    // Migrate old format: put all shifts in "Default" category
                    this.gopdCategories = { 'Default': config.shifts };
                } else {
                    // Initialize with default categories
                    this.gopdCategories = {
                        'Morning Shifts': [],
                        'Evening Shifts': [],
                        'Night Shifts': []
                    };
                }
                
                // Set active category to first one
                const categories = Object.keys(this.gopdCategories);
                this.activeGopdCategory = categories.length > 0 ? categories[0] : null;
                
                // Update UI
                document.getElementById('gopdStaffCount').value = config.staff_count || 2;
                this.renderGopdCategoryTabs();
                this.renderGopdCategoryContent();
            }
        } catch (error) {
            console.error('Error loading GOPD config:', error);
            this.showToast('Failed to load GOPD configuration', 'error');
        }
    }

    renderGopdCategoryTabs() {
        const tabsContainer = document.getElementById('gopdCategoryTabs');
        if (!tabsContainer) return;

        const categories = Object.keys(this.gopdCategories);
        if (categories.length === 0) {
            tabsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">No categories yet. Click "Add Category" to create one.</p>';
            return;
        }

        tabsContainer.innerHTML = categories.map(cat => `
            <button class="mini-tab ${cat === this.activeGopdCategory ? 'active' : ''}" 
                    onclick="prPortal.switchGopdCategory('${cat.replace(/'/g, "\\'")}')">
                ${cat}
            </button>
        `).join('');
    }

    switchGopdCategory(category) {
        this.activeGopdCategory = category;
        this.renderGopdCategoryTabs();
        this.renderGopdCategoryContent();
    }

    renderGopdCategoryContent() {
        const listContainer = document.getElementById('gopdShiftsList');
        if (!listContainer || !this.activeGopdCategory) return;

        const shifts = this.gopdCategories[this.activeGopdCategory] || [];
        
        if (shifts.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 32px; color: var(--text-muted);">
                    <p style="font-size: 14px; margin-bottom: 8px;">📋 No shifts in this category yet</p>
                    <p style="font-size: 12px;">Click "Add Shift to Category" below to add shifts</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = shifts.map((shift, idx) => `
            <div class="shift-card" style="margin-bottom: 12px; padding: 14px; background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <input type="text" value="${shift.name || ''}" 
                               onchange="prPortal.updateGopdShift(${idx}, 'name', this.value)"
                               placeholder="Shift Name"
                               style="font-weight: 600; font-size: 14px; margin-bottom: 8px; width: 100%; padding: 6px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg);">
                        <div style="display: flex; gap: 12px; align-items: center; margin-top: 8px;">
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 12px; color: var(--text-muted);">Start:</span>
                                <input type="time" value="${shift.start || ''}" 
                                       onchange="prPortal.updateGopdShift(${idx}, 'start', this.value)"
                                       style="padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); font-size: 12px;">
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 12px; color: var(--text-muted);">End:</span>
                                <input type="time" value="${shift.end || ''}" 
                                       onchange="prPortal.updateGopdShift(${idx}, 'end', this.value)"
                                       style="padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); font-size: 12px;">
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 12px; color: var(--text-muted);">Min Staff:</span>
                                <input type="number" value="${shift.min_staff || 1}" min="1" max="10"
                                       onchange="prPortal.updateGopdShift(${idx}, 'min_staff', parseInt(this.value))"
                                       style="width: 60px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); font-size: 12px;">
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-left: 12px;">
                        <button class="btn btn-sm btn-secondary" onclick="prPortal.moveGopdShiftToCategory(${idx})" title="Move to another category">
                            ↔️
                        </button>
                        <button class="btn btn-sm" style="background: #ef4444; color: white;" onclick="prPortal.deleteGopdShift(${idx})" title="Delete shift">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    addGopdCategory() {
        const name = prompt('Enter category name (e.g., "Morning Shifts", "Evening Shifts", "Night Shifts"):');
        if (!name || !name.trim()) return;

        const trimmedName = name.trim();
        if (this.gopdCategories[trimmedName]) {
            this.showToast('Category already exists', 'error');
            return;
        }

        this.gopdCategories[trimmedName] = [];
        this.activeGopdCategory = trimmedName;
        this.renderGopdCategoryTabs();
        this.renderGopdCategoryContent();
        this.showToast(`Category "${trimmedName}" added`, 'success');
    }

    addGopdShiftToCategory() {
        if (!this.activeGopdCategory) {
            this.showToast('Please select or create a category first', 'error');
            return;
        }

        const newShift = {
            name: 'New Shift',
            start: '08:00',
            end: '14:00',
            min_staff: 2
        };

        this.gopdCategories[this.activeGopdCategory].push(newShift);
        this.renderGopdCategoryContent();
        this.showToast('Shift added to category', 'success');
    }

    updateGopdShift(index, field, value) {
        if (!this.activeGopdCategory) return;
        
        const shifts = this.gopdCategories[this.activeGopdCategory];
        if (shifts[index]) {
            shifts[index][field] = value;
        }
    }

    deleteGopdShift(index) {
        if (!this.activeGopdCategory) return;
        
        if (!confirm('Are you sure you want to delete this shift?')) return;

        this.gopdCategories[this.activeGopdCategory].splice(index, 1);
        this.renderGopdCategoryContent();
        this.showToast('Shift deleted', 'success');
    }

    moveGopdShiftToCategory(index) {
        if (!this.activeGopdCategory) return;

        const categories = Object.keys(this.gopdCategories).filter(c => c !== this.activeGopdCategory);
        if (categories.length === 0) {
            this.showToast('No other categories available. Create another category first.', 'error');
            return;
        }

        const targetCategory = prompt(`Move shift to which category?\nAvailable: ${categories.join(', ')}\n\nEnter category name:`);
        if (!targetCategory || !targetCategory.trim()) return;

        const trimmedTarget = targetCategory.trim();
        if (!this.gopdCategories[trimmedTarget]) {
            this.showToast('Category not found', 'error');
            return;
        }

        const shift = this.gopdCategories[this.activeGopdCategory][index];
        this.gopdCategories[trimmedTarget].push(shift);
        this.gopdCategories[this.activeGopdCategory].splice(index, 1);
        this.renderGopdCategoryContent();
        this.showToast(`Shift moved to "${trimmedTarget}"`, 'success');
    }

    async saveGopdConfig() {
        const staffCount = parseInt(document.getElementById('gopdStaffCount').value) || 2;

        const config = {
            staff_count: staffCount,
            categories: this.gopdCategories
        };

        try {
            const response = await fetch('/api/pr/gopd-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const data = await response.json();
            if (data.ok) {
                this.showToast('GOPD configuration saved successfully', 'success');
            } else {
                throw new Error(data.message || 'Save failed');
            }
        } catch (error) {
            console.error('Error saving GOPD config:', error);
            this.showToast('Failed to save GOPD configuration', 'error');
        }
    }

    // ===== STAFF SHIFT TEMPLATES CATEGORIZATION SYSTEM =====
    staffShiftCategories = { clinical: {}, front: {} }; // {clinical: {Morning: [...]}, front: {...}}
    activeStaffTeam = 'clinical';
    activeStaffCategory = null;

    async loadPrShiftTemplates() {
        try {
            const response = await fetch('/api/shift-templates');
            const data = await response.json();
            
            if (data.ok) {
                // Handle both old format {clinical: [...], front: [...]} and new format {clinical: {...}, front: {...}}
                for (const team of ['clinical', 'front']) {
                    if (data.templates[team]) {
                        if (Array.isArray(data.templates[team])) {
                            // Migrate old format: put all shifts in "Default" category
                            this.staffShiftCategories[team] = { 'Default': data.templates[team] };
                        } else if (typeof data.templates[team] === 'object') {
                            // New format with categories
                            this.staffShiftCategories[team] = data.templates[team];
                        }
                    } else {
                        // Initialize with default categories
                        this.staffShiftCategories[team] = {
                            'Morning Shifts': [],
                            'Evening Shifts': [],
                            'Night Shifts': []
                        };
                    }
                }
                
                // Set active category to first one for current team
                const categories = Object.keys(this.staffShiftCategories[this.activeStaffTeam]);
                this.activeStaffCategory = categories.length > 0 ? categories[0] : null;
                
                this.renderStaffCategoryTabs();
                this.renderStaffCategoryContent();
            }
        } catch (error) {
            console.error('Error loading shift templates:', error);
            this.showToast('Failed to load shift templates', 'error');
        }
    }

    switchStaffTeam(team) {
        this.activeStaffTeam = team;
        
        // Update tab buttons
        document.getElementById('prShiftClinicalTab').classList.toggle('active', team === 'clinical');
        document.getElementById('prShiftFrontTab').classList.toggle('active', team === 'front');
        
        // Set active category to first one for new team
        const categories = Object.keys(this.staffShiftCategories[team]);
        this.activeStaffCategory = categories.length > 0 ? categories[0] : null;
        
        this.renderStaffCategoryTabs();
        this.renderStaffCategoryContent();
    }

    renderStaffCategoryTabs() {
        const tabsContainer = document.getElementById('staffCategoryTabs');
        if (!tabsContainer) return;

        const categories = Object.keys(this.staffShiftCategories[this.activeStaffTeam]);
        if (categories.length === 0) {
            tabsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">No categories yet. Click "Add Category" to create one.</p>';
            return;
        }

        tabsContainer.innerHTML = categories.map(cat => `
            <button class="mini-tab ${cat === this.activeStaffCategory ? 'active' : ''}" 
                    onclick="prPortal.switchStaffCategory('${cat.replace(/'/g, "\\'")}')">
                ${cat}
            </button>
        `).join('');
    }

    switchStaffCategory(category) {
        this.activeStaffCategory = category;
        this.renderStaffCategoryTabs();
        this.renderStaffCategoryContent();
    }

    renderStaffCategoryContent() {
        const listContainer = document.getElementById('prShiftList');
        if (!listContainer || !this.activeStaffCategory) return;

        const shifts = this.staffShiftCategories[this.activeStaffTeam][this.activeStaffCategory] || [];
        
        if (shifts.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 32px; color: var(--text-muted);">
                    <p style="font-size: 14px; margin-bottom: 8px;">📋 No shifts in this category yet</p>
                    <p style="font-size: 12px;">Click "Add Shift to Category" below to add shifts</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = shifts.map((shift, idx) => {
            const isFrontDesk = this.activeStaffTeam === 'front';
            const matchingDoctors = isFrontDesk ? [] : this.findMatchingDoctorsForShift(shift);
            const matchInfo = matchingDoctors.length > 0 
                ? `<div style="font-size: 11px; color: #10b981; margin-top: 4px;">🎯 AI Match: Covers ${matchingDoctors.join(', ')}</div>`
                : '';
            
            // Get front desk stations for dropdown
            const frontStations = isFrontDesk ? (this.state.stations?.front || []) : [];
            const stationOptions = frontStations.map(station => 
                `<option value="${station.id}" ${shift.station === station.id ? 'selected' : ''}>${station.name}</option>`
            ).join('');
            
            return `
            <div class="shift-card" style="margin-bottom: 12px; padding: 14px; background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <input type="text" value="${shift.name || ''}" 
                               onchange="prPortal.updateStaffShift(${idx}, 'name', this.value)"
                               placeholder="${isFrontDesk ? 'Front Desk Shift Name' : 'Clinical Shift Name'}"
                               style="font-weight: 600; font-size: 14px; margin-bottom: 8px; width: 100%; padding: 6px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg);">
                        <div style="display: flex; gap: 12px; align-items: center; margin-top: 8px; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 12px; color: var(--text-muted);">Start:</span>
                                <input type="time" value="${shift.start || ''}" 
                                       onchange="prPortal.updateStaffShift(${idx}, 'start', this.value)"
                                       style="padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); font-size: 12px;">
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 12px; color: var(--text-muted);">End:</span>
                                <input type="time" value="${shift.end || ''}" 
                                       onchange="prPortal.updateStaffShift(${idx}, 'end', this.value)"
                                       style="padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); font-size: 12px;">
                            </div>
                            ${isFrontDesk ? `
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 12px; color: var(--text-muted);">Staff Count:</span>
                                <input type="number" value="${shift.staffCount || 1}" min="0" max="10"
                                       onchange="prPortal.updateStaffShift(${idx}, 'staffCount', parseInt(this.value))"
                                       title="Number of staff required for this shift"
                                       style="width: 70px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); font-size: 12px;">
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 12px; color: var(--text-muted);">Station/Counter:</span>
                                <select onchange="prPortal.updateStaffShift(${idx}, 'station', this.value)"
                                        title="Select which station/counter this shift is for"
                                        style="padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); font-size: 12px; min-width: 150px;">
                                    <option value="">Select Station...</option>
                                    ${stationOptions}
                                </select>
                            </div>
                            ` : ''}
                        </div>
                        ${matchInfo}
                    </div>
                    <div style="display: flex; gap: 8px; margin-left: 12px;">
                        <button class="btn btn-sm btn-secondary" onclick="prPortal.openMoveCategoryModal(${idx})" title="Move to another category">
                            ↔️
                        </button>
                        <button class="btn btn-sm" style="background: #ef4444; color: white;" onclick="prPortal.deleteStaffShift(${idx})" title="Delete shift">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    findMatchingDoctorsForShift(shift) {
        // Find which doctor OPD start times this clinical shift can cover
        // Clinical should start 30-60 mins before doctor
        if (!shift.start || !this.state.doctorOpd) return [];
        
        const shiftStartMinutes = this.timeToMinutes(shift.start);
        const matching = [];
        
        Object.keys(this.state.doctorOpd).forEach(specialty => {
            const opd = this.state.doctorOpd[specialty];
            [opd.shift1, opd.shift2].forEach((doctorShift, idx) => {
                if (doctorShift && doctorShift.start) {
                    const doctorStartMinutes = this.timeToMinutes(doctorShift.start);
                    const difference = doctorStartMinutes - shiftStartMinutes;
                    // Clinical should be 30-90 mins before doctor
                    if (difference >= 30 && difference <= 90) {
                        matching.push(`${specialty} ${doctorShift.start}`);
                    }
                }
            });
        });
        
        return matching;
    }

    timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const [hours, mins] = timeStr.split(':').map(Number);
        return hours * 60 + mins;
    }

    addStaffCategory() {
        this.openManageCategoriesModal(true);
    }

    addShiftToStaffCategory() {
        if (!this.activeStaffCategory) {
            this.showToast('Please select or create a category first', 'error');
            return;
        }

        const isFrontDesk = this.activeStaffTeam === 'front';
        const newShift = isFrontDesk ? {
            name: 'Front Desk Shift',
            start: '08:00',
            end: '16:00',
            staffCount: 1
        } : {
            name: 'Clinical Shift',
            start: '07:30',
            end: '15:30'
        };

        this.staffShiftCategories[this.activeStaffTeam][this.activeStaffCategory].push(newShift);
        this.renderStaffCategoryContent();
        this.savePrShifts();
        this.showToast('Shift added to category', 'success');
    }

    updateStaffShift(index, field, value) {
        if (!this.activeStaffCategory) return;
        
        const shifts = this.staffShiftCategories[this.activeStaffTeam][this.activeStaffCategory];
        if (shifts[index]) {
            shifts[index][field] = value;
            this.savePrShifts();
        }
    }

    deleteStaffShift(index) {
        if (!this.activeStaffCategory) return;
        
        if (!confirm('Are you sure you want to delete this shift?')) return;

        this.staffShiftCategories[this.activeStaffTeam][this.activeStaffCategory].splice(index, 1);
        this.renderStaffCategoryContent();
        this.savePrShifts();
        this.showToast('Shift deleted', 'success');
    }

    openMoveCategoryModal(shiftIndex) {
        if (!this.activeStaffCategory) return;

        const categories = Object.keys(this.staffShiftCategories[this.activeStaffTeam]).filter(c => c !== this.activeStaffCategory);
        if (categories.length === 0) {
            this.showToast('No other categories available. Create another category first.', 'error');
            return;
        }

        this.pendingShiftMove = { index: shiftIndex, from: this.activeStaffCategory };

        const categoryItems = categories.map(cat => {
            const safeCat = cat.replace(/'/g, "\\'");
            return '<div class="category-item" onclick="prPortal.selectMoveCategory(\'' + safeCat + '\')"><span class="category-item-name">' + cat + '</span></div>';
        }).join('');

        const modalHtml = '<div id="moveCategoryModal" class="category-modal active">' +
            '<div class="category-modal-content">' +
            '<div class="category-modal-header">' +
            '<h3>Move Shift to Category</h3>' +
            '<button onclick="prPortal.closeCategoryModal()" style="background: none; border: none; color: var(--text); font-size: 24px; cursor: pointer;">&times;</button>' +
            '</div>' +
            '<p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">Select the destination category:</p>' +
            '<div class="category-list">' + categoryItems + '</div>' +
            '<button onclick="prPortal.closeCategoryModal()" class="btn btn-secondary" style="width: 100%; margin-top: 12px;">Cancel</button>' +
            '</div>' +
            '</div>';

        const existing = document.getElementById('moveCategoryModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    selectMoveCategory(targetCategory) {
        if (!this.pendingShiftMove) return;

        const shift = this.staffShiftCategories[this.activeStaffTeam][this.pendingShiftMove.from][this.pendingShiftMove.index];
        this.staffShiftCategories[this.activeStaffTeam][targetCategory].push(shift);
        this.staffShiftCategories[this.activeStaffTeam][this.pendingShiftMove.from].splice(this.pendingShiftMove.index, 1);
        
        this.closeCategoryModal();
        this.renderStaffCategoryContent();
        this.savePrShifts();
        this.showToast('Shift moved to "' + targetCategory + '"', 'success');
        this.pendingShiftMove = null;
    }

    closeCategoryModal() {
        const modal = document.getElementById('moveCategoryModal') || document.getElementById('manageCategoriesModal');
        if (modal) modal.remove();
        this.pendingShiftMove = null;
    }

    addStaffCategory() {
        this.openManageCategoriesModal(true);
    }

    openManageCategoriesModal(addMode = false) {
        const categories = Object.keys(this.staffShiftCategories[this.activeStaffTeam]);
        
        let categoryListHtml = '';
        if (!addMode) {
            categoryListHtml = categories.map(cat => {
                const safeCat = cat.replace(/'/g, "\\'");
                return '<div class="category-item"><span class="category-item-name">' + cat + '</span>' +
                       '<button class="category-item-delete" onclick="prPortal.deleteCategoryConfirm(\'' + safeCat + '\')">Delete</button></div>';
            }).join('');
        }

        const modalHtml = '<div id="manageCategoriesModal" class="category-modal active">' +
            '<div class="category-modal-content">' +
            '<div class="category-modal-header">' +
            '<h3>' + (addMode ? 'Add Category' : 'Manage Categories') + '</h3>' +
            '<button onclick="prPortal.closeCategoryModal()" style="background: none; border: none; color: var(--text); font-size: 24px; cursor: pointer;">&times;</button>' +
            '</div>' +
            (addMode ? 
                '<div style="margin-bottom: 20px;">' +
                '<label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--text);">Category Name:</label>' +
                '<input type="text" id="newCategoryName" placeholder="e.g., Morning Shifts, Evening Shifts" style="width: 100%; padding: 10px; border: 2px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); font-size: 14px;">' +
                '</div>' +
                '<button onclick="prPortal.createNewCategory()" class="btn btn-primary" style="width: 100%; margin-bottom: 8px;">Create Category</button>' +
                '<button onclick="prPortal.closeCategoryModal()" class="btn btn-secondary" style="width: 100%;">Cancel</button>'
            :
                '<p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">Existing categories (click to delete):</p>' +
                '<div class="category-list">' + categoryListHtml + '</div>' +
                '<button onclick="prPortal.openManageCategoriesModal(true)" class="btn btn-primary" style="width: 100%; margin-top: 12px;">+ Add New Category</button>' +
                '<button onclick="prPortal.closeCategoryModal()" class="btn btn-secondary" style="width: 100%; margin-top: 8px;">Close</button>'
            ) +
            '</div>' +
            '</div>';

        const existing = document.getElementById('manageCategoriesModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        if (addMode) {
            setTimeout(() => document.getElementById('newCategoryName')?.focus(), 100);
        }
    }

    createNewCategory() {
        const input = document.getElementById('newCategoryName');
        const name = input?.value?.trim();
        
        if (!name) {
            this.showToast('Please enter a category name', 'error');
            return;
        }

        if (this.staffShiftCategories[this.activeStaffTeam][name]) {
            this.showToast('Category already exists', 'error');
            return;
        }

        this.staffShiftCategories[this.activeStaffTeam][name] = [];
        this.activeStaffCategory = name;
        this.closeCategoryModal();
        this.renderStaffCategoryTabs();
        this.renderStaffCategoryContent();
        this.savePrShifts();
        this.showToast('Category "' + name + '" created', 'success');
    }

    deleteCategoryConfirm(categoryName) {
        const shifts = this.staffShiftCategories[this.activeStaffTeam][categoryName];
        const shiftCount = shifts?.length || 0;
        
        const message = shiftCount > 0 
            ? 'Delete category "' + categoryName + '"?\n\nThis will also delete ' + shiftCount + ' shift(s) in this category.'
            : 'Delete category "' + categoryName + '"?';
        
        if (!confirm(message)) return;

        delete this.staffShiftCategories[this.activeStaffTeam][categoryName];
        
        // If deleted current category, switch to first available
        const remainingCategories = Object.keys(this.staffShiftCategories[this.activeStaffTeam]);
        this.activeStaffCategory = remainingCategories.length > 0 ? remainingCategories[0] : null;
        
        this.closeCategoryModal();
        this.renderStaffCategoryTabs();
        this.renderStaffCategoryContent();
        this.savePrShifts();
        this.showToast('Category "' + categoryName + '" deleted', 'success');
    }

    async savePrShifts() {
        try {
            const response = await fetch('/api/shift-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.staffShiftCategories)
            });

            const data = await response.json();
            if (data.ok) {
                this.showToast('Shift templates saved successfully', 'success');
            } else {
                throw new Error(data.message || 'Save failed');
            }
        } catch (error) {
            console.error('Error saving shift templates:', error);
            this.showToast('Failed to save shift templates', 'error');
        }
    }

}

// Initialize
console.log('Creating prPortal instance...');
const prPortal = new PRPortalLight();
window.prPortal = prPortal;
console.log('prPortal instance created:', prPortal);
