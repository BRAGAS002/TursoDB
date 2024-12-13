const { createClient } = require('@libsql/client');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to Turso database
const db = createClient({
  url: 'libsql://server-bragas002.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MzQwNzg3MjAsImlkIjoiNmEyMTZkNTUtZWUzOC00YWQ3LTk0MjctYzZmYTU2OWJmZmE2In0.0oaEDs3D1vcEbsEJ93C7Om3aWHMdpA_yMRq4I7aF_M8JHxktEoJwnWE4UdMXSQkDrC6nYvO57lEfL5guKXHxBQ', // Replace with your Turso auth token
});

// Route to serve HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Route to save form data
app.post('/submit', async (req, res) => {
  const { name, message } = req.body;

  try {
    const result = await db.execute(
      `INSERT INTO messages (name, message) VALUES (?, ?)`,
      [name, message]
    );
    res.status(200).json({ 
      status: 'success', 
      message: 'Your message has been sent successfully!', 
      result 
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to save message' });
  }
});

// Route to serve messages in a table format
app.get('/api/messages', async (req, res) => {
  try {
    // Fetch messages from the database
    const result = await db.execute('SELECT * FROM messages ORDER BY id DESC LIMIT 50');

    // Generate the HTML table
    let htmlTable = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Messages</title>
          <style>
              table {
                  width: 100%;
                  border-collapse: collapse;
              }
              table, th, td {
                  border: 1px solid black;
              }
              th, td {
                  padding: 8px;
                  text-align: left;
              }
          </style>
      </head>
      <body>
          <h1>Messages from Database</h1>
          <table>
              <thead>
                  <tr>
                      <th>Name</th>
                      <th>Message</th>
                      <th>Date</th>
                  </tr>
              </thead>
              <tbody>
    `;

    // Loop through the messages and add each one as a row in the table
    result.rows.forEach(message => {
      htmlTable += `
        <tr>
          <td>${message.name}</td>
          <td>${message.message}</td>
          <td>${new Date(message.timestamp).toLocaleString()}</td> <!-- Assuming you have a timestamp column -->
        </tr>
      `;
    });

    // Close the table and HTML tags
    htmlTable += `
              </tbody>
          </table>
      </body>
      </html>
    `;

    // Send the generated HTML as a response
    res.send(htmlTable);

  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).send('Failed to fetch messages');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
