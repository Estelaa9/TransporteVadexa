<?php

include("../layout/header.php");
include("../layout/sidebar.php");
include("../config/conexion.php");

$id = $_GET['id'];

$sql="SELECT * FROM clientes WHERE id='$id'";
$result=mysqli_query($conn,$sql);
$row=mysqli_fetch_assoc($result);

?>

<div class="content">

<div class="card shadow">

<div class="card-header bg-warning">
<h5>Editar Cliente</h5>
</div>

<div class="card-body">

<form action="actualizar.php" method="POST">

<input type="hidden" name="id" value="<?php echo $row['id']; ?>">

<div class="row">

<div class="col-md-6 mb-3">
<label>Cliente / Empresa</label>
<input type="text" name="nombre" class="form-control"
value="<?php echo $row['nombre']; ?>" required>
</div>

<div class="col-md-6 mb-3">
<label>RUC / DNI</label>
<input type="text" name="documento" class="form-control"
value="<?php echo $row['documento']; ?>">
</div>

<div class="col-md-6 mb-3">
<label>Teléfono</label>
<input type="text" name="telefono" class="form-control"
value="<?php echo $row['telefono']; ?>">
</div>

<div class="col-md-6 mb-3">
<label>Email</label>
<input type="email" name="email" class="form-control"
value="<?php echo $row['email']; ?>">
</div>

<div class="col-md-6 mb-3">
<label>Tipo Cliente</label>

<select name="tipo_cliente" class="form-control">

<option value="Empresa" <?php if($row['tipo_cliente']=="Empresa") echo "selected"; ?>>
Empresa
</option>

<option value="Persona" <?php if($row['tipo_cliente']=="Persona") echo "selected"; ?>>
Persona
</option>

</select>

</div>

<div class="col-md-12 mb-3">
<label>Dirección</label>
<textarea name="direccion" class="form-control"><?php echo $row['direccion']; ?></textarea>
</div>

</div>

<button class="btn btn-primary">
Actualizar Cliente
</button>

<a href="index.php" class="btn btn-secondary">
Volver
</a>

</form>

</div>

</div>

</div>