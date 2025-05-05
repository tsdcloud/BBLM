import { Router } from "express";
import { param } from "express-validator";
import { createDerogationController,
    getAllDerogationController,
    getDerogationByIdController,
    updateDerogationController,
    deleteDerogationController,
    restoreDerogationController} from "../controllers/derogation.controller.js";
import {
    createDerogation,
    setDefaultQueryParams,
    validateQueryParams,
    updateDerogation
} from '../validations/derogation.validation.js'
// import { rateLimitAndTimeout } from "../middlewares/ratelimiter.middleware.js";
const routes = Router();

routes.post('/',
// rateLimitAndTimeout,
createDerogation,
createDerogationController);

routes.get('/',
setDefaultQueryParams,
validateQueryParams,
getAllDerogationController);

routes.get('/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
], getDerogationByIdController),

routes.patch('/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
updateDerogation,
updateDerogationController);

routes.patch('/delete/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
deleteDerogationController);

routes.patch('/restore/:id',
[
    param("id")
        .isUUID()
        .withMessage("Invalid ID format. Must be a valid UUID."),
],
// rateLimitAndTimeout,
restoreDerogationController);


export default routes;