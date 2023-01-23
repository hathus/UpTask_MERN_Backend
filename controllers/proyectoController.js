import Proyecto from '../models/Proyecto.js';
import Usuario from '../models/Usuario.js';

/**
 * Función que crea un nuevo proyecto
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const nuevoProyecto = async (req, res) => {
    // Instanciamos el proyecto al modelo con los datos del request
    const proyecto = new Proyecto(req.body);
    // Le ponemos el creador del proyecto al proyecto, en este caso es nuestro usuario autenticado
    proyecto.creador = req.usuario._id;

    try {
        const almacenarProyecto = await proyecto.save();
        res.status(200).json(almacenarProyecto);
    } catch (err) {
        const error = new Error("Acción no válida");
        return res.status(404).json({ msg: error.message });
    }
};

/**
 * Función que lista un proyecto
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const obtenerProyecto = async (req, res) => {
    const { id } = req.params;

    try {
        const proyecto = await Proyecto.findById(id)
            .populate({ path: "tareas", populate: { path: "completado", select: "nombre" } })
            .populate("colaboradores", "nombre email");

        if (proyecto.creador.toString() !== req.usuario._id.toString()
            && !proyecto.colaboradores.some(
                (colaborador) => colaborador._id.toString() === req.usuario._id.toString()
            )) {
            const error = new Error("Acción no válida");
            return res.status(401).json({ msg: error.message });
        }

        // Obtener las tareas del proyecto
        //const tareas = await Tarea.find().where("proyecto").equals(proyecto._id);

        res.status(200).json(proyecto);
    } catch (err) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({ msg: error.message });
    }
};

/**
 * Función que lista los proyectos
 * @param {*} req 
 * @param {*} res 
 */
const obtenerProyectos = async (req, res) => {
    try {
        const proyectos = await Proyecto.find(
            {
                $or: [
                    { colaboradores: { $in: req.usuario } },
                    { creador: { $in: req.usuario } }
                ]
            }
        ).select("-tareas");
        res.status(200).json(proyectos);
    } catch (err) {
        const error = new Error("Acción no válida");
        return res.status(404).json({ msg: error.message });
    }
};

/**
 * Función que edita un proyecto
 * @param {*} req 
 * @param {*} res 
 */
const editarProyecto = async (req, res) => {
    const { id } = req.params;

    try {
        const proyecto = await Proyecto.findById(id);
        if (proyecto.creador.toString() !== req.usuario._id.toString()) {
            const error = new Error("Acción no válida");
            return res.status(401).json({ msg: error.message });
        }

        proyecto.nombre = req.body.nombre || proyecto.nombre;
        proyecto.descripcion = req.body.descripcion || proyecto.descripcion;
        proyecto.fechaEntrega = req.body.fechaEntrega || proyecto.fechaEntrega;
        proyecto.cliente = req.body.cliente || proyecto.cliente;

        const proyectoAlmacenado = await proyecto.save();

        res.status(200).json(proyectoAlmacenado);
    } catch (error) {
        const err = new Error("Proyecto no encontrado");
        return res.status(404).json({ msg: err.message });
    }
};

/**
 * Función que elimina un proyecto
 * @param {*} req 
 * @param {*} res 
 */
const eliminarProyecto = async (req, res) => {
    const { id } = req.params;

    try {
        const proyecto = await Proyecto.findById(id);

        if (proyecto.creador.toString() !== req.usuario._id.toString()) {
            const err = new Error("Acción no válida");
            return res.status(401).json({ msg: err.message });
        }

        await proyecto.deleteOne();
        res.status(200).json({ msg: "El proyecto ha sido eliminado" });
    } catch (error) {
        const err = new Error("Proyecto no encontrado");
        return res.status(404).json({ msg: err.message });
    }
};


const buscarColaborador = async (req, res) => {
    const { email } = req.body;

    try {
        const usuario = await Usuario.findOne({ email }).select('-password -confirmado -token -__v -createdAt -updatedAt');

        if (!usuario) {
            const error = new Error("Usuario no encontrado");
            return res.status(404).json({ msg: error.message });
        }

        res.json(usuario);
    } catch (error) {
        return res.status(404).json(error.message);
    }
};

/**
 * Función que agrega un colaborador a un proyecto
 * @param {*} req 
 * @param {*} res 
 */
const agregarColaborador = async (req, res) => {
    try {
        const proyecto = await Proyecto.findById(req.params.id);

        // Revisamos que el proyecto exista
        if (!proyecto) {
            const error = new Error("Proyecto no encontrado");
            return res.status(404).json({ msg: error.message });
        }

        // Revisamos que solo el creador del proyecto pueda agregar colaboradores
        if (proyecto.creador.toString() !== req.usuario._id.toString()) {
            const error = new Error("Acción no válida");
            return res.status(404).json({ msg: error.message });
        }

        // REvisamos que el usuario existe
        const { email } = req.body;
        const usuario = await Usuario.findOne({ email }).select('-password -confirmado -token -__v -createdAt -updatedAt');

        if (!usuario) {
            const error = new Error("Usuario no encontrado");
            return res.status(404).json({ msg: error.message });
        }

        // Revisamos que el usuario no sea el administrador del proyecto
        if (proyecto.creador.toString() === usuario._id.toString()) {
            const error = new Error("El creador del proyecto no puede ser colaborador");
            return res.status(404).json({ msg: error.message });
        }

        // Revisamos que el usuario que se quiere agregar ya esté agregado
        if (proyecto.colaboradores.includes(usuario._id)) {
            const error = new Error("El usuario ya ha sido agregado al proyecto");
            return res.status(404).json({ msg: error.message });
        }

        // Si todas las comprobaciones están bien
        proyecto.colaboradores.push(usuario._id);
        await proyecto.save();
        return res.json({ msg: "Colaborador agregado correctamente" });
    } catch (error) {
        return res.status(404).json(error.message);
    }
};

/**
 * Función que elimina un colaborador de un proyecto
 * @param {*} req 
 * @param {*} res 
 */
const eliminarColaborador = async (req, res) => {
    try {
        const proyecto = await Proyecto.findById(req.params.id);

        // Revisamos que el proyecto exista
        if (!proyecto) {
            const error = new Error("Proyecto no encontrado");
            return res.status(404).json({ msg: error.message });
        }

        // Revisamos que solo el creador del proyecto pueda agregar colaboradores
        if (proyecto.creador.toString() !== req.usuario._id.toString()) {
            const error = new Error("Acción no válida");
            return res.status(404).json({ msg: error.message });
        }

        // Si las comprobaciones son correctas
        proyecto.colaboradores.pull(req.body.id);

        await proyecto.save();

        return res.json({ msg: "Colaborador eliminado correctamente" });
    } catch (error) {
        return res.status(404).json(error.message);
    }
};

export {
    nuevoProyecto,
    obtenerProyecto,
    obtenerProyectos,
    editarProyecto,
    eliminarProyecto,
    buscarColaborador,
    agregarColaborador,
    eliminarColaborador,
}