import { Router } from "express";
import { param } from "express-validator";
import { createBudgetLineOfController,
    createBudgetLineOfControllerBis,
    getAllBudgetLineOfController,
    getBudgetLineOfByIdController,
    updateBudgetLineOfController,
    deleteBudgetLineOfController,
    restoreBudgetLineOfController} from "../controllers/BudgetLineOf.controller.js";
import {
    createBudgetLineOf,
    createBudgetLineOfBis,
    setDefaultQueryParams,
    validateQueryParams,
    updateBudgetLineOf
} from '../validations/budgetLineOf.validation.js'
// import { rateLimitAndTimeout } from "../middlewares/ratelimiter.middleware.js";
const routes = Router();

routes.post('/',
// rateLimitAndTimeout,
createBudgetLineOf,
createBudgetLineOfController);

routes.post('/bis',
// rateLimitAndTimeout,
createBudgetLineOfBis,
createBudgetLineOfControllerBis);

routes.get('/',
setDefaultQueryParams,
validateQueryParams,
getAllBudgetLineOfController);

routes.get('/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
], getBudgetLineOfByIdController),

routes.patch('/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
updateBudgetLineOf,
updateBudgetLineOfController);

routes.patch('/delete/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
deleteBudgetLineOfController);

routes.patch('/restore/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
restoreBudgetLineOfController);


export default routes;