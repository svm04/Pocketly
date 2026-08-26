const expresss = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getDashboardData } = require("../controllers/dashboardController");
const router = expresss.Router();

//route to get dashboard data
router.get("/", protect, getDashboardData);

module.exports = router;
