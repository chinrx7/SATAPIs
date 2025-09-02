const db = require('./mysql');
const logger = require('./log');
const { format } = require('date-fns');
const fdata = require('./file');
const iconv = require('iconv-lite');

module.exports.CreateQT = async (Data, Files) => {
    let res;

    const Cdate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    let query = `INSERT INTO sl_quotation (no, rev, cm_id, cm_text, sale_id, parent, create_date, remark, qt_date) VALUES
        ('${Data.no}', '${Data.rev}', ${Data.cm_id}, ${chkNull(Data.cm_text)}, '${Data.staff_id}', ${chkNull(Data.parent)}, '${Cdate}'
        , '${Data.remark}', '${Data.qt_date}')`;

    try{

        await db.ExecQuery(query);

        if (Array.isArray(Files.file) === true) {

            for await (const f of Files.file) {
                const decodedName = iconv.decode(Buffer.from(f.name, 'latin1'), 'utf8');
                query = `INSERT INTO sl_qt_files (qt_no, rev, filename) VALUES ('${Data.no}','${Data.rev}','${decodedName}')`
                fdata.saveQT(f, decodedName, Data);

                await db.ExecQuery(query);
            }
        }
        else{
            const f  = Files.file;
            const decodedName = iconv.decode(Buffer.from(f.name, 'latin1'), 'utf8');
            query = `INSERT INTO sl_qt_files (qt_no, rev, filename) VALUES ('${Data.no}','${Data.rev}','${decodedName}')`;
            fdata.saveQT(f, decodedName, Data);

            await db.ExecQuery(query);
        }
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Create quotation error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.uploadFile = async (Info, Files) => {
    let res;
    try {

        if (Array.isArray(Files.file) === true) {
            for await (const f of Files.file) {
                const decodedName = iconv.decode(Buffer.from(f.name, 'latin1'), 'utf8');
                //console.log(decodedName)
                fdata.saveQT(f, decodedName, Info);
                const query = `INSERT INTO sl_qt_files (qt_no, rev, filename) VALUES  ('${Info.no}', '${Info.rev}', '${decodedName}')`;
                await db.ExecQuery(query);
            }
        }
        else {
            const f = Files.file;
            const decodedName = iconv.decode(Buffer.from(f.name, 'latin1'), 'utf8');
            //console.log(decodedName)
            fdata.saveQT(f, decodedName, Info);
            const query = `INSERT INTO sl_qt_files (qt_no, rev, filename) VALUES  ('${Info.no}', '${Info.rev}', '${decodedName}')`;
            await db.ExecQuery(query);
        }

        res = 'ok';
    }
    catch(err){
        logger.loginfo(`QT upload file error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.getQT = async (Option) => {
    let res = [];

    let { view, date } = Option;
    const Cdate = new Date(date);
    let query, qMonth, qYear, qQuarter;

    qMonth = Cdate.getMonth() + 1;
    qYear = Cdate.getFullYear();

    // determine quarter from month
    qQuarter = Math.floor((qMonth - 1) / 3) + 1;

    if (view === 'm') {
        query = `SELECT * FROM vw_qt 
                 WHERE MONTH(qt_date)='${qMonth}' 
                 AND YEAR(qt_date)='${qYear}'`;
    }
    else if (view === 'y') {
        query = `SELECT * FROM vw_qt 
                 WHERE YEAR(qt_date)='${qYear}'`;
    }
    else if (view === 'q') {
        // quarter start month and end month
        const startMonth = (qQuarter - 1) * 3 + 1;
        const endMonth = qQuarter * 3;

        query = `SELECT * FROM vw_qt 
                 WHERE MONTH(qt_date) BETWEEN '${startMonth}' AND '${endMonth}' 
                 AND YEAR(qt_date)='${qYear}'`;
    }

    const qt = await db.ExecQuery(query);

    for await (let q of qt) {
        query = `SELECT * FROM sl_qt_files 
                 WHERE qt_no='${q.no}' 
                 AND rev='${q.rev}'`;
        const files = await db.ExecQuery(query);

        q.Files = files;

        res.push(q);
    }

    return res;
};


module.exports.getSummerizeQT = async (Option) => {
    let res = [];

    let { view, date } = Option;
    const Cdate = new Date(date);
    let query, qMonth, qYear, qQuarter;

    qMonth = Cdate.getMonth() + 1;
    qYear = Cdate.getFullYear();
    qQuarter = Math.floor((qMonth - 1) / 3) + 1;

    // base query
    query = `
        SELECT 
            COUNT(*) AS total, 
            SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS open,
            SUM(CASE WHEN status <> 1 THEN 1 ELSE 0 END) AS purchased
        FROM sl_quotation
    `;

    // filter by view
    if (view === 'y') {
        query += ` WHERE YEAR(qt_date) = '${qYear}'`;
    }
    else if (view === 'q') {
        const startMonth = (qQuarter - 1) * 3 + 1;
        const endMonth = qQuarter * 3;
        query += ` WHERE YEAR(qt_date) = '${qYear}' 
                   AND MONTH(qt_date) BETWEEN '${startMonth}' AND '${endMonth}'`;
    }
    // view === 'all' → no WHERE condition

    const qt = await db.ExecQuery(query);

    if (qt) {
        res = qt[0]; // return single object instead of array
    }

    return res;
};



module.exports.updateQT = async (s) => {
    let res;

    const query = `UPDATE sl_quotation SET status='${s.status}', remark='${s.remark}' WHERE ID='${s.ID}'`;
    try{
        await db.ExecQuery(query);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`update QT error : ${err}`);
        res = 'error';
    }
    return res;
}

chkNull = (obj) => {
    let res;
    if(obj === null){
        res = null;
    }
    else{
        res =`'${obj}'`;
    }

    return res;
}

getfileExtension = (fname) => {
    const tfile = fname.split('.');
    return tfile[tfile.length - 1];
}