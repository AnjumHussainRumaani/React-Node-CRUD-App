const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = 'your-secret';
let items = [];
let users = [{ email: 'test@example.com', password: '1234' }];

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.sendStatus(403);
  }
}

// Register endpoint
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  const userExists = users.find((u) => u.email === email);
  if (userExists)
    return res.status(409).json({ message: 'User already exists' });

  users.push({ email, password });
  res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  const user = users.find((u) => u.email === email);
  if (!user)
    return res.status(404).json({ message: "Account doesn't exist" });
  if (user.password !== password)
    return res.status(401).json({ message: 'Wrong password' });

  const token = jwt.sign({ email }, SECRET, { expiresIn: '1h' });
  res.json({ token, email });
});

// Get all items
app.get('/items', authenticate, (req, res) => {
  res.json(items);
});

// Add new item
app.post('/items', authenticate, (req, res) => {
  const { name, idCard, phone, city, country } = req.body;
  const item = {
    id: Date.now(),
    name,
    idCard,
    phone,
    city,
    country
  };
  items.push(item);
  res.status(201).json(item);
});

// Update item
app.put('/items/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, idCard, phone, city, country } = req.body;
  const index = items.findIndex((item) => item.id === Number(id));
  if (index === -1)
    return res.status(404).json({ message: 'Item not found' });

  items[index] = { ...items[index], name, idCard, phone, city, country };
  res.status(200).json(items[index]);
});

// Delete item
app.delete('/items/:id', authenticate, (req, res) => {
  const id = Number(req.params.id);
  const initialLength = items.length;
  items = items.filter((i) => i.id !== id);
  if (items.length === initialLength)
    return res.status(404).json({ message: 'Item not found' });
  res.status(204).json({ message: 'Item deleted' });
});

// Start local server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});