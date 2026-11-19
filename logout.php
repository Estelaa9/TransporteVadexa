<?php
// Ruta heredada: la aplicación vive en frontend/. El cierre de sesión se hace por POST desde la SPA.
header('Location: frontend/index.html#logout');
exit;
