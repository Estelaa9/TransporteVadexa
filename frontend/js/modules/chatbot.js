// frontend/js/modules/chatbot.js - Asistente Virtual Inteligente VADEXSA
import { api } from '../api.js';

export function initChatbot() {
  const fab = document.getElementById('tms-chat-fab');
  const panel = document.getElementById('tms-chat-panel');
  const closeBtn = document.getElementById('chat-close-btn');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const messagesContainer = document.getElementById('chat-messages');

  if (!fab || !panel) return;

  function toggleChat() {
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      panel.classList.remove('open');
    } else {
      panel.classList.add('open');
      input.focus();
      if (messagesContainer.children.length === 0) {
        addBotMessage("¡Hola! Soy el asistente inteligente de **VADEXSA LOGISTIC** 🤖🚚\n\n¿En qué puedo ayudarte hoy?\n• Consulta de servicios del día\n• Estado de un servicio por ID\n• Facturación y utilidad del mes\n• Disponibilidad de conductores");
      }
    }
  }

  fab.addEventListener('click', toggleChat);
  if (closeBtn) closeBtn.addEventListener('click', toggleChat);

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-bubble user';
    div.textContent = text;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-bubble bot';
    div.innerHTML = text.replace(/\n/g, '<br>');
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-bubble bot';
    div.id = 'chat-typing-indicator';
    div.style.color = '#64748b';
    div.style.fontStyle = 'italic';
    div.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Consultando datos...`;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('chat-typing-indicator');
    if (el) el.remove();
  }

  async function handleSend(pregunta) {
    if (!pregunta) return;
    addUserMessage(pregunta);
    input.value = '';
    showTyping();

    try {
      const res = await api.post('chatbot/responder.php', { pregunta });
      removeTyping();
      if (res.success && res.respuesta) {
        addBotMessage(res.respuesta);
      } else {
        addBotMessage('No pude obtener una respuesta en este momento.');
      }
    } catch (err) {
      removeTyping();
      addBotMessage(err.message || 'Error al conectar con el servidor.');
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pregunta = input.value.trim();
    if (pregunta) handleSend(pregunta);
  });

  document.querySelectorAll('.chat-quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const pregunta = chip.dataset.query;
      if (pregunta) handleSend(pregunta);
    });
  });
}
