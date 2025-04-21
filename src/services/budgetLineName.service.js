import {prisma} from '../config.js';
// import {budgetLineNameAbilities} from '../utils/abilities.utils.js';
import { Op } from 'sequelize';

const budgetLineNameClient = prisma.budgetLineName;

/**
 * Create a budgetLineName
 * @param body 
 * @returns 
 */
export const createBudgetLineNameService = async (body) => {
    try {
        // Vérifier l'unicité du code et de la combinaison (name, majorBudgetLineId)
        const existingRecord = await budgetLineNameClient.findFirst({
            where: {
                OR: [
                    { code: body.code }, // Vérifie si le code existe déjà
                    {
                        AND: [
                            { name: body.name.toLowerCase() }, // Vérifie le nom
                            { majorBudgetLineId: body.majorBudgetLineId }, // Vérifie l'ID de la ligne budgétaire principale
                        ],
                    },
                ],
            },
        });

        if (existingRecord) {
            if (existingRecord.code === body.code) {
                throw new Error("Code must be unique.");
            }
            if (
                existingRecord.name === body.name.toLowerCase() &&
                existingRecord.majorBudgetLineId === body.majorBudgetLineId
            ) {
                throw new Error("The combination of Name and Major Budget Line ID must be unique.");
            }
        }

        // Générer le numéro de référence
        const lastBudgetLineName = await budgetLineNameClient.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { numRef: true },
        });

        const date = new Date();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(-2);
        const prefix = `${mm}${yy}`;
        const nextNum = lastBudgetLineName ? parseInt(lastBudgetLineName.numRef.slice(-4)) + 1 : 1;
        const numRef = `${prefix}${String(nextNum).padStart(4, '0')}`;

        // Créer la ligne budgétaire
        const budgetLineName = await budgetLineNameClient.create({
            data: { ...body, numRef },
            include: { majorBudgetLine: true },
        });

        return budgetLineName;
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to create budget line: ${error.message}`);
    }
};



/**
 * 
 * @returns 
 */
export const getAllBudgetLineNameService = async (params = {}) => {
    try {
        const {
            limit = 100,
            skip = 0,
            order = 'asc', // Prisma utilise 'asc'/'desc' au lieu de 'ASC'/'DESC'
            sortBy = 'createdAt',
            numRef,
            code,
            name,
            createdBy,
            updatedBy,
            createdAt,
            createdAtBis, // Pour l'intervalle sur createdAt
            operationCreatedAt,
            updatedAt,
            updatedAtBis, // Nouveau paramètre pour l'intervalle supérieur sur updatedAt
            operationUpdatedAt,
            isActive,
            ...filters
        } = params;

        const validatedLimit = Number(limit);
        const validatedSkip = Math.max(0, Number(skip)) || 0;

        const cleanFilters = { ...filters };

        // Gestion des filtres texte
        if (numRef) cleanFilters.numRef = { contains: numRef };
        if (name) cleanFilters.name = { contains: name };
        if (code) cleanFilters.code = code;

        // Filtres utilisateurs
        if (createdBy) cleanFilters.createdBy = createdBy;
        if (updatedBy) cleanFilters.updatedBy = updatedBy;

        // Gestion des dates
        const handleDateFilter = (date, operation) => {
            if (!date) return null;
            const d = new Date(date);
            d.setUTCHours(0, 0, 0, 0);

            return operation === 'sup' ? { gte: d }
                : operation === 'inf' ? { lte: d }
                : d;
        };

        // Gestion de l'intervalle pour createdAt
        if (createdAt && createdAtBis) {
            const startDate = new Date(createdAt);
            const endDate = new Date(createdAtBis);
            startDate.setUTCHours(0, 0, 0, 0);
            endDate.setUTCHours(23, 59, 59, 999); // Fin de journée pour endDate

            cleanFilters.createdAt = {
                gte: startDate, // Date de début incluse
                lte: endDate    // Date de fin incluse
            };
        } else if (createdAt && operationCreatedAt) {
            cleanFilters.createdAt = handleDateFilter(createdAt, operationCreatedAt);
        }

        // Gestion de l'intervalle pour updatedAt
        if (updatedAt && updatedAtBis) {
            const startDate = new Date(updatedAt);
            const endDate = new Date(updatedAtBis);
            startDate.setUTCHours(0, 0, 0, 0);
            endDate.setUTCHours(23, 59, 59, 999); // Fin de journée pour endDate

            cleanFilters.updatedAt = {
                gte: startDate, // Date de début incluse
                lte: endDate    // Date de fin incluse
            };
        } else if (updatedAt && operationUpdatedAt) {
            cleanFilters.updatedAt = handleDateFilter(updatedAt, operationUpdatedAt);
        }

        // Gestion des filtres booléens
        if (isActive !== undefined) {
            cleanFilters.isActive = isActive === true || isActive === 'true';
        }

        // Cas spécial : si limit < 0, on récupère tous les éléments avec isActive: true
        if (validatedLimit < 0) {
            cleanFilters.isActive = true; // Forcer isActive à true
            const data = await prisma.budgetLineName.findMany({
                where: cleanFilters,
                orderBy: { [sortBy]: order }, // Tri selon le paramètre sortBy
                include: { majorBudgetLine: true } // Inclure les données de majorBudgetLine
            });

            return {
                limit: -1, // Indiquer que la limite est désactivée
                skip: 0,   // Ignorer le skip
                total: data.length,
                totalPages: 1, // Une seule page puisque tout est renvoyé
                currentPage: 1,
                data
            };
        }

        // Configuration de la requête avec pagination
        const queryOptions = {
            where: cleanFilters,
            orderBy: { [sortBy]: order }, // Prisma utilise orderBy au lieu de order
            take: validatedLimit >= 0 ? validatedLimit : undefined, // Prisma utilise take au lieu de limit
            skip: validatedSkip,
            include: { majorBudgetLine: true } // Inclure les données de majorBudgetLine
        };

        // Exécution parallèle
        const [totalRecords, data] = await Promise.all([
            prisma.budgetLineName.count({ where: cleanFilters }),
            prisma.budgetLineName.findMany(queryOptions)
        ]);

        // Calcul de la pagination
        const totalPages = validatedLimit > 0
            ? Math.ceil(totalRecords / validatedLimit)
            : 1;

        const currentPage = validatedLimit > 0
            ? Math.floor(validatedSkip / validatedLimit) + 1
            : 1;

        return {
            limit: validatedLimit,
            skip: validatedSkip,
            total: totalRecords,
            totalPages,
            currentPage,
            data
        };
    } catch (error) {
        console.error('Service Error:', error);
        throw new Error(`Erreur lors de la récupération des données : ${error.message}`);
    }
};


/**
 * 
 * @param id 
 * @returns 
 */

export const getBudgetLineNameByIdService = async (id) => {
    try {
        // Recherchez le BudgetLineName avec ses relations incluses
        let budgetLineName = await budgetLineNameClient.findFirst({
            where: { id },
            include: {
                majorBudgetLine: true, // Inclure les données de MajorBudgetLine
                budgetLineOfs: true,   // Inclure les données de BudgetLineOf
            },
        });

        // Si aucun résultat n'est trouvé, lancez une erreur
        if (!budgetLineName) throw new Error(`No budgetLineName found.`);

        return budgetLineName; // Retournez les données avec les relations incluses
    } catch (error) {
        console.error(error);
        throw new Error(`${error}`);
    }
};


/**
 * 
 * @param id 
 * @param body
 * @param body  
 * @returns 
 */
export const updateBudgetLineNameService = async (id, body) => {
    try {
        // Vérifier l'existence de l'enregistrement
        const existingBudgetLineName = await budgetLineNameClient.findUnique({
            where: { id },
        });

        if (!existingBudgetLineName) {
            throw new Error("Budget line name not found.");
        }

        // Vérifier l'unicité du code et de la combinaison (name, majorBudgetLineId)
        const existingRecord = await budgetLineNameClient.findFirst({
            where: {
                OR: [
                    { code: body.code }, // Vérifie si le code existe déjà
                    {
                        AND: [
                            { name: body.name.toLowerCase() }, // Vérifie le nom
                            { majorBudgetLineId: body.majorBudgetLineId }, // Vérifie l'ID de la ligne budgétaire principale
                        ],
                    },
                ],
            },
        });

        if (existingRecord) {
            if (existingRecord.code === body.code) {
                throw new Error(`The code "${body.code}" is already in use.`);
            }
            if (
                existingRecord.name === body.name.toLowerCase() &&
                existingRecord.majorBudgetLineId === body.majorBudgetLineId
            ) {
                throw new Error(`The combination of Name "${body.name}" and Major Budget Line ID "${body.majorBudgetLineId}" is already in use.`);
            }
        }

        // Mettre à jour l'enregistrement
        const updatedBudgetLineName = await budgetLineNameClient.update({
            where: { id },
            data: {
                code: body.code,
                name: body.name.toLowerCase(),
                majorBudgetLineId: body.majorBudgetLineId,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
            },
            include: {
                majorBudgetLine: true, // Inclure les données de MajorBudgetLine
                budgetLineOfs: true,   // Inclure les données de BudgetLineOf
            },
        });

        return updatedBudgetLineName;
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to update budget line name: ${error.message}`);
    }
};


/**
 * 
 * @param id
 * @param body  
 * @returns 
 */

export const deleteBudgetLineNameServices = async (id, body) => {
    try {
        // Rechercher l'enregistrement existant
        const existingBudgetLineName = await budgetLineNameClient.findUnique({
            where: { id },
        });

        // Si l'enregistrement n'existe pas, retourner null
        if (!existingBudgetLineName) {
            return null;
        }

        // Désactiver l'enregistrement (soft delete)
        const updatedBudgetLineName = await budgetLineNameClient.update({
            where: { id },
            data: { 
                isActive: false,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
             },
        });

        return updatedBudgetLineName;
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to delete major budget line: ${error.message}`);
    }
};

/**
 * 
 * @param id 
 * @returns 
 */
export const restoreBudgetLineNameServices = async (id, body) =>{
    try {
        let budgetLineName = await budgetLineNameClient.update({
            where: {id},
            data:{
                isActive:true,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
            },
            include: {
                majorBudgetLine: true, // Inclure les données de MajorBudgetLine
                budgetLineOfs: true,   // Inclure les données de BudgetLineOf
            },
        });
        return budgetLineName
    } catch (error) {
        console.log(error);
        throw new Error(`${error}`);
    }
}