import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

/**
 * Función que nos permite verificar el token de un usuario y guardar sus datos de sesión
 * @param {headers.authorization} req 
 * @param {res.usuario} res 
 * @param {*} next 
 * @returns 
 */
const checkAuth = async (req, res, next) => {
    //Creamos una variable para el token
    let token;
    // Hacemos un request a headers.authorization para obtener el token
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            // Si el token existe entonces le quitamos la palabra Bearer del inicio
            token = req.headers.authorization.split(" ")[1];
            // Verificamos si el token es correcto con la frase de cifrado
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Si es correcto instanciamos en una variable en el request los datos deseados del usuario
            req.usuario = await Usuario.findById(decoded.id)
                .select("-password -confirmado -token -createdAt -updatedAt -__v");
            // Hacemos un next middleware si todo se cumple
            return next();
        } catch (error) {
            // De lo contrario mandamos un error
            return res.status(404).json({ msg: "Existe un error al verificar sus datos" });
        }
    }

    // En caso de no encontrar un token en el request, entonces mandamos un error
    if (!token) {
        const error = new Error("Token no valido");
        return res.status(401).json({ msg: error.message });
    }
}

export default checkAuth;