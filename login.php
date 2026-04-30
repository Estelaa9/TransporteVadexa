<?php session_start(); ?>

<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">
<title>VADEXA LOGISTIC | Sistema de Transporte</title>

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

<style>

body{
background: linear-gradient(135deg,#0d6efd,#1e3c72);
height:100vh;
display:flex;
align-items:center;
justify-content:center;
font-family: Arial;
}

.login-card{
border-radius:12px;
box-shadow:0 10px 30px rgba(0,0,0,0.2);
}

.logo{
font-size:28px;
font-weight:bold;
color:#0d6efd;
}

.subtitle{
font-size:14px;
color:#6c757d;
}

.btn-primary{
background:#0d6efd;
border:none;
}

.btn-primary:hover{
background:#084298;
}
.logo-img{
max-width:200px;
margin-bottom:10px;
}
</style>

</head>

<body>

<div class="container">

<div class="row justify-content-center">

<div class="col-md-4">

<div class="card login-card">

<div class="card-body p-4">

<div class="text-center mb-4">

<div class="logo"></div>

<div class="text-center mb-4">

<img src="assets/img/logo.png" width="200">

<div class="subtitle">
Sistema de Transporte y Mudanzas
</div>

</div>

<form method="POST" action="validar_login.php">

<div class="mb-3">

<label class="form-label">Usuario</label>

<input type="text" name="usuario" class="form-control" placeholder="Ingrese su usuario" required>

</div>

<div class="mb-3">

<label class="form-label">Contraseña</label>

<input type="password" name="password" class="form-control" placeholder="Ingrese su contraseña" required>

</div>

<div class="d-grid">

<button class="btn btn-primary">
Ingresar al Sistema
</button>

</div>

</form>

</div>

<div class="card-footer text-center text-muted">

VADEXSA LOGISTIC © <?php echo date("Y"); ?>

</div>

</div>

</div>

</div>

</div>

</body>

</html>