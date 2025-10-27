import express from "express";

const app = express();

// Serve a simple front page
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Teen Habit Tracker</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #111;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          h1 {
            font-size: 3em;
            color: #00d4ff;
          }
        </style>
      </head>
      <body>
        <h1>Teen Habit Tracker</h1>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ App running on port ${PORT}`));
