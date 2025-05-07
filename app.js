const express = require('express');
const cors = require('cors');
const route = require('./routes/route');
const { config } = require('./middleware/config');
const logger = require('./middleware/log');
const fileUpload = require('express-fileupload');

const app = express();

app.use(fileUpload({ limits: { fileSize: 20 * 1024 * 1024 }, abortOnLimit: true }));
app.use(express.json({ limit: '100mb' }));
app.use(cors({ origin: '*', credentials: true }));

app.listen(config.API.port);
app.use(route);

logger.loginfo('app running at port : ' + config.API.port);