// ============================================================================
// CATEGORIZED SHIFT KNOWLEDGE SYSTEM
// Replace the old shift knowledge system with this categorized approach
// ============================================================================

// Global state
let shiftCategories = {};
let activeCategory = null;

// Element references (ensure these exist in HTML)
const shiftKnowledgeModal = document.getElementById('shiftKnowledgeModal');
const shiftKnowledgeStatus = document.getElementById('shiftKnowledgeStatus');
const openShiftKnowledgeBtn = document.getElementById('openShiftKnowledgeBtn');
const closeShiftKnowledgeBtn = document.getElementById('closeShiftKnowledgeBtn');
const addNewCategoryBtn = document.getElementById('addNewCategoryBtn');
const addShiftToCategoryBtn = document.getElementById('addShiftToCategory');

// Fetch shift knowledge from API
async function fetchShiftKnowledge() {
    try {
        const r = await fetch('/api/shift_knowledge');
        const j = await r.json();
        return j && j.ok ? (j.data || {}) : {};
    } catch (e) {
        console.error('Failed to fetch shift knowledge:', e);
        return {};
    }
}

// Save shift knowledge to API
async function saveShiftKnowledge(data) {
    if (shiftKnowledgeStatus) shiftKnowledgeStatus.textContent = 'Saving…';
    try {
        const r = await fetch('/api/shift_knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data })
        });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || 'Save failed');
        if (shiftKnowledgeStatus) {
            shiftKnowledgeStatus.textContent = 'Saved ✓';
            setTimeout(() => {
                if (shiftKnowledgeStatus.textContent === 'Saved ✓') shiftKnowledgeStatus.textContent = '';
            }, 1500);
        }
        return true;
    } catch (e) {
        if (shiftKnowledgeStatus) shiftKnowledgeStatus.textContent = 'Error: ' + (e.message || 'Save failed');
        return false;
    }
}

// Render category tabs
function renderCategoryTabs() {
    const tabsContainer = document.getElementById('categoryTabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';
    const categories = Object.keys(shiftCategories).sort();

    if (categories.length === 0) {
        tabsContainer.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:8px">No categories yet. Click "Add Category" to start.</div>';
        return;
    }

    categories.forEach(cat => {
        const tab = document.createElement('button');
        tab.textContent = cat;
        const isActive = activeCategory === cat;
        tab.style.cssText = `
            padding:10px 20px;
            background:${isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99, 102, 241, 0.1)'};
            color:${isActive ? '#ffffff' : 'var(--text)'};
            border:2px solid ${isActive ? '#6366f1' : 'rgba(99, 102, 241, 0.3)'};
            border-radius:10px;
            font-weight:700;
            font-size:13px;
            cursor:pointer;
            transition:all 0.3s;
        `;
        tab.addEventListener('click', () => {
            activeCategory = cat;
            renderCategoryTabs();
            renderCategoryContent();
        });
        tab.addEventListener('mouseenter', () => {
            if (!isActive) tab.style.background = 'rgba(99, 102, 241, 0.2)';
        });
        tab.addEventListener('mouseleave', () => {
            if (!isActive) tab.style.background = 'rgba(99, 102, 241, 0.1)';
        });
        tabsContainer.appendChild(tab);
    });
}

// Render category content
function renderCategoryContent() {
    const contentContainer = document.getElementById('categoryContent');
    if (!contentContainer) return;

    if (!activeCategory || !shiftCategories[activeCategory]) {
        contentContainer.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);font-size:14px">Select a category or create a new one</div>';
        return;
    }

    const shifts = shiftCategories[activeCategory];
    contentContainer.innerHTML = '';

    if (shifts.length === 0) {
        contentContainer.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);font-size:14px">No shifts in this category. Click "Add Shift to Category" to add one.</div>';
        return;
    }

    shifts.forEach((shift, index) => {
        const card = document.createElement('div');
        card.style.cssText = `
            background:var(--card);
            border:2px solid var(--border);
            border-radius:12px;
            padding:16px;
            margin-bottom:12px;
            transition:all 0.3s;
        `;

        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <input 
                    type="text" 
                    value="${shift.name || ''}" 
                    placeholder="Shift Name (e.g., Morning OPD 08:00-14:00)"
                    data-index="${index}"
                    data-field="name"
                    style="flex:1;padding:8px 12px;background:var(--panel);border:2px solid var(--border);border-radius:8px;font-size:14px;font-weight:700;color:var(--primary)"
                />
                <button 
                    onclick="window.deleteShiftFromCategory('${activeCategory}', ${index})"
                    style="margin-left:12px;background:rgba(239,68,68,0.15);border:2px solid rgba(239,68,68,0.3);padding:6px 12px;border-radius:8px;color:#ef4444;font-weight:700;cursor:pointer"
                >🗑️ Delete</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">
                <div>
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px">Start Time</label>
                    <input type="time" value="${shift.start || ''}" data-index="${index}" data-field="start" style="width:100%;padding:8px;background:var(--panel);border:1px solid var(--border);border-radius:6px;font-size:12px"/>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px">End Time</label>
                    <input type="time" value="${shift.end || ''}" data-index="${index}" data-field="end" style="width:100%;padding:8px;background:var(--panel);border:1px solid var(--border);border-radius:6px;font-size:12px"/>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px">Min Staff</label>
                    <input type="number" value="${shift.min_staff || 1}" data-index="${index}" data-field="min_staff" min="1" style="width:100%;padding:8px;background:var(--panel);border:1px solid var(--border);border-radius:6px;font-size:12px"/>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px">Color</label>
                    <input type="color" value="${shift.color || '#6366f1'}" data-index="${index}" data-field="color" style="width:100%;height:38px;background:var(--panel);border:1px solid var(--border);border-radius:6px;cursor:pointer"/>
                </div>
            </div>
            <div style="margin-top:12px">
                <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px">Notes</label>
                <textarea data-index="${index}" data-field="notes" placeholder="Additional notes..." style="width:100%;padding:8px;background:var(--panel);border:1px solid var(--border);border-radius:6px;font-size:12px;resize:vertical;min-height:60px">${shift.notes || ''}</textarea>
            </div>
        `;

        // Add change listeners
        card.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('change', async (e) => {
                const idx = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;

                shiftCategories[activeCategory][idx][field] = value;
                await saveShiftKnowledge(shiftCategories);
            });
        });

        contentContainer.appendChild(card);
    });
}

// Open shift knowledge modal
async function openShiftKnowledge() {
    if (!shiftKnowledgeModal) return;

    const contentContainer = document.getElementById('categoryContent');
    if (contentContainer) contentContainer.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">Loading…</div>';

    shiftKnowledgeModal.style.display = 'flex';
    setTimeout(() => {
        shiftKnowledgeModal.style.visibility = 'visible';
        shiftKnowledgeModal.style.opacity = '1';
    }, 10);

    // Load data
    const data = await fetchShiftKnowledge();
    shiftCategories = data;

    // Ensure there are default categories if empty
    if (Object.keys(shiftCategories).length === 0) {
        shiftCategories = {
            'Morning OPD': [],
            'Evening OPD': [],
            'Night Duty': []
        };
        await saveShiftKnowledge(shiftCategories);
    }

    // Set active category to first one
    const categories = Object.keys(shiftCategories);
    activeCategory = categories.length > 0 ? categories[0] : null;

    renderCategoryTabs();
    renderCategoryContent();
}

// Close shift knowledge modal
function closeShiftKnowledgeModal() {
    if (!shiftKnowledgeModal) return;
    shiftKnowledgeModal.style.visibility = 'hidden';
    shiftKnowledgeModal.style.opacity = '0';
    setTimeout(() => {
        shiftKnowledgeModal.style.display = 'none';
    }, 300);
}

// Add new category
async function addNewCategory() {
    const categoryName = prompt('Enter category name (e.g., "Morning OPD", "Evening OPD", "Night Duty"):');
    if (!categoryName || !categoryName.trim()) return;

    const trimmed = categoryName.trim();
    if (shiftCategories[trimmed]) {
        alert('Category already exists!');
        return;
    }

    shiftCategories[trimmed] = [];
    activeCategory = trimmed;

    await saveShiftKnowledge(shiftCategories);
    renderCategoryTabs();
    renderCategoryContent();
}

// Add shift to current category
async function addShiftToCurrentCategory() {
    if (!activeCategory) {
        alert('Please select or create a category first!');
        return;
    }

    const newShift = {
        name: '',
        start: '08:00',
        end: '16:00',
        min_staff: 1,
        color: '#6366f1',
        notes: ''
    };

    shiftCategories[activeCategory].push(newShift);
    await saveShiftKnowledge(shiftCategories);
    renderCategoryContent();
}

// Delete shift from category
async function deleteShiftFromCategory(category, index) {
    if (!confirm('Delete this shift?')) return;

    shiftCategories[category].splice(index, 1);
    await saveShiftKnowledge(shiftCategories);
    renderCategoryContent();
}

// Make functions global for onclick
window.deleteShiftFromCategory = deleteShiftFromCategory;
window.openShiftKnowledge = openShiftKnowledge;
window.closeShiftKnowledgeModal = closeShiftKnowledgeModal;
window.addNewCategory = addNewCategory;
window.addShiftToCurrentCategory = addShiftToCurrentCategory;

// Event Listeners
if (openShiftKnowledgeBtn) {
    openShiftKnowledgeBtn.addEventListener('click', openShiftKnowledge);
}

if (closeShiftKnowledgeBtn) {
    closeShiftKnowledgeBtn.addEventListener('click', closeShiftKnowledgeModal);
}

if (addNewCategoryBtn) {
    addNewCategoryBtn.addEventListener('click', addNewCategory);
}

if (addShiftToCategoryBtn) {
    addShiftToCategoryBtn.addEventListener('click', addShiftToCurrentCategory);
}

console.log('✅ Categorized Shift Knowledge System loaded');
