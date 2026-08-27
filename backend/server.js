require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
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
const monthlyRolloverRoutes = require("./routes/monthlyRolloverRoutes");
const { processDueRecurring } = require("./controllers/recurringController");
const { backfillLegacyBudgets } = require("./controllers/budgetController");
const { backfillCategoryWhitespace } = require("./controllers/expenseController");
const { catchUpMonthlyRollover } = require("./controllers/monthlyRolloverController");

const app = express();

// Render sits behind a reverse proxy, so without this Express sees every
// request as coming from the proxy's own IP — which would make
// express-rate-limit (see authRoutes.js) count all requests as one client
// instead of limiting per real visitor.
app.set("trust proxy", 1);

// Baseline HTTP security headers (X-Content-Type-Options, HSTS, etc).
// crossOriginResourcePolicy is relaxed to "cross-origin" because uploaded
// profile pictures are served from here but rendered on the Vercel-hosted
// frontend (a different origin) — the default "same-origin" policy would
// silently block the browser from loading them.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

//Middleware for CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Default body-size limit is 100kb — too small for a profile picture sent
// as a base64 data URI (a 2MB image encodes to ~2.7MB of JSON text), so
// raise it enough to comfortably fit one plus everything else.
app.use(express.json({ limit: "5mb" }));
connectDB();

// A friendly root route — mainly so a browser visit or an uptime/keep-alive
// ping has something to see other than Express's default "Cannot GET /"
// (this API otherwise only serves the /api/v1/* routes below).
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Pocketly API is running" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/budget", budgetRoutes);
app.use("/api/v1/recurring", recurringRoutes);
app.use("/api/v1/goals", savingsGoalRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/monthly-rollover", monthlyRolloverRoutes);

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

  // One-time-per-boot migration: pin any pre-history budgets to a month
  // and make sure the new per-month unique index is in place.
  backfillLegacyBudgets().catch((err) =>
    console.error("[budget] Backfill failed:", err.message)
  );

  // One-time-per-boot cleanup: trims stray whitespace off existing
  // Expense/Budget category values so a category can't silently split into
  // two chart slices/budget mismatches (see backfillCategoryWhitespace).
  backfillCategoryWhitespace().catch((err) =>
    console.error("[expense] Category whitespace backfill failed:", err.message)
  );

  // Close out any fully-elapsed month that hasn't been closed yet — same
  // "catch up on whatever we missed while asleep" reasoning as the
  // recurring-transactions job above, since a free-tier server can easily
  // sleep straight through the 1st of the month.
  catchUpMonthlyRollover().catch((err) =>
    console.error("[monthly-rollover] Startup catch-up failed:", err.message)
  );

  cron.schedule("5 0 * * *", () => {
    processDueRecurring().catch((err) =>
      console.error("[recurring] Scheduled run failed:", err.message)
    );
    catchUpMonthlyRollover().catch((err) =>
      console.error("[monthly-rollover] Scheduled run failed:", err.message)
    );
  });
});
