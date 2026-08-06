import pool from "../db";
import path from "path";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let firebaseApp: App;
if (!getApps().length) {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require(
      path.join(__dirname, "../firebase-service-account.json"),
    );
  }
  firebaseApp = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  firebaseApp = getApps()[0];
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendPushToCouple(
  coupleId: string,
  excludeUserId: string,
  title: string,
  body: string,
) {
  try {
    const result = await pool.query(
      "SELECT expo_push_token FROM public.users WHERE couple_id = $1 AND id != $2",
      [coupleId, excludeUserId],
    );

    const tokens = result.rows
      .map((r: any) => r.expo_push_token)
      .filter(Boolean);

    if (tokens.length === 0) return;

    const expoTokens = tokens.filter((t: string) =>
      t.startsWith("ExponentPushToken"),
    );
    const fcmTokens = tokens.filter(
      (t: string) => !t.startsWith("ExponentPushToken"),
    );

    if (expoTokens.length > 0) {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          expoTokens.map((token: string) => ({
            to: token,
            title,
            body,
            sound: "default",
            priority: "high",
            channelId: "default",
          })),
        ),
      });
      const data = await response.json();
      console.log("Expo push response:", JSON.stringify(data));
    }

    if (fcmTokens.length > 0) {
      for (const token of fcmTokens) {
        try {
          await getMessaging().send({
            token,
            notification: { title, body },
            android: {
              priority: "high" as const,
              notification: {
                sound: "default",
                channelId: "default",
              },
            },
          });
          console.log("FCM sent to:", token);
        } catch (fcmError) {
          console.error("FCM error for token:", token, fcmError);
        }
      }
    }
  } catch (error) {
    console.error("Error enviando push:", error);
  }
}
