

import mongoose from 'mongoose';
// Importamos la librería de encriptado
import bcrypt from "bcrypt";

// Schema de la tabla de usuario, estructura de las tablas de la BD
const usuarioSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    token: {
        type: String,
    },
    confirmado: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

// Ahora usamos un middleware para hacer la encriptar el password antes de ser salvado en la bd
// para eso usamos el nombre del schema y la función pre que es el middleware de mongoose 
// Usamos async - await para bloquear la siguiente linea de ejecución
usuarioSchema.pre("save", async function (next) {
    /** 
     * Revisamos si el password no ha sido hasheado antes, esto es para cuando se hacen modificaciones y
     * actualizaciones de los datos y con eso evitamos que la cuenta quede inaccesible 
     *  */
    if (!this.isModified("password")) {
        // Esta instrucción nos manda al siguiente middleware
        next();
    }

    //Usamos 10 saltos de hash para la encriptación del password 
    const salt = await bcrypt.genSalt(10);
    // Ahora apuntamos al parámetro que deseamos hashear
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Creamos un método para comprobar el password
 */
usuarioSchema.methods.comprobarPassword = async function (passwordFromFormulario) {
    return await bcrypt.compare(passwordFromFormulario, this.password);
}

// Modelo de la tabla usuario y el schema que se va a utilizar
const Usuario = mongoose.model("Usuario", usuarioSchema);

// Hacemos disponible el modelo en la aplicación
export default Usuario;