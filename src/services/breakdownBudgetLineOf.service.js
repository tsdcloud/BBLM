import {prisma} from '../config.js';
// import {BreakdownBudgetLineOfAbilities} from '../utils/abilities.utils.js';
import { Op } from 'sequelize';

const breakdownBudgetLineOfClient = prisma.breakdownBudgetLineOf;

/**
 * Create a BreakdownBudgetLineOf
 * @param body 
 * @returns 
 */
export const createBreakdownBudgetLineOfService = async (body) => {
    try {
        // Vérifier l'unicité du code et de la combinaison (month, budgetLineOfId)

        const existingRecord = await breakdownBudgetLineOfClient.findFirst({
            where: {
                AND: [
                    {
                        month: body.month, // Vérifie l'ID de la ligne budgétaire principale
                    },
                    {
                        budgetLineOfId: body.budgetLineOfId, // Vérifie l'ID de la ligne budgétaire principale
                    },
                ],
            },
        });

        if (existingRecord) {
            throw new Error("A breakdown with this budgetLineOfId and month already exists.");
        }

        // Générer le numéro de référence
        const lastBreakdownBudgetLineOf = await breakdownBudgetLineOfClient.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { numRef: true },
        });

        const date = new Date();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(-2);
        const prefix = `${mm}${yy}`;
        const nextNum = lastBreakdownBudgetLineOf ? parseInt(lastBreakdownBudgetLineOf.numRef.slice(-4)) + 1 : 1;
        const numRef = `${prefix}${String(nextNum).padStart(4, '0')}`;

        // Créer la ligne budgétaire
        const breakdownBudgetLineOf = await breakdownBudgetLineOfClient.create({
            data: { ...body, numRef },
            // include: { budgetLineOf: true }
            include: {
                budgetLineOf: {
                    include: {
                        budgetLineName: {
                            include: {
                                majorBudgetLine: true, // Inclure la relation majorBudgetLine
                            },
                        },
                    },
                },
            },
        });

        return breakdownBudgetLineOf;
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to create budget line: ${error.message}`);
    }
};


/**
 * 
 * @returns 
 */
export const getAllBreakdownBudgetLineOfService = async (params = {}) => {
    try {
        const {
            limit = 100,
            skip = 0,
            order = 'asc',
            sortBy = 'createdAt',
            numRef,
            budgetLineOfId,
            month,
            end_month,
            operationMonth,
            estimatedAmount,
            estimatedAmount_down,
            realAmount,
            realAmount_down,
            purchaseOrderAmount,
            purchaseOrderAmount_down,
            operationEstimatedAmount,
            operationRealAmount,
            operationpurchaseOrderAmount,
            createdBy,
            updatedBy,
            createdAt,
            createdAtBis,
            operationCreatedAt,
            updatedAt,
            updatedAtBis,
            operationUpdatedAt,
            isActive,
            ...filters
        } = params;

        const validatedLimit = Number(limit);
        const validatedSkip = Math.max(0, Number(skip)) || 0;
        const cleanFilters = { ...filters };

        // Fonction utilitaire pour gérer les intervalles
        const handleRangeFilter = (field, value1, value2, operation) => {
            if (value1 && value2) {
                return { [field]: { gte: value1, lte: value2 } };
            } else if (value1 && operation) {
                return { [field]: operation === 'sup' ? { gte: value1 } : { lte: value1 } };
            }
            return null;
        };

        // Validation et traitement des mois
        const monthsSet = new Set([
            "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN",
            "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"
        ]);

        // if (month && end_month) {
        //     if (!monthsSet.has(month.toUpperCase()) || !monthsSet.has(end_month.toUpperCase())) {
        //         throw new Error("Invalid month name provided.");
        //     }

        //     const months = Array.from(monthsSet);
        //     const startMonthIndex = months.indexOf(month.toUpperCase());
        //     const endMonthIndex = months.indexOf(end_month.toUpperCase());

        //     cleanFilters.month = { in: months.slice(startMonthIndex, endMonthIndex + 1) };
        // } else if (month) {
        //     if (!monthsSet.has(month.toUpperCase())) {
        //         throw new Error("Invalid month name provided.");
        //     }

        //     cleanFilters.month = month.toUpperCase();
        // }

        const allMonths = Array.from(monthsSet);

        if (month) {
            const monthUpper = month.toUpperCase();
            if (!monthsSet.has(monthUpper)) {
                throw new Error("Invalid month name provided.");
            }

            // Gestion selon operationMonth
            if (operationMonth === "inf") {
                // Filtre du début de l'année jusqu'à monthUpper inclus
                const index = allMonths.indexOf(monthUpper);
                cleanFilters.month = { in: allMonths.slice(0, index + 1) };
            } else if (operationMonth === "sup") {
                // Filtre de monthUpper jusqu'à la fin de l'année
                const index = allMonths.indexOf(monthUpper);
                cleanFilters.month = { in: allMonths.slice(index) };
            } else if (end_month) {
                // Comportement original avec intervalle
                const endMonthUpper = end_month.toUpperCase();
                if (!monthsSet.has(endMonthUpper)) {
                    throw new Error("Invalid end_month name provided.");
                }

                const startIdx = allMonths.indexOf(monthUpper);
                const endIdx = allMonths.indexOf(endMonthUpper);

                if (startIdx > endIdx) {
                    throw new Error("Start month must be before or equal to end month.");
                }

                cleanFilters.month = { in: allMonths.slice(startIdx, endIdx + 1) };
            } else {
                // Cas simple : un seul mois
                cleanFilters.month = monthUpper;
            }
        }

        // Filtres textuels
        if (numRef) cleanFilters.numRef = { contains: numRef };
        if (budgetLineOfId) cleanFilters.budgetLineOfId = budgetLineOfId;

        // Filtres numériques (montants)
        const estimatedAmountFilter = handleRangeFilter('estimatedAmount', estimatedAmount, estimatedAmount_down, operationEstimatedAmount);
        if (estimatedAmountFilter) cleanFilters.estimatedAmount = estimatedAmountFilter;

        const realAmountFilter = handleRangeFilter('realAmount', realAmount, realAmount_down, operationRealAmount);
        if (realAmountFilter) cleanFilters.realAmount = realAmountFilter;

        const purchaseOrderAmountFilter = handleRangeFilter('purchaseOrderAmount', purchaseOrderAmount, purchaseOrderAmount_down, operationpurchaseOrderAmount);
        if (purchaseOrderAmountFilter) cleanFilters.purchaseOrderAmount = purchaseOrderAmountFilter;

        // Filtres de dates
        const handleDateFilter = (date, bis, operation) => {
            if (date && bis) {
                const startDate = new Date(date);
                const endDate = new Date(bis);
                startDate.setUTCHours(0, 0, 0, 0);
                endDate.setUTCHours(23, 59, 59, 999);

                return { gte: startDate, lte: endDate };
            } else if (date && operation) {
                const d = new Date(date);
                d.setUTCHours(0, 0, 0, 0);

                return operation === 'sup' ? { gte: d } : { lte: d };
            }
            return null;
        };

        const createdAtFilter = handleDateFilter(createdAt, createdAtBis, operationCreatedAt);
        if (createdAtFilter) cleanFilters.createdAt = createdAtFilter;

        const updatedAtFilter = handleDateFilter(updatedAt, updatedAtBis, operationUpdatedAt);
        if (updatedAtFilter) cleanFilters.updatedAt = updatedAtFilter;

        // Filtres booléens
        if (isActive !== undefined) cleanFilters.isActive = isActive === true || isActive === 'true';

        // Requête principale avec pagination
        const queryOptions = {
            where: cleanFilters,
            orderBy: { [sortBy]: order },
            take: validatedLimit >= 0 ? validatedLimit : undefined,
            skip: validatedSkip,
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
        };

        // Cas spécial : récupération de tous les éléments avec isActive: true
        if (validatedLimit < 0) {
            cleanFilters.isActive = true;
            const data = await prisma.breakdownBudgetLineOf.findMany({
                where: cleanFilters,
                orderBy: { [sortBy]: order },
                include: queryOptions.include,
            });

            return {
                limit: -1,
                skip: 0,
                total: data.length,
                totalPages: 1,
                currentPage: 1,
                data,
            };
        }

        // Exécution parallèle pour compter et récupérer les données
        const [totalRecords, data] = await Promise.all([
            prisma.breakdownBudgetLineOf.count({ where: cleanFilters }),
            prisma.breakdownBudgetLineOf.findMany(queryOptions),
        ]);

        const totalPages = validatedLimit > 0 ? Math.ceil(totalRecords / validatedLimit) : 1;
        const currentPage = validatedLimit > 0 ? Math.floor(validatedSkip / validatedLimit) + 1 : 1;

        return {
            limit: validatedLimit,
            skip: validatedSkip,
            total: totalRecords,
            totalPages,
            currentPage,
            data,
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

export const getBreakdownBudgetLineOfByIdService = async (id) => {
    try {
        // Recherchez le BreakdownBudgetLineOf avec ses relations incluses
        let breakdownBudgetLineOf = await breakdownBudgetLineOfClient.findFirst({
            where: { id },
            include: {
                budgetLineOf: {
                    include: {
                        budgetLineName: {
                            include: {
                                majorBudgetLine: true, // Inclure la relation majorBudgetLine
                            },
                        },
                    },
                },
            },
        });

        // Si aucun résultat n'est trouvé, lancez une erreur
        if (!breakdownBudgetLineOf) throw new Error(`No BreakdownBudgetLineOf found.`);

        return breakdownBudgetLineOf; // Retournez les données avec les relations incluses
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

export const updateBreakdownBudgetLineOfService = async (id, body) => {
    try {
        // Rechercher l'enregistrement existant
        console.log(body);
        const existingBreakdownBudgetLineOf = await breakdownBudgetLineOfClient.findUnique({
            where: { id },
        });

        if (!existingBreakdownBudgetLineOf) {
            throw new Error("Budget line not found.");
        }

        // Vérifier si realAmount est fourni dans la requête
        // if ((typeof body.realAmount === 'number' && !isNaN(body.realAmount)) ||
        //     (typeof body.purchaseOrderAmount === 'number' && !isNaN(body.purchaseOrderAmount))) {
        if ((body.realAmount !== undefined && !isNaN(body.realAmount)) ||
            (body.purchaseOrderAmount !== undefined && !isNaN(body.purchaseOrderAmount))) {
            // Extraire l'année et le mois actuels
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth(); // Index de 0 (Janvier) à 11 (Décembre)

            // Extraire l'année et le mois de création à partir de createdAt
            const createdAtDate = new Date(existingBreakdownBudgetLineOf.createdAt);
            const creationYear = createdAtDate.getFullYear();
            const creationMonth = createdAtDate.getMonth(); // Index de 0 à 11

            // Conversion du mois enum en index numérique pour comparaison
            const monthEnumToIndex = {
                JANVIER: 0,
                FEVRIER: 1,
                MARS: 2,
                AVRIL: 3,
                MAI: 4,
                JUIN: 5,
                JUILLET: 6,
                AOUT: 7,
                SEPTEMBRE: 8,
                OCTOBRE: 9,
                NOVEMBRE: 10,
                DECEMBRE: 11,
            };
            const recordMonthIndex = monthEnumToIndex[existingBreakdownBudgetLineOf.month];

            // Validation : Année actuelle doit être égale ou supérieure à l'année de création
            if (currentYear < creationYear) {
                throw new Error("You can't update a budget line from another year.");
            }

            // Validation : Le mois actuel doit être >= au mois de l'enregistrement si l'année est la même
            if (currentYear === creationYear && currentMonth < recordMonthIndex) {
                throw new Error(`The current date (${currentYear}-${currentMonth + 1}) is earlier than the record date (${creationYear}-${recordMonthIndex + 1}).`);
            }
            const newRealAmount = body.realAmount ?? existingBreakdownBudgetLineOf.realAmount;
            const newPurchaseOrderAmount = body.purchaseOrderAmount ?? existingBreakdownBudgetLineOf.purchaseOrderAmount;

            const totalUsed = newRealAmount + newPurchaseOrderAmount;

            if (totalUsed > existingBreakdownBudgetLineOf.estimatedAmount) {
                throw new Error("Total used (real + purchase order) cannot exceed estimated budget.");
            }
        }
        if (
            body.amount !== undefined && 
            !isNaN(body.amount)
            ){
            if(existingBreakdownBudgetLineOf.purchaseOrderAmount < body.amount){
                throw new Error("You cannot pay more than the purchase order amount.");
            }
            existingBreakdownBudgetLineOf.purchaseOrderAmount = Number(existingBreakdownBudgetLineOf.purchaseOrderAmount) - Number(body.amount);
            existingBreakdownBudgetLineOf.realAmount = Number(existingBreakdownBudgetLineOf.realAmount) + Number(body.amount);
            console.log("body.amount : ", body.amount);
            console.log("existingBreakdownBudgetLineOf.purchaseOrderAmount :", existingBreakdownBudgetLineOf.purchaseOrderAmount);
            console.log("existingBreakdownBudgetLineOf.realAmount :", existingBreakdownBudgetLineOf.realAmount);

        }

        // Mettre à jour l'enregistrement
        const updatedBreakdownBudgetLineOf = await breakdownBudgetLineOfClient.update({
            where: { id },
            data: {
                budgetLineOfId: body.budgetLineOfId || existingBreakdownBudgetLineOf.budgetLineOfId,
                month: body.month ? body.month : existingBreakdownBudgetLineOf.month,
                estimatedAmount: body.estimatedAmount !== undefined ? body.estimatedAmount : existingBreakdownBudgetLineOf.estimatedAmount,
                realAmount: body.realAmount !== undefined ? body.realAmount : existingBreakdownBudgetLineOf.realAmount,
                purchaseOrderAmount: body.purchaseOrderAmount !== undefined ? body.purchaseOrderAmount : existingBreakdownBudgetLineOf.purchaseOrderAmount,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
            },
            include: {
                budgetLineOf: {
                    include: {
                        budgetLineName: {
                            include: {
                                majorBudgetLine: true, // Inclure la relation majorBudgetLine
                            },
                        },
                    },
                },
            },
        });

        return updatedBreakdownBudgetLineOf;

    } catch (error) {
        console.error("Error in updateBreakdownBudgetLineOfService:", error);
        throw error; // Remonter l'erreur telle quelle pour traitement dans le contrôleur
    }
};


/**
 * 
 * @param id
 * @param body  
 * @returns 
 */

export const deleteBreakdownBudgetLineOfServices = async (id, body) => {
    try {
        // Rechercher l'enregistrement existant
        const existingBreakdownBudgetLineOf = await breakdownBudgetLineOfClient.findUnique({
            where: { id },
            updatedBy: body.updatedBy, // Obligatoire
            updatedAt: new Date(),
        });

        // Si l'enregistrement n'existe pas, retourner null
        if (!existingBreakdownBudgetLineOf) {
            return null;
        }

        // Désactiver l'enregistrement (soft delete)
        const updatedBreakdownBudgetLineOf = await breakdownBudgetLineOfClient.update({
            where: { id },
            data: { 
                isActive: false,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(), 
            },
        });

        return updatedBreakdownBudgetLineOf;
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
export const restoreBreakdownBudgetLineOfServices = async (id, body) =>{
    try {
        let breakdownBudgetLineOf = await breakdownBudgetLineOfClient.update({
            where: {id},
            data:{
                isActive:true,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
            },
            include: {
                budgetLineOf: {
                    include: {
                        budgetLineName: {
                            include: {
                                majorBudgetLine: true, // Inclure la relation majorBudgetLine
                            },
                        },
                    },
                },
            },
        });
        return breakdownBudgetLineOf
    } catch (error) {
        console.log(error);
        throw new Error(`${error}`);
    }
}