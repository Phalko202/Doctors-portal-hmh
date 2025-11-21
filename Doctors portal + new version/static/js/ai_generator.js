// ============================================================================
// AI GENERATOR ENHANCED FUNCTIONALITY
// Modern AI-powered roster generation with advanced options
// ============================================================================

let currentGenMode = 'full';
let selectedPattern = 'mixed-weekly';
let selectedStaff = new Set();
let generationResults = null;

// Initialize generation modal
function initAiGenerator() {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = nextMonth.toISOString().split('T')[0];
    
    document.getElementById('fullGenStartDate').value = today;
    document.getElementById('fullGenEndDate').value = endDate;
    document.getElementById('specialGenStartDate').value = today;
    document.getElementById('specialGenEndDate').value = endDate;
    document.getElementById('selectiveGenStartDate').value = today;
    document.getElementById('selectiveGenEndDate').value = endDate;
    
    loadStaffForSelection();
}

// Open AI Generator Modal
function openAiGenModal() {
    document.getElementById('aiGenModal').style.display = 'flex';
    initAiGenerator();
}

// Close AI Generator Modal
function closeAiGenModal() {
    document.getElementById('aiGenModal').style.display = 'none';
    resetGenModal();
}

// Close and refresh schedule
function closeAiGenModalAndRefresh() {
    closeAiGenModal();
    if (typeof prPortal !== 'undefined') {
        prPortal.renderSchedule();
    }
}

// Reset modal to initial state
function resetGenModal() {
    // Hide loading and results
    document.getElementById('genLoadingState').style.display = 'none';
    document.getElementById('genResultsState').style.display = 'none';
    
    // Show full gen options
    selectGenMode('full');
    
    // Clear selections
    selectedStaff.clear();
    generationResults = null;
}

// Select generation mode
function selectGenMode(mode) {
    currentGenMode = mode;
    
    // Update tabs
    document.querySelectorAll('.gen-mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    
    // Update options visibility
    document.querySelectorAll('.gen-options').forEach(opt => {
        opt.classList.remove('active');
    });
    
    if (mode === 'full') {
        document.getElementById('fullGenOptions').classList.add('active');
    } else if (mode === 'special') {
        document.getElementById('specialGenOptions').classList.add('active');
    } else if (mode === 'selective') {
        document.getElementById('selectiveGenOptions').classList.add('active');
    }
}

// Select pattern for special generation
function selectPattern(pattern) {
    selectedPattern = pattern;
    document.querySelectorAll('.pattern-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.pattern === pattern);
    });
}

// Load staff for selection
function loadStaffForSelection() {
    const staffList = document.getElementById('staffSelectionList');
    if (!staffList) return;
    
    const staff = prPortal?.state?.staff?.filter(s => s.active !== false) || [];
    
    staffList.innerHTML = staff.map(s => {
        const roles = Array.isArray(s.roles) ? s.roles : [s.role];
        const icon = roles.includes('clinical') ? '🏥' : roles.includes('front') ? '🎯' : '👤';
        return `
            <div class="staff-select-item" onclick="toggleStaffSelection('${s.id}', this)">
                <input type="checkbox" id="staff_${s.id}" onclick="event.stopPropagation()">
                <span>${icon} ${s.name}</span>
            </div>
        `;
    }).join('');
}

// Toggle staff selection
function toggleStaffSelection(staffId, element) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        selectedStaff.add(staffId);
        element.classList.add('selected');
    } else {
        selectedStaff.delete(staffId);
        element.classList.remove('selected');
    }
}

// Start Full Generation
async function startFullGeneration() {
    const startDate = document.getElementById('fullGenStartDate').value;
    const endDate = document.getElementById('fullGenEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
        alert('End date must be after start date');
        return;
    }
    
    if (!confirm(`⚠️ This will generate roster from ${startDate} to ${endDate} for ALL staff. Continue?`)) {
        return;
    }
    
    await executeGeneration({
        mode: 'full',
        start_date: startDate,
        end_date: endDate
    });
}

// Start Special Generation
async function startSpecialGeneration() {
    const startDate = document.getElementById('specialGenStartDate').value;
    const endDate = document.getElementById('specialGenEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
        alert('End date must be after start date');
        return;
    }
    
    await executeGeneration({
        mode: 'special',
        pattern: selectedPattern,
        start_date: startDate,
        end_date: endDate
    });
}

// Start Selective Generation
async function startSelectiveGeneration() {
    const startDate = document.getElementById('selectiveGenStartDate').value;
    const endDate = document.getElementById('selectiveGenEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
        alert('End date must be after start date');
        return;
    }
    
    if (selectedStaff.size === 0) {
        alert('Please select at least one staff member');
        return;
    }
    
    await executeGeneration({
        mode: 'selective',
        staff_ids: Array.from(selectedStaff),
        start_date: startDate,
        end_date: endDate
    });
}

// Execute Generation with Loading Animation
async function executeGeneration(params) {
    // Hide options, show loading
    document.querySelectorAll('.gen-options').forEach(opt => opt.style.display = 'none');
    document.getElementById('genLoadingState').style.display = 'block';
    
    // Animate loading text
    const loadingTexts = [
        '🤖 Analyzing staff availability...',
        '📊 Calculating optimal assignments...',
        '🔄 Balancing workload distribution...',
        '✨ Applying AI algorithms...',
        '🎯 Finalizing roster assignments...'
    ];
    
    let textIndex = 0;
    const loadingInterval = setInterval(() => {
        document.getElementById('loadingText').textContent = loadingTexts[textIndex];
        textIndex = (textIndex + 1) % loadingTexts.length;
    }, 1500);
    
    try {
        const response = await fetch('/api/pr/generate-roster-enhanced', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        
        const data = await response.json();
        
        clearInterval(loadingInterval);
        
        if (data.ok) {
            generationResults = data;
            showGenerationResults(data);
        } else {
            alert(`❌ Generation failed: ${data.error || 'Unknown error'}`);
            closeAiGenModal();
        }
    } catch (error) {
        clearInterval(loadingInterval);
        console.error('Generation error:', error);
        alert('❌ Failed to generate roster. Please try again.');
        closeAiGenModal();
    }
}

// Show Generation Results
function showGenerationResults(data) {
    document.getElementById('genLoadingState').style.display = 'none';
    document.getElementById('genResultsState').style.display = 'block';
    
    // Render statistics
    const stats = data.stats || {};
    const resultsStats = document.getElementById('resultsStats');
    resultsStats.innerHTML = `
        <div class="result-stat-card">
            <div class="result-stat-value">${stats.total_days || 0}</div>
            <div class="result-stat-label">Days Generated</div>
        </div>
        <div class="result-stat-card">
            <div class="result-stat-value">${stats.total_staff || 0}</div>
            <div class="result-stat-label">Staff Assigned</div>
        </div>
        <div class="result-stat-card">
            <div class="result-stat-value">${stats.total_assignments || 0}</div>
            <div class="result-stat-label">Total Assignments</div>
        </div>
        <div class="result-stat-card">
            <div class="result-stat-value">${stats.gopd_assignments || 0}</div>
            <div class="result-stat-label">GOPD Assignments</div>
        </div>
    `;
    
    // Render staff assignments overview
    const staffAssignments = data.staff_overview || [];
    const staffList = document.getElementById('staffAssignmentsList');
    staffList.innerHTML = staffAssignments.map(staff => {
        const badges = [];
        if (staff.clinical_count > 0) badges.push(`<span class="assignment-badge clinical">Clinical: ${staff.clinical_count}</span>`);
        if (staff.front_count > 0) badges.push(`<span class="assignment-badge front">Front: ${staff.front_count}</span>`);
        if (staff.gopd_count > 0) badges.push(`<span class="assignment-badge gopd">GOPD: ${staff.gopd_count}</span>`);
        
        return `
            <div class="staff-assignment-item">
                <div>
                    <div class="staff-assignment-name">${staff.icon || '👤'} ${staff.name}</div>
                    <div class="staff-assignment-details">${staff.total_assignments} assignments • ${staff.pattern || 'Standard pattern'}</div>
                </div>
                <div class="staff-assignment-badges">
                    ${badges.join('')}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================================
// PR BOT ASSISTANT
// ============================================================================

let botChatHistory = [];

// Toggle PR Bot Chat
function togglePrBot() {
    const botChat = document.getElementById('prBotChat');
    botChat.classList.toggle('open');
}

// Handle Enter key in bot input
function handleBotKeypress(event) {
    if (event.key === 'Enter') {
        sendBotMessage();
    }
}

// Send Bot Message
async function sendBotMessage() {
    const input = document.getElementById('prBotInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addBotMessage(message, 'user');
    input.value = '';
    
    // Add to history
    botChatHistory.push({ role: 'user', content: message });
    
    // Show typing indicator
    const typingId = addBotMessage('💭 Thinking...', 'assistant');
    
    try {
        const response = await fetch('/api/pr-bot/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: message,
                history: botChatHistory.slice(-10) // Last 10 messages
            })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        document.getElementById(typingId).remove();
        
        if (data.ok) {
            addBotMessage(data.response, 'assistant');
            botChatHistory.push({ role: 'assistant', content: data.response });
        } else {
            addBotMessage('❌ Sorry, I encountered an error. Please try again.', 'assistant');
        }
    } catch (error) {
        console.error('Bot error:', error);
        document.getElementById(typingId).remove();
        addBotMessage('❌ Connection error. Please check your network.', 'assistant');
    }
}

// Add Message to Bot Chat
function addBotMessage(text, type) {
    const messagesContainer = document.getElementById('prBotMessages');
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `bot-message ${type}`;
    messageDiv.innerHTML = text;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
}

// Pre-defined Bot Responses
const botKnowledgeBase = {
    'roster': 'The roster system helps you manage staff assignments across clinical and front desk duties. You can generate rosters automatically using AI, or manually assign staff to specific stations and dates.',
    'generation': 'AI roster generation uses smart algorithms to distribute staff fairly across all stations, considering their roles, availability, and workload balance. You can choose full generation (all staff), special patterns (mixed assignments), or selective generation (specific staff only).',
    'staff': 'Staff members can have multiple roles: Clinical (for medical specialties), Front Desk (reception duties), or Training. You can manage staff in the Staff Management section.',
    'gopd': 'GOPD (General OPD) is configured for public holidays like Fridays. You can set minimum staff requirements and shift timings in the GOPD Configuration section.',
    'stations': 'Stations represent duty locations. Clinical stations are linked to doctor specialties, while front stations are custom-created. You can manage these in Station Knowledge Base.',
    'help': 'I can help you with: roster generation, staff management, station assignments, GOPD configuration, leave management, and understanding system features. Just ask me anything!'
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('AI Generator initialized');
    
    // Connect generate button to open modal
    const generateBtn = document.getElementById('generateDutyBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', openAiGenModal);
    }
});
