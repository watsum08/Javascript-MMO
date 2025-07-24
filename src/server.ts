import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url'; // Import the necessary function

// --- ES Module Boilerplate for __dirname ---
// This is the modern replacement for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the Express app
const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---

// Serve static files from the 'dist' directory.
// We now use our new __dirname variable to construct the correct path.
// Note: In your build script, all public files are copied to 'dist',
// so the server should serve from 'dist' in production.
app.use(express.static(path.join(__dirname, '../dist')));


// --- API Routes ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is healthy' });
});

// --- Server Startup ---

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
