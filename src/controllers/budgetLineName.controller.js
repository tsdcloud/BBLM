import { createBudgetLineNameService,
    getAllBudgetLineNameService,
    getBudgetLineNameByIdService,
    deleteBudgetLineNameServices,
    restoreBudgetLineNameServices,
    updateBudgetLineNameService } from "../services/budgetLineName.service.js";
import HTTP_STATUS from "../utils/http.utils.js";
import validateQueryParams from "../validations/budgetLineName.validation.js";
import { validationResult, matchedData } from 'express-validator';


/**
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export const createBudgetLineNameController = async (req, res) => {
    try {
        // Convertir le champ "name" en lowercase
        req.body.name = req.body.name.toLowerCase();

        const budgetLineName = await createBudgetLineNameService(req.body);
        res
            .status(HTTP_STATUS.CREATED.statusCode)
            .send({ success: true, data: budgetLineName });
    } catch (error) {
        console.error(error);

        // Différencier les erreurs de validation et les erreurs internes
        if (error.message.includes("must be unique")) {
            return res
                .status(HTTP_STATUS.BAD_REQUEST.statusCode)
                .send({ 
                    error: true, 
                    message: error.message,
                    description: HTTP_STATUS.BAD_REQUEST.description 
                });
        }

        res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode)
            .send({ 
                error: true, 
                message: `An unexpected error occurred: ${error.message}`,
                description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description 
            });
    }
};



/**
 * 
 * @param req 
 * @param res 
 * @returns 
 */
// Controller.js
export const getAllBudgetLineNameController = async (req, res) => {
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
        const result = await getAllBudgetLineNameService(validatedParams);
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
export const getBudgetLineNameByIdController = async (req, res) => {
    let { id } = req.params;

    // Vérifiez si l'ID est fourni
    if (!id) {
        res.sendStatus(HTTP_STATUS.NOT_FOUND.statusCode);
        return;
    }

    try {
        // Récupérez les données via le service
        let budgetLineName = await getBudgetLineNameByIdService(id);

        // Envoyez la réponse avec les données
        res
            .status(HTTP_STATUS.OK.statusCode)
            .send(budgetLineName);
    } catch (error) {
        console.error(error);
        res.sendStatus(HTTP_STATUS.NOT_FOUND.statusCode);
    }
};

/**
 * 
 * @param req 
 * @param res 
 */
export const updateBudgetLineNameController = async (req, res) => {
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
        const budgetLineName = await updateBudgetLineNameService(req.params.id, req.body);

        // Envoyer la réponse avec succès
        res
            .status(HTTP_STATUS.OK.statusCode)
            .send({ success: true, data: budgetLineName });
    } catch (error) {
        console.error(error);
        res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode)
            .send({ error: true, message: "An error occurred while updating the major budget line." });
    }
};


/**
 * 
 * @param req 
 * @param res 
 */
export const deleteBudgetLineNameController = async (req, res) => {
    try {
        // Appeler le service pour effectuer le soft delete
        const budgetLineName = await deleteBudgetLineNameServices(req.params.id, req.body);

        // Vérifier si l'enregistrement a été trouvé et désactivé
        if (!budgetLineName) {
            return res
                .status(HTTP_STATUS.NOT_FOUND.statusCode)
                .send({ error: true, message: "Major budget line not found." });
        }

        // Réponse avec un statut 204 (No Content)
        res
            .status(HTTP_STATUS.NO_CONTENT.statusCode)
            .send(); // Pas de contenu à retourner
    } catch (error) {
        console.error(error);
        res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode)
            .send({ error: true, message: "An error occurred while deleting the major budget line." });
    }
};


/**
 * 
 * @param req 
 * @param res 
 */
export const restoreBudgetLineNameController = async (req, res) => {
    try {
        let budgetLineName = await restoreBudgetLineNameServices(req.params.id, req.body);
        res
        .send(budgetLineName)
        .status(HTTP_STATUS.NO_CONTENT.statusCode);
        return;
    } catch (error) {
        console.log(error);
        res
        .sendStatus(HTTP_STATUS.BAD_REQUEST.statusCode);
        return;
    }
}
