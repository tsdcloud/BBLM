import { createDerogationService,
    getAllDerogationService,
    getDerogationByIdService,
    deleteDerogationServices,
    restoreDerogationServices,
    updateDerogationService } from "../services/derogation.service.js";
import HTTP_STATUS from "../utils/http.utils.js";
import validateQueryParams from "../validations/derogation.validation.js";
import { validationResult, matchedData } from 'express-validator';

/**
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export const createDerogationController = async (req, res) => {
    try {
        // Convertir le champ "name" en lowercase
        req.body.description = req.body.description.toLowerCase();

        const derogation = await createDerogationService(req.body);
        res
            .status(HTTP_STATUS.CREATED.statusCode)
            .send({ success: true, data: derogation });
    } catch (error) {
        console.error(error);
        res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode)
            .send({ error: true, message: "An error occurred while creating the derogation." });
    }
};

/**
 * 
 * @param req 
 * @param res 
 * @returns 
 */
// Controller.js
export const getAllDerogationController = async (req, res) => {
    try {
        // Validation des paramètres
        await Promise.all(validateQueryParams.map(validation => validation.run(req)));
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Récupération des données validées
        const validatedParams = matchedData(req, { locations: ['query'] });

        // Appel du service avec les paramètres validés
        const result = await getAllDerogationService(validatedParams);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Erreur serveur"
        });
    }
};

/**
 * 
 * @param req
 * @param res 
 * @returns 
 */
export const getDerogationByIdController = async (req, res) => {
    let { id } = req.params;
    console.log(id);

    if(!id){
        res.sendStatus(HTTP_STATUS.NOT_FOUND.statusCode);
        return;
    }

    try {
        let derogation = await getDerogationByIdService(id);
        res
        .send(derogation)
        .status(HTTP_STATUS.OK.statusCode);
        return;
    } catch (error) {
        console.log(error);
        res
        .sendStatus(HTTP_STATUS.NOT_FOUND.statusCode);
        return;
    }
}

/**
 * 
 * @param req 
 * @param res 
 */
export const updateDerogationController = async (req, res) => {
    try {
        // Vérifier que "updatedBy" est présent
        if (!req.body.updatedBy) {
            return res
                .status(HTTP_STATUS.BAD_REQUEST.statusCode)
                .send({ error: true, message: "updatedBy is required." });
        }

        // Convertir le champ "name" en lowercase s'il est fourni
        if (req.body.name) {
            req.body.name = req.body.name.toLowerCase();
        }

        // Appeler le service pour mettre à jour la ligne budgétaire
        const derogation = await updateDerogationService(req.params.id, req.body);

        // Envoyer la réponse avec succès
        res
            .status(HTTP_STATUS.OK.statusCode)
            .send({ success: true, data: derogation });
    } catch (error) {
        console.error(error);
        res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode)
            .send({ error: true, message: "An error occurred while updating the derogation." });
    }
};

/**
 * 
 * @param req 
 * @param res 
 */
export const deleteDerogationController = async (req, res) => {
    try {
        // Appeler le service pour effectuer le soft delete
        const derogation = await deleteDerogationServices(req.params.id, req.body);

        // Vérifier si l'enregistrement a été trouvé et désactivé
        if (!derogation) {
            return res
                .status(HTTP_STATUS.NOT_FOUND.statusCode)
                .send({ error: true, message: "Derogation line not found." });
        }

        // Réponse avec un statut 204 (No Content)
        res
            .status(HTTP_STATUS.NO_CONTENT.statusCode)
            .send(); // Pas de contenu à retourner
    } catch (error) {
        console.error(error);
        res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode)
            .send({ error: true, message: "An error occurred while deleting the derogation." });
    }
};

/**
 * 
 * @param req 
 * @param res 
 */
export const restoreDerogationController = async (req, res) => {
    try {
        let derogation = await restoreDerogationServices(req.params.id, req.body);
        res
        .send(derogation)
        .status(HTTP_STATUS.NO_CONTENT.statusCode);
        return;
    } catch (error) {
        console.log(error);
        res
        .sendStatus(HTTP_STATUS.BAD_REQUEST.statusCode);
        return;
    }
}

