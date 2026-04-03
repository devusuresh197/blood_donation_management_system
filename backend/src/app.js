import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import donorRoutes from "./routes/donorRoutes.js";
import recipientRoutes from "./routes/recipientRoutes.js";
import bloodBankRoutes from "./routes/bloodBankRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ success: true, message: "Blood donation backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/blood-banks", bloodBankRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/requests", requestRoutes);

app.use((request, response) => {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
});

export default app;
