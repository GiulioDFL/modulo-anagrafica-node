const express = require('express');
const router = express.Router();

// Definizione della rotta (risponderà a GET /users)
router.get('/', (req, res) => {
  res.send('Home');
});

module.exports = router;