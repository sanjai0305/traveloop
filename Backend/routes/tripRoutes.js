import express from "express";

import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  generateShareToken,
  getSharedTrip,
  cloneTrip,
  getActivitiesRecommendations,
  getDestinationsAutocomplete,
  getDestinationDetails,
  getNearbyDestinations,
  inviteCollaborator,
  getCollaborators,
  removeCollaborator,
  updateCollaboratorRole,
  acceptInvite,
  declineInvite,
  getActivityLogs,
  addExpense,
  deleteExpense,
  addSettlement,
  getExchangeRates,
  exportTripPDF,
} from "../controllers/tripController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  protect,
  createTrip
);

router.get(
  "/",
  protect,
  getTrips
);

router.get(
  "/destinations/autocomplete",
  protect,
  getDestinationsAutocomplete
);

router.get(
  "/destinations/details",
  protect,
  getDestinationDetails
);

// V1.6 Smart Explore — nearby tourist attractions
router.get(
  "/destinations/nearby",
  protect,
  getNearbyDestinations
);

router.get(
  "/exchange-rates",
  protect,
  getExchangeRates
);

router.get(
  "/shared/:token",
  getSharedTrip
);

router.get(
  "/:id/pdf",
  protect,
  exportTripPDF
);

router.get(
  "/:id",
  protect,
  getTripById
);

router.put(
  "/:id",
  protect,
  updateTrip
);

router.delete(
  "/:id",
  protect,
  deleteTrip
);

router.post(
  "/:id/expenses",
  protect,
  addExpense
);

router.delete(
  "/:id/expenses/:expenseId",
  protect,
  deleteExpense
);

router.post(
  "/:id/settlements",
  protect,
  addSettlement
);

router.post(
  "/:id/share",
  protect,
  generateShareToken
);

router.post(
  "/:id/clone",
  protect,
  cloneTrip
);

router.get(
  "/:id/recommendations",
  protect,
  getActivitiesRecommendations
);

// V1.4 Collaboration routes
router.post("/:id/invite", protect, inviteCollaborator);
router.get("/:id/collaborators", protect, getCollaborators);
router.delete("/:id/collaborators/:userId", protect, removeCollaborator);
router.put("/:id/collaborators/:userId", protect, updateCollaboratorRole);
router.post("/invite/:notificationId/accept", protect, acceptInvite);
router.post("/invite/:notificationId/decline", protect, declineInvite);
router.get("/:id/activity-log", protect, getActivityLogs);

export default router;