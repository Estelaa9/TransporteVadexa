<?php
include("../layout/header.php");
include("../layout/sidebar.php");
?>

<div class="content">

<h4>Cambiar contraseña</h4>

<form action="actualizar_password.php" method="POST">
<?php require_once __DIR__ . '/../config/gestion.php'; ?>
<input type="hidden" name="csrf_token" value="<?=htmlspecialchars(gestion_csrf(), ENT_QUOTES, 'UTF-8')?>">

<div class="mb-3">
<label>Nueva contraseña</label>
<input type="password" name="password" class="form-control">
</div>

<button class="btn btn-primary">
Actualizar contraseña
</button>

</form>

</div>
