import { 
    createBreakdownBudgetLineOfService,
    getAllBreakdownBudgetLineOfService,
    getBreakdownBudgetLineOfByIdService,
    deleteBreakdownBudgetLineOfServices,
    restoreBreakdownBudgetLineOfServices,
    updateBreakdownBudgetLineOfService 
}from "../services/breakdownBudgetLineOf.service.js";
import HTTP_STATUS from "../utils/http.utils.js";
import validateQueryParams from "../validations/budgetLineOf.validation.js";
import { validationResult, matchedData } from 'express-validator';

/**
 * Contrôleur pour créer une nouvelle ligne budgétaire détaillée.
 */
export const createBreakdownBudgetLineOfController = async (req, res) => {
    try {
        // Appel du service pour créer la ligne budgétaire
        const budgetLineOf = await createBreakdownBudgetLineOfService(req.body);

        // Réponse en cas de succès
        return res.status(HTTP_STATUS.CREATED.statusCode).send({
            success: true,
            data: budgetLineOf,
        });
    } catch (error) {
        console.error("Error in createBreakdownBudgetLineOfController:", error);

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
 * Contrôleur pour récupérer toutes les lignes budgétaires détaillées.
 */
export const getAllBreakdownBudgetLineOfController = async (req, res) => {
    try {
        // Validation des paramètres
        await Promise.all(validateQueryParams.map(validation => validation.run(req)));
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).json({
                success: false,
                message: "Paramètres invalides.",
                errors: errors.array(),
            });
        }

        // Récupération des données validées
        const validatedParams = matchedData(req, { locations: ['query'] });

        // Appel du service avec les paramètres validés
        const result = await getAllBreakdownBudgetLineOfService(validatedParams);
        res.status(HTTP_STATUS.OK.statusCode).json(result);
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).json({
            success: false,
            message: error.message || "Une erreur serveur est survenue.",
        });
    }
};

/**
 * Contrôleur pour récupérer une ligne budgétaire détaillée par ID.
 */
export const getBreakdownBudgetLineOfByIdController = async (req, res) => {
    const { id } = req.params;

    // Vérifiez si l'ID est fourni
    if (!id) {
        return res.status(HTTP_STATUS.NOT_FOUND.statusCode).send({
            success: false,
            message: "ID is required.",
            description: HTTP_STATUS.NOT_FOUND.description,
        });
    }

    try {
        // Récupérez les données via le service
        const budgetLineOf = await getBreakdownBudgetLineOfByIdService(id);

        // Envoyez la réponse avec les données
        res.status(HTTP_STATUS.OK.statusCode).send({
            success: true,
            data: budgetLineOf,
        });
    } catch (error) {
        console.error(error);
        res.status(HTTP_STATUS.NOT_FOUND.statusCode).send({
            success: false,
            message: "Budget line not found.",
            description: HTTP_STATUS.NOT_FOUND.description,
        });
    }
};

/**
 * Contrôleur pour mettre à jour une ligne budgétaire détaillée.
 */
// export const updateBreakdownBudgetLineOfController = async (req, res) => {
//     try {
//         // 1. Vérifier que "updatedBy" est présent dans le corps de la requête
//         if (!req.body.updatedBy) {
//             return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
//                 success: false,
//                 message: "updatedBy is required.",
//                 description: HTTP_STATUS.BAD_REQUEST.description,
//             });
//         }

//         // 2. Convertir le champ "name" en lowercase s'il est fourni
//         if (req.body.name) {
//             req.body.name = req.body.name.toLowerCase();
//         }

//         // 3. Appeler le service pour mettre à jour la ligne budgétaire
//         const updatedBudgetLineOf = await updateBreakdownBudgetLineOfService(req.params.id, req.body);

//         // 4. Envoyer la réponse avec succès
//         return res.status(HTTP_STATUS.OK.statusCode).send({
//             success: true,
//             data: updatedBudgetLineOf,
//             message: "Budget line updated successfully.",
//         });
//     } catch (error) {
//         console.error("Error in updateBreakdownBudgetLineOfController:", error);

//         // 5. Gestion des erreurs spécifiques
//         if (error.message.includes("Budget line not found")) {
//             return res.status(HTTP_STATUS.NOT_FOUND.statusCode).send({
//                 success: false,
//                 message: "Budget line not found.",
//                 description: HTTP_STATUS.NOT_FOUND.description,
//             });
//         }

//         if (error.message.includes("You can't update a budget line from another year")) {
//             return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
//                 success: false,
//                 message: "You can't update a budget line from another year.",
//                 description: HTTP_STATUS.BAD_REQUEST.description,
//             });
//         }

//         if (error.message.includes("This Budget Line already exists for this year")) {
//             return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
//                 success: false,
//                 message: "This Budget Line already exists for this year.",
//                 description: HTTP_STATUS.BAD_REQUEST.description,
//             });
//         }

//         if (error.message.includes("Invalid or missing creation date")) {
//             return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
//                 success: false,
//                 message: "Invalid or missing creation date for the budget line.",
//                 description: HTTP_STATUS.BAD_REQUEST.description,
//             });
//         }

//         // 6. Erreur par défaut pour les cas non gérés
//         return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send({
//             success: false,
//             message: "An unexpected error occurred.",
//             description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description,
//         });
//     }
// };
export const updateBreakdownBudgetLineOfController = async (req, res) => {
    try {
        // Vérifier que "updatedBy" est présent dans le corps de la requête
        if (!req.body.updatedBy) {
            return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
                success: false,
                message: "updatedBy is required.",
                description: HTTP_STATUS.BAD_REQUEST.description,
            });
        }

        // Convertir le champ "name" en lowercase s'il est fourni
        if (req.body.name) {
            req.body.name = req.body.name.toLowerCase();
        }

        // Appeler le service pour mettre à jour la ligne budgétaire
        const updatedBudgetLineOf = await updateBreakdownBudgetLineOfService(req.params.id, req.body);

        // Envoyer la réponse avec succès
        return res.status(HTTP_STATUS.OK.statusCode).send({
            success: true,
            data: updatedBudgetLineOf,
            message: "Budget line updated successfully.",
        });
    } catch (error) {
        console.error("Error in updateBreakdownBudgetLineOfController:", error);

        // Gestion des erreurs spécifiques
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

        if (error.message.includes("The current date")) {
            return res.status(HTTP_STATUS.BAD_REQUEST.statusCode).send({
                success: false,
                message: error.message, // Utiliser directement le message d'erreur du service
                description: HTTP_STATUS.BAD_REQUEST.description,
            });
        }

        // Erreur par défaut pour les cas non gérés
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send({
            success: false,
            message: "An unexpected error occurred.",
            description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description,
        });
    }
};

/**
 * Contrôleur pour supprimer une ligne budgétaire détaillée (soft delete).
 */
export const deleteBreakdownBudgetLineOfController = async (req, res) => {
    try {
        // Appeler le service pour effectuer le soft delete
        const budgetLineOf = await deleteBreakdownBudgetLineOfServices(req.params.id, req.body);

        // Vérifier si l'enregistrement a été trouvé et désactivé
        if (!budgetLineOf) {
            return res.status(HTTP_STATUS.NOT_FOUND.statusCode).send({
                success: false,
                message: "Budget line not found.",
                description: HTTP_STATUS.NOT_FOUND.description,
            });
        }

        // Réponse avec un statut 204 (No Content)
        res.status(HTTP_STATUS.NO_CONTENT.statusCode).send(); // Pas de contenu à retourner
    } catch (error) {
        console.error(error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send({
            success: false,
            message: "An error occurred while deleting the budget line.",
            description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description,
        });
    }
};


/**
 * 
 * @param req 
 * @param res 
 */
export const restoreBreakdownBudgetLineOfController = async (req, res) => {
    try {
        let budgetLineOf = await restoreBreakdownBudgetLineOfServices(req.params.id, req.body);
        // Si la restauration échoue
        if (!budgetLineOf) {
            return res.status(HTTP_STATUS.NOT_FOUND.statusCode).send({
                success: false,
                message: "Budget line not found.",
                description: HTTP_STATUS.NOT_FOUND.description,
            });
        }
        res
        .send(budgetLineOf)
        .status(HTTP_STATUS.OK.statusCode);
        return;
    } catch (error) {
        console.error(error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send({
            success: false,
            message: "An error occurred while restoring the budget line.",
            description: HTTP_STATUS.INTERNAL_SERVER_ERROR.description,
        });
    }
};