const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === process.env.CLIENT_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

app.use("/api/auth", require("./routes/auth"));
app.use('/api/spotify', require('./routes/spotify'));
app.use("/uploads", express.static("uploads"));
app.use("/api/messages", require("./routes/messages"));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));