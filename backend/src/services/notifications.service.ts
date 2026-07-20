import pool from "../db";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendPushToCouple(
  coupleId: string,
  excludeUserId: string,
  title: string,
  body: string,
) {
  try {
    const result = await pool.query(
      "SELECT expo_push_token FROM users WHERE couple_id = $1 AND id != $2",
      [coupleId, excludeUserId],
    );

    const tokens = result.rows
      .map((r: any) => r.expo_push_token)
      .filter(Boolean);

    if (tokens.length === 0) return;

    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        tokens.map((token: string) => ({
          to: token,
          title,
          body,
          sound: "default",
          priority: "high",
        })),
      ),
    });
  } catch (error) {
    console.error("Error enviando push:", error);
  }
}
