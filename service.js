const Service = require('node-windows').Service;
const svc = new Service({
    name:'SAT Portal APIS',
    description: 'Sats management system backend',
    script: ''
});

svc.on('install', () =>{
    svc.start();
});

svc.install();