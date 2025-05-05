import {prisma} from '../config.js';
// import {DerogationAbilities} from '../utils/abilities.utils.js';
import { Op } from 'sequelize';
import { Month } from '../utils/utils.js';

const DerogationClient = prisma.Derogation;
const DerogationLigneClient = prisma.DerogationLigne;
const breakdownBudgetLineOfClient = prisma.breakdownBudgetLineOf;

const generateNumRef = async (prisma, prefix) => {
    const count = await prisma.derogation.count({
        where: { numRef: { startsWith: prefix } }
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

// Configuration des constantes réutilisables
const DEROGATION_LIGNES_INCLUDE = {
    derogationLignes: {
        select: {
            Amount: true,
            numRef: true,
            isActive: true,
            breakdownBudgetLineOfDebited: {
                include: {
                    budgetLineOf: {
                        include: {
                            budgetLineName: {
                                include: {
                                    majorBudgetLine: { select: { name: true } }
                                }
                            }
                        }
                    }
                }
            },
            breakdownBudgetLineOfCredited: {
                include: {
                    budgetLineOf: {
                        include: {
                            budgetLineName: {
                                include: {
                                    majorBudgetLine: { select: { name: true } }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};


/**
 * Create a Derogation
 * @param body 
 * @returns 
 */
export const createDerogationService = async (body) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Création de la dérogation
        // 1. Génération du préfixe avec Date natif
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0'); // Mois 01-12
        const yy = String(now.getFullYear()).slice(-2); // Deux derniers chiffres
        const datePrefix = mm + yy;
        const derogationNumRef = await generateNumRef(tx, datePrefix);
        
        const derogation = await tx.derogation.create({
            data: {
                description: body.description,
                numRef: derogationNumRef,
                createdBy: body.createdBy
            }
        });

        // 2. Traitement des lignes
        for (const [index, ligne] of body.derogationLignes.entries()) {
            // Vérification des BreakdownBudgetLineOf existants
            const [debited, credited] = await Promise.all([
                tx.breakdownBudgetLineOf.findUnique({ 
                    where: { id: ligne.breakdownBudgetLineOfDebitedId } 
                }),
                tx.breakdownBudgetLineOf.findUnique({ 
                    where: { id: ligne.breakdownBudgetLineOfCreditedId } 
                })
            ]);

            if (!debited) throw new Error(`BreakdownBudgetLineOfDebited ${ligne.breakdownBudgetLineOfDebitedId} n'existe pas`);
            if (!credited) throw new Error(`BreakdownBudgetLineOfCredited ${ligne.breakdownBudgetLineOfCreditedId} n'existe pas`);
            if (debited.estimatedAmount < ligne.Amount) throw new Error(`Montant insuffisant pour ${debited.id}`);

            // Mise à jour des montants
            await tx.breakdownBudgetLineOf.update({
                where: { id: debited.id },
                data: { 
                    // estimatedAmount: debited.estimatedAmount - ligne.Amount,
                    estimatedAmount: Number(debited.estimatedAmount) - Number(ligne.Amount),
                    updatedBy: body.createdBy,
                    updatedAt: new Date(),
                    // realAmount: debited.realAmount ? debited.realAmount + ligne.Amount : ligne.Amount
                }
            });

            await tx.breakdownBudgetLineOf.update({
                where: { id: credited.id },
                data: { 
                    // estimatedAmount: credited.estimatedAmount + ligne.Amount,
                    estimatedAmount: Number(credited.estimatedAmount) + Number(ligne.Amount),
                    updatedBy: body.createdBy,
                    updatedAt: new Date(),
                    // realAmount: credited.realAmount ? credited.realAmount - ligne.Amount : -ligne.Amount
                }
            });

            // Création de la DerogationLigne
            const ligneNumRef = `${derogationNumRef}-${String(index + 1).padStart(2, '0')}`;
            
            await tx.derogationLigne.create({
                data: {
                    numRef: ligneNumRef,
                    derogationId: derogation.id,
                    breakdownBudgetLineOfDebitedId: debited.id,
                    breakdownBudgetLineOfCreditedId: credited.id,
                    Amount: ligne.Amount,
                    createdBy: body.createdBy || 'system'
                }
            });
        }

        return tx.derogation.findUnique({
            where: { id: derogation.id },
            include: DEROGATION_LIGNES_INCLUDE
        });
    });
};


/**
 * 
 * @returns 
 */
export const getAllDerogationService = async (params = {}) => {
    try {
        
        // Extraction des paramètres
        const {
            limit = 100,
            skip = 0,
            order = 'asc',
            sortBy = 'createdAt',
            numRef,
            description,
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

        // Validation des paramètres numériques
        const validatedLimit = Number(limit);
        const validatedSkip = Math.max(0, Number(skip)) || 0;

        // Fonctions utilitaires
        const handleTextFilter = (field, value) => 
            value ? { [field]: { contains: value } } : {};

        const handleUserFilter = (field, value) => 
            value ? { [field]: value } : {};

        const handleDateRange = (startDate, endDate, field) => {
            if (!startDate || !endDate) return null;
            
            const start = new Date(startDate);
            start.setUTCHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);

            return { [field]: { gte: start, lte: end } };
        };

        const handleSingleDate = (date, operation, field) => {
            if (!date) return null;
            
            const d = new Date(date);
            d.setUTCHours(0, 0, 0, 0);
            
            return {
                [field]: operation === 'sup' ? { gte: d }
                    : operation === 'inf' ? { lte: d }
                    : d
            };
        };

        // Construction des filtres
        const cleanFilters = { 
            ...filters,
            ...handleTextFilter('numRef', numRef),
            ...handleTextFilter('description', description),
            ...handleUserFilter('createdBy', createdBy),
            ...handleUserFilter('updatedBy', updatedBy),
        };

        // Gestion des dates
        if (createdAt && createdAtBis) {
            Object.assign(cleanFilters, handleDateRange(createdAt, createdAtBis, 'createdAt'));
        } else if (createdAt) {
            Object.assign(cleanFilters, handleSingleDate(createdAt, operationCreatedAt, 'createdAt'));
        }

        if (updatedAt && updatedAtBis) {
            Object.assign(cleanFilters, handleDateRange(updatedAt, updatedAtBis, 'updatedAt'));
        } else if (updatedAt) {
            Object.assign(cleanFilters, handleSingleDate(updatedAt, operationUpdatedAt, 'updatedAt'));
        }

        // Filtre booléen
        if (isActive !== undefined) {
            cleanFilters.isActive = ['true', true].includes(isActive);
        }

        // Configuration de base de la requête
        const baseQueryOptions = {
            where: cleanFilters,
            orderBy: { [sortBy]: order },
            include: DEROGATION_LIGNES_INCLUDE
        };

        // Cas spécial sans pagination
        if (validatedLimit < 0) {
            const data = await prisma.Derogation.findMany({
                ...baseQueryOptions,
                where: { ...cleanFilters, isActive: true },
                take: undefined,
                skip: 0
            });

            return {
                limit: -1,
                skip: 0,
                total: data.length,
                totalPages: 1,
                currentPage: 1,
                data
            };
        }

        // Requête paginée
        const queryOptions = {
            ...baseQueryOptions,
            take: validatedLimit,
            skip: validatedSkip
        };

        // Exécution parallèle
        const [totalRecords, data] = await Promise.all([
            prisma.Derogation.count({ where: cleanFilters }),
            prisma.Derogation.findMany(queryOptions)
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
export const getDerogationByIdService = async(id) =>{
    try {
        let derogations = await DerogationClient.findFirst({
            where:{id},
            include: DEROGATION_LIGNES_INCLUDE
        });
        if (!derogations) throw new Error(`No Derogation found.`)
        return derogations;
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
export const updateDerogationService = async (id, body) => {
    try {
        // Rechercher la ligne budgétaire existante
        const existingDerogation = await DerogationClient.findUnique({
            where: { id },
        });

        if (!existingDerogation) {
            throw new Error("Major budget line not found.");
        }


        // Mettre à jour la ligne budgétaire
        const derogations = await DerogationClient.update({
            where: { id },
            data: {
                description: body.description ? body.description.toLowerCase() : existingDerogation.description,
                updatedBy: body.updatedBy, // Obligatoire
                updatedAt: new Date(),
            },
            include: DEROGATION_LIGNES_INCLUDE
        });

        return derogations;
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
export const deleteDerogationServices = async (id, body) => {
    const lignes = await DerogationLigneClient.findMany({ where: { derogationId: id } });
    console.log("Lignes trouvées :", lignes.length); // Assurez-vous qu'il y en a
    try {
        const existingDerogation = await DerogationClient.findUnique({
            where: { id },
        });

        if (!existingDerogation) return null;

        // Désactiver les lignes associées avant la dérivation
        await DerogationLigneClient.updateMany({
            where: { derogationId: id },
            data: {
                isActive: false,
                updatedBy: body.updatedBy,
                updatedAt: new Date(),
            },
        });

        // Désactiver la dérogation principale
        const derogations = await DerogationClient.update({
            where: { id },
            data: {
                isActive: false,
                updatedBy: body.updatedBy,
                updatedAt: new Date(),
            },
        });

        return derogations;
    } catch (error) {
        console.error(error);
        throw new Error(`Échec de la suppression de la dérogation : ${error.message}`);
    }
};

/**
 * 
 * @param id
 * @param body  
 * @returns 
 */
export const restoreDerogationServices = async (id, body) => {
    try {
        // Réactiver toutes les lignes associées
        await DerogationLigneClient.updateMany({
            where: { derogationId: id },
            data: {
                isActive: true,
                updatedBy: body.updatedBy,
                updatedAt: new Date(),
            },
        });

        // Réactiver la dérogation principale
        const derogations = await DerogationClient.update({
            where: { id },
            data: {
                isActive: true,
                updatedBy: body.updatedBy,
                updatedAt: new Date(),
            },
            include: DEROGATION_LIGNES_INCLUDE, // Assurez-vous que cette variable est définie
        });

        return derogations;
    } catch (error) {
        console.error(error);
        throw new Error(`Échec de la restauration de la dérogation : ${error.message}`);
    }
};
