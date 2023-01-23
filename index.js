import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import proyectoRoutes from "./routes/proyectoRoutes.js";
import tareaRoutes from "./routes/tareaRoutes.js";

const app = express();
// Habilitamos la función que nos permite leer json
app.use(express.json());

connectDB();

// Configurar CORS
const whiteList = [`${process.env.FRONTEND_URL}`];

const corsOptions = {
    origin: function (origin, callback) {
        if (whiteList.includes(origin)) {
            // Si existe la url en el arreglo de white list
            // entonces puedo consultar la api
            callback(null, true);
        } else {
            // De lo contrario lanzamos un error
            callback(new Error("Error de CORS"));
        }
    }
}

app.use(cors(corsOptions));

// Routing
// nombre_de_la_app.nombre_verbo("ruta", (request, response) => {callback})
// Grupo de rutas por un end point app.use("/api/usuarios", archivo de route)
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/proyectos", proyectoRoutes);
app.use("/api/tareas", tareaRoutes);

const PORT = process.env.PORT || 4000;

const servidor = app.listen(PORT, () => {
    console.log(`Servidor Express ejecutándose en el puerto ${PORT}`);
});

// Configuración de socket.io

import { Server } from 'socket.io';

const io = new Server(servidor, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL
    }
});

io.on("connection", (socket) => {
    //console.log("Conectado a socket.IO");

    // Aquí definimos los eventos de socket.IO
    // Cuando se abre un proyecto aquí se carga su
    // id para que los eventos de propagación solo correspondan
    // al de la sesión y el proyecto en uso
    socket.on("abrir proyecto", (proyecto) => {
        socket.join(proyecto);
    })

    // Agrega una nueva tarea a un proyecto especifico
    socket.on("nueva tarea", (tarea) => {
        const proyecto = tarea.proyecto;
        socket.to(proyecto).emit("tarea agregada", tarea);
    });

    // Elimina una tarea de un proyecto especifico
    socket.on("eliminar tarea", tarea => {
        const proyecto = tarea.proyecto;
        socket.to(proyecto).emit("tarea eliminada", tarea);
    });

    // Actualiza una tarea de un proyecto especifico
    socket.on("actualizar tarea", tarea => {
        const proyecto = tarea.proyecto._id;
        socket.to(proyecto).emit("tarea actualizada", tarea);
    });

    // Cambia el estado de una tarea completa - incompleta
    socket.on("cambiar estado", tarea => {
        const proyecto = tarea.proyecto._id;
        socket.to(proyecto).emit("nuevo estado", tarea);
    });
});