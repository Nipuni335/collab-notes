// validators/authValidators.js
const { body, validationResult } = require("express-validator");

// ── Reusable runner ───────────────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
};

// ── Auth ──────────────────────────────────────────────────────────────────────
const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 60 }),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number"),
];

const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ── Notes ─────────────────────────────────────────────────────────────────────
const noteRules = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title max 200 chars"),
  body("content").optional().isString(),
  body("color")
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage("Invalid hex colour"),
];

// ── Collaborators ─────────────────────────────────────────────────────────────
const collaboratorRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  noteRules,
  collaboratorRules,
};
