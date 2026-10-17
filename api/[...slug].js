import app from "../server/src/index.js";

export default function handler(req, res) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    if (!res || typeof res.status !== "function" || typeof res.on !== "function") {
      resolve(Response.json({ error: "The API received a request it could not answer." }, { status: 500 }));
      return;
    }

    res.on("finish", finish);
    res.on("close", finish);
    res.on("error", finish);

    try {
      app(req, res);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Something went wrong." });
      }
      finish();
    }
  });
}
