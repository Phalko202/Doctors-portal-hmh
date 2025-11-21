// User Management Module for Admin Panel
// Handles role-based access control and user CRUD operations

let currentUser = null;
let allUsers = [];

// Initialize user management on page load
(async function initUserManagement() {
  try {
    // Fetch current user info
    const meRes = await fetch('/api/me');
    if (meRes.ok) {
      const meData = await meRes.json();
      currentUser = meData.user;
      
      // Update user display in header
      const userDisplay = document.getElementById('userDisplay');
      if (userDisplay && currentUser) {
        userDisplay.textContent = `${currentUser.display_name || currentUser.username} (${currentUser.role})`;
      }
      
      // Filter menu items based on permissions
      filterMenuByPermissions();
    }
  } catch (err) {
    console.error('Failed to load current user:', err);
  }
})();

function filterMenuByPermissions() {
  if (!currentUser) return;
  
  const navItems = document.querySelectorAll('.sidenav .nav-item[data-permission]');
  navItems.forEach(item => {
    const requiredPerm = item.getAttribute('data-permission');
    const hasPermission = checkPermission(requiredPerm);
    
    if (!hasPermission) {
      item.style.display = 'none';
    } else {
      item.style.display = '';
    }
  });
}

function checkPermission(permission) {
  if (!currentUser) return false;
  if (currentUser.role === 'super_admin') return true;
  if (currentUser.permissions && currentUser.permissions.includes('all')) return true;
  return currentUser.permissions && currentUser.permissions.includes(permission);
}

// User Management UI
const addUserBtn = document.getElementById('addUserBtn');
const usersList = document.getElementById('usersList');
const userModal = document.getElementById('userModal');
const userModalTitle = document.getElementById('userModalTitle');
const userForm = document.getElementById('userForm');
const editUserId = document.getElementById('editUserId');
const userUsername = document.getElementById('userUsername');
const userDisplayName = document.getElementById('userDisplayName');
const userPassword = document.getElementById('userPassword');
const userRole = document.getElementById('userRole');

async function loadUsers() {
  if (!usersList) return;
  
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to load users');
    
    const data = await res.json();
    allUsers = data.users || [];
    
    renderUsersList();
  } catch (err) {
    usersList.innerHTML = `<div style="color:var(--danger);text-align:center;padding:40px">Error: ${err.message}</div>`;
  }
}

function renderUsersList() {
  if (!usersList) return;
  
  // Add super admin card (read-only)
  let html = `
    <div class="doc-row" style="border-color:var(--accent);background:linear-gradient(145deg,rgba(29,168,142,.08),transparent)">
      <div style="flex:1">
        <div class="nm" style="color:var(--accent)">Super Admin</div>
        <div class="sub">Username: admin | Role: Super Admin (Full Access)</div>
        <div class="meta-line">Default hardcoded credentials - cannot be modified</div>
      </div>
      <div class="acts">
        <span style="padding:8px 14px;background:var(--gradient-primary);color:#fff;border-radius:10px;font-weight:700;font-size:11px">PROTECTED</span>
      </div>
    </div>
  `;
  
  // Add regular users
  allUsers.forEach(user => {
    const roleColor = {
      'admin': 'var(--primary)',
      'medical_admin': '#2ebf94',
      'pr_staff': '#f4c542',
      'editor': 'var(--warning)',
      'viewer': 'var(--muted)'
    }[user.role] || 'var(--muted)';
    
    const roleLabel = {
      'admin': 'Admin',
      'medical_admin': 'Medical Admin',
      'pr_staff': 'PR Staff',
      'editor': 'Editor',
      'viewer': 'Viewer'
    }[user.role] || user.role;
    
    html += `
      <div class="doc-row">
        <div style="flex:1">
          <div class="nm">${escapeHtml(user.display_name || user.username)}</div>
          <div class="sub">Username: ${escapeHtml(user.username)}</div>
          <div class="meta-line" style="color:${roleColor}">Role: ${roleLabel}</div>
          ${user.created_at ? `<div class="meta-line">Created: ${new Date(user.created_at).toLocaleDateString()}</div>` : ''}
        </div>
        <div class="acts">
          <button onclick="editUser('${escapeHtml(user.id)}')">Edit</button>
          <button onclick="deleteUser('${escapeHtml(user.id)}', '${escapeHtml(user.username)}')" 
                  style="background:linear-gradient(135deg,#c62828,#e53935);color:#fff">Delete</button>
        </div>
      </div>
    `;
  });
  
  if (allUsers.length === 0) {
    html += `<div style="color:var(--muted);text-align:center;padding:40px">No additional users. Click "Add User" to create one.</div>`;
  }
  
  usersList.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openUserModal(userId = null) {
  if (!userModal) return;
  
  editUserId.value = userId || '';
  userModalTitle.textContent = userId ? 'Edit User' : 'Add User';
  
  if (userId) {
    const user = allUsers.find(u => u.id === userId || u.username === userId);
    if (user) {
      userUsername.value = user.username;
      userUsername.disabled = true; // Cannot change username
      userDisplayName.value = user.display_name || '';
      userRole.value = user.role;
      userPassword.value = '';
      userPassword.placeholder = 'Leave blank to keep current password';
      userPassword.required = false;
    }
  } else {
    userForm.reset();
    userUsername.disabled = false;
    userPassword.placeholder = '••••••••';
    userPassword.required = true;
  }
  
  userModal.setAttribute('aria-hidden', 'false');
  userModal.style.display = 'flex';
}

function closeUserModal() {
  if (!userModal) return;
  userModal.setAttribute('aria-hidden', 'true');
  userModal.style.display = 'none';
  userForm.reset();
}

async function saveUser(e) {
  e.preventDefault();
  
  const userId = editUserId.value;
  const username = userUsername.value.trim();
  const displayName = userDisplayName.value.trim();
  const password = userPassword.value.trim();
  const role = userRole.value;
  
  if (!username || (! userId && !password)) {
    alert('Username and password are required for new users');
    return;
  }
  
  const payload = {
    username,
    display_name: displayName || username,
    role
  };
  
  if (password) {
    payload.password = password;
  }
  
  try {
    let res;
    if (userId) {
      // Update existing user
      res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // Create new user
      res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save user');
    }
    
    closeUserModal();
    loadUsers();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function deleteUser(userId, username) {
  if (!confirm(`Delete user "${username}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete user');
    }
    
    loadUsers();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

window.editUser = openUserModal;
window.deleteUser = deleteUser;

// Event listeners
if (addUserBtn) {
  addUserBtn.addEventListener('click', () => openUserModal());
}

if (userForm) {
  userForm.addEventListener('submit', saveUser);
}

// Modal close handlers
if (userModal) {
  userModal.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeUserModal);
  });
}

// Load users when User Management tab is opened
const userManagementNav = document.querySelector('.sidenav .nav-item[data-target="users"]');
if (userManagementNav) {
  userManagementNav.addEventListener('click', () => {
    if (!usersList.hasChildNodes() || usersList.querySelector('[style*="Loading"]')) {
      loadUsers();
    }
  });
}
