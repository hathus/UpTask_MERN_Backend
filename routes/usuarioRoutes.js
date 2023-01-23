import express from 'express';
//Mandamos a llamar de express Router
const router = express.Router();
//Importamos el controlador de usuarios
import { registrar, autenticar, confirmar, resetPassword, validarToken, nuevoPassword, perfil } from '../controllers/usuarioController.js';
// Importamos el middleware de checkAuth
import checkAuth from '../middleware/checkAuth.js';

//Creamos los verbos que ocupemos GET, POST, PUT, DELETE, etc
// Creación, Autenticación y Confirmación de Usuarios
router.post("/", registrar); // Crea un nuevo usuario
router.post("/login", autenticar); // Creamos la ruta de autenticación de usuarios
router.get("/confirmar/:token", confirmar); // Ruta para confirmar la cuenta con routing dinámico
router.post("/reset-password", resetPassword); // Ruta para resetear el password olvidado
//router.get("/reset-password/:token", validarToken); //Validar token
//router.post("/reset-password/:token", nuevoPassword); // Ingresamos el nuevo password
// Express nos permite compactar rutas para evitar repetirlas
router.route("/reset-password/:token")
    .get(validarToken)
    .post(nuevoPassword);

// Se crea la ruta para el middleware de auth
router.get("/perfil", checkAuth, perfil);

export default router;