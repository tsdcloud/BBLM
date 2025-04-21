import {prisma} from '../config.js';
// import {BudgetLineOfAbilities} from '../utils/abilities.utils.js';
import { Op } from 'sequelize';

const budgetLineOfClient = prisma.budgetLineOf;
const breakdownBudgetLineOfClient = prisma.breakdownBudgetLineOf;

/**
 * Create a BudgetLineOf
 * @param body 
 * @returns 
 */
export const createBudgetLineOfService = async (body) => {
    try {
        // Vérifier l'unicité du code et de la combinaison (name, budgetLineNameId)
        const currentYear = new Date().getFullYear();

        const existingRecord = await budgetLineOfClient.findFirst({
            where: {
                AND: [
                    {
                        createdAt: {
                            gte: new Date(`${currentYear}-01-01T00:00:00Z`), // Date minimale de l'année en cours
                            lt: new Date(`${currentYear + 1}-01-01T00:00:00Z`), // Date minimale de l'année suivante
                        },
                    },
                    {
                        budgetLineNameId: body.budgetLineNameId, // Vérifie l'ID de la ligne budgétaire principale
                    },
                ],
            },
        });

        if (existingRecord) {
            throw new Error("This Budget Line also exist for this year.");
        }

        // Générer le numéro de référence
        const lastBudgetLineOf = await budgetLineOfClient.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { numRef: true },
        });

        const date = new Date();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(-2);
        const prefix = `${mm}${yy}`;
        const nextNum = lastBudgetLineOf ? parseInt(lastBudgetLineOf.numRef.slice(-4)) + 1 : 1;
        const numRef = `${prefix}${String(nextNum).padStart(4, '0')}`;

        // Créer la ligne budgétaire
        const budgetLineOf = await budgetLineOfClient.create({
            data: { ...body, numRef },
            // include: { budgetLineName: true }
            include: {
                budgetLineName: {
                    include: {
                        majorBudgetLine: true, // Inclure la relation majorBudgetLine
                    },
                },
                breakdowns: true, // Inclure les données de breakdowns
            },
        });

        return budgetLineOf;
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to create budget line: ${error.message}`);
    }
};


export const createBudgetLineOfServiceBis = async (body) => {
    try {
        const { budgetLineNameId, createdBy, breakdowns } = body;

        // Vérifier l'unicité du BudgetLineOf pour l'année en cours
        const currentYear = new Date().getFullYear();
        const existingRecord = await budgetLineOfClient.findFirst({
            where: {
                AND: [
                    {
                        createdAt: {
                            gte: new Date(`${currentYear}-01-01T00:00:00Z`),
                            lt: new Date(`${currentYear + 1}-01-01T00:00:00Z`),
                        },
                    },
                    {
                        budgetLineNameId,
                    },
                ],
            },
        });

        if (existingRecord) {
            throw new Error("This Budget Line already exists for this year.");
        }

        // Générer le numéro de référence pour le BudgetLineOf
        const lastBudgetLineOf = await budgetLineOfClient.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { numRef: true },
        });

        const date = new Date();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(-2);
        const prefix = `${mm}${yy}`;
        const nextNum = lastBudgetLineOf ? parseInt(lastBudgetLineOf.numRef.slice(-4)) + 1 : 1;
        const numRef = `${prefix}${String(nextNum).padStart(4, '0')}`;

        // Créer le BudgetLineOf
        const budgetLineOf = await budgetLineOfClient.create({
            data: {
                numRef,
                budgetLineNameId,
                createdBy,
            },
            include: {
                budgetLineName: {
                    include: {
                        majorBudgetLine: true,
                    },
                },
                breakdowns: true, // Inclure les données de breakdowns
            },
        });

        // Créer les BreakdownBudgetLineOf pour chaque mois fourni
        const createdBreakdowns = [];
        for (const breakdown of breakdowns) {
            const { month, estimatedAmount } = breakdown;

            // Validation des données du breakdown
            if (!month || !estimatedAmount) {
                throw new Error(`Invalid breakdown data: month and estimatedAmount are required.`);
            }

            // Générer le numéro de référence pour le BreakdownBudgetLineOf
            const lastBreakdown = await breakdownBudgetLineOfClient.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { numRef: true },
            });

            const breakdownPrefix = `${mm}${yy}`;
            const breakdownNextNum = lastBreakdown ? parseInt(lastBreakdown.numRef.slice(-4)) + 1 : 1;
            const breakdownNumRef = `${breakdownPrefix}${String(breakdownNextNum).padStart(4, '0')}`;

            // Créer le BreakdownBudgetLineOf
            const createdBreakdown = await breakdownBudgetLineOfClient.create({
                data: {
                    numRef: breakdownNumRef,
                    budgetLineOfId: budgetLineOf.id,
                    month,
                    estimatedAmount,
                    createdBy: createdBy, // Utiliser le createdBy global
                },
                include: {
                    budgetLineOf: {
                        include: {
                            budgetLineName: {
                                include: {
                                    majorBudgetLine: true,
                                },
                            },
                        },
                    },
                },
            });

            createdBreakdowns.push(createdBreakdown);
        }

        return { budgetLineOf, breakdowns: createdBreakdowns };
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to create budget line: ${error.message}`);
    }
};


/**
 * 
 * @returns 
 */
// export const getAllBudgetLineOfService = async (params = {}) => {
//     try {
//         const {
//             limit = 100,
//             skip = 0,
//             order = 'asc', // Prisma utilise 'asc'/'desc' au lieu de 'ASC'/'DESC'
//             sortBy = 'createdAt',
//             numRef,
//             budgetLineNameId,
//             createdBy,
//             updatedBy,
//             createdAt,
//             createdAtBis, // Pour l'intervalle sur createdAt
//             operationCreatedAt,
//             updatedAt,
//             updatedAtBis, // Nouveau paramètre pour l'intervalle supérieur sur updatedAt
//             operationUpdatedAt,
//             isActive,
//             ...filters
//         } = params;

//         const validatedLimit = Number(limit);
//         const validatedSkip = Math.max(0, Number(skip)) || 0;

//         const cleanFilters = { ...filters };

//         // Gestion des filtres texte
//         if (numRef) cleanFilters.numRef = { contains: numRef };

//         if (budgetLineNameId) cleanFilters.budgetLineNameId = budgetLineNameId;

//         // Filtres utilisateurs
//         if (createdBy) cleanFilters.createdBy = createdBy;
//         if (updatedBy) cleanFilters.updatedBy = updatedBy;

//         // Gestion des dates
//         const handleDateFilter = (date, operation) => {
//             if (!date) return null;
//             const d = new Date(date);
//             d.setUTCHours(0, 0, 0, 0);

//             return operation === 'sup' ? { gte: d }
//                 : operation === 'inf' ? { lte: d }
//                 : d;
//         };

//         // Gestion de l'intervalle pour createdAt
//         if (createdAt && createdAtBis) {
//             const startDate = new Date(createdAt);
//             const endDate = new Date(createdAtBis);
//             startDate.setUTCHours(0, 0, 0, 0);
//             endDate.setUTCHours(23, 59, 59, 999); // Fin de journée pour endDate

//             cleanFilters.createdAt = {
//                 gte: startDate, // Date de début incluse
//                 lte: endDate    // Date de fin incluse
//             };
//         } else if (createdAt && operationCreatedAt) {
//             cleanFilters.createdAt = handleDateFilter(createdAt, operationCreatedAt);
//         }

//         // Gestion de l'intervalle pour updatedAt
//         if (updatedAt && updatedAtBis) {
//             const startDate = new Date(updatedAt);
//             const endDate = new Date(updatedAtBis);
//             startDate.setUTCHours(0, 0, 0, 0);
//             endDate.setUTCHours(23, 59, 59, 999); // Fin de journée pour endDate

//             cleanFilters.updatedAt = {
//                 gte: startDate, // Date de début incluse
//                 lte: endDate    // Date de fin incluse
//             };
//         } else if (updatedAt && operationUpdatedAt) {
//             cleanFilters.updatedAt = handleDateFilter(updatedAt, operationUpdatedAt);
//         }

//         // Gestion des filtres booléens
//         if (isActive !== undefined) {
//             cleanFilters.isActive = isActive === true || isActive === 'true';
//         }

//         // Cas spécial : si limit < 0, on récupère tous les éléments avec isActive: true
//         if (validatedLimit < 0) {
//             cleanFilters.isActive = true; // Forcer isActive à true
//             const data = await prisma.budgetLineOf.findMany({
//                 where: cleanFilters,
//                 orderBy: { [sortBy]: order }, // Tri selon le paramètre sortBy
//                 // include: { budgetLineName: true } // Inclure les données de budgetLineName
//                 include: {
//                     budgetLineName: {
//                         include: {
//                             majorBudgetLine: true, // Inclure la relation majorBudgetLine
//                         },
//                     },
//                     breakdowns: true, // Inclure les données de breakdowns
//                 }
//             });

//             return {
//                 limit: -1, // Indiquer que la limite est désactivée
//                 skip: 0,   // Ignorer le skip
//                 total: data.length,
//                 totalPages: 1, // Une seule page puisque tout est renvoyé
//                 currentPage: 1,
//                 data
//             };
//         }

//         // Configuration de la requête avec pagination
//         const queryOptions = {
//             where: cleanFilters,
//             orderBy: { [sortBy]: order }, // Prisma utilise orderBy au lieu de order
//             take: validatedLimit >= 0 ? validatedLimit : undefined, // Prisma utilise take au lieu de limit
//             skip: validatedSkip,
//             include: { budgetLineName: true } // Inclure les données de budgetLineName
//         };

//         // Exécution parallèle
//         const [totalRecords, data] = await Promise.all([
//             prisma.budgetLineOf.count({ where: cleanFilters }),
//             prisma.budgetLineOf.findMany(queryOptions)
//         ]);

//         // Calcul de la pagination
//         const totalPages = validatedLimit > 0
//             ? Math.ceil(totalRecords / validatedLimit)
//             : 1;

//         const currentPage = validatedLimit > 0
//             ? Math.floor(validatedSkip / validatedLimit) + 1
//             : 1;

//         return {
//             limit: validatedLimit,
//             skip: validatedSkip,
//             total: totalRecords,
//             totalPages,
//             currentPage,
//             data
//         };
//     } catch (error) {
//         console.error('Service Error:', error);
//         throw new Error(`Erreur lors de la récupération des données : ${error.message}`);
//     }
// };

export const getAllBudgetLineOfService = async (params = {}) => {
    try {
        const {
            limit = 100,
            skip = 0,
            order = 'asc', // Prisma utilise 'asc'/'desc' au lieu de 'ASC'/'DESC'
            sortBy = 'createdAt',
            numRef,
            budgetLineNameId,
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

        if (budgetLineNameId) cleanFilters.budgetLineNameId = budgetLineNameId;

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
            const data = await prisma.budgetLineOf.findMany({
                where: cleanFilters,
                orderBy: { [sortBy]: order }, // Tri selon le paramètre sortBy
                include: {
                    budgetLineName: {
                        include: {
                            majorBudgetLine: true, // Inclure la relation majorBudgetLine
                        },
                    },
                    breakdowns: true, // Inclure les données de breakdowns
                },
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
            include: {
                budgetLineName: {
                    include: {
                        majorBudgetLine: true, // Inclure la relation majorBudgetLine
                    },
                },
                breakdowns: true, // Inclure les données de breakdowns
            },
        };

        // Exécution parallèle
        const [totalRecords, data] = await Promise.all([
            prisma.budgetLineOf.count({ where: cleanFilters }),
            prisma.budgetLineOf.findMany(queryOptions)
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

export const getBudgetLineOfByIdService = async (id) => {
    try {
        // Recherchez le BudgetLineOf avec ses relations incluses
        let budgetLineOf = await budgetLineOfClient.findFirst({
            where: { id },
            include: {
                budgetLineName: {
                    include: {
                        majorBudgetLine: true, // Inclure la relation majorBudgetLine
                    },
                },
                breakdowns: true,   // Inclure les données de breakdowns
            },
        });

        // Si aucun résultat n'est trouvé, lancez une erreur
        if (!budgetLineOf) throw new Error(`No BudgetLineOf found.`);

        return budgetLineOf; // Retournez les données avec les relations incluses
    } catch (error) {
        console.error(error);
        throw new Error(`${error}`);
    }
};


/**
 * 
 * @param id 
 * @param body 
 * @returns 
 */
export const updateBudgetLineOfService = async (id, body) => {
    try {
        // Étape 1 : Vérifier l'existence de l'enregistrement
        const currentYear = new Date().getFullYear();

        // Rechercher la ligne budgétaire correspondante
        const existingBudgetLineOf = await budgetLineOfClient.findUnique({
            where: { id },
        });

        // S'assurer que la ligne budgétaire existe
        if (!existingBudgetLineOf) {
            throw new Error("Budget line not found.");
        }

        // Vérifier que createdAt est valide et convertir en objet Date si nécessaire
        const createdAtDate = new Date(existingBudgetLineOf.createdAt);
        if (isNaN(createdAtDate.getTime())) {
            throw new Error("Invalid or missing creation date for the budget line.");
        }

        // Vérifier que la ligne budgétaire n'appartient pas à une année antérieure
        if (createdAtDate.getFullYear() < currentYear) {
            throw new Error("You can't update a budget line from another year.");
        }

        // Étape 2 : Vérifier l'unicité pour l'année en cours (exclure l'enregistrement actuel)
        const existingRecord = await budgetLineOfClient.findFirst({
            where: {
                AND: [
                    {
                        createdAt: {
                            gte: new Date(`${currentYear}-01-01T00:00:00Z`), // Début de l'année en cours
                            lt: new Date(`${currentYear + 1}-01-01T00:00:00Z`), // Début de l'année suivante
                        },
                    },
                    {
                        budgetLineNameId: body.budgetLineNameId, // Vérifie l'ID de la ligne budgétaire principale
                    },
                    {
                        id: { not: id }, // Exclure l'enregistrement actuel
                    },
                ],
            },
        });

        // Si un enregistrement identique existe déjà pour l'année en cours, lever une erreur
        if (existingRecord) {
            throw new Error("This Budget Line already exists for this year.");
        }

        // Étape 3 : Mettre à jour l'enregistrement
        const updatedBudgetLineOf = await budgetLineOfClient.update({
            where: { id },
            data: {
                budgetLineNameId: body.budgetLineNameId,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
            },
            include: {
                budgetLineName: {
                    include: {
                        majorBudgetLine: true, // Inclure la relation majorBudgetLine
                    },
                },
                breakdowns: true,   // Inclure les données de breakdowns
            },
        });

        // Retourner la ligne budgétaire mise à jour
        return updatedBudgetLineOf;

    } catch (error) {
        // Gérer les erreurs et les afficher dans la console
        console.error("Error in updateBudgetLineOfService:", error);
        throw new Error(`Failed to update budget line: ${error.message}`);
    }
};


/**
 * 
 * @param id
 * @param body  
 * @returns 
 */

export const deleteBudgetLineOfServices = async (id, body) => {
    try {
        // Rechercher l'enregistrement existant
        const existingBudgetLineOf = await budgetLineOfClient.findUnique({
            where: { id },
        });

        // Si l'enregistrement n'existe pas, retourner null
        if (!existingBudgetLineOf) {
            return null;
        }

        // Désactiver l'enregistrement (soft delete)
        const updatedBudgetLineOf = await budgetLineOfClient.update({
            where: { id },
            data: { 
                isActive: false,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
            },
        });

        return updatedBudgetLineOf;
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to delete major budget line: ${error.message}`);
    }
};

/**
 * 
 * @param id
 * @param body  
 * @returns 
 */
export const restoreBudgetLineOfServices = async (id, body) =>{
    try {
        let BudgetLineOf = await budgetLineOfClient.update({
            where: {id},
            data:{
                isActive:true,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
            },
            include: {
                budgetLineName: {
                    include: {
                        majorBudgetLine: true, // Inclure la relation majorBudgetLine
                    },
                },
                breakdowns: true,   // Inclure les données de breakdowns
            },
        });
        return BudgetLineOf
    } catch (error) {
        console.log(error);
        throw new Error(`${error}`);
    }
}