import Proyecto from "../models/Proyecto.js";
import Tarea from "../models/Tarea.js";

/**
 * Función que agrega una tarea a un proyecto existente,
 * la tarea solo puede ser agregada por el usuario que la creó
 * @param {body} req 
 * @param {json} res 
 * @returns 
 */
const agregarTarea = async (req, res) => {
    const { proyecto } = req.body;

    try {
        const existeProyecto = await Proyecto.findById(proyecto);

        if (existeProyecto.creador.toString() !== req.usuario._id.toString()) {
            const err = new Error("No tienes los permisos para agregar tareas");
            return res.status(403).json({ msg: err.message });
        }

        const tareaAlmacenada = await Tarea.create(req.body);
        // Almacenamos el id del proyecto en la tarea creada
        existeProyecto.tareas.push(tareaAlmacenada._id);
        await existeProyecto.save();
        res.status(200).json(tareaAlmacenada);

    } catch (error) {
        const err = new Error("El proyecto no existe");
        return res.status(404).json({ msg: err.message });
    }

};

/**
 * Función que lista las tareas de un proyecto que haya creado un usuario
 * @param {params} req 
 * @param {json} res 
 * @returns 
 */
const obtenerTarea = async (req, res) => {
    const { id } = req.params;
    try {
        const tarea = await Tarea.findById(id).populate("proyecto");

        if (tarea.proyecto.creador._id.toString() !== req.usuario._id.toString()) {
            const err = new Error("No tiene permisos para listar las tareas de este proyecto");
            return res.status(403).json({ msg: err.message });
        }

        res.status(200).json({ tarea });
    } catch (error) {
        const err = new Error("La tarea no existe");
        return res.status(404).json({ msg: err.message });
    }
};

/**
 * Función que actualiza una tarea de un proyecto especifico del usuario que lo creó
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const actualizarTarea = async (req, res) => {
    const { id } = req.params;

    try {
        const tarea = await Tarea.findById(id).populate("proyecto");
        if (tarea.proyecto.creador._id.toString() !== req.usuario._id.toString()) {
            const err = new Error("No tiene los permisos para listar las tareas de este proyecto");
            return res.status(403).json({ msg: err.message });
        }

        tarea.nombre = req.body.nombre || tarea.nombre;
        tarea.descripcion = req.body.descripcion || tarea.descripcion;
        tarea.prioridad = req.body.prioridad || tarea.prioridad;
        tarea.fechaEntrega = req.body.fechaEntrega || tarea.fechaEntrega;

        const tareaAlmacenada = await tarea.save();
        res.status(200).json(tareaAlmacenada);

    } catch (error) {
        const err = new Error("La tarea no existe");
        return res.status(404).json({ msg: err.message });
    }
};

/**
 * Función que elimina una tarea de un proyecto en especifico, creado por un usuario
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const eliminarTarea = async (req, res) => {
    const { id } = req.params;

    try {
        const tarea = await Tarea.findById(id).populate("proyecto");

        if (tarea.proyecto.creador._id.toString() !== req.usuario._id.toString()) {
            const err = new Error("No tiene los permisos para listar las tareas de este proyecto");
            return res.status(403).json({ msg: err.message });
        }

        const proyecto = await Proyecto.findById(tarea.proyecto._id);
        proyecto.tareas.pull(tarea._id);
        await Promise.allSettled([
            await tarea.deleteOne(),
            await proyecto.save()
        ])

        res.status(200).json({ msg: "La Tarea ha sido eliminada" });
    } catch (error) {
        const err = new Error("La tarea no existe");
        return res.status(404).json({ msg: err.message });
    }
};

/**
 * Función que cambia el estado de la tarea de true a false,
 * true = completada, false = incompleta (estado inicial)
 * @param {params} req id de la tarea
 * @param {object} res tarea
 * @returns json tarea
 */
const estadoTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const tarea = await Tarea.findById(id).populate("proyecto");

        if (tarea.proyecto.creador._id.toString() !== req.usuario._id.toString() &&
            !tarea.proyecto.colaboradores.some((colaborador) => colaborador._id.toString() === req.usuario._id.toString())
        ) {
            const error = new Error("Acción no válida");
            return res.status(403).json({ msg: error.message });
        }

        tarea.estado = !tarea.estado;
        tarea.completado = req.usuario._id;

        await tarea.save();

        const tareaAlmacenada = await Tarea.findById(id).populate("proyecto").populate("completado");

        return res.status(200).json(tareaAlmacenada);

    } catch (error) {
        return res.status(404).json({ msg: error.message });
    }
};

export {
    agregarTarea,
    obtenerTarea,
    actualizarTarea,
    eliminarTarea,
    estadoTarea,
}