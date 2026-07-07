import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";
import { UserProfile, Booking, Salon, Review } from "./types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID, falling back to default if needed
let db;
try {
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  if (dbId && dbId !== "(default)") {
    db = getFirestore(app, dbId);
  } else {
    db = getFirestore(app);
  }
} catch (e) {
  console.warn("Could not initialize Firestore with custom databaseId, falling back to default database:", e);
  db = getFirestore(app);
}
const auth = getAuth(app);

// Validate Connection to Firestore (MANDATORY CONSTRAINT FROM SKILL)
import { getDocFromServer } from "firebase/firestore";
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Successfully validated Firestore connection.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    } else {
      console.warn("Firestore connection check produced warning/error (expected if offline or database is newly provisioned):", error);
    }
  }
}
testConnection();

export { db, auth };

// --- FIRESTORE ERROR HANDLING (MANDATORY FROM SKILL) ---

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- FIRESTORE USER HELPERS ---

/**
 * Fetch a user profile by email from Firestore.
 */
export async function getCloudUserProfile(email: string): Promise<UserProfile | null> {
  if (!email) return null;
  const path = `users/${email.trim().toLowerCase()}`;
  try {
    const docRef = doc(db, "users", email.trim().toLowerCase());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Save a user profile to Firestore.
 */
export async function saveCloudUserProfile(profile: UserProfile): Promise<void> {
  if (!profile.email) return;
  const path = `users/${profile.email.trim().toLowerCase()}`;
  try {
    const docRef = doc(db, "users", profile.email.trim().toLowerCase());
    await setDoc(docRef, {
      name: profile.name,
      email: profile.email.trim().toLowerCase(),
      phone: profile.phone || "",
      avatar: profile.avatar || "",
      favorites: profile.favorites || [],
      role: profile.role || "customer",
      salonIds: profile.salonIds || []
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load all registered user profiles from Firestore.
 */
export async function getAllCloudUserProfiles(): Promise<UserProfile[]> {
  const path = "users";
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// --- FIRESTORE BOOKINGS HELPERS ---

/**
 * Load all bookings from Firestore.
 */
export async function getAllCloudBookings(): Promise<Booking[]> {
  const path = "bookings";
  try {
    const querySnapshot = await getDocs(collection(db, "bookings"));
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    return bookings;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Save/update a booking in Firestore.
 */
export async function saveCloudBooking(booking: Booking): Promise<void> {
  if (!booking.id) return;
  const path = `bookings/${booking.id}`;
  try {
    const docRef = doc(db, "bookings", booking.id);
    await setDoc(docRef, booking, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a booking from Firestore.
 */
export async function deleteCloudBooking(bookingId: string): Promise<void> {
  const path = `bookings/${bookingId}`;
  try {
    const docRef = doc(db, "bookings", bookingId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- FIRESTORE SALONS HELPERS ---

/**
 * Load all salons from Firestore.
 */
export async function getAllCloudSalons(): Promise<Salon[]> {
  const path = "salons";
  try {
    const querySnapshot = await getDocs(collection(db, "salons"));
    const salons: Salon[] = [];
    querySnapshot.forEach((doc) => {
      salons.push({ id: doc.id, ...doc.data() } as Salon);
    });
    return salons;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Save/update a salon in Firestore.
 */
export async function saveCloudSalon(salon: Salon): Promise<void> {
  if (!salon.id) return;
  const path = `salons/${salon.id}`;
  try {
    const docRef = doc(db, "salons", salon.id);
    await setDoc(docRef, salon, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a salon from Firestore.
 */
export async function deleteCloudSalon(salonId: string): Promise<void> {
  const path = `salons/${salonId}`;
  try {
    const docRef = doc(db, "salons", salonId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete a user profile from Firestore.
 */
export async function deleteCloudUserProfile(email: string): Promise<void> {
  const path = `users/${email.trim().toLowerCase()}`;
  try {
    const docRef = doc(db, "users", email.trim().toLowerCase());
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- FIRESTORE REVIEWS HELPERS ---

/**
 * Load all reviews for a salon from Firestore.
 */
export async function getCloudReviews(salonId: string): Promise<Review[]> {
  const path = "reviews";
  try {
    const querySnapshot = await getDocs(collection(db, "reviews"));
    const reviews: Review[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Review;
      if (data.salonId === salonId) {
        reviews.push({ id: doc.id, ...data });
      }
    });
    return reviews;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Save/update a review in Firestore.
 */
export async function saveCloudReview(review: Review): Promise<void> {
  if (!review.id) return;
  const path = `reviews/${review.id}`;
  try {
    const docRef = doc(db, "reviews", review.id);
    await setDoc(docRef, review, { merge: true });
    
    // Update salon rating and review count
    const salonReviews = await getCloudReviews(review.salonId);
    if (salonReviews.length > 0) {
      const avgRating = salonReviews.reduce((sum, r) => sum + r.rating, 0) / salonReviews.length;
      const salonRef = doc(db, "salons", review.salonId);
      const salonDoc = await getDoc(salonRef);
      if (salonDoc.exists()) {
        await setDoc(salonRef, {
          rating: avgRating,
          reviewCount: salonReviews.length
        }, { merge: true });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
