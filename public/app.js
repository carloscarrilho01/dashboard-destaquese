let ws;
let currentContact = null;
let allContacts = [];
let allMessages = [];

function init() {
    connectWebSocket();
    loadStats();
    loadContacts();
    setupSearchFilter();
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket conectado');
        updateConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };

    ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        updateConnectionStatus('disconnected');
    };

    ws.onclose = () => {
        console.log('WebSocket desconectado');
        updateConnectionStatus('disconnected');
        setTimeout(connectWebSocket, 3000);
    };
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    const statusText = statusElement.querySelector('.status-text');

    statusElement.className = `connection-status ${status}`;

    if (status === 'connected') {
        statusText.textContent = 'Conectado';
    } else if (status === 'disconnected') {
        statusText.textContent = 'Desconectado';
    } else {
        statusText.textContent = 'Conectando...';
    }
}

function handleWebSocketMessage(data) {
    if (data.type === 'new_message') {
        const message = data.data;

        if (currentContact && message.phone_number === currentContact) {
            addMessageToView(message);
        }

        loadStats();
        loadContacts();

        playNotificationSound();
    } else if (data.type === 'status_update') {
        updateMessageStatus(data.data.id, data.data.status);
        loadStats();
    }
}

function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMlBSh+zPDZjToIGGS46+ikUhELTKXh8bllHAU7k9n0zoQwBx9xx/HdlEcNE1ms6OytWhkIP5XY88BpIgQsgsrv15BAChZiuejtpVIRC0mi4PK8aB8GM4nU8tGFMwcfccfw3JJFDBFYrOfrrlsZCECY2fO/aiMELIHJ8NiQQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMlBSh+zPDZjToIGGS46+ikUhELTKXh8bllHAU7k9n0zoQwBx9xx/HdlEcNE1ms6OytWhkIP5XY88BpIgQsgsrv15BAChZiuejtpVIRC0mi4PK8aB8GM4nU8tGFMwcfccfw3JJFDBFYrOfrrlsZCECY2fO/aiMELIHJ8NiQQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMlBSh+zPDZjToIGGS46+ikUhELTKXh8bllHAU7k9n0zoQwBx9xx/HdlEcNE1ms6OytWhkIP5XY88BpIgQsgsrv15BAChZiuejtpVIRC0mi4PK8aB8GM4nU8tGFMwcfccfw3JJFDBFYrOfrrlsZCECY2fO/aiMELIHJ8NiQQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMlBSh+zPDZjToIGGS46+ikUhELTKXh8bllHAU7k9n0zoQwBx9xx/HdlEcNE1ms6OytWhkIP5XY88BpIgQsgsrv15BAChZiuejtpVIRC0mi4PK8aB8GM4nU8tGFMwcfccfw3JJFDBFYrOfrrlsZCECY2fO/aiMELIHJ8NiQQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMlBSh+zPDZjToIGGS46+ikUhELTKXh8bllHAU7k9n0zoQwBx9xx/HdlEcNE1ms6OytWhkIP5XY88BpIgQsgsrv15BAChZiuejtpVIRC0mi4PK8aB8GM4nU8tGFMwcfccfw');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Não foi possível reproduzir o som'));
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        document.getElementById('total-messages').textContent = stats.total_messages || 0;
        document.getElementById('total-contacts').textContent = stats.total_contacts || 0;
        document.getElementById('messages-today').textContent = stats.messages_today || 0;
        document.getElementById('pending-messages').textContent = stats.pending_messages || 0;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

async function loadContacts() {
    try {
        const response = await fetch('/api/contacts');
        allContacts = await response.json();
        renderContacts(allContacts);
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
    }
}

function renderContacts(contacts) {
    const contactsList = document.getElementById('contacts-list');

    if (contacts.length === 0) {
        contactsList.innerHTML = '<div class="loading">Nenhum contato encontrado</div>';
        return;
    }

    contactsList.innerHTML = contacts.map(contact => `
        <div class="contact-item ${currentContact === contact.phone_number ? 'active' : ''}"
             onclick="selectContact('${contact.phone_number}')">
            <div class="contact-name">${contact.name || 'Desconhecido'}</div>
            <div class="contact-phone">${contact.phone_number}</div>
            <div class="contact-info">
                <span class="contact-messages">${contact.total_messages} mensagens</span>
                <span class="contact-time">${formatDate(contact.last_interaction)}</span>
            </div>
        </div>
    `).join('');
}

function setupSearchFilter() {
    const searchInput = document.getElementById('search-contact');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = allContacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.phone_number.includes(searchTerm)
        );
        renderContacts(filtered);
    });
}

async function selectContact(phoneNumber) {
    currentContact = phoneNumber;

    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const contact = allContacts.find(c => c.phone_number === phoneNumber);
    document.getElementById('current-contact').textContent = contact ? contact.name : phoneNumber;

    await loadMessages(phoneNumber);
}

async function loadMessages(phoneNumber) {
    try {
        const response = await fetch(`/api/conversations?phone_number=${phoneNumber}&limit=200`);
        allMessages = await response.json();
        renderMessages(allMessages);
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messages-container');

    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhuma mensagem encontrada</p></div>';
        return;
    }

    container.innerHTML = messages.reverse().map(msg => `
        <div class="message ${msg.message_type}">
            <div class="message-bubble">
                <div class="message-text">${escapeHtml(msg.message)}</div>
                <div class="message-footer">
                    <span class="message-time">${formatDateTime(msg.timestamp)}</span>
                    <span class="message-status ${msg.status}">${msg.status}</span>
                </div>
            </div>
        </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
}

function addMessageToView(message) {
    const container = document.getElementById('messages-container');
    const emptyState = container.querySelector('.empty-state');

    if (emptyState) {
        container.innerHTML = '';
    }

    const messageHtml = `
        <div class="message ${message.message_type}">
            <div class="message-bubble">
                <div class="message-text">${escapeHtml(message.message)}</div>
                <div class="message-footer">
                    <span class="message-time">${formatDateTime(message.timestamp)}</span>
                    <span class="message-status ${message.status || 'pending'}">${message.status || 'pending'}</span>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', messageHtml);
    container.scrollTop = container.scrollHeight;
}

function updateMessageStatus(messageId, status) {
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => {
        const statusSpan = msg.querySelector('.message-status');
        if (statusSpan && msg.dataset.id === messageId.toString()) {
            statusSpan.className = `message-status ${status}`;
            statusSpan.textContent = status;
        }
    });
}

function filterMessages() {
    const filterType = document.getElementById('filter-type').value;

    if (filterType === 'all') {
        renderMessages(allMessages);
    } else {
        const filtered = allMessages.filter(msg => msg.message_type === filterType);
        renderMessages(filtered);
    }
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (date.toDateString() === today.toDateString()) {
        return `Hoje ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
        return `Ontem ${timeStr}`;
    } else {
        return date.toLocaleDateString('pt-BR') + ' ' + timeStr;
    }
}

function formatDate(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
    } else {
        return date.toLocaleDateString('pt-BR');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', init);

setInterval(loadStats, 30000);
