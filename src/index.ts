import express from 'express';
import endorser from "./endorser";
import ehr from "./ehr";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

// default is allow-any
app.use(cors());

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({OK: true})
})

app.use("/endorser", endorser);
app.use("/ehr", ehr);

app.listen(port, () => {
  console.log(`UDAP Demo is running on port ${port}.`);
});
