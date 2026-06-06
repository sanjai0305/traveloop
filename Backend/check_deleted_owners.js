import mongoose from "mongoose";
import User from "./models/User.js";
import Trip from "./models/Trip.js";
import { hasTripPermission } from "./utils/permissionHelper.js";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/traveloop");
  console.log("Connected to MongoDB");

  const trips = await Trip.find({});
  console.log(`Checking ${trips.length} trips...`);

  for (const trip of trips) {
    const ownerId = trip.owner || trip.user;
    const ownerExists = await User.exists({ _id: ownerId });
    if (!ownerExists) {
      console.log(`Trip "${trip.title}" (${trip._id}) has non-existent owner: ${ownerId}`);
    }

    if (trip.collaborators) {
      for (const collab of trip.collaborators) {
        const collabExists = await User.exists({ _id: collab.userId });
        if (!collabExists) {
          console.log(`Trip "${trip.title}" (${trip._id}) has non-existent collaborator: ${collab.userId}`);
        }
      }
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
