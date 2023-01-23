import nodemailer from "nodemailer";

const emailRegistro = async (datos) => {
    const { email, nombre, token } = datos;

    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    // Información del email a enviar
    const info = await transport.sendMail({
        from: '"UpTask - Administrador de Proyectos" - <cuentas@uptask.mx>',
        to: email,
        subject: "UpTask - Confirma tu cuenta",
        text: "Confirma tu cuenta de UpTask",
        html: `<p>Hola ${nombre}!, confirma tu cuenta de UpTask.</p>
        <p>Tu cuenta ya esta casi lista, solo debes comprobarla en el siguiente enlace:</p>
        <a href="${process.env.FRONTEND_URL}/confirmar/${token}">Confirmar tu cuenta</a>
        <p>Si tu no creaste esta cuenta, puedes ignorar este email.</p>
        `
    });
};

const emailResetPassword = async (datos) => {
    const { email, nombre, token } = datos;

    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    // Información del email a enviar
    const info = await transport.sendMail({
        from: '"UpTask - Administrador de Proyectos" - <cuentas@uptask.mx>',
        to: email,
        subject: "UpTask - Crea una nueva contraseña para tu cuenta de UpTask",
        text: "Crea una nueva contraseña para tu cuenta de UpTask",
        html: `<p>Hola ${nombre}!, has solicitado restablecer tu contraseña de tu cuenta de UpTask.</p>
        <p>Sigue el siguiente enlace para generar una nueva contraseña:</p>
        <a href="${process.env.FRONTEND_URL}/olvide-password/${token}">Restablecer contraseña</a>
        <p>Si tu no solicitaste está acción, puedes ignorar este email.</p>
        `
    });
};

export {
    emailRegistro,
    emailResetPassword,
}