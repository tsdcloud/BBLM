// import express from 'express';
import xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { generateRefNum } from './utils/utils.js';
const prisma = new PrismaClient();
// const app = express();

// Path to your Excel file
const excelFilePath = 'C:/Users/EVERMATE/Downloads/ID EQUIPEMENT.xlsx';

// Function to read and parse the Excel file
function readExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet); // Convert sheet to JSON
}

// Function to seed the database
async function seedDatabase() {
  try {
    const data = readExcelFile(excelFilePath);

    for (const row of data) {
        const lastIncidentType = await prisma.equipement.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { numRef: true }
        });
      // Map Excel columns to your Prisma model fields
      const date = new Date();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(-2);
        const prefix = `${mm}${yy}`;
        const nextNum = lastIncidentType ? parseInt(lastIncidentType.numRef.slice(-4)) + 1 : 1;
        const numRef = generateRefNum(lastIncidentType)

      const incidentType = {
        name: row['DESIGNATION'],
        numRef,
        createdBy:"user 1"
      };
      // Insert data into the database
      await prisma.equipement
      // .create({
      //   data: incidentType,
      // });
      .upsert({
        where: {
          name: incidentType.name,
        },
        update: {
          name: incidentType.name,
        },
        create: {name:incidentType.name, numRef, createdBy:"user 1"},
    })
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const seedIncidentTable = async () => {
  let incidentType;
  let equipement;
  let incidentCause;

  try {
    const data = readExcelFile(`C:/Users/EVERMATE/Documents/INCIDENTS.xlsx`);

    for (const row of data) {
      
      let incidentTypeName = row['Type INCIDENT'];
      let equipementName = row['IdEquipement'];
      let incidentCauseName = row['CAUSES INCIDENT'];
      let incidentStatus = row['statut incident'] === 'CLOTURE' ? 'CLOSED' : 'PENDING';

      if(incidentTypeName  && equipementName && incidentCauseName && incidentStatus){

        incidentType = await prisma.incidentType.findFirst({
          where: { name: incidentTypeName },
        });
  
        if (!incidentType) {
  
          incidentType = await prisma.incidentType.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { numRef: true }
          });
  
          const newNumRef = generateRefNum(incidentType);
  
          incidentType = await prisma.incidentType.create({
            data: {
              numRef: newNumRef,
              name: incidentTypeName,
              createdBy: "user 1",
            },
          });
        }
  
        equipement = await prisma.equipement.findFirst({
          where: { name: equipementName },
        });
  
        if (!equipement) {
          equipement = await prisma.equipement.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { numRef: true }
          });
          const newNumRef = generateRefNum(equipement);
          equipement = await prisma.equipement.create({
            data: {
              numRef: newNumRef,
              name: equipementName,
              createdBy: "user 1",
            },
          });
        }
  
        incidentCause = await prisma.incidentCause.findFirst({
          where: { name: incidentCauseName },
        });
  
        if (!incidentCause) {
          // Generate a unique numRef
          incidentCause = await prisma.incidentCause.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { numRef: true }
          });
          const newNumRef = generateRefNum(incidentCause);
          // Check if the numRef already exists
          const existingIncidentCause = await prisma.incidentCause.findFirst({
            where: { numRef: newNumRef },
          });
  
          if (!existingIncidentCause) {
            // If it doesn't exist, create it
            incidentCause = await prisma.incidentCause.create({
              data: {
                numRef: newNumRef,
                name: incidentCauseName,
                createdBy: "user 1",
              },
            });
          } else {
            console.log(`Incident cause with numRef ${newNumRef} already exists.`);
          }
        } 
  
  
        let lastIncidentCause = await prisma.incident.findFirst({
          orderBy:{creationDate:'desc'}
        });
  
        if (!incidentCause) {
          incidentCause = await prisma.incidentCause.create({
            data: {
              numRef: generateRefNum(lastIncidentCause),
              name: incidentCauseName,
              createdBy: "user 1",
            },
          });
        }
  
        let lastIncident = await prisma.incident.findFirst({
          orderBy:{creationDate:'desc'}
        });
  
        let data = {
          numRef: generateRefNum(lastIncident),
          incident: incidentType.id,
          equipement: equipement?.id || null,
          siteId: row['IdGuerite'] || '--',
          description: row['Description INDIDENT'] || "",
          createdBy: row['Nom CHEF DE GUERITE']|| "--",
          status: incidentStatus,
          incident: { connect: { id: incidentType.id }},
          equipement: { connect: { id: equipement.id }},
          incidentCauses: { connect: { id: incidentCause.id }},
        };
  
        let incident = await prisma.incident.create({
          data: {...data},
        });
        console.log(incident);
      }
    }

    console.log("Incident creation completed!");

  } catch (error) {
    console.error(error);
    throw new Error(`${error}`);
  }
}

seedIncidentTable();
// seedDatabase();


