require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const recurringRoutes = require("./routes/recurringRoutes");
const savingsGoalRoutes = require("./routes/savingsGoalRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const { processDueRecurring } = require("./controllers/recurringController");

const app = express();

//Middleware for CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
connectDB();

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/budget", budgetRoutes);
app.use("/api/v1/recurring", recurringRoutes);
app.use("/api/v1/goals", savingsGoalRoutes);
app.use("/api/v1/transactions", transactionRoutes);

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Catch up on any recurring transactions that came due while the server
  // was offline, then check again every day at 00:05.
  processDueRecurring().catch((err) =>
    console.error("[recurring] Startup catch-up failed:", err.message)
  );

  cron.schedule("5 0 * * *", () => {
    processDueRecurring().catch((err) =>
      console.error("[recurring] Scheduled run failed:", err.message)
    );
  });
});
