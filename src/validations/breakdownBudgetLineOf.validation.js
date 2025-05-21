import { body,
    query,
    param,
    check,
    oneOf,
    matchedData,
    validationResult } from "express-validator";
import HTTP_STATUS from "../utils/http.utils.js";
import { Decimal } from '@prisma/client/runtime/library';

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

// export const validateQueryParams = [
//     // query('limit').optional().isInt({ min: 0 }).withMessage('Limit must be a positive integer'),
//     query('limit').optional().isInt().withMessage('Limit must be an integer'),
//     query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a positive integer'),
//     query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be either asc or desc'),
//     query('sortBy').optional().isString().withMessage('SortBy must be a string'),
//     query('budgetLineOfId').optional().isString().withMessage('majorBudgetLineId must be selected'),
//     query('numRef').optional().isString().withMessage('NumRef must be a string'),
//     query('month').optional().isString().withMessage('majorBudgetLineId must be selected')
//     .isIn([
//         "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN",
//         "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"
//     ])
//     .withMessage("The month field must be a valid month."),
//     query('end_month').optional().isString().withMessage('majorBudgetLineId must be selected')
//     .isIn([
//         "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN",
//         "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"
//     ])
//     .withMessage("The month field must be a valid month."),
//     query('operationMonth').optional().isIn(['sup', 'inf']).withMessage('operationMonth must be either sup or inf'),
//     query('estimatedAmount').optional().isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
//     .withMessage("The estimatedAmount must have exactly 2 decimal places."),
//     query('estimatedAmount_down').optional().isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
//     .withMessage("The estimatedAmount must have exactly 2 decimal places."),
//     query('operationEstimatedAmount').optional().isIn(['sup', 'inf']).withMessage('operationEstimatedAmount must be either sup or inf'),
//     query('realAmount').optional().isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
//     .withMessage("The realAmount must have exactly 2 decimal places."),
//     query('realAmount_down').optional().isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
//     .withMessage("The realAmount_down must have exactly 2 decimal places."),
//     query('purchaseOrderAmount').optional().isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
//     .withMessage("The purchaseOrderAmount must have exactly 2 decimal places."),
//     query('purchaseOrderAmount_down').optional().isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
//     .withMessage("The purchaseOrderAmount_down must have exactly 2 decimal places."),
//     query('operationpurchaseOrderAmount').optional().isIn(['sup', 'inf']).withMessage('operationpurchaseOrderAmount must be either sup or inf'),
//     query('createdBy').optional().isString().withMessage('CreatedBy must be a string'),
//     query('updatedBy').optional().isString().withMessage('UpdatedBy must be a string'),
//     query('createdAt').optional().isISO8601().withMessage('CreatedAt must be a valid ISO date'),
//     query('createdAtBis').optional().isISO8601().withMessage('CreatedAt must be a valid ISO date'),
//     query('operationCreatedAt').optional().isIn(['sup', 'inf']).withMessage('OperationCreatedAt must be either sup or inf'),
//     query('updatedAt').optional().isISO8601().withMessage('UpdatedAt must be a valid ISO date'),
//     query('updatedAtBis').optional().isISO8601().withMessage('UpdatedAt must be a valid ISO date'),
//     query('operationUpdatedAt').optional().isIn(['sup', 'inf']).withMessage('OperationUpdatedAt must be either sup or inf'),
//     query('isActive').optional().isBoolean().withMessage('IsActive must be a boolean')
//   ];
export const validateQueryParams = [
    // Pagination & tri
    query('limit').optional().isInt().withMessage('Limit must be an integer'),
    query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a positive integer or zero'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be either asc or desc'),
    query('sortBy').optional().isString().withMessage('SortBy must be a string'),
  
    // Filtres texte
    query('budgetLineOfId').optional().isString().withMessage('budgetLineOfId must be a string'),
    query('numRef').optional().isString().withMessage('numRef must be a string'),
  
    // Filtres mois
    query('month')
      .optional()
      .isIn([
        "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN",
        "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"
      ])
      .withMessage("The month field must be a valid month."),
  
    query('end_month')
      .optional()
      .isIn([
        "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN",
        "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"
      ])
      .withMessage("The end_month field must be a valid month."),
  
    query('operationMonth')
      .optional()
      .isIn(['sup', 'inf'])
      .withMessage('operationMonth must be either sup or inf'),
  
    // Filtres montants : estimatedAmount
    query('estimatedAmount')
      .optional()
      .isDecimal({ decimal_digits: '2' })
      .withMessage("The estimatedAmount must have exactly 2 decimal places.")
      .customSanitizer(value => new Decimal(value)),
  
    query('estimatedAmount_down')
      .optional()
      .isDecimal({ decimal_digits: '2' })
      .withMessage("The estimatedAmount_down must have exactly 2 decimal places.")
      .customSanitizer(value => new Decimal(value)),
  
    query('operationEstimatedAmount')
      .optional()
      .isIn(['sup', 'inf'])
      .withMessage('operationEstimatedAmount must be either sup or inf'),
  
    // Filtres montants : realAmount
    query('realAmount')
      .optional()
      .isDecimal({ decimal_digits: '2' })
      .withMessage("The realAmount must have exactly 2 decimal places.")
      .customSanitizer(value => new Decimal(value)),
  
    query('realAmount_down')
      .optional()
      .isDecimal({ decimal_digits: '2' })
      .withMessage("The realAmount_down must have exactly 2 decimal places.")
      .customSanitizer(value => new Decimal(value)),
  
    query('operationRealAmount')
      .optional()
      .isIn(['sup', 'inf'])
      .withMessage('operationRealAmount must be either sup or inf'),
  
    // Filtres montants : purchaseOrderAmount ✅ LE PLUS IMPORTANT POUR TOI
    query('purchaseOrderAmount')
      .optional()
      .isDecimal({ decimal_digits: '2' })
      .withMessage("The purchaseOrderAmount must have exactly 2 decimal places.")
      .customSanitizer(value => new Decimal(value)),
  
    query('purchaseOrderAmount_down')
      .optional()
      .isDecimal({ decimal_digits: '2' })
      .withMessage("The purchaseOrderAmount_down must have exactly 2 decimal places.")
      .customSanitizer(value => new Decimal(value)),
  
    query('operationpurchaseOrderAmount')
      .optional()
      .isIn(['sup', 'inf'])
      .withMessage('operationpurchaseOrderAmount must be either sup or inf'),
  
    // Filtres utilisateurs
    query('createdBy').optional().isString().withMessage('CreatedBy must be a string'),
    query('updatedBy').optional().isString().withMessage('UpdatedBy must be a string'),
  
    // Filtres dates
    query('createdAt').optional().isISO8601().withMessage('CreatedAt must be a valid ISO date'),
    query('createdAtBis').optional().isISO8601().withMessage('CreatedAtBis must be a valid ISO date'),
    query('operationCreatedAt')
      .optional()
      .isIn(['sup', 'inf'])
      .withMessage('OperationCreatedAt must be either sup or inf'),
  
    query('updatedAt').optional().isISO8601().withMessage('UpdatedAt must be a valid ISO date'),
    query('updatedAtBis').optional().isISO8601().withMessage('UpdatedAtBis must be a valid ISO date'),
    query('operationUpdatedAt')
      .optional()
      .isIn(['sup', 'inf'])
      .withMessage('OperationUpdatedAt must be either sup or inf'),
  
    // Filtre boolean
    query('isActive').optional().isBoolean().withMessage('IsActive must be a boolean')
  ];

export const createBreakdownBudgetLineOf = [
    // Validation du champ budgetLineOfId
    body("budgetLineOfId")
        .notEmpty()
        .withMessage("The budgetLineOfId field is required."),

    // Validation du champ month
    body("month")
        .notEmpty()
        .withMessage("The month field is required.")
        .isIn([
            "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN",
            "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"
        ])
        .withMessage("The month field must be a valid month."),

    // Validation du champ estimatedAmount
    body("estimatedAmount")
        .notEmpty()
        .withMessage("The estimatedAmount field is required.")
        .isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
        .withMessage("The estimatedAmount must have exactly 2 decimal places."),

    // Validation du champ realAmount
    body("realAmount")
        .optional()
        .notEmpty()
        .withMessage("The realAmount field is required.")
        .isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
        .withMessage("The realAmount must have exactly 2 decimal places."),
    // Validation du champ purchaseOrderAmount
    body("purchaseOrderAmount")
        .optional()
        .notEmpty()
        .withMessage("The purchaseOrderAmount field is required.")
        .isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
        .withMessage("The purchaseOrderAmount must have exactly 2 decimal places."),

    // // Validation du champ createdBy
    // body("createdBy")
    //     .notEmpty()
    //     .withMessage("The createdBy field is required."),

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


export const updateBreakdownBudgetLineOf = [
    // Validation du champ budgetLineOfId
    body("budgetLineOfId")
        .optional()
        .notEmpty()
        .withMessage("The budgetLineOfId field is required."),

    // Validation du champ month
    body("month")
        .optional()
        .notEmpty()
        .withMessage("The month field is required.")
        .isIn([
            "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN",
            "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"
        ])
        .withMessage("The month field must be a valid month."),

    // Validation du champ amount
    body("amount")
        .optional()
        .notEmpty()
        .withMessage("The amount field is required.")
        .isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
        .withMessage("The amount must have exactly 2 decimal places."),
    // Validation du champ estimatedAmount
    body("estimatedAmount")
        .optional()
        .notEmpty()
        .withMessage("The estimatedAmount field is required.")
        .isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
        .withMessage("The estimatedAmount must have exactly 2 decimal places."),

    // Validation du champ realAmount
    body("realAmount")
        .optional()
        .notEmpty()
        .withMessage("The realAmount field is required.")
        .isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
        .withMessage("The realAmount must have exactly 2 decimal places."),
    // Validation du champ purchaseOrderAmount
    body("purchaseOrderAmount")
        .optional()
        .notEmpty()
        .withMessage("The purchaseOrderAmount field is required.")
        .isDecimal({ decimal_digits: "2" }) // Vérifie que le nombre a exactement 2 chiffres après la virgule
        .withMessage("The purchaseOrderAmount must have exactly 2 decimal places."),

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