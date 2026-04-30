<div class="sidebar">

<div class="logo-area text-center">

<img src="../assets/img/logo.png" width="150">

<h6 class="mt-2">VADEXA LOGISTIC</h6>

</div>

<hr>

<ul class="menu">

<li>
<a href="../dashboard/index.php">
🏠 Dashboard
</a>
</li>

<li>
<a href="../servicios/">
🚚 Servicios
</a>
</li>

<li>
<a href="../clientes/">
👤 Clientes
</a>
</li>

<li>
<a href="../vehiculos/">
🚛 Vehículos
</a>
</li>

<li>
<a href="../conductores/">
🧑‍✈️ Conductores
</a>
</li>

<li>
<a href="../proveedores/">
📦 Proveedores
</a>
</li>

<li>
<a href="../gastos_operativos/">
⛽ Gastos Operativos
</a>
</li>

<li>
<a href="../gastos_administrativos/">
🏢 Gastos Administrativos
</a>
</li>

<li>
<a href="../reportes/">
📊 Reportes
</a>
</li>

<li>
<a href="../servicios/programacion.php">
<i class="bi bi-calendar-event"></i> Programación
</a>
</li>

<li>
<a href="../logout.php">
🚪 Cerrar sesión
</a>
</li>

</ul>

</div>

<!-- CHATBOT -->
<div id="chat-btn" onclick="toggleChat()" style="position:fixed;bottom:24px;right:24px;z-index:9999;
  background:#0d6efd;color:#fff;width:52px;height:52px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:22px;
  box-shadow:0 2px 10px rgba(0,0,0,0.2);">
  <i class="bi bi-chat-dots-fill"></i>
</div>

<div id="chat-box" style="display:none;position:fixed;bottom:90px;right:24px;z-index:9999;
  width:340px;background:#fff;border:1px solid #dee2e6;
  border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.15);flex-direction:column;">
  <div style="background:#0d6efd;color:#fff;padding:12px 16px;border-radius:12px 12px 0 0;
    font-weight:500;display:flex;justify-content:space-between;align-items:center;">
    <span><i class="bi bi-robot"></i> Asistente VADEXSA</span>
    <span onclick="toggleChat()" style="cursor:pointer;font-size:18px;">&times;</span>
  </div>
  <div id="chat-msgs" style="height:300px;overflow-y:auto;padding:12px;font-size:14px;"></div>
  <div style="display:flex;gap:8px;padding:10px;border-top:1px solid #dee2e6;">
    <input id="chat-input" type="text" class="form-control form-control-sm"
           placeholder="Escribe tu pregunta..."
           onkeypress="if(event.key==='Enter') enviarChat()">
    <button class="btn btn-primary btn-sm" onclick="enviarChat()">
      <i class="bi bi-send-fill"></i>
    </button>
  </div>
</div>

<script>
if (typeof window.toggleChat !== 'function') {
  window.toggleChat = function() {
    const box = document.getElementById('chat-box');
    const abierto = box.style.display === 'flex';
    box.style.display = abierto ? 'none' : 'flex';
    if (!abierto && document.getElementById('chat-msgs').innerHTML === '') {
      agregarMensaje('bot', '¡Hola! Soy el asistente de VADEXSA.\n\nPuedo ayudarte con:\n- Servicios del día\n- Estado de un servicio (#ID)\n- Facturación del mes\n- Gastos del mes\n- Utilidad del mes');
    }
  };

  window.agregarMensaje = function(tipo, texto) {
    const msgs = document.getElementById('chat-msgs');
    const esBot = tipo === 'bot';
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom:10px;display:flex;' + (esBot ? 'justify-content:flex-start' : 'justify-content:flex-end');
    div.innerHTML = `<span style="background:${esBot?'#e9ecef':'#0d6efd'};color:${esBot?'#212529':'#fff'};
      padding:8px 12px;border-radius:${esBot?'0 10px 10px 10px':'10px 0 10px 10px'};
      max-width:80%;display:inline-block;font-size:13px;white-space:pre-line">${texto}</span>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  };

  window.enviarChat = function() {
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto) return;

    agregarMensaje('usuario', texto);
    input.value = '';

    const typing = document.createElement('div');
    typing.id = 'typing-indicator';
    typing.style.cssText = 'margin-bottom:10px;color:#6c757d;font-size:12px;';
    typing.textContent = 'Escribiendo...';
    document.getElementById('chat-msgs').appendChild(typing);

    fetch('../chatbot/responder.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'pregunta=' + encodeURIComponent(texto)
    })
    .then(r => r.json())
    .then(d => {
      document.getElementById('typing-indicator')?.remove();
      agregarMensaje('bot', d.respuesta || 'No pude generar una respuesta.');
    })
    .catch(() => {
      document.getElementById('typing-indicator')?.remove();
      agregarMensaje('bot', 'Error al conectar con el servidor.');
    });
  };
}
</script>