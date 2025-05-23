import { body,
    query,
    param,
    check,
    oneOf,
    matchedData,
    validationResult } from "express-validator";
import HTTP_STATUS from "../utils/http.utils.js";

// Middleware de validation pour les paramètres de requête

export const setDefaultQueryParams = (req, res, next) => {
    // Définir les valeurs par défaut si les paramètres ne sont pas fournis
    req.query.limit = req.query.limit || '100'; // Par défaut : 100
    req.query.skip = req.query.skip || '0';     // Par défaut : 0
    req.query.order = req.query.order || 'asc'; // Par défaut : asc
    req.query.sortBy = req.query.sortBy || 'createdAt'; // Par défaut : createdAt
  
    // Passer au middleware suivant
    next();
  };

export const validateQueryParams = [
    // query('limit').optional().isInt({ min: 0 }).withMessage('Limit must be a positive integer'),
    query('limit').optional().isInt().withMessage('Limit must be an integer'),
    query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a positive integer'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be either asc or desc'),
    query('sortBy').optional().isString().withMessage('SortBy must be a string'),
    query('numRef').optional().isString().withMessage('NumRef must be a string'),
    query('budgetLineNameId').optional().isString().withMessage('majorBudgetLineId must be selected'),
    query('createdBy').optional().isString().withMessage('CreatedBy must be a string'),
    query('updatedBy').optional().isString().withMessage('UpdatedBy must be a string'),
    query('createdAt').optional().isISO8601().withMessage('CreatedAt must be a valid ISO date'),
    query('createdAtBis').optional().isISO8601().withMessage('CreatedAt must be a valid ISO date'),
    query('operationCreatedAt').optional().isIn(['sup', 'inf']).withMessage('OperationCreatedAt must be either sup or inf'),
    query('updatedAt').optional().isISO8601().withMessage('UpdatedAt must be a valid ISO date'),
    query('updatedAtBis').optional().isISO8601().withMessage('UpdatedAt must be a valid ISO date'),
    query('operationUpdatedAt').optional().isIn(['sup', 'inf']).withMessage('OperationUpdatedAt must be either sup or inf'),
    // Valider l'année
    query('year')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage(`L'année doit être un nombre valide entre 1900 et ${new Date().getFullYear() + 1}.`),
    query('isActive').optional().isBoolean().withMessage('IsActive must be a boolean')
];
  

export const createBudgetLineOf = [
    body("budgetLineNameId").notEmpty().withMessage("Invalid Major Budget Line"),
    // body("createdBy").notEmpty().withMessage("createdBy is required"), // createdBy est obligatoire
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res
                .status(HTTP_STATUS.BAD_REQUEST.statusCode)
                .send({ error: true, error_list: errors.array() });
        }
        next();
    }
];


export const updateBudgetLineOf = [
    // Validation optionnelle pour "budgetLineNameId"
    body("budgetLineNameId")
        .optional()
        .notEmpty()
        .withMessage("The major budget line cannot be empty if provided."),

    // // Validation obligatoire pour "updatedBy"
    // body("updatedBy")
    //     .notEmpty()
    //     .withMessage("updatedBy is required."),

    // Middleware de validation
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res
                .status(HTTP_STATUS.BAD_REQUEST.statusCode)
                .send({ error: true, error_list: errors.array() });
        }
        next();
    }
];


export const createBudgetLineOfBis = [
    // Validation du champ budgetLineNameId
    body("budgetLineNameId")
        .notEmpty()
        .withMessage("The budgetLineNameId field is required."),

    // Validation du champ createdBy
    // body("createdBy")
    //     .notEmpty()
    //     .withMessage("The createdBy field is required."),

    // Validation du champ breakdowns
    body("breakdowns")
        .isArray({ min: 12, max: 12 }) // Le tableau doit contenir exactement 12 éléments
        .withMessage("The breakdowns array must contain exactly 12 months."),

    // Validation personnalisée pour les éléments du tableau breakdowns
    body("breakdowns.*.month")
        .notEmpty()
        .withMessage("The month field is required for each breakdown.")
        .isIn([
            "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN",
            "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"
        ])
        .withMessage("The month field must be a valid month."),

    body("breakdowns.*.estimatedAmount")
        .notEmpty()
        .withMessage("The estimatedAmount field is required for each breakdown.")
        .isDecimal({ decimal_digits: "2" })
        .withMessage("The estimatedAmount must have exactly 2 decimal places.")
        .custom((value) => {
            if (parseFloat(value) < 0) {
                throw new Error("The estimatedAmount must be greater than or equal to 0.");
            }
            return true;
        }),

    // Validation personnalisée pour vérifier que tous les mois sont uniques
    body("breakdowns").custom((breakdowns) => {
        const months = breakdowns.map(breakdown => breakdown.month);
        const uniqueMonths = new Set(months);

        if (uniqueMonths.size !== 12) {
            throw new Error("Each month must appear exactly once in the breakdowns array.");
        }

        return true;
    }),

    // Middleware pour vérifier les erreurs de validation
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res
                .status(HTTP_STATUS.BAD_REQUEST.statusCode)
                .send({ error: true, error_list: errors.array() });
        }
        next();
    }
];
export default validateQueryParams;