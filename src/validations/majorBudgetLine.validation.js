import { body,
    query,
    param,
    check,
    oneOf,
    matchedData,
    validationResult } from "express-validator";
import HTTP_STATUS from "../utils/http.utils.js";
import { Month } from '../utils/utils.js';

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
    query('serviceId').optional().isString().withMessage('serviceId must be a string'),
    query('code').optional().isString().withMessage('Code must be a string'),
    query('name').optional().isString().withMessage('Name must be a string'),
    query('createdBy').optional().isString().withMessage('CreatedBy must be a string'),
    query('updatedBy').optional().isString().withMessage('UpdatedBy must be a string'),
    query('createdAt').optional().isISO8601().withMessage('CreatedAt must be a valid ISO date'),
    query('createdAtBis').optional().isISO8601().withMessage('CreatedAt must be a valid ISO date'),
    query('operationCreatedAt').optional().isIn(['sup', 'inf']).withMessage('OperationCreatedAt must be either sup or inf'),
    query('updatedAt').optional().isISO8601().withMessage('UpdatedAt must be a valid ISO date'),
    query('updatedAtBis').optional().isISO8601().withMessage('UpdatedAt must be a valid ISO date'),
    query('operationUpdatedAt').optional().isIn(['sup', 'inf']).withMessage('OperationUpdatedAt must be either sup or inf'),
    query('isActive').optional().isBoolean().withMessage('IsActive must be a boolean')
  ];
  

export const createMajorBudgetLine = [
body("code").notEmpty().withMessage("Invalid code"),
body("name").notEmpty().withMessage("Invalid name"),
body("serviceId").notEmpty().withMessage("Invalid serviceId"),
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


export const updateMajorBudgetLine = [
    // Validation optionnelle pour "serviceId"
    body("serviceId")
        .optional()
        .notEmpty()
        .withMessage("Code cannot be empty if provided."),
    // Validation optionnelle pour "code"
    body("code")
        .optional()
        .notEmpty()
        .withMessage("Code cannot be empty if provided."),

    // Validation optionnelle pour "name"
    body("name")
        .optional()
        .notEmpty()
        .withMessage("Name cannot be empty if provided."),

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


// Middleware de validation pour les paramètres
export const validateAnalyseParams = [
    // Valider les services
    body('services')
        .exists({ checkFalsy: true })
        .withMessage('La liste des services est requise et doit contenir au moins un élément.')
        .isArray({ min: 1 })
        .withMessage('La liste des services doit être un tableau contenant au moins un élément.'),

    // Valider l'année
    body('year')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage(`L'année doit être un nombre valide entre 1900 et ${new Date().getFullYear() + 1}.`),

    // Valider le mois de début
    body('startMonth')
        .optional()
        .isIn(Object.values(Month))
        .withMessage('Le mois de début n\'est pas valide.'),

    // Valider le mois de fin
    body('endMonth')
        .optional()
        .isIn(Object.values(Month))
        .withMessage('Le mois de fin n\'est pas valide.'),

    // Vérifier que startMonth <= endMonth
    body('startMonth').custom((value, { req }) => {
        if (value && req.query.endMonth) {
            const monthValues = Object.values(Month); // Liste des mois valides
            const startMonthIndex = monthValues.indexOf(value); // Index du mois de début
            const endMonthIndex = monthValues.indexOf(req.query.endMonth); // Index du mois de fin

            if (startMonthIndex > endMonthIndex) {
                throw new Error('Le mois de début ne peut pas être après le mois de fin.');
            }
        }
        return true;
    }),
];


export default validateQueryParams;