import { Router } from "express";
import { param } from "express-validator";
import { createBreakdownBudgetLineOfController,
    getAllBreakdownBudgetLineOfController,
    getBreakdownBudgetLineOfByIdController,
    updateBreakdownBudgetLineOfController,
    deleteBreakdownBudgetLineOfController,
    restoreBreakdownBudgetLineOfController} from "../controllers/breakdownBudgetLineOf.controller.js";
import {
    createBreakdownBudgetLineOf,
    setDefaultQueryParams,
    validateQueryParams,
    updateBreakdownBudgetLineOf
} from '../validations/breakdownBudgetLineOf.validation.js'
// import { rateLimitAndTimeout } from "../middlewares/ratelimiter.middleware.js";
const routes = Router();

routes.post('/',
// rateLimitAndTimeout,
createBreakdownBudgetLineOf,
createBreakdownBudgetLineOfController);
routes.get('/', setDefaultQueryParams,
validateQueryParams,
getAllBreakdownBudgetLineOfController);

routes.get('/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
], getBreakdownBudgetLineOfByIdController),

routes.patch('/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
updateBreakdownBudgetLineOf,
updateBreakdownBudgetLineOfController);

routes.patch('/delete/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
deleteBreakdownBudgetLineOfController);

routes.patch('/restore/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
restoreBreakdownBudgetLineOfController);


export default routes;