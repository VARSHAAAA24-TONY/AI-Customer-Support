const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('OK'));
app.listen(5001, () => {
    console.log('Test Server running on port 5001');
    // Keep it running for at least 10 seconds
    setTimeout(() => {
        console.log('Test finished.');
        process.exit(0);
    }, 10000);
});
