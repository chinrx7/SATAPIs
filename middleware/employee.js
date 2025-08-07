const db = require('./mysql');
const logger = require('./log');
const { format } = require('date-fns');

module.exports.newTimeSheet = async (T) => {
    let res, query;

    query = `INSERT INTO ee_timesheet (ee_id, taskname, pj_taskid, status, progress, start_time, end_time, detail, remark, pj_id)
    VALUES ('${T.user_id}','${T.taskname}',${T.pj_taskid},'${T.status}','${T.progress}','${T.start_time}','${T.end_time}','${T.detail}','${T.remark}','${T.pj_id ? T.pj_id : null}')`;

    let updateQuery = `UPDATE pj_tasks 
    SET status = '${T.status}', finish_date = '${T.end_time}' 
    WHERE ID = ${T.pj_taskid}`;

    try{
        await db.ExecQuery(query);
        await db.ExecQuery(updateQuery);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`New timesheet error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.updateTimeSheet = async (T) => {
    let res;
    const Cdate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const query = `UPDATE ee_timesheet SET ee_id=${T.user_id}, taskname='${T.taskname}', pj_taskid='${T.pj_taskid}', status=${T.status}, progress='${T.progress}'
    , start_time='${T.start_time}', end_time='${T.end_time}', update_time='${Cdate}', detail='${T.detail}', remark='${T.remark}', pj_id='${T.pj_id}' WHERE ID='${T.ID}'`;

    let updateQuery = `UPDATE pj_tasks 
    SET status = '${T.status}', finish_date = '${T.end_time}' 
    WHERE ID = ${T.pj_taskid}`;

    try{
        await db.ExecQuery(query);
        await db.ExecQuery(updateQuery);
        res= 'ok';
    }
    catch(err){
        logger.loginfo(`Update timesheet error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.getTimesheet = async (T) => {
    let res;
    const query = `SELECT * FROM vw_timesheet WHERE staff_id=${T.user_id}`;
    try{
        res = await db.ExecQuery(query);
    }
    catch(err){
        logger.loginfo(`get time sheet error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.getFilterTimesheet = async (T) => {
    let res;
    const startDate = T.start ? `'${T.start}'` : 'NULL';
    const endDate = T.end ? `'${T.end}'` : 'NULL';

    const query = `
        SELECT * FROM vw_timesheet 
        WHERE staff_id = ${T.user_id}
        AND (
            (start_time BETWEEN ${startDate} AND ${endDate})
            OR (end_time BETWEEN ${startDate} AND ${endDate})
        )
    `;
    try {
        res = await db.ExecQuery(query);
    } catch (err) {
        logger.loginfo(`get time sheet error : ${err}`);
        res = 'error';
    }
    return res;
};

module.exports.getPJtask = async (T) => {
    let res;
    const query = `SELECT * FROM vw_project_tasks WHERE staff_id=${T.user_id}`;
    try{
        res = await db.ExecQuery(query);
    }
    catch(err){
        logger.loginfo(`get project task error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.newServiceLog = async (item) => {
    let res, query;
    const Cdate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    query = `INSERT INTO srv_srvlog (ticket_id, date, duration, task, contact, status, remark, staff_id, update_time)
    VALUES ('${item.Ticket}','${item.Date}',${item.Duration},'${item.Task}','${item.Contact}','${item.Status}','${item.Remark}','${item.Staff_id}','${Cdate}')`;

    // let updateQuery = `UPDATE pj_tasks 
    // SET status = '${T.status}', finish_date = '${T.end_time}' 
    // WHERE ID = ${T.pj_taskid}`;

    try{
        await db.ExecQuery(query);
        //await db.ExecQuery(updateQuery);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`New timesheet error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.updateServiceLog = async (item) => {
    let res;
    const Cdate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const query = `UPDATE srv_srvlog SET task='${item.Task}', date='${item.Date}', duration=${item.Duration}, contact='${item.Contact}'
    , status='${item.Status}', update_time='${Cdate}', remark='${item.Remark}' WHERE ticket_id='${item.Ticket}'`;

    // let updateQuery = `UPDATE pj_tasks 
    // SET status = '${T.status}', finish_date = '${T.end_time}' 
    // WHERE ID = ${T.pj_taskid}`;

    try{
        await db.ExecQuery(query);
        //await db.ExecQuery(updateQuery);
        res= 'ok';
    }
    catch(err){
        logger.loginfo(`Update timesheet error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.getServiceLog = async (T) => {
    let res;
    const query = `SELECT * FROM srv_srvlog WHERE ticket_id=${T.Ticket}`;
    try{
        res = await db.ExecQuery(query);
    }
    catch(err){
        logger.loginfo(`get time sheet error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.getSPticket = async (T) => {
    let res;
    const query = `SELECT * FROM vw_service_staff WHERE Staff_id=${T.user_id}`;
    try{
        res = await db.ExecQuery(query);
    }
    catch(err){
        logger.loginfo(`get project task error : ${err}`);
        res = 'error';
    }
    return res;
}