import { db } from "./src/firebase";
import { doc, getDocFromServer, setDoc } from "firebase/firestore";

async function run() {
  try {
    const d = doc(db, "test", "test");
    await setDoc(d, { hello: "world" });
    const snap = await getDocFromServer(d);
    console.log("SUCCESS:", snap.data());
  } catch (e) {
    console.error("FAIL:", e.message);
  }
  process.exit(0);
}
run();
