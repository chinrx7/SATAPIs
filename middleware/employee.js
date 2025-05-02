const db = require('./mysql');
const logger = require('./log');
const { format } = require('date-fns');

module.exports.newTimeSheet = async (T) => {
    let res, query;

    query = `INSERT INTO ee_timesheet (ee_id, taskname, pj_taskid, status, progress, start_time, end_time, detail, remark)
    VALUES ('${T.user_id}','${T.taskname}',${T.pj_taskid},'${T.status}','${T.progress}','${T.start_time}','${T.end_time}','${T.detail}','${T.remark}')`;

    try{
        await db.ExecQuery(query);
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
    , start_time='${T.start_time}', end_time='${T.end_time}', update_time='${Cdate}', detail='${T.detail}', remark='${T.remark}' WHERE ID='${T.ID}'`;

    try{
        await db.ExecQuery(query);
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