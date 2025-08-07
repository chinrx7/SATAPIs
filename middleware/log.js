const fs = require('fs');
const util = require('util');
const { config } = require('./config');
const db = require('./mysql');
const { format } = require('date-fns');

module.exports.loginfo = (log) => {

    const fdname = './log';
    if (!fs.existsSync(fdname)) {
        fs.mkdirSync(fdname);
    }
    //console.log(log);
    const fdate = new Date().toISOString().slice(0, 10);
    //console.log(fdate)

    //console.log(fdate.replace(new RegExp(escapeRegExp(find), '/'),'-'));
    const fileName = './log/' + fdate + '.log';

    const tmp = new Date().toLocaleTimeString();

    const msg = fdate + ' ' + tmp + ' ' + log;

    const log_stdout = process.stdout;

    if (!fs.existsSync(fileName)) {
        const log_file = fs.createWriteStream(fileName, { flags: 'w' });
        log_file.write(util.format(msg) + '\n');

    }
    else {
        fs.appendFileSync(fileName, util.format(msg + '\n'));
    }

    log_stdout.write(util.format(msg) + '\n');
}

module.exports.debuglog = (log) => {
    if (config.Debug.Enable === 1) {
        this.loginfo(log);
    }
}

module.exports.mailLog = (log) => {
    const fdname = './log/mail_log';
    if (!fs.existsSync(fdname)) {
        fs.mkdirSync(fdname);
    }
    const fdate = new Date().toISOString().slice(0, 10);
    const filename = `./log/mail_log/${fdate}.log`

    const tmp = new Date().toLocaleTimeString();

    const log_stdout = process.stdout;

    if (!fs.existsSync(filename)) {
        const log_file = fs.createWriteStream(filename, { flags: 'w' });
        log_file.write(util.format(log) + '\n');
    }
    else {
        fs.appendFileSync(filename, util.format(`${log}\n`));
    }

    log_stdout.write(util.format(log) + '\n');
}

module.exports.DBlog = async (log) => {
    let res;
    try {
        const Edate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
        const Cdate = format(new Date(), 'yyyy_MM')

        const Tname = `sys_event_${Cdate}`;

        // Use CREATE TABLE IF NOT EXISTS to avoid race conditions
        let query = `CREATE TABLE IF NOT EXISTS ${Tname} (
            ID int NOT NULL AUTO_INCREMENT,
            module tinytext,
            action tinytext,
            event_date datetime(3) DEFAULT NULL,
            staff_id int DEFAULT NULL,
            PRIMARY KEY (ID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3`;

        await db.ExecQuery(query);

        // Insert the log entry
        query = `INSERT INTO ${Tname} (module, action, event_date, staff_id) 
            VALUES ('${log.module}', '${log.action}', '${Edate}', '${log.staff}')`;

        await db.ExecQuery(query);
        res = 'ok';
    }
    catch (err) {
        this.loginfo(`DB log error : ${err}`);
        res = 'error';
    }
    return res;
}