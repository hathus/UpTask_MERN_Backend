import Usuario from "../models/Usuario.js";
import generarId from '../helpers/generarId.js';
import generarJWT from '../helpers/generarJWT.js';
import { emailRegistro, emailResetPassword } from "../helpers/email.js";

// Como no sabemos lo que tardará en guardar los datos en la bd, usamos async - await
const registrar = async (req, res) => {

    // Verificamos si el usuario que se esta intentando registrar ya esta en la BD
    // Obtenemos el email del request
    const { email } = req.body;
    // Buscamos el email en la BD
    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
        const error = new Error("El usuario ya ha sido registrado con ese email");
        return res.status(409).json({ msg: error.message });
    }

    // Usamos el try - catch para tener un mejor control del script
    try {
        // Se crea la instancia de usuario y le pasamos el body que viene del request
        const usuario = new Usuario(req.body);
        //Generamos el token del usuario
        usuario.token = generarId();
        // Salvamos los datos de la instancia en la bd
        await usuario.save();

        // Enviamos el email de confirmación de cuenta
        emailRegistro({
            email: usuario.email,
            nombre: usuario.nombre,
            token: usuario.token,
        });

        // Regresamos el mensaje y el usuario guardado
        res.json({
            msg: "Usuario creado correctamente, revisa tu email para confirmar tu cuenta."
        });
    } catch (error) {
        // Si existe un error, lo mandamos a la consola
        console.error(error);
    }
}

/**
 * Función para autenticar a un usuario registrado
 */
const autenticar = async (req, res) => {

    const { email, password } = req.body;

    // Comprobar que el usuario existe
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
        const error = new Error("El usuario no se encuentra registrado");
        return res.status(404).json({ msg: error.message });
    }

    // Comprobar si el usuario esta confirmado
    if (!usuario.confirmado) {
        const error = new Error("Tu cuenta de usuario no ha sido confirmada");
        return res.status(403).json({ msg: error.message });
    }

    // Comprobar que el password coincida
    /**
     * Al comprobar que el password coincide, entonces creamos la respuesta json
     * y generamos el token con el id de usuario
     */
    if (await usuario.comprobarPassword(password)) {
        return res.status(200).json({
            msg: "Bienvenido",
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            token: generarJWT(usuario._id),
        });
    } else {
        const error = new Error("Las credenciales no coinciden");
        return res.status(401).json({ msg: error.message });
    }
}

/**
 * Función para confirmar la cuenta del usuario
 */
const confirmar = async (req, res) => {
    /**
     * Recuperamos el token de los parámetros y lo buscamos si coincide con el
     * que se generó y se almacenó en la BD, si este es null entonces el token no
     * es valido o no coincide
     */
    const { token } = req.params;
    const confirmarUsuario = await Usuario.findOne({ token });
    if (!confirmarUsuario) {
        res.status(403).json({ msg: "Token no valido" });
    }

    /**
     * Si coincide, entonces cambiamos confirmado por true
     * eliminamos el token de un solo uso y ponemos una cadena vacía
     * salvamos los datos en la bd y regresamos la respuesta json
     * que ha sido conformada
     */
    try {
        confirmarUsuario.confirmado = true;
        confirmarUsuario.token = "";
        await confirmarUsuario.save();
        res.status(200).json({ msg: "Su usuario ha sido confirmado" });
    } catch (error) {
        console.error(error.message);
    }

}

/**
 * Función para restablecer el password de un usuario
 */
const resetPassword = async (req, res) => {
    const { email } = req.body;

    // Comprobar que el usuario existe
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
        const error = new Error("El usuario no se encuentra registrado");
        return res.status(404).json({ msg: error.message });
    }

    try {
        usuario.token = generarId();
        await usuario.save();

        // Enviamos el email con las instrucciones para ingresar una nueva contraseña
        emailResetPassword({
            email: usuario.email,
            nombre: usuario.nombre,
            token: usuario.token,
        });

        res.status(200).json({ msg: "Hemos enviado un email con las instrucciones" });
    } catch (error) {
        console.error(error);
    }
}

/**
 * Función que comprueba el usuario y el token
 */
const validarToken = async (req, res) => {
    const { token } = req.params;
    const tokenValido = await Usuario.findOne({ token });

    if (tokenValido) {
        res.status(200).json({ msg: "Token valido, el usuario ha sido encontrado" });
    } else {
        const error = new Error("Token no valido");
        return res.status(404).json({ msg: error.message });
    }
}

/**
 * Función que nos permite reiniciar el password de un usuario existente
 */
const nuevoPassword = async (req, res) => {
    // Obtenemos los datos de los params de request
    const { token } = req.params;
    // Obtenemos el nuevo password del formulario
    const { password } = req.body;

    // comprobamos que el token sea valido
    const usuario = await Usuario.findOne({ token });

    if (usuario) {
        usuario.password = password;
        usuario.token = "";

        try {
            await usuario.save();
            res.status(200).json({ msg: "Su password ha sido restaurado correctamente" });
        } catch (error) {
            console.error(error);
        }
    } else {
        const error = new Error("No se ha podido procesar su solicitud");
        return res.status(400).json({ msg: error.message });
    }
}

/**
 * Función que maneja el perfil del usuario
 */
const perfil = async (req, res) => {
    const { usuario } = req;

    res.json(usuario);
}

export {
    registrar,
    autenticar,
    confirmar,
    resetPassword,
    validarToken,
    nuevoPassword,
    perfil,
}