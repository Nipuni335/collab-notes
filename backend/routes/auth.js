// routes/auth.js
const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  registerRules,
  loginRules,
  validate,
} = require("../validators/authValidators");

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);

module.exports = router;
