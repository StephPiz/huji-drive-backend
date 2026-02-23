import { google } from "googleapis";

export const config = {
  api: { bodyParser: { sizeLimit: "12mb" } }
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { imageBase64, filename } = req.body || {};
    const folderId = process.env.DRIVE_FOLDER_ID;

    if (!imageBase64 || !filename) {
  return res.status(400).json({
    ok: false,
    error: "Missing imageBase64 / filename"
  });
}

if (!folderId) {
  return res.status(500).json({
    ok: false,
    error: "Missing DRIVE_FOLDER_ID env var"
  });
}

    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ["https://www.googleapis.com/auth/drive.file"]
    });

    const drive = google.drive({ version: "v3", auth });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId]
      },
      media: {
        mimeType: "image/jpeg",
        body: buffer
      },
      fields: "id,name"
    });

    return res.status(200).json({
      ok: true,
      fileId: response.data.id
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: "Upload failed"
    });
  }
}
