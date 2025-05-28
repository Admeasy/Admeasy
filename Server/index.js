const express = require('express');
const cors = require('cors');
require('dotenv').config();
const CollegesRoutes = require('./routes/collegeRoutes');


const app = express();
app.use(cors());
app.use(express.json());

// Call College Routes to handle college-related requests
app.use('/api/colleges', CollegesRoutes);

// Example route
app.get("/", (req, res) => res.send("Back-end is under development..."));

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));