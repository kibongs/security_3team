const path = require('path');
const fs = require('fs');
    
exports.privateKey = fs.readFileSync(path.join(__dirname, '../../localhost+2-key.pem')).toString();
exports.certificate = fs.readFileSync(path.join(__dirname, '../../localhost+2.pem')).toString();