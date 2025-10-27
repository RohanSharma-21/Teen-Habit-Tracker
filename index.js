import express from "express";
const app = express();

// Serve everything in /public
app.use(express.static("public"));

// Root route
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Grow app running on port ${PORT}`));
