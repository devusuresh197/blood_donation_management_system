import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import { testConnection } from "./config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const port = Number(process.env.PORT || 4005);

async function startServer() {
  try {
    await testConnection();
    app.listen(port, () => {
      console.log(`Blood donation backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

startServer();
