const express = require('express');

const {
    addIncome,
    updateIncome,
    getAllIncome,
    getIncomeMonthlySummary,
    deleteIncome,
    downloadIncomeExcel
} = require('../controllers/incomeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/add', protect, addIncome);
router.get('/get', protect, getAllIncome);
router.get('/monthly-summary', protect, getIncomeMonthlySummary);
router.get('/downloadexcel', protect, downloadIncomeExcel);
router.put('/:id', protect, updateIncome);
router.delete('/:id', protect, deleteIncome);

module.exports = router;
