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
    query('code').optional().isString().withMessage('Code must be a string'),
    query('name').optional().isString().withMessage('Name must be a string'),
    query('majorBudgetLineId').optional().isString().withMessage('majorBudgetLineId must be selected'),
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
  

  export const createBudgetLineName = [
    body("code").notEmpty().withMessage("Invalid code"),
    body("name").notEmpty().withMessage("Invalid name"),
    body("majorBudgetLineId").notEmpty().withMessage("Invalid Major Budget Line"),
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


export const updateBudgetLineName = [
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
    // Validation optionnelle pour "majorBudgetLineId"
    body("majorBudgetLineId")
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

export default validateQueryParams;