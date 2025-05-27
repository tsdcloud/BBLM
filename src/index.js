import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { PORT } from './config.js';
import HTTP_STATUS from './utils/http.utils.js';
import majorBudgetLine from './routes/majorBudgetLine.route.js';
import budgetLineName from './routes/budgetLineName.route.js';
import budgetLineOf from './routes/budgetLineOf.route.js';
import breakdownBudgetLineOf from './routes/breakdownBudgetLineOf.route.js';
import derogation from './routes/derogation.route.js';
import { verifyUserExist } from './middlewares/verifyToken.middleware.js';
import { rateLimitAndTimeout } from './middlewares/ratelimiter.middleware.js';

// Charger les variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// const corsOptions = {
//     origin: process.env.ORIGIN.split(',').map(o => o.trim()),
//     methods: process.env.METHODS.split(',').map(m => m.trim()), // Nettoyage des espaces
//     allowedHeaders: process.env.ALLOWEDHEADERS.split(',').map(h => h.trim()), // Ajout manquant
//     credentials: true, // Si vous utilisez des cookies
// };

const getAllOrigins = function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim());
    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
    } else {
        callback(new Error('Not allowed by CORS'));
    }
}
const corsOptions = {
    origin: "https://berp.bfcgroupsa.com",
    methods: 'GET,POST,PUT,DELETE', // Allow these HTTP methods
    allowedHeaders: 'Content-Type,Authorization,Access-Control-Allow-Origin', // Allow these headers
    // methods: process.env.ALLOWED_METHODS.split(',').map(m => m.trim()),
    // allowedHeaders: process.env.ALLOWED_HEADERS.split(',').map(h => h.trim()),
    credentials: true,
  };

app.use(cors(corsOptions));
//app.use(cors());

// Middleware de sécurité
//app.use(helmet());

// Middleware pour parser les corps de requête
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("common"));

// Logging avec Morgan (écriture dans un fichier)
import { createWriteStream } from 'fs';
const accessLogStream = createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));


// Route principale
app.get('/api/', (req, res) => {
    res.send('Bienvenue sur notre API de ligne budgétaire !');
});
app.use(verifyUserExist); // Middleware d'authentification
app.use(rateLimitAndTimeout); // Middleware de limitation de débit
app.use("/api/major-budget-lines", majorBudgetLine);
app.use("/api/budget-line-names", budgetLineName);
app.use("/api/budget-line-ofs", budgetLineOf);
app.use("/api/breakdown-budget-lineOfs", breakdownBudgetLineOf);
app.use("/api/derogations", derogation);

// Middleware de gestion des erreurs global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.statusCode).send('Something broke!');
});

// Démarrage du serveur
const PORT_NUMBER = process.env.PORT || PORT;
const ADDRESS = process.env.ADDRESS || 'localhost';
app.listen(PORT_NUMBER,ADDRESS, () => console.log(`Server running on port ${PORT_NUMBER}...`));
