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
    query('limit').optional().isInt().withMessage('Limit must be an integer'),
    query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a positive integer'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be either asc or desc'),
    query('sortBy').optional().isString().withMessage('SortBy must be a string'),
    query('numRef').optional().isString().withMessage('NumRef must be a string'),
    query('description').optional().isString().withMessage('description must be a string'),
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

export const createDerogation = [
    body("description")
      .notEmpty().withMessage("La description est obligatoire")
      .isString().withMessage("La description doit être une chaîne de caractères"),
  
    body('derogationLignes')
      .exists({ checkFalsy: true }).withMessage('Au moins une ligne de dérogation est requise')
      .isArray({ min: 1 }).withMessage('Doit être un tableau avec au moins un élément'),
  
    // Validation des éléments du tableau
    body('derogationLignes.*.breakdownBudgetLineOfDebitedId')
      .notEmpty().withMessage('Ligne budgétaire débitée obligatoire')
      .isString().withMessage('Doit être une chaîne de caractères'),
  
    body('derogationLignes.*.breakdownBudgetLineOfCreditedId')
      .notEmpty().withMessage('Ligne budgétaire créditée obligatoire')
      .isString().withMessage('Doit être une chaîne de caractères'),
  
    body('derogationLignes.*.Amount')
      .isDecimal({ decimal_digits: "1,2", min: 0.01 }).withMessage('Le montant doit être un nombre supérieur à 0 avec 1 à 2 chiffres après la virgule')
      .toFloat(),
  
    // Validation des doublons (optionnel)
    body('derogationLignes').custom((lines) => {
      const uniqueCombinations = new Set();
      
      for (const line of lines) {
        const key = `${line.breakdownBudgetLineOfDebitedId}-${line.breakdownBudgetLineOfCreditedId}`;
        
        if (uniqueCombinations.has(key)) {
          throw new Error('Combinaison de lignes budgétaires en doublon');
        }
        uniqueCombinations.add(key);
      }
      return true;
    }),
  
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
  
  export const updateDerogation = [
    body("description")
      .optional()
      .isString().withMessage("La description doit être une chaîne de caractères"),
  
    body('derogationLignes')
      .optional()
      .isArray({ min: 1 }).withMessage('Doit être un tableau avec au moins un élément'),
  
    // Les mêmes validations que pour la création si le champ est présent
    body('derogationLignes.*.breakdownBudgetLineOfDebitedId')
      .if(body('derogationLignes').exists())
      .notEmpty().withMessage('Ligne budgétaire débitée obligatoire')
      .isString().withMessage('Doit être une chaîne de caractères'),
  
    body('derogationLignes.*.breakdownBudgetLineOfCreditedId')
      .if(body('derogationLignes').exists())
      .notEmpty().withMessage('Ligne budgétaire créditée obligatoire')
      .isString().withMessage('Doit être une chaîne de caractères'),
  
    body('derogationLignes.*.Amount')
      .if(body('derogationLignes').exists())
      .isDecimal({ decimal_digits: "1,2", min: 0.01 }).withMessage('Le montant doit être un nombre supérieur à 0 avec 1 à 2 chiffres après la virgule')
      .toFloat(),
  
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