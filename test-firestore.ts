import { db } from "./src/firebase";
import { collection, getDocs } from "firebase/firestore";

async function run() {
  try {
    const querySnapshot = await getDocs(collection(db, "salons"));
    console.log("Success! Docs:", querySnapshot.size);
  } catch (e: any) {
    console.error("FAIL:", e.message);
  }
  process.exit(0);
}
run();
