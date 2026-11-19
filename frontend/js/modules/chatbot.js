// frontend/js/modules/chatbot.js - Asistente de consultas basado en reglas (UX-01): reconoce palabras clave; no es inteligencia artificial.
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
        addBotMessage('Hola. Soy el asistente de consultas de VADEXSA (basado en reglas) y estoy conectado a todos los módulos.\nPrueba con:\n• servicios de mañana · servicio #15\n• cliente andina · placa BXK-481 · conductor Pedro\n• F001-000012 · cuentas por cobrar · deudores\n• resultado del mes · diagnóstico del mes\nEscribe «ayuda» para ver todo lo que puedo responder.');
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
    // SEG-13: la respuesta se muestra como texto; los saltos de línea se respetan con CSS.
    div.style.whiteSpace = 'pre-line';
    div.textContent = String(text ?? '');
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
