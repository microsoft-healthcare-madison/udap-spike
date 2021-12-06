import express from 'express';

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.json({OK: true})
})

app.listen(port, () => {
  console.log(`UDAP Demo is running on port ${port}.`);
});
