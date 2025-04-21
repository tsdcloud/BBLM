import { createBudgetLineOfService,
    createBudgetLineOfServiceBis,
    getAllBudgetLineOfService,
    getBudgetLineOfByIdService,
    deleteBudgetLineOfServices,
    restoreBudgetLineOfServices,
    updateBudgetLineOfService } from "../services/budgetLineOf.service.js";
import HTTP_STATUS from "../utils/http.utils.js";
import validateQueryParams from "../validations/budgetLineOf.validation.js";
import { validationResult, matchedData } from 'express-validator';


/**
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export const createBudgetLineOfController = async (req, res) => {
    try {
        // Appel du service pour créer la ligne budgétaire
        const budgetLineOf = await createBudgetLineOfService(req.body);

        // Réponse en cas de succès
        return res.status(HTTP_STATUS.CREATED.statusCode).send({
            success: true,
            data: budgetLineOf,
        });
    } catch (error) {
        console.error("Error in createBudgetLineOfController:", error);

        // Gestion des erreurs spécifiques
        if (error.message.includes("This Budget Line also exist for this year")) {
            return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
                success: false,
                message: "This Budget Line already exists for this year.",
                description: HTTP_STATUS.BAD_REQUEST.description,
            });
        }

        if (error.message.includes("Failed to create budget line")) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send({
                success: false,
                message: `An unexpected error occurred: ${error.message}`,
                description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description,
            });
        }

        // Erreur par défaut
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send({
            success: false,
            message: "An unexpected error occurred.",
            description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description,
        });
    }
};


/**
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export const createBudgetLineOfControllerBis = async (req, res) => {
    try {
        // Appel du service pour créer la ligne budgétaire et ses décompositions
        const { budgetLineOf, breakdowns } = await createBudgetLineOfServiceBis(req.body);

        // Réponse en cas de succès
        return res.status(HTTP_STATUS.CREATED.statusCode).send({
            success: true,
            data: {
                budgetLineOf,
                breakdowns,
            },
        });
    } catch (error) {
        console.error("Error in createBudgetLineOfControllerBis:", error);

        // Gestion des erreurs spécifiques
        if (error.message.includes("This Budget Line already exists for this year")) {
            return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
                success: false,
                message: "This Budget Line already exists for this year.",
                description: HTTP_STATUS.BAD_REQUEST.description,
            });
        }

        if (error.message.includes("Failed to create budget line")) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send({
                success: false,
                message: `An unexpected error occurred: ${error.message}`,
                description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description,
            });
        }

        // Erreur par défaut
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send({
            success: false,
            message: "An unexpected error occurred.",
            description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description,
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
export const getAllBudgetLineOfController = async (req, res) => {
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
        const result = await getAllBudgetLineOfService(validatedParams);
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
export const getBudgetLineOfByIdController = async (req, res) => {
    let { id } = req.params;

    // Vérifiez si l'ID est fourni
    if (!id) {
        res.sendStatus(HTTP_STATUS.NOT_FOUND.statusCode);
        return;
    }

    try {
        // Récupérez les données via le service
        let budgetLineOf = await getBudgetLineOfByIdService(id);

        // Envoyez la réponse avec les données
        res
            .status(HTTP_STATUS.OK.statusCode)
            .send(budgetLineOf);
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
// export const updateBudgetLineOfController = async (req, res) => {
//     try {
//         // Vérifier que "updatedBy" est présent
//         if (!req.body.updatedBy) {
//             return res
//                 .status(HTTP_STATUS.BAD_REQUEST.statusCode)
//                 .send({ error: true, message: "updatedBy is required." });
//         }

//         // Convertir le champ "name" en lowercase s'il est fourni
//         if (req.body.name) {
//             req.body.name = req.body.name.toLowerCase();
//         }

//         // Appeler le service pour mettre à jour la ligne budgétaire
//         const BudgetLineOf = await updateBudgetLineOfService(req.params.id, req.body);

//         // Envoyer la réponse avec succès
//         res
//             .status(HTTP_STATUS.OK.statusCode)
//             .send({ success: true, data: BudgetLineOf });
//     } catch (error) {
//         console.error("Error in createBudgetLineOfController:", error);

//         // Gestion des erreurs spécifiques
//         if (error.message.includes("This Budget Line also exist for this year")) {
//             return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
//                 success: false,
//                 message: "This Budget Line already exists for this year.",
//                 description: HTTP_STATUS.BAD_REQUEST.description,
//             });
//         }

//         if (error.message.includes("Failed to create budget line")) {
//             return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send({
//                 success: false,
//                 message: `An unexpected error occurred: ${error.message}`,
//                 description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description,
//             });
//         }

//         // Erreur par défaut
//         return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send({
//             success: false,
//             message: "An unexpected error occurred.",
//             description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description,
//         });
//     }
// };
export const updateBudgetLineOfController = async (req, res) => {
    try {
        // 1. Vérifier que "updatedBy" est présent dans le corps de la requête
        if (!req.body.updatedBy) {
            return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
                success: false,
                message: "updatedBy is required.",
                description: HTTP_STATUS.BAD_REQUEST.description,
            });
        }

        // 2. Convertir le champ "name" en lowercase s'il est fourni
        if (req.body.name) {
            req.body.name = req.body.name.toLowerCase();
        }

        // 3. Appeler le service pour mettre à jour la ligne budgétaire
        const updatedBudgetLineOf = await updateBudgetLineOfService(req.params.id, req.body);

        // 4. Envoyer la réponse avec succès
        return res.status(HTTP_STATUS.OK.statusCode).send({
            success: true,
            data: updatedBudgetLineOf,
            message: "Budget line updated successfully.",
        });

    } catch (error) {
        console.error("Error in updateBudgetLineOfController:", error);

        // 5. Gestion des erreurs spécifiques
        if (error.message.includes("Budget line not found")) {
            return res.status(HTTP_STATUS.NOT_FOUND.statusCode).send({
                success: false,
                message: "Budget line not found.",
                description: HTTP_STATUS.NOT_FOUND.description,
            });
        }

        if (error.message.includes("You can't update a budget line from another year")) {
            return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
                success: false,
                message: "You can't update a budget line from another year.",
                description: HTTP_STATUS.BAD_REQUEST.description,
            });
        }

        if (error.message.includes("This Budget Line already exists for this year")) {
            return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
                success: false,
                message: "This Budget Line already exists for this year.",
                description: HTTP_STATUS.BAD_REQUEST.description,
            });
        }

        if (error.message.includes("Invalid or missing creation date")) {
            return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
                success: false,
                message: "Invalid or missing creation date for the budget line.",
                description: HTTP_STATUS.BAD_REQUEST.description,
            });
        }

        // 6. Erreur par défaut pour les cas non gérés
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send({
            success: false,
            message: "An unexpected error occurred.",
            description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description,
        });
    }
};


/**
 * 
 * @param req 
 * @param res 
 */
export const deleteBudgetLineOfController = async (req, res) => {
    try {
        // Appeler le service pour effectuer le soft delete
        const BudgetLineOf = await deleteBudgetLineOfServices(req.params.id, req.body);

        // Vérifier si l'enregistrement a été trouvé et désactivé
        if (!BudgetLineOf) {
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
export const restoreBudgetLineOfController = async (req, res) => {
    try {
        let BudgetLineOf = await restoreBudgetLineOfServices(req.params.id, req.body);
        res
        .send(BudgetLineOf)
        .status(HTTP_STATUS.NO_CONTENT.statusCode);
        return;
    } catch (error) {
        console.log(error);
        res
        .sendStatus(HTTP_STATUS.BAD_REQUEST.statusCode);
        return;
    }
}
