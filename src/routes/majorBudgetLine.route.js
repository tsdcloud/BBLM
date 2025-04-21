import { Router } from "express";
import { param } from "express-validator";
import { createMajorBudgetLineController,
    getAllMajorBudgetLineController,
    getMajorBudgetLineByIdController,
    updateMajorBudgetLineController,
    deleteMajorBudgetLineController,
    getAnalyseMajorBudgetLineController,
    restoreMajorBudgetLineController} from "../controllers/majorBudgetLine.controller.js";
import {
    createMajorBudgetLine,
    setDefaultQueryParams,
    validateQueryParams,
    validateAnalyseParams,
    updateMajorBudgetLine
} from '../validations/majorBudgetLine.validation.js'
// import { rateLimitAndTimeout } from "../middlewares/ratelimiter.middleware.js";
const routes = Router();

routes.post('/',
// rateLimitAndTimeout,
createMajorBudgetLine,
createMajorBudgetLineController);

routes.get('/',
setDefaultQueryParams,
validateQueryParams,
getAllMajorBudgetLineController);

routes.post('/analysis',
validateAnalyseParams,
getAnalyseMajorBudgetLineController);

routes.get('/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
], getMajorBudgetLineByIdController),

routes.patch('/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
updateMajorBudgetLine,
updateMajorBudgetLineController);

routes.patch('/delete/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
deleteMajorBudgetLineController);

routes.patch('/restore/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
restoreMajorBudgetLineController);


export default routes;