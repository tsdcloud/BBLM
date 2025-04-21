// import {prisma} from '../config.js'
// import { AbilityBuilder, Ability } from '@casl/ability';
// import { createPrismaAbility } from '@casl/prisma';
// import rolesUtils from '../utils/roles.utils.js';



// export const consommableAbilities = async (
//     roles,
//     permissions,
//     user
// ) =>{
//     const { can, cannot, build } = new AbilityBuilder(createPrismaAbility);
//     // ROLES
//     if(roles.includes(rolesUtils.CG) || roles.includes(rolesUtils.ADMIN)){
//         can("delete","BudgetLineName")
//         can("delete","MajorBudgetLine")
//         can("delete","BudgetLineName")
//     }

//     // PERMISSIONS
//      if(permissions.includes("view_budget_line")){
//         can("read","BudgetLineName", { createdBy: user.id, isActive:true });
//      }

//      if(permissions.includes("view_all_budget_line")){
//         can("read", "BudgetLineName", { isAvtive: true });
//      }

//      if(permissions.includes("create_budget_line")){
//         can("create", "BudgetLineName");
//      }

//      if(permissions.includes("update_budget_line")){
//         can("update", "BudgetLineName", {createdBy: user.id, isActive:true});
//      }
         
//     return build();
// }