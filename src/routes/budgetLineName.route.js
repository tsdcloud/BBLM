import { Router } from "express";
import { param } from "express-validator";
import { createBudgetLineNameController,
    getAllBudgetLineNameController,
    getBudgetLineNameByIdController,
    updateBudgetLineNameController,
    deleteBudgetLineNameController,
    restoreBudgetLineNameController} from "../controllers/budgetLineName.controller.js";
import {
    createBudgetLineName,
    setDefaultQueryParams,
    validateQueryParams,
    updateBudgetLineName
} from '../validations/budgetLineName.validation.js'
// import { rateLimitAndTimeout } from "../middlewares/ratelimiter.middleware.js";
const routes = Router();

routes.post('/',
// rateLimitAndTimeout,
createBudgetLineName,
createBudgetLineNameController);

routes.get('/',
setDefaultQueryParams,
validateQueryParams,
getAllBudgetLineNameController);

routes.get('/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
], getBudgetLineNameByIdController),

routes.patch('/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
updateBudgetLineName,
updateBudgetLineNameController);

routes.patch('/delete/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
deleteBudgetLineNameController);

routes.patch('/restore/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
restoreBudgetLineNameController);


export default routes;