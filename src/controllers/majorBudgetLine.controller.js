import { createMajorBudgetLineService,
    getAllMajorBudgetLineService,
    getMajorBudgetLineByIdService,
    deleteMajorBudgetLineServices,
    restoreMajorBudgetLineServices,
    analyseMajorBudgetLineService,
    updateMajorBudgetLineService } from "../services/majorBudgetLine.service.js";
import HTTP_STATUS from "../utils/http.utils.js";
import validateQueryParams from "../validations/majorBudgetLine.validation.js";
import { validationResult, matchedData } from 'express-validator';


/**
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export const createMajorBudgetLineController = async (req, res) => {
    try {
        // Convertir le champ "name" en lowercase
        req.body.name = req.body.name.toLowerCase();

        const majorBudgetLine = await createMajorBudgetLineService(req.body);
        res
            .status(HTTP_STATUS.CREATED.statusCode)
            .send({ success: true, data: majorBudgetLine });
    } catch (error) {
        console.error(error);
        res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode)
            .send({ error: true, message: "An error occurred while creating the major budget line." });
    }
};



/**
 * 
 * @param req 
 * @param res 
 * @returns 
 */
// Controller.js
export const getAllMajorBudgetLineController = async (req, res) => {
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
        const result = await getAllMajorBudgetLineService(validatedParams);
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
export const getMajorBudgetLineByIdController = async (req, res) => {
    let { id } = req.params;
    console.log(id);

    if(!id){
        res.sendStatus(HTTP_STATUS.NOT_FOUND.statusCode);
        return;
    }

    try {
        let majorBudgetLine = await getMajorBudgetLineByIdService(id);
        res
        .send(majorBudgetLine)
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
export const updateMajorBudgetLineController = async (req, res) => {
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
        const majorBudgetLine = await updateMajorBudgetLineService(req.params.id, req.body);

        // Envoyer la réponse avec succès
        res
            .status(HTTP_STATUS.OK.statusCode)
            .send({ success: true, data: majorBudgetLine });
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
export const deleteMajorBudgetLineController = async (req, res) => {
    try {
        // Appeler le service pour effectuer le soft delete
        const majorBudgetLine = await deleteMajorBudgetLineServices(req.params.id, req.body);

        // Vérifier si l'enregistrement a été trouvé et désactivé
        if (!majorBudgetLine) {
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
export const restoreMajorBudgetLineController = async (req, res) => {
    try {
        let majorBudgetLine = await restoreMajorBudgetLineServices(req.params.id, req.body);
        res
        .send(majorBudgetLine)
        .status(HTTP_STATUS.NO_CONTENT.statusCode);
        return;
    } catch (error) {
        console.log(error);
        res
        .sendStatus(HTTP_STATUS.BAD_REQUEST.statusCode);
        return;
    }
}

// export const getAnalyseMajorBudgetLineController = async (req, res) => {
//     try {
//       const { services, year, startMonth, endMonth } = req.body;
  
//       // Valider les paramètres
//       const { isValid, errors } = validateParams(services, year, startMonth, endMonth);
//       if (!isValid) {
//         return res.status(400).json({ errors });
//       }
  
//       // Appeler le service
//       const results = await analyseMajorBudgetLineService({
//         services,
//         year,
//         startMonth,
//         endMonth,
//       });
  
//       // Renvoyer les résultats
//       res.status(200).json(results);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: "Une erreur est survenue lors de l'analyse." });
//     }
//   };
export const getAnalyseMajorBudgetLineController = async (req, res) => {
    try {
        // Vérifier les erreurs de validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Extraire les paramètres validés
        const { services, year, startMonth, endMonth } = req.body;

        // Appeler le service
        const results = await analyseMajorBudgetLineService({
            services,
            year,
            startMonth,
            endMonth,
        });

        // Renvoyer les résultats
        res.status(200).json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Une erreur est survenue lors de l'analyse." });
    }
};
