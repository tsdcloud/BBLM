import {prisma} from '../config.js';
// import {majorBudgetLineAbilities} from '../utils/abilities.utils.js';
import { Op } from 'sequelize';
import { Month } from '../utils/utils.js';

const majorBudgetLineClient = prisma.majorBudgetLine;

/**
 * Create a majorBudgetLine
 * @param body 
 * @returns 
 */
export const createMajorBudgetLineService = async (body) => {
    try {
        // Vérifier l'unicité du code
        const existingCode = await majorBudgetLineClient.findUnique({
            where: { code: body.code },
        });
        if (existingCode) {
            throw new Error("Code must be unique.");
        }

        // Vérifier l'unicité du nom (en minuscules)
        const existingName = await majorBudgetLineClient.findUnique({
            where: { name: body.name.toLowerCase() },
        });
        if (existingName) {
            throw new Error("Name must be unique.");
        }

        // Générer le numéro de référence
        const lastMajorBudgetLine = await majorBudgetLineClient.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { numRef: true },
        });

        const date = new Date();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(-2);
        const prefix = `${mm}${yy}`;
        const nextNum = lastMajorBudgetLine ? parseInt(lastMajorBudgetLine.numRef.slice(-4)) + 1 : 1;
        const numRef = `${prefix}${String(nextNum).padStart(4, '0')}`;

        // Créer la ligne budgétaire principale
        const majorBudgetLine = await majorBudgetLineClient.create({
            data: { ...body, numRef },
        });

        return majorBudgetLine;
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to create major budget line: ${error.message}`);
    }
};


/**
 * 
 * @returns 
 */
export const getAllMajorBudgetLineService = async (params = {}) => {
    try {
        const {
            limit = 100,
            skip = 0,
            order = 'asc', // Prisma utilise 'asc'/'desc' au lieu de 'ASC'/'DESC'
            sortBy = 'createdAt',
            numRef,
            code,
            serviceId,
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
        if (serviceId) cleanFilters.serviceId = serviceId;

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
            const data = await prisma.majorBudgetLine.findMany({
                where: cleanFilters,
                orderBy: { [sortBy]: order }, // Tri selon le paramètre sortBy
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
            skip: validatedSkip
        };

        // Exécution parallèle
        const [totalRecords, data] = await Promise.all([
            prisma.majorBudgetLine.count({ where: cleanFilters }),
            prisma.majorBudgetLine.findMany(queryOptions)
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
export const getMajorBudgetLineByIdService = async(id) =>{
    try {
        let majorBudgetLine = await majorBudgetLineClient.findFirst({
            where:{id},
            include: {budgetLineNames: true},
        });
        if (!majorBudgetLine) throw new Error(`No majorBudgetLine found.`)
        return majorBudgetLine;
    } catch (error) {
        console.log(error);
        throw new Error(`${error}`);
    }
}


/**
 * 
 * @param id 
 * @param body 
 * @returns 
 */
export const updateMajorBudgetLineService = async (id, body) => {
    try {
        // Rechercher la ligne budgétaire existante
        const existingMajorBudgetLine = await majorBudgetLineClient.findUnique({
            where: { id },
        });

        if (!existingMajorBudgetLine) {
            throw new Error("Major budget line not found.");
        }

        // Vérifier l'unicité du code si fourni
        if (body.code && body.code !== existingMajorBudgetLine.code) {
            const existingCode = await majorBudgetLineClient.findUnique({
                where: { code: body.code },
            });
            if (existingCode) {
                throw new Error("Code must be unique.");
            }
        }

        // Vérifier l'unicité du nom (en minuscules) si fourni
        if (body.name && body.name.toLowerCase() !== existingMajorBudgetLine.name) {
            const existingName = await majorBudgetLineClient.findUnique({
                where: { name: body.name.toLowerCase() },
            });
            if (existingName) {
                throw new Error("Name must be unique.");
            }
        }

        // Mettre à jour la ligne budgétaire
        const updatedMajorBudgetLine = await majorBudgetLineClient.update({
            where: { id },
            data: {
                code: body.code || existingMajorBudgetLine.code,
                serviceId: body.serviceId || existingMajorBudgetLine.serviceId,
                name: body.name ? body.name.toLowerCase() : existingMajorBudgetLine.name,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
            },
            include: {budgetLineNames: true},
        });

        return updatedMajorBudgetLine;
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to update major budget line: ${error.message}`);
    }
};


/**
 * 
 * @param id
 * @param body  
 * @returns 
 */
export const deleteMajorBudgetLineServices = async (id,body) => {
    try {
        // Rechercher l'enregistrement existant
        const existingMajorBudgetLine = await majorBudgetLineClient.findUnique({
            where: { id },
        });

        // Si l'enregistrement n'existe pas, retourner null
        if (!existingMajorBudgetLine) {
            return null;
        }

        // Désactiver l'enregistrement (soft delete)
        const updatedMajorBudgetLine = await majorBudgetLineClient.update({
            where: { id },
            data: { 
                isActive: false,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
            },
        });

        return updatedMajorBudgetLine;
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
export const restoreMajorBudgetLineServices = async (id, body) =>{
    try {
        let majorBudgetLine = await majorBudgetLineClient.update({
            where: {id},
            data:{
                isActive:true,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
            },
            include: {budgetLineNames: true},
        });
        return majorBudgetLine
    } catch (error) {
        console.log(error);
        throw new Error(`${error}`);
    }
}


// export const analyseMajorBudgetLineService = async ({ services, year, startMonth, endMonth }) => {
//     try {
//         // Déterminer l'année et les mois sélectionnés
//         const currentYear = new Date().getFullYear();
//         const currentMonthIndex = new Date().getMonth(); // 0 pour janvier, 11 pour décembre

//         const selectedYear = year || currentYear;
//         const selectedStartMonth = startMonth || 'JANVIER';
//         const selectedEndMonth = endMonth || Object.values(Month)[currentMonthIndex];

//         const monthValues = Object.values(Month); // Liste des mois valides
//         const startMonthIndex = monthValues.indexOf(selectedStartMonth);
//         const endMonthIndex = monthValues.indexOf(selectedEndMonth);

//         // Récupérer les données depuis Prisma
//         const majorBudgetLines = await prisma.majorBudgetLine.findMany({
//             where: {
//                 serviceId: { in: services },
//                 isActive: true,
//             },
//             select: {
//                 id: true,
//                 numRef: true,
//                 code: true,
//                 name: true,
//                 serviceId: true,
//                 budgetLineNames: {
//                     where: { isActive: true },
//                     select: {
//                         id: true,
//                         numRef: true,
//                         code: true,
//                         name: true,
//                         budgetLineOfs: {
//                             where: {
//                                 isActive: true,
//                                 createdAt: {
//                                     gte: new Date(selectedYear, startMonthIndex, 1),
//                                     lt: new Date(selectedYear, endMonthIndex + 1, 1),
//                                 },
//                             },
//                             select: {
//                                 id: true,
//                                 numRef: true,
//                                 breakdowns: {
//                                     where: { isActive: true },
//                                     select: {
//                                         month: true,
//                                         estimatedAmount: true,
//                                         realAmount: true,
//                                     },
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//         });

//         // Transformer les données pour correspondre à la structure attendue
//         const groupedByServiceId = {};

//         majorBudgetLines.forEach((majorBudgetLine) => {
//             const { serviceId, ...rest } = majorBudgetLine;

//             // Calculer les totaux annuels pour chaque budgetLineOf
//             const transformedBudgetLine = {
//                 ...rest,
//                 budgetLineNames: majorBudgetLine.budgetLineNames.map((budgetLineName) => ({
//                     id: budgetLineName.id,
//                     numRef: budgetLineName.numRef,
//                     code: budgetLineName.code,
//                     name: budgetLineName.name,
//                     budgetLineOfs: budgetLineName.budgetLineOfs.map((budgetLineOf) => {
//                         const totalEstimatedAmount = budgetLineOf.breakdowns.reduce(
//                             (sum, breakdown) => sum + (breakdown.estimatedAmount?.toNumber() || 0),
//                             0
//                         );
//                         const totalRealAmount = budgetLineOf.breakdowns.reduce(
//                             (sum, breakdown) => sum + (breakdown.realAmount?.toNumber() || 0),
//                             0
//                         );

//                         return {
//                             id: budgetLineOf.id,
//                             numRef: budgetLineOf.numRef || '',
//                             estimatedAmount: totalEstimatedAmount,
//                             realAmount: totalRealAmount,
//                         };
//                     }),
//                 })),
//             };

//             // Regrouper par serviceId
//             if (!groupedByServiceId[serviceId]) {
//                 groupedByServiceId[serviceId] = [];
//             }
//             groupedByServiceId[serviceId].push(transformedBudgetLine);
//         });

//         return groupedByServiceId;
//     } catch (error) {
//         console.error('Erreur lors de l\'analyse des lignes budgétaires :', error);
//         throw new Error('Une erreur est survenue lors de l\'analyse des lignes budgétaires.');
//     }
// };
export const analyseMajorBudgetLineService = async ({ services, year, startMonth, endMonth }) => {
    try {
        // Déterminer l'année et les mois sélectionnés
        const currentYear = new Date().getFullYear();
        const currentMonthIndex = new Date().getMonth(); // 0 pour janvier, 11 pour décembre

        const selectedYear = year || currentYear;
        const selectedStartMonth = startMonth || 'JANVIER';
        const selectedEndMonth = endMonth || Object.values(Month)[currentMonthIndex];

        const monthValues = Object.values(Month); // Liste des mois valides
        const startMonthIndex = monthValues.indexOf(selectedStartMonth);
        const endMonthIndex = monthValues.indexOf(selectedEndMonth);

        // Récupérer les données depuis Prisma
        // const majorBudgetLines = await prisma.majorBudgetLine.findMany({
        //     where: {
        //         serviceId: { in: services },
        //         isActive: true,
        //     },
        //     select: {
        //         id: true,
        //         numRef: true,
        //         code: true,
        //         name: true,
        //         serviceId: true, // Inclure serviceId ici
        //         budgetLineNames: {
        //             where: { isActive: true },
        //             select: {
        //                 id: true,
        //                 numRef: true,
        //                 code: true,
        //                 name: true,
        //                 budgetLineOfs: {
        //                     where: {
        //                         isActive: true,
        //                         createdAt: {
        //                             gte: new Date(selectedYear, startMonthIndex, 1),
        //                             lt: new Date(selectedYear, endMonthIndex + 1, 1),
        //                         },
        //                     },
        //                     select: {
        //                         id: true,
        //                         numRef: true,
        //                         breakdowns: {
        //                             where: { isActive: true },
        //                             select: {
        //                                 month: true,
        //                                 estimatedAmount: true,
        //                                 realAmount: true,
        //                             },
        //                         },
        //                     },
        //                 },
        //             },
        //         },
        //     },
        // });
        const majorBudgetLines = await prisma.majorBudgetLine.findMany({
            where: {
                serviceId: { in: services },
                isActive: true, // Condition pour MajorBudgetLine
            },
            select: {
                id: true,
                numRef: true,
                code: true,
                name: true,
                serviceId: true, // Inclure serviceId ici
                budgetLineNames: {
                    where: {
                        isActive: true, // Condition pour BudgetLineName
                    },
                    select: {
                        id: true,
                        numRef: true,
                        code: true,
                        name: true,
                        budgetLineOfs: {
                            where: {
                                isActive: true, // Condition pour BudgetLineOf
                                createdAt: {
                                    gte: new Date(selectedYear, startMonthIndex, 1),
                                    lt: new Date(selectedYear, endMonthIndex + 1, 1),
                                },
                            },
                            select: {
                                id: true,
                                numRef: true,
                                breakdowns: {
                                    where: {
                                        isActive: true, // Condition pour BreakdownBudgetLineOf
                                    },
                                    select: {
                                        month: true,
                                        estimatedAmount: true,
                                        realAmount: true,
                                        purchaseOrderAmount: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Transformer les données pour correspondre à la structure attendue
        const transformedData = majorBudgetLines.map((majorBudgetLine) => {
            return {
                ...majorBudgetLine,
                budgetLineNames: majorBudgetLine.budgetLineNames.map((budgetLineName) => ({
                    id: budgetLineName.id,
                    numRef: budgetLineName.numRef,
                    code: budgetLineName.code,
                    name: budgetLineName.name,
                    budgetLineOfs: budgetLineName.budgetLineOfs.map((budgetLineOf) => {
                        const totalEstimatedAmount = budgetLineOf.breakdowns.reduce(
                            (sum, breakdown) => sum + (breakdown.estimatedAmount?.toNumber() || 0),
                            0
                        );
                        const totalRealAmount = budgetLineOf.breakdowns.reduce(
                            (sum, breakdown) => sum + (breakdown.realAmount?.toNumber() || 0),
                            0
                        );
                        const totalPurchaseOrderAmount = budgetLineOf.breakdowns.reduce(
                            (sum, breakdown) => sum + (breakdown.purchaseOrderAmount?.toNumber() || 0),
                            0
                        );

                        return {
                            id: budgetLineOf.id,
                            numRef: budgetLineOf.numRef || '',
                            estimatedAmount: totalEstimatedAmount,
                            realAmount: totalRealAmount,
                            purchaseOrderAmount: totalPurchaseOrderAmount,
                        };
                    }),
                })),
            };
        });

        return transformedData; // Retourner un tableau plat
    } catch (error) {
        console.error('Erreur lors de l\'analyse des lignes budgétaires :', error);
        throw new Error('Une erreur est survenue lors de l\'analyse des lignes budgétaires.');
    }
};