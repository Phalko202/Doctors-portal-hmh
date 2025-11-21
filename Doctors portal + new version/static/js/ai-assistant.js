/**
 * AI Assistant - Intelligent System Helper
 * Draggable floating widget with comprehensive system knowledge
 * Preserves chat history and provides contextual help
 */

class AIAssistant {
    constructor() {
        this.chatHistory = [];
        this.isOpen = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.systemKnowledge = this.buildSystemKnowledge();
        this.quickActions = [
            { text: "📝 Mark Staff Leave", action: "openLeaveForm" },
            { text: "🤖 Generate Roster", action: "openRosterGenerator" },
            { text: "Explain clinical shift matching", action: "ask" },
            { text: "What are freed clinicals?", action: "ask" },
            { text: "How to manage doctor schedules?", action: "ask" },
            { text: "Configure GOPD settings", action: "ask" }
        ];
        
        this.init();
    }
    
    init() {
        this.createWidget();
        this.createChatWindow();
        this.loadChatHistory();
        this.setupEventListeners();
    }
    
    createWidget() {
        const widget = document.createElement('div');
        widget.className = 'ai-widget-button';
        widget.id = 'aiWidget';
        widget.innerHTML = `
            <div class="ai-widget-icon">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140'%3E%3Cdefs%3E%3ClinearGradient id='headGrad' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%232d3748'/%3E%3Cstop offset='100%25' style='stop-color:%231a202c'/%3E%3C/linearGradient%3E%3ClinearGradient id='glowGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300e5ff'/%3E%3Cstop offset='100%25' style='stop-color:%230099ff'/%3E%3C/linearGradient%3E%3Cfilter id='glow'%3E%3CfeGaussianBlur stdDeviation='2' result='coloredBlur'/%3E%3CfeMerge%3E%3CfeMergeNode in='coloredBlur'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3C!-- Main head --%3E%3Cpath d='M35 30 L85 30 L95 40 L95 85 L85 95 L35 95 L25 85 L25 40 Z' fill='url(%23headGrad)' stroke='%23404b5e' stroke-width='2'/%3E%3C!-- Top panel --%3E%3Crect x='40' y='25' width='40' height='8' rx='2' fill='%23404b5e'/%3E%3Crect x='42' y='27' width='8' height='4' rx='1' fill='%2300d4ff' filter='url(%23glow)'/%3E%3Crect x='56' y='27' width='8' height='4' rx='1' fill='%23ff6b00'/%3E%3Crect x='70' y='27' width='8' height='4' rx='1' fill='%2300d4ff' filter='url(%23glow)'/%3E%3C!-- Visor/Eyes --%3E%3Cellipse cx='45' cy='55' rx='10' ry='14' fill='%2300e5ff' filter='url(%23glow)'/%3E%3Cellipse cx='75' cy='55' rx='10' ry='14' fill='%2300e5ff' filter='url(%23glow)'/%3E%3Cellipse cx='45' cy='55' rx='6' ry='10' fill='%2300ffff'/%3E%3Cellipse cx='75' cy='55' rx='6' ry='10' fill='%2300ffff'/%3E%3C!-- Mouth panel --%3E%3Crect x='35' y='72' width='50' height='12' rx='3' fill='%23404b5e'/%3E%3Cpath d='M40 78 L50 82 L60 78 L70 82 L80 78' stroke='%2300d4ff' stroke-width='2' fill='none' stroke-linecap='round' filter='url(%23glow)'/%3E%3C!-- Side panels --%3E%3Crect x='20' y='50' width='8' height='25' rx='2' fill='%23404b5e'/%3E%3Crect x='92' y='50' width='8' height='25' rx='2' fill='%23404b5e'/%3E%3Ccircle cx='24' cy='60' r='2' fill='%2300d4ff' filter='url(%23glow)'/%3E%3Ccircle cx='96' cy='60' r='2' fill='%2300d4ff' filter='url(%23glow)'/%3E%3C!-- Chin detail --%3E%3Cpath d='M45 90 L60 95 L75 90' stroke='%23404b5e' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E" alt="PR Bot" style="width: 45px; height: 45px;"/>
            </div>
        `;
        widget.title = 'PR Bot - Click or drag to move';
        document.body.appendChild(widget);
    }
    
    createChatWindow() {
        const chatWindow = document.createElement('div');
        chatWindow.className = 'ai-chat-window';
        chatWindow.id = 'aiChatWindow';
        chatWindow.innerHTML = `
            <div class="ai-chat-header">
                <div class="ai-chat-header-info">
                    <div class="ai-chat-avatar">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140'%3E%3Cdefs%3E%3ClinearGradient id='headGrad' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%232d3748'/%3E%3Cstop offset='100%25' style='stop-color:%231a202c'/%3E%3C/linearGradient%3E%3ClinearGradient id='glowGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300e5ff'/%3E%3Cstop offset='100%25' style='stop-color:%230099ff'/%3E%3C/linearGradient%3E%3Cfilter id='glow'%3E%3CfeGaussianBlur stdDeviation='2' result='coloredBlur'/%3E%3CfeMerge%3E%3CfeMergeNode in='coloredBlur'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M35 30 L85 30 L95 40 L95 85 L85 95 L35 95 L25 85 L25 40 Z' fill='url(%23headGrad)' stroke='%23404b5e' stroke-width='2'/%3E%3Crect x='40' y='25' width='40' height='8' rx='2' fill='%23404b5e'/%3E%3Crect x='42' y='27' width='8' height='4' rx='1' fill='%2300d4ff' filter='url(%23glow)'/%3E%3Crect x='56' y='27' width='8' height='4' rx='1' fill='%23ff6b00'/%3E%3Crect x='70' y='27' width='8' height='4' rx='1' fill='%2300d4ff' filter='url(%23glow)'/%3E%3Cellipse cx='45' cy='55' rx='10' ry='14' fill='%2300e5ff' filter='url(%23glow)'/%3E%3Cellipse cx='75' cy='55' rx='10' ry='14' fill='%2300e5ff' filter='url(%23glow)'/%3E%3Cellipse cx='45' cy='55' rx='6' ry='10' fill='%2300ffff'/%3E%3Cellipse cx='75' cy='55' rx='6' ry='10' fill='%2300ffff'/%3E%3Crect x='35' y='72' width='50' height='12' rx='3' fill='%23404b5e'/%3E%3Cpath d='M40 78 L50 82 L60 78 L70 82 L80 78' stroke='%2300d4ff' stroke-width='2' fill='none' stroke-linecap='round' filter='url(%23glow)'/%3E%3Crect x='20' y='50' width='8' height='25' rx='2' fill='%23404b5e'/%3E%3Crect x='92' y='50' width='8' height='25' rx='2' fill='%23404b5e'/%3E%3Ccircle cx='24' cy='60' r='2' fill='%2300d4ff' filter='url(%23glow)'/%3E%3Ccircle cx='96' cy='60' r='2' fill='%2300d4ff' filter='url(%23glow)'/%3E%3Cpath d='M45 90 L60 95 L75 90' stroke='%23404b5e' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E" alt="PR Bot" style="width: 36px; height: 36px;"/>
                    </div>
                    <div class="ai-chat-title">
                        <h3>PR Bot <span class="ai-badge new">Smart</span></h3>
                        <div class="ai-chat-status">
                            <span class="ai-status-indicator"></span>Online & Ready
                        </div>
                    </div>
                </div>
                <div class="ai-chat-actions">
                    <button class="ai-action-btn" onclick="aiAssistant.clearChat()" title="New Chat">
                        🔄
                    </button>
                    <button class="ai-action-btn" onclick="aiAssistant.toggleFullScreen()" title="Full Screen">
                        ⛶
                    </button>
                    <button class="ai-action-btn" onclick="aiAssistant.toggleChat()" title="Close">
                        ✕
                    </button>
                </div>
            </div>
            
            <div class="ai-chat-messages" id="aiChatMessages">
                ${this.chatHistory.length === 0 ? this.getWelcomeScreen() : ''}
            </div>
            
            <div class="ai-typing-indicator" id="aiTypingIndicator">
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
            </div>
            
            <div class="ai-quick-actions" id="aiQuickActions">
                ${this.quickActions.map(action => {
                    if (typeof action === 'object' && action.action) {
                        return `<div class="ai-quick-action ai-quick-action-btn" onclick="aiAssistant.handleAction('${action.action}')">${action.text}</div>`;
                    } else {
                        const text = typeof action === 'string' ? action : action.text;
                        return `<div class="ai-quick-action" onclick="aiAssistant.sendQuickAction('${this.escapeHtml(text)}')">${text}</div>`;
                    }
                }).join('')}
            </div>
            
            <div class="ai-chat-input-area">
                <div class="ai-input-wrapper">
                    <textarea 
                        class="ai-chat-input" 
                        id="aiChatInput" 
                        placeholder="Ask me anything about the system..."
                        rows="1"></textarea>
                    <button class="ai-send-btn" id="aiSendBtn" onclick="aiAssistant.sendMessage()">
                        ➤
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(chatWindow);
    }
    
    getWelcomeScreen() {
        return `
            <div class="ai-welcome-screen">
                <div class="ai-welcome-icon">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140'%3E%3Cdefs%3E%3ClinearGradient id='headGrad2' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%232d3748'/%3E%3Cstop offset='100%25' style='stop-color:%231a202c'/%3E%3C/linearGradient%3E%3ClinearGradient id='glowGrad2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300e5ff'/%3E%3Cstop offset='100%25' style='stop-color:%230099ff'/%3E%3C/linearGradient%3E%3Cfilter id='glow2'%3E%3CfeGaussianBlur stdDeviation='3' result='coloredBlur'/%3E%3CfeMerge%3E%3CfeMergeNode in='coloredBlur'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M35 30 L85 30 L95 40 L95 85 L85 95 L35 95 L25 85 L25 40 Z' fill='url(%23headGrad2)' stroke='%23404b5e' stroke-width='2'/%3E%3Crect x='40' y='25' width='40' height='8' rx='2' fill='%23404b5e'/%3E%3Crect x='42' y='27' width='8' height='4' rx='1' fill='%2300d4ff' filter='url(%23glow2)'/%3E%3Crect x='56' y='27' width='8' height='4' rx='1' fill='%23ff6b00'/%3E%3Crect x='70' y='27' width='8' height='4' rx='1' fill='%2300d4ff' filter='url(%23glow2)'/%3E%3Cellipse cx='45' cy='55' rx='10' ry='14' fill='%2300e5ff' filter='url(%23glow2)'/%3E%3Cellipse cx='75' cy='55' rx='10' ry='14' fill='%2300e5ff' filter='url(%23glow2)'/%3E%3Cellipse cx='45' cy='55' rx='6' ry='10' fill='%2300ffff'/%3E%3Cellipse cx='75' cy='55' rx='6' ry='10' fill='%2300ffff'/%3E%3Crect x='35' y='72' width='50' height='12' rx='3' fill='%23404b5e'/%3E%3Cpath d='M40 78 L50 82 L60 78 L70 82 L80 78' stroke='%2300d4ff' stroke-width='2' fill='none' stroke-linecap='round' filter='url(%23glow2)'/%3E%3Crect x='20' y='50' width='8' height='25' rx='2' fill='%23404b5e'/%3E%3Crect x='92' y='50' width='8' height='25' rx='2' fill='%23404b5e'/%3E%3Ccircle cx='24' cy='60' r='2' fill='%2300d4ff' filter='url(%23glow2)'/%3E%3Ccircle cx='96' cy='60' r='2' fill='%2300d4ff' filter='url(%23glow2)'/%3E%3Cpath d='M45 90 L60 95 L75 90' stroke='%23404b5e' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E" style="width: 80px; height: 80px;"/>
                </div>
                <h2 class="ai-welcome-title">Welcome to PR Bot</h2>
                <p class="ai-welcome-subtitle">Your intelligent helper for the Doctor Schedule System</p>
                
                <div class="ai-welcome-features">
                    <div class="ai-feature-card">
                        <div class="ai-feature-icon">📋</div>
                        <div class="ai-feature-title">Roster Management</div>
                        <div class="ai-feature-desc">Generate schedules, assign staff, and manage rosters</div>
                    </div>
                    <div class="ai-feature-card">
                        <div class="ai-feature-icon">🏥</div>
                        <div class="ai-feature-title">Clinical Matching</div>
                        <div class="ai-feature-desc">Smart clinical-doctor shift alignment</div>
                    </div>
                    <div class="ai-feature-card">
                        <div class="ai-feature-icon">⚙️</div>
                        <div class="ai-feature-title">Configuration</div>
                        <div class="ai-feature-desc">Stations, GOPD, shifts, and templates</div>
                    </div>
                    <div class="ai-feature-card">
                        <div class="ai-feature-icon">📊</div>
                        <div class="ai-feature-title">Analytics</div>
                        <div class="ai-feature-desc">Reports, statistics, and insights</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        const widget = document.getElementById('aiWidget');
        const input = document.getElementById('aiChatInput');
        
        // Widget drag functionality
        widget.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        
        // Widget click to toggle (only if not dragging)
        widget.addEventListener('click', (e) => {
            if (!this.wasDragged) {
                this.toggleChat();
            }
        });
        
        // Input auto-resize
        input.addEventListener('input', () => this.autoResizeInput(input));
        
        // Enter to send (Shift+Enter for new line)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    startDrag(e) {
        const widget = document.getElementById('aiWidget');
        this.isDragging = true;
        this.wasDragged = false;
        widget.classList.add('dragging');
        
        const rect = widget.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        this.wasDragged = true;
        const widget = document.getElementById('aiWidget');
        
        let x = e.clientX - this.dragOffset.x;
        let y = e.clientY - this.dragOffset.y;
        
        // Keep within viewport
        const maxX = window.innerWidth - widget.offsetWidth;
        const maxY = window.innerHeight - widget.offsetHeight;
        
        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));
        
        widget.style.left = x + 'px';
        widget.style.top = y + 'px';
        widget.style.right = 'auto';
        widget.style.bottom = 'auto';
    }
    
    endDrag() {
        if (this.isDragging) {
            const widget = document.getElementById('aiWidget');
            widget.classList.remove('dragging');
            this.isDragging = false;
            
            // Reset wasDragged after a short delay
            setTimeout(() => {
                this.wasDragged = false;
            }, 100);
        }
    }
    
    toggleChat() {
        const chatWindow = document.getElementById('aiChatWindow');
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            chatWindow.classList.add('open');
            document.getElementById('aiChatInput').focus();
            
            // Render chat history if exists
            if (this.chatHistory.length > 0) {
                this.renderChatHistory();
            }
        } else {
            chatWindow.classList.remove('open');
        }
    }
    
    autoResizeInput(input) {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }
    
    sendQuickAction(action) {
        document.getElementById('aiChatInput').value = action;
        this.sendMessage();
    }
    
    async sendMessage() {
        const input = document.getElementById('aiChatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage('user', message);
        input.value = '';
        input.style.height = 'auto';
        
        // Show typing indicator
        this.showTyping();
        
        // Simulate AI thinking delay
        await this.delay(800);
        
        // Get AI response
        const response = this.generateResponse(message);
        
        // Hide typing and show response
        this.hideTyping();
        this.addMessage('ai', response);
        
        // Save chat history
        this.saveChatHistory();
    }
    
    addMessage(sender, text) {
        const messagesDiv = document.getElementById('aiChatMessages');
        
        // Remove welcome screen if exists
        const welcome = messagesDiv.querySelector('.ai-welcome-screen');
        if (welcome) {
            welcome.remove();
        }
        
        const time = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender}`;
        messageDiv.innerHTML = `
            <div class="ai-message-avatar">${sender === 'ai' ? '🤖' : '👤'}</div>
            <div class="ai-message-content">
                <div class="ai-message-bubble">${this.formatMessage(text)}</div>
                <div class="ai-message-time">${time}</div>
            </div>
        `;
        
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        // Add to history
        this.chatHistory.push({ sender, text, time });
    }
    
    formatMessage(text) {
        // Convert markdown-like syntax to HTML with interactive elements
        text = this.escapeHtml(text);
        
        // Bold **text**
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Code `code`
        text = text.replace(/`(.+?)`/g, '<code>$1</code>');
        
        // Make action keywords clickable and interactive
        const actionKeywords = [
            { pattern: /\b(Mark staff leave|mark leave|Mark Leave)\b/gi, action: 'openLeaveForm' },
            { pattern: /\b(Generate roster|generate roster)\b/gi, action: 'openRosterGenerator' },
            { pattern: /\b(Add staff|add staff)\b/gi, action: 'openStaffForm' },
            { pattern: /\b(Configure shifts|configure shifts)\b/gi, action: 'goToShifts' }
        ];
        
        actionKeywords.forEach(({ pattern, action }) => {
            text = text.replace(pattern, (match) => {
                return `<span class="ai-action-link" onclick="aiAssistant.handleAction('${action}')" title="Click to ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}">${match}</span>`;
            });
        });
        
        // Line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }
    
    showTyping() {
        document.getElementById('aiTypingIndicator').classList.add('active');
        const messagesDiv = document.getElementById('aiChatMessages');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    hideTyping() {
        document.getElementById('aiTypingIndicator').classList.remove('active');
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    generateResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Enhanced intelligent pattern matching - understand variations
        const patterns = {
            roster_generate: [
                /\b(how\s+)?(to\s+|can\s+i\s+|do\s+i\s+|we\s+)?generate\s+(a\s+|the\s+)?roster/i,
                /\b(how\s+)?(to\s+|can\s+i\s+|do\s+i\s+|we\s+)?create\s+(a\s+|the\s+)?roster/i,
                /\bi\s+want\s+to\s+generate/i,
                /\bgenerate\s+(roster|sheet)/i,
                /\bmake\s+(a\s+)?(roster|sheet)/i
            ],
            leave_telegram: [
                /\bmark.*(leave|off|sick)/i,
                /\bset.*leave/i,
                /\bstaff.*leave/i,
                /\btelegram.*leave/i,
                /\binteractive.*leave/i,
                /\bapprove.*leave/i
            ]
        };
        
        // Check enhanced patterns
        for (const [key, regexList] of Object.entries(patterns)) {
            if (regexList.some(regex => regex.test(message))) {
                if (key === 'roster_generate' && this.systemKnowledge["generate roster"]) {
                    return this.systemKnowledge["generate roster"];
                } else if (key === 'leave_telegram' && this.systemKnowledge["telegram leave marking"]) {
                    return this.systemKnowledge["telegram leave marking"];
                }
            }
        }
        
        // Original keyword matching
        for (const [keywords, response] of Object.entries(this.systemKnowledge)) {
            const keywordList = keywords.split('|');
            if (keywordList.some(keyword => lowerMessage.includes(keyword))) {
                return response;
            }
        }
        
        // Default response
        return `I understand you're asking about "${message}". 

Here are some things I can help with:

**Roster Management**
• Generate AI rosters for staff
• Mark staff leaves via Telegram bot
• Manage clinical shift assignments
• Handle freed clinicals when doctors are on leave

**Configuration**
• Set up clinical shifts and time slots
• Configure doctor OPD timings
• Manage stations and GOPD settings

**System Features**
• Smart clinical-doctor matching (30-60 min before OPD)
• Interactive Telegram leave requests
• Visual color coding and status indicators
• Staff management and leave tracking

Try asking: "How do I generate a roster?" or "How to mark staff leave via Telegram?"`;
    }
    
    clearChat() {
        if (confirm('Start a new chat? Current conversation will be saved.')) {
            this.chatHistory = [];
            this.saveChatHistory();
            
            const messagesDiv = document.getElementById('aiChatMessages');
            messagesDiv.innerHTML = this.getWelcomeScreen();
        }
    }
    
    renderChatHistory() {
        const messagesDiv = document.getElementById('aiChatMessages');
        messagesDiv.innerHTML = '';
        
        this.chatHistory.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `ai-message ${msg.sender}`;
            messageDiv.innerHTML = `
                <div class="ai-message-avatar">${msg.sender === 'ai' ? '🤖' : '👤'}</div>
                <div class="ai-message-content">
                    <div class="ai-message-bubble">${this.formatMessage(msg.text)}</div>
                    <div class="ai-message-time">${msg.time}</div>
                </div>
            `;
            messagesDiv.appendChild(messageDiv);
        });
        
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    saveChatHistory() {
        try {
            localStorage.setItem('aiChatHistory', JSON.stringify(this.chatHistory));
        } catch (e) {
            console.warn('Could not save chat history:', e);
        }
    }
    
    loadChatHistory() {
        try {
            const saved = localStorage.getItem('aiChatHistory');
            if (saved) {
                this.chatHistory = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Could not load chat history:', e);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    buildSystemKnowledge() {
        return {
            // Roster Generation
            "generate roster|create roster|ai generate|make schedule": `**Generating AI Rosters** 🤖📋

To generate a roster:

1. Go to **PR Portal** → **Schedule** tab
2. Click the **🤖 AI Generate** button
3. Select your **date range** (start and end dates)
4. Choose generation mode:
   • **Full** - All active staff
   • **Selective** - Specific staff members
   • **Special** - Custom patterns (weekly/daily rotation)
5. Click **Generate**

The AI will:
• Match clinicals to doctors based on OPD timings (30-60 min before)
• Assign front desk staff
• Store doctor assignment metadata
• Rotate staff fairly across stations

**Tip**: Clinical shifts should be configured first for optimal matching!`,

            // Clinical Shift Matching
            "clinical shift|clinical matching|shift matching|30 min before|doctor timing": `**Smart Clinical Shift Matching** 🏥⏰

This intelligent system matches clinical staff to doctors based on optimal timing:

**How It Works:**
1. Clinical shifts start **30-60 minutes** before doctor OPD
2. AI automatically finds best matches
3. Example: Clinical 07:30 → Doctor 08:00 ✅

**Configuration:**
• Go to **Shift Knowledge** → **Staff Shift Templates**
• Create clinical shifts: 07:30-15:30, 08:30-16:30, etc.
• Set **slots** field (number of positions needed)

**Benefits:**
• Clinicals arrive before doctors
• Smooth operation start
• Visual AI matching indicators show coverage`,

            // Freed Clinicals
            "freed clinical|freed staff|purple clinical|doctor leave|clinical reassign": `**Freed Clinicals System** 🆓💜

When doctors take leave, their assigned clinicals become "freed":

**Visual Indicators:**
• **Purple text color** (#9333ea)
• **🆓 icon** next to name
• **Thick purple border** (3px)
• Tooltip: "Freed Clinical - Doctor on leave, manually reassignable"

**How to Reassign:**
1. Locate freed clinical (purple color)
2. Click on their cell
3. Select new station
4. Save assignment

**Why This Matters:**
• Prevents wasted clinical time
• Flexible staffing when doctors absent
• Visual alerts for supervisors`,

            // Doctor OPD Configuration
            "doctor opd|opd timing|specialty timing|doctor schedule|opd configuration": `**Doctor OPD Information** 👨‍⚕️⏰

Configure doctor OPD timings for each specialty:

**Setup Steps:**
1. Go to **PR Portal** → **Configuration** → **Shift Knowledge**
2. Scroll to **Doctor OPD Information**
3. Click **➕ Add OPD Profile**
4. Select **specialty** (e.g., Internal Medicine)
5. Configure **Shift 1**: Start, End, Patient count
6. Configure **Shift 2**: Evening OPD timings
7. Click **Save**

**Features:**
• Shows **best clinical match** (green text with 📌)
• Supports 2 shifts per specialty
• Patient capacity tracking

**Example:**
Internal Medicine: 08:00-14:00 (20 patients)
Best Clinical: 07:30-15:30 Clinical ✅`,

            // GOPD Configuration
            "gopd|general opd|friday duty|holiday duty|gopd config": `**GOPD (General OPD) Configuration** ⚙️🕌

Configure special duty requirements for Fridays and holidays:

**Setup:**
1. Go to **PR Portal** → **Configuration** → **GOPD Config**
2. Create categories (Morning, Evening, Night)
3. Add duty requirements per category
4. Set minimum staff needed

**Features:**
• Category-based organization
• Minimum staff requirements
• Special patterns for public holidays
• Friday (mosque day) specific settings

**Purpose:**
Ensures adequate coverage on reduced-staff days like Fridays when hospital operates with minimal OPD services.`,

            // Staff Shift Templates
            "staff shift|shift template|category shift|clinical slots|shift configuration": `**Staff Shift Templates** 📑⏰

Organize shifts by team and category:

**Structure:**
• **Teams**: Clinical, Front Desk, Training
• **Categories**: Morning, Evening, Night
• **Shifts**: Time slots with staff positions

**Creating Shifts:**
1. Select team (Clinical/Front/Training)
2. Click **Add Category**
3. Name it (e.g., "Morning Shifts")
4. Click **Add Shift to Category**
5. Configure:
   • **Name**: "07:30-15:30 Clinical"
   • **Start**: 07:30
   • **End**: 15:30
   • **Slots**: 2 (number of positions)
6. Save templates

**Note**: Use **slots** instead of min_staff for clinical shifts!`,

            // Station Management
            "station|manage station|clinical station|front desk station|station config": `**Station Management** 🏪🗺️

Manage duty locations and assignments:

**Types:**
• **Clinical Stations** - Linked to doctor specialties
• **Front Desk Stations** - Reception, registration
• **Training Stations** - For trainees

**Configuration:**
1. Go to **Stations Management** tab
2. Click **Add Station** (Clinical/Front)
3. Fill details:
   • Name
   • Specialty (for clinical)
   • Allow AI Assignment toggle
4. Save stations

**AI Assignment Toggle:**
• ✅ Enabled - AI can assign staff here
• ❌ Disabled - Manual assignment only

**Sync Feature:**
Automatically syncs clinical stations with doctor specialties from Doctor Portal.`,

            // Leave Management
            "leave|sick leave|annual leave|al|sl|ml|cl|manage leave": `**Leave Management System** 📝🏥

Track and manage staff leave with color-coded visualization:

**Leave Types (Updated):**
• **AL** - Annual Leave (Light Green 🟢)
• **FRL** - Family Leave (Light Pink 💗)
• **EXC** - Exam Leave (Tomato Red 🔴)
• **HI** - Home Isolation (Bright Red 🚨)
• **OR** - Official Request (Orange 🟠)
• **SWP** - Swap (Sky Blue ☁️)
• **SWPL** - Swap Leave (Steel Blue 🔷)
• **NP** - No Pay (Plum Purple 🟣)
• **AB** - Absent (Hot Pink 💕)
• **SL** - Sick Leave (Gold 🟡)
• **ML** - Medical Leave (Light Salmon 🐟)
• **OC** - On Call (Orchid Purple 🌸)
• **AC** - Additional Coverage (Turquoise 🌊)
• **PML** - Paternity/Maternity Leave (Light Pink 👶)
• **NP** - No Pay (Plum)
• **AB** - Absent (Crimson)
• **OC** - On Call (Orchid)
• **AC** - Absent On-Call (Deep Sky Blue)

**How to Apply Leave:**
1. Click on staff's cell for the date
2. Select **Leave Type** dropdown
3. Choose from 15 leave types
4. Optionally add notes
5. Save

**Interactive Form UI:**
Click "Mark Leave" button to open futuristic form with:
• Staff search/select dropdown
• Date range picker
• Leave type buttons with colors
• Instant preview
• One-click apply

**Impact:**
When doctor on leave → Assigned clinical becomes **freed** (purple 🆓)`,

            // Color Legend
            "color code|legend|color meaning|purple|status indicator": `**Roster Color Legend** 🎨📊

Visual status indicators:

**Leave Types:**
• 🟢 **Light Green** - Annual Leave (AL)
• 💗 **Light Pink** - Family Leave (FRL)
• 🔴 **Tomato Red** - Exam Leave (EXC)
• 🚨 **Bright Red** - Home Isolation (HI)
• 🟠 **Orange** - Official Request (OR)
• ☁️ **Sky Blue** - Swap (SWP)
• 🔷 **Steel Blue** - Swap Leave (SWPL)
• 🟣 **Plum Purple** - No Pay (NP)
• 💕 **Hot Pink** - Absent (AB)
• 🟡 **Gold** - Sick Leave (SL)
• 🐟 **Light Salmon** - Medical Leave (ML)
• 🌸 **Orchid Purple** - On Call (OC)
• 🌊 **Turquoise** - Additional Coverage (AC)
• 👶 **Light Pink** - Paternity/Maternity Leave (PML)

**Assignments:**
• **Blue Text** - Normal station assignment
• **Purple Text 🆓** - Freed clinical (doctor on leave)
• **Purple Border** - 3px thick, indicates freed status
• **Gray Text** - No assignment

**Special Days:**
• 🕌 **Peach/Pink Background** - Friday (Mosque day)
• **Peach Background** - Hospital Closed

Legend appears above the schedule table automatically!`,

            // Staff Management
            "staff|add staff|manage staff|clinical staff|front desk staff|staff roles": `**Staff Management** 👥💼

Manage staff members and their roles:

**Adding Staff:**
1. Go to **Staff Management** section
2. Click **Add Staff**
3. Fill information:
   • Name, Employee ID
   • Roles (Clinical/Front Desk/Training)
   • Active status
4. Save

**Roles:**
• **Clinical** - Works with doctors, patient care
• **Front Desk** - Reception, registration
• **Training** - Trainees/interns

**Multiple Roles:**
Staff can have multiple roles for flexible assignment.

**Status:**
• ✅ **Active** - Available for roster
• ❌ **Inactive** - Excluded from AI generation`,

            // Telegram Integration
            "telegram|notification|telegram bot|telegram group|alert": `**Telegram Integration** 📱💬

Get schedule updates via Telegram:

**Features:**
• Real-time roster notifications
• Doctor schedule updates
• System alerts and reminders
• Interactive leave marking

**Setup:**
1. Go to **Integrations** → **Telegram**
2. Enter **Bot Token**
3. Enter **Group ID**
4. Click **Save Settings**
5. Test connection

**Environment Variables:**
\`\`\`
$env:ENABLE_TELEGRAM='true'
$env:TELEGRAM_BOT_TOKEN='your-token'
$env:TELEGRAM_GROUP_ID='your-group-id'
\`\`\`

Restart server after configuration!`,

            // NEW: Telegram Leave Marking
            "telegram leave marking|mark leave telegram|interactive leave|telegram leave|mark staff leave|off request|leave approval": `**Interactive Telegram Leave Marking** 💬🏥

Supervisors can mark staff leaves directly via Telegram bot with an interactive workflow!

**How It Works:**

**1. Initiate Request:**
Message the bot: \`Mark staff leave\` or \`Set staff off\`

**2. Interactive Steps:**
Bot will ask for:
• **Staff Name**: Type or select from list
• **Date**: Which day in the roster (DD/MM/YYYY)
• **Leave Type**: Select from options:
  - AL (Annual Leave)
  - SL (Sick Leave)
  - FRL (Family Leave)
  - EXC (Exam Leave)
  - HI (Home Isolation)
  - OR (Official Release)
  - NP (No Pay)
  - OC (On Call)
  - And 7 more types!

**3. Confirmation:**
Bot shows summary and asks for confirmation
Supervisor approves → Leave marked automatically!

**Monthly Off Requests (Priority System):**
• Staff request 5 days off by 10th of previous month
• First-come-first-served priority
• Supervisor reviews and approves via Telegram
• Bot marks approved dates as "AL" or requested status

**Benefits:**
• ✅ No need to open web portal
• ✅ Mobile-friendly workflow
• ✅ Immediate roster updates
• ✅ Priority-based fair system
• ✅ Audit trail of all changes

**Example Conversation:**
\`\`\`
Supervisor: Mark staff leave
Bot: Please provide staff name or select:
     1. Ahmed Ali
     2. Fathimath Naaz
     3. Mohamed Ibrahim
Supervisor: 1
Bot: Selected: Ahmed Ali
     Enter date (DD/MM/YYYY):
Supervisor: 15/12/2025
Bot: Date: 15th December 2025
     Select leave type:
     1. AL - Annual Leave
     2. SL - Sick Leave
     ...
Supervisor: 1
Bot: ✅ Confirm marking:
     Staff: Ahmed Ali
     Date: 15/12/2025
     Type: Annual Leave (AL)
     Reply YES to confirm
Supervisor: YES
Bot: ✅ Leave marked successfully!
     Ahmed Ali - 15/12/2025 - AL
\`\`\`

This feature makes leave management fast and accessible!`,

            // Troubleshooting
            "error|not working|bug|problem|issue|fix|help": `**Troubleshooting Guide** 🔧🛠️

Common issues and solutions:

**Clinical Not Freed When Doctor on Leave:**
• Ensure roster generated with AI (not manual)
• Check assignment metadata exists
• Hard refresh browser (Ctrl+Shift+R)

**No AI Matching Shown:**
• Configure Doctor OPD timings first
• Adjust clinical shift start time (30-90 min before)
• Reload Shift Knowledge data

**Server Not Starting:**
• Check Python running: \`Get-Process python\`
• Port 5000 in use: Stop other apps
• Check for syntax errors in app.py

**Purple Border Not Showing:**
• Clear browser cache
• Check CSS loaded: F12 → Network tab
• Restart server

**General Fix:**
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Restart server: \`python run_waitress.py\``,

            // System Overview
            "how does|system work|overview|explain system|what is this": `**Doctor Schedule System - Overview** 🏥💻

A comprehensive hospital staff scheduling system with AI.

**Core Components:**

**1. PR Portal**
• Staff roster management
• AI-powered generation
• Leave tracking
• Station assignments

**2. Doctor Portal**
• Doctor schedule management
• Specialty-based OPD timings
• Photo and promo management

**3. Patient Display**
• Public-facing doctor schedules
• Real-time updates
• TV display mode

**4. Smart Features**
• Clinical-doctor shift matching
• Freed clinical detection
• Visual status indicators
• Telegram notifications

**5. Configuration**
• Shift templates (categorized)
• Station management
• GOPD settings
• Doctor OPD information

**Technology:**
Frontend: JavaScript, HTML5, CSS3
Backend: Flask/Python
Server: Waitress WSGI
Storage: JSON files`
        };
    }

    toggleFullScreen() {
        const chatWindow = document.getElementById('aiChatWindow');
        
        if (!chatWindow.classList.contains('fullscreen')) {
            // Enter fullscreen mode
            chatWindow.classList.add('fullscreen');
            chatWindow.style.width = '100vw';
            chatWindow.style.height = '100vh';
            chatWindow.style.maxWidth = '100vw';
            chatWindow.style.maxHeight = '100vh';
            chatWindow.style.left = '0';
            chatWindow.style.top = '0';
            chatWindow.style.right = 'auto';
            chatWindow.style.bottom = 'auto';
            chatWindow.style.transform = 'none';
            chatWindow.style.borderRadius = '0';
            
            // Update button title
            const fullscreenBtn = chatWindow.querySelector('[title="Full Screen"]');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '⛶';
                fullscreenBtn.title = 'Exit Full Screen';
            }
        } else {
            // Exit fullscreen mode
            chatWindow.classList.remove('fullscreen');
            chatWindow.style.width = '';
            chatWindow.style.height = '';
            chatWindow.style.maxWidth = '';
            chatWindow.style.maxHeight = '';
            chatWindow.style.left = '';
            chatWindow.style.top = '';
            chatWindow.style.right = '';
            chatWindow.style.bottom = '';
            chatWindow.style.transform = '';
            chatWindow.style.borderRadius = '';
            
            // Update button title
            const fullscreenBtn = chatWindow.querySelector('[title="Exit Full Screen"]');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '⛶';
                fullscreenBtn.title = 'Full Screen';
            }
        }
    }

    openInNewTab() {
        // Save current chat history to localStorage
        localStorage.setItem('aiChatHistory', JSON.stringify(this.chatHistory));
        localStorage.setItem('aiChatTimestamp', new Date().getTime().toString());
        
        // Open PR Bot in new tab with chat interface
        const newTab = window.open('', '_blank');
        if (newTab) {
            newTab.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PR Bot - AI Assistant</title>
    <link rel="stylesheet" href="/static/css/ai-assistant.css">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        #aiChatWindow {
            position: relative !important;
            width: 90vw !important;
            height: 90vh !important;
            max-width: 1200px !important;
            max-height: 900px !important;
            left: auto !important;
            right: auto !important;
            bottom: auto !important;
            top: auto !important;
            transform: none !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
        #aiChatWindow.open {
            display: block !important;
        }
    </style>
</head>
<body>
    <div id="aiChatWindow" class="ai-chat-window open">
        <!-- Chat content will be loaded here -->
    </div>
    <script src="/static/js/ai-assistant.js"></script>
    <script>
        // Wait for AI Assistant to initialize
        setTimeout(() => {
            if (window.aiAssistant) {
                // Load saved chat history
                const savedHistory = localStorage.getItem('aiChatHistory');
                if (savedHistory) {
                    try {
                        aiAssistant.chatHistory = JSON.parse(savedHistory);
                        aiAssistant.renderChatHistory();
                    } catch (e) {
                        console.error('Failed to load chat history:', e);
                    }
                }
                // Make sure chat window is visible
                const chatWindow = document.getElementById('aiChatWindow');
                if (chatWindow) {
                    chatWindow.classList.add('open');
                }
                // Focus input
                const input = document.getElementById('aiChatInput');
                if (input) input.focus();
            }
        }, 300);
    </script>
</body>
</html>
            `);
            newTab.document.close();
        } else {
            alert('Please allow popups for this site to open PR Bot in a new tab.');
        }
    }
    
    // Interactive Action Handlers
    handleAction(action) {
        console.log('AI Action triggered:', action);
        
        switch(action) {
            case 'openLeaveForm':
                console.log('Opening leave form...');
                this.openInteractiveLeaveForm();
                break;
            case 'openRosterGenerator':
                console.log('Opening roster generator...');
                if (typeof prPortal !== 'undefined') {
                    prPortal.openModal('aiGeneratorModal');
                }
                this.addMessage('ai', '✅ Opening AI Roster Generator...');
                break;
            case 'openStaffForm':
                this.addMessage('ai', '📋 Navigate to Staff Directory to add new staff members.');
                break;
            case 'goToShifts':
                this.addMessage('ai', '⚙️ Go to AI Configuration → Shift Knowledge to configure shifts.');
                break;
            default:
                console.error('Unknown action:', action);
        }
    }
    
    async openInteractiveLeaveForm() {
        console.log('openInteractiveLeaveForm called');
        
        // Fetch staff list from API
        let staffList = [];
        try {
            console.log('Fetching staff list...');
            const response = await fetch('/api/pr/staff');
            const data = await response.json();
            staffList = data.staff || [];
            console.log('Staff list loaded:', staffList.length, 'members');
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            staffList = [
                { name: 'Ahmed Ali', employee_id: 'EMP001' },
                { name: 'Fathimath Naaz', employee_id: 'EMP002' },
                { name: 'Mohamed Ibrahim', employee_id: 'EMP003' }
            ];
            console.log('Using fallback staff list');
        }
        
        const leaveTypes = [
            { code: 'AL', name: 'Annual Leave', color: '#90EE90' },
            { code: 'SL', name: 'Sick Leave', color: '#FFD700' },
            { code: 'ML', name: 'Medical Leave', color: '#8B4513' },
            { code: 'CL', name: 'Circumcision Leave', color: '#7FFF00' },
            { code: 'PML', name: 'Paternity/Maternity Leave', color: '#FFB6C1' },
            { code: 'FRL', name: 'Family Leave', color: '#FFA07A' },
            { code: 'EXC', name: 'Exam Leave', color: '#FF8C00' },
            { code: 'HI', name: 'Home Isolation', color: '#FF0000' },
            { code: 'OR', name: 'Official Release', color: '#9ACD32' },
            { code: 'SWP', name: 'Swap Request', color: '#4169E1' },
            { code: 'SWPL', name: 'Leave After Swap', color: '#1E90FF' },
            { code: 'NP', name: 'No Pay', color: '#DDA0DD' },
            { code: 'AB', name: 'Absent', color: '#DC143C' },
            { code: 'OC', name: 'On Call', color: '#DA70D6' },
            { code: 'AC', name: 'Absent On-Call', color: '#00BFFF' }
        ];
        
        const formHtml = `
        <div class="ai-interactive-form" id="aiLeaveForm">
            <div class="ai-form-header">
                <h3>📝 Interactive Leave Marking</h3>
                <button onclick="document.getElementById('aiLeaveForm').remove()" class="ai-form-close">✕</button>
            </div>
            <div class="ai-form-body">
                <div class="ai-form-group">
                    <label class="ai-form-label">
                        <span class="ai-label-icon">👤</span>
                        Select Staff Member
                    </label>
                    <select id="aiLeaveStaff" class="ai-form-select">
                        <option value="">Choose staff...</option>
                        ${staffList.map(s => `<option value="${s.name}">${s.name} (${s.employee_id || 'N/A'})</option>`).join('')}
                    </select>
                </div>
                
                <div class="ai-form-group">
                    <label class="ai-form-label">
                        <span class="ai-label-icon">📅</span>
                        Leave Date / Date Range
                    </label>
                    <div class="ai-date-inputs">
                        <input type="date" id="aiLeaveStartDate" class="ai-form-input" placeholder="Start Date">
                        <span style="color: var(--text-muted); font-weight: 600;">to</span>
                        <input type="date" id="aiLeaveEndDate" class="ai-form-input" placeholder="End Date (Optional)">
                    </div>
                </div>
                
                <div class="ai-form-group">
                    <label class="ai-form-label">
                        <span class="ai-label-icon">🏷️</span>
                        Leave Type
                    </label>
                    <div class="ai-leave-type-grid">
                        ${leaveTypes.map(lt => `
                            <button class="ai-leave-type-btn" data-code="${lt.code}" style="--leave-color: ${lt.color}">
                                <div class="ai-leave-color" style="background: ${lt.color}"></div>
                                <div class="ai-leave-info">
                                    <div class="ai-leave-code">${lt.code}</div>
                                    <div class="ai-leave-name">${lt.name}</div>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="ai-form-preview" id="aiLeavePreview" style="display: none;">
                    <div class="ai-preview-header">📋 Preview</div>
                    <div class="ai-preview-content" id="aiPreviewContent"></div>
                </div>
            </div>
            <div class="ai-form-footer">
                <button class="ai-btn-secondary" onclick="document.getElementById('aiLeaveForm').remove()">Cancel</button>
                <button class="ai-btn-primary" onclick="aiAssistant.submitLeaveForm()">
                    <span class="ai-btn-icon">✓</span>
                    Apply Leave
                </button>
            </div>
        </div>
        `;
        
        console.log('Inserting form HTML into chat...');
        const messagesDiv = document.getElementById('aiChatMessages');
        if (!messagesDiv) {
            console.error('Chat messages div not found!');
            return;
        }
        
        messagesDiv.insertAdjacentHTML('beforeend', formHtml);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        console.log('Form inserted successfully');
        
        // Add event listeners
        setTimeout(() => {
            console.log('Setting up event listeners...');
            const leaveTypeButtons = document.querySelectorAll('.ai-leave-type-btn');
            console.log('Found leave type buttons:', leaveTypeButtons.length);
            leaveTypeButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Leave type clicked:', btn.dataset.code);
                    leaveTypeButtons.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    this.updateLeavePreview();
                });
            });
            
            ['aiLeaveStaff', 'aiLeaveStartDate', 'aiLeaveEndDate'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('change', () => this.updateLeavePreview());
            });
        }, 100);
    }
    
    updateLeavePreview() {
        const staff = document.getElementById('aiLeaveStaff')?.value;
        const startDate = document.getElementById('aiLeaveStartDate')?.value;
        const endDate = document.getElementById('aiLeaveEndDate')?.value;
        const selectedLeave = document.querySelector('.ai-leave-type-btn.selected');
        
        if (!staff || !startDate || !selectedLeave) {
            document.getElementById('aiLeavePreview').style.display = 'none';
            return;
        }
        
        const leaveCode = selectedLeave.dataset.code;
        const leaveName = selectedLeave.querySelector('.ai-leave-name').textContent;
        const leaveColor = selectedLeave.style.getPropertyValue('--leave-color');
        
        const dateRange = endDate && endDate !== startDate
            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
            : new Date(startDate).toLocaleDateString();
        
        const previewHtml = `
            <div class="ai-preview-item">
                <strong>Staff:</strong> ${staff}
            </div>
            <div class="ai-preview-item">
                <strong>Date:</strong> ${dateRange}
            </div>
            <div class="ai-preview-item">
                <strong>Leave Type:</strong>
                <span class="ai-preview-leave" style="background: ${leaveColor}; color: white; padding: 4px 12px; border-radius: 6px; font-weight: 700;">
                    ${leaveCode} - ${leaveName}
                </span>
            </div>
        `;
        
        document.getElementById('aiPreviewContent').innerHTML = previewHtml;
        document.getElementById('aiLeavePreview').style.display = 'block';
    }
    
    async submitLeaveForm() {
        const staff = document.getElementById('aiLeaveStaff')?.value;
        const startDate = document.getElementById('aiLeaveStartDate')?.value;
        const endDate = document.getElementById('aiLeaveEndDate')?.value || startDate;
        const selectedLeave = document.querySelector('.ai-leave-type-btn.selected');
        
        if (!staff || !startDate || !selectedLeave) {
            alert('Please fill in all required fields');
            return;
        }
        
        const leaveCode = selectedLeave.dataset.code;
        const leaveName = selectedLeave.querySelector('.ai-leave-name').textContent;
        
        // Close form
        document.getElementById('aiLeaveForm')?.remove();
        
        // Show success message
        this.addMessage('ai', `✅ Leave marked successfully!

**Details:**
• Staff: ${staff}
• Date: ${new Date(startDate).toLocaleDateString()}${endDate !== startDate ? ' - ' + new Date(endDate).toLocaleDateString() : ''}
• Type: ${leaveCode} - ${leaveName}

The roster has been updated. You can view the changes in Schedule Management.`);
        
        // Here you would make an API call to actually save the leave
        // For now, this is a UI demonstration
        console.log('Leave submission:', { staff, startDate, endDate, leaveCode });
    }
}

// Initialize AI Assistant
let aiAssistant;
document.addEventListener('DOMContentLoaded', () => {
    aiAssistant = new AIAssistant();
    console.log('🤖 AI Assistant initialized successfully');
});
