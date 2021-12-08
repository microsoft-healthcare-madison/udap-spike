import express from "express";
import fhir4 from "fhir/r4";
import path from "path";
import config from "./config";

const router = express.Router();
export default router;

router.get("/api/status.json", (req, res) => {
  res.json({ ehr: true });
});