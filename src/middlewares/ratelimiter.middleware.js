import HTTP_STATUS from "../utils/http.utils.js";

const requestCounts = new Map(); // Utiliser un Map pour mieux gérer les clés
const rateLimit = parseInt(process.env.RATE_LIMIT) || 20; // Limite configurable via variable d'environnement
const interval = parseInt(process.env.RATE_INTERVAL) || 60 * 1000; // Intervalle configurable
const timeoutDuration = parseInt(process.env.REQUEST_TIMEOUT) || 15000; // Timeout configurable

// Réinitialisation périodique des compteurs
setInterval(() => {
  for (const [ip, data] of requestCounts.entries()) {
    if (Date.now() - data.lastRequest > interval) {
      requestCounts.delete(ip); // Supprimer les IPs inactives
    } else {
      data.count = 0; // Réinitialiser le compteur pour les IPs actives
    }
  }
}, interval);

/**
 * Middleware pour appliquer un rate limiting et un timeout sur les requêtes.
 */
export function rateLimitAndTimeout(req, res, next) {
  const ip = req.ip || 'unknown'; // Récupérer l'IP du client

  // Appliquer le rate limiting uniquement pour les méthodes PUT, PATCH, DELETE et POST
  const restrictedMethods = ['PUT', 'PATCH', 'DELETE', 'POST'];
  if (!restrictedMethods.includes(req.method)) {
    return next(); // Ignorer les autres méthodes
  }

  // Initialiser ou mettre à jour les données pour cette IP
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 0, lastRequest: Date.now() });
  }

  const data = requestCounts.get(ip);
  data.count += 1;
  data.lastRequest = Date.now();

  // Vérifier si la limite de requêtes est dépassée
  if (data.count > rateLimit) {
    return res.status(429).json({
      code: 429,
      status: "Error",
      message: "Rate limit exceeded. Please try again later.",
      data: null,
    });
  }

  // Définir un timeout pour la requête
  const timeout = setTimeout(() => {
    if (!res.headersSent) { // Vérifier si la réponse n'a pas déjà été envoyée
      res.status(HTTP_STATUS.GATE_TIMEOUT.statusCode).json({
        code: HTTP_STATUS.GATE_TIMEOUT.statusCode,
        status: "Error",
        message: HTTP_STATUS.GATE_TIMEOUT.message,
        data: null,
      });
    }
  }, timeoutDuration);

  // Nettoyer le timeout après que la requête soit terminée
  res.on("finish", () => clearTimeout(timeout));
  res.on("close", () => clearTimeout(timeout));

  next();
}