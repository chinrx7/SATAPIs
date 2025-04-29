const db = require('./mysql');
const logger = require('./log');
const { format } = require('date-fns');

module.exports.CreateQT = async (Data) => {
    let res;

    const Cdate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    let query = `INSERT INTO sl_quotation (no, rev, cm_id, cm_text, sale_id, parent, create_date) VALUES
        ('${Data.no}', '${Data.rev}', ${Data.cm_id}, ${chkNull(Data.cm_text)}, '${Data.staff_id}', ${chkNull(Data.parent)}, '${Cdate}')`;

    try{
        await db.ExecQuery(query);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Create quotation error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.getQT = async (Option) => {
    let res;

    let { view, date } = Option;
    const Cdate = new Date(date);
    let query, qMonth, qYear;
    qMonth = Cdate.getMonth() + 1;
    qYear = Cdate.getFullYear();

    if(view === 'm'){
        query = `SELECT * FROM sl_quotation WHERE MONTH(create_date)='${qMonth}' AND YEAR(create_date)='${qYear}'`;
    }
    else if(view === 'y'){
        query = `SELECT * FROM sl_quotation WHERE YEAR(create_date)='${qYear}'`;
    }

    res = await db.ExecQuery(query);

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