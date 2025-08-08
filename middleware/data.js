const db = require('./mysql');
const logger = require('./log');
const fs = require('fs');
const fdata = require('./file');
const { format } = require('date-fns');
const { fi, el } = require('date-fns/locale');
const { mailSend } = require('./notification');

module.exports.NewCustomer = async (Customer) => {

    let query = `INSERT INTO cm_customers (cm_id, name_th, address_th, branch_th, name_eng, address_eng, branch_eng, taxid, bill_condition, credit_term)  VALUES ('${Customer.key}', '${Customer.name_th}', 
    '${Customer.address_th}', '${Customer.branch_th}', '${Customer.name_eng}', '${Customer.address_eng}', '${Customer.branch_eng}', '${Customer.taxid}', '${Customer.bill_con}', '${Customer.credit_term}');`

    const res = await db.ExecQuery(query);

    for await (const phone of Customer.phones) {
        query = `INSERT INTO cm_phones (cm_id, phone_type, phone_number) VALUES 
        ('${Customer.key}', '${phone.type}', '${phone.number}')`

        await db.ExecQuery(query);
    }

    for await (const c of Customer.contacts) {
        query = `INSERT INTO cm_contacts (cm_id, name, position, email, remark, phone) VALUES 
        ('${Customer.key}', '${c.name}', '${c.position}', '${c.email}', '${c.remark}', '${c.phone}')`;

        await db.ExecQuery(query);
    }

    return res
}

module.exports.UpdateCustomer = async (C) => {
    let query = `UPDATE cm_customers SET name_th='${C.name_th}', address_th='${C.address_th}', branch_th='${C.branch_th}', name_eng='${C.name_eng}', address_th='${C.address_eng}', branch_th='${C.branch_eng}',
     taxid='${C.taxid}', bill_condition='${C.bill_con}', credit_term='${C.credit_term}', doc_no='${C.doc_no}' WHERE cm_id='${C.cm_id}'`;
    await db.ExecQuery(query);

    if (C.phones) {
        for await (const phone of C.phones) {
            const f = phone.flag;
            switch (f) {
                case 'i':
                    query = `INSERT INTO cm_phones (cm_id, phone_type, phone_number, is_primary) VALUES 
                    ('${C.cm_id}', '${phone.type}', '${phone.number}', '${phone.isprimary}')`;
                    await db.ExecQuery(query);
                    break;
                case 'u':
                    query = `UPDATE cm_phones SET phone_type='${phone.type}', phone_number='${phone.number}', is_primary='${phone.isprimary}' WHERE ID='${phone.ID}'`;
                    await db.ExecQuery(query);
                    break;
                case 'd':
                    query = `DELETE FROM cm_phones WHERE ID='${phone.ID}'`;
                    await db.ExecQuery(query);
                    break;

            }
        }
    }

    if (C.contacts) {
        for await (const contact of C.contacts) {
            switch (contact.flag) {
                case 'i':
                    query = `INSERT INTO cm_contacts (cm_id, name, position, email, remark, phone) VALUES 
                    ('${C.cm_id}', '${contact.name}', '${contact.position}', '${contact.email}', '${contact.remark}', '${contact.phone}')`;
                    await db.ExecQuery(query);
                    break;
                case 'u':
                    query = `UPDATE cm_contacts SET name='${contact.name}', position='${contact.position}', email='${contact.email}', remark='${contact.remark}'
                    , phone='${contact.phone}' WHERE ID='${contact.ID}'`;
                    await db.ExecQuery(query);
                    break;
                case 'd':
                    query = `DELETE FROM cm_contacts WHERE ID='${contact.ID}'`;
                    await db.ExecQuery(query);
                    break;
            }
        }
    }

}

module.exports.AddShipAddr = async (S) => {
    let res;
    try {
        const query = `INSERT INTO cm_ship_address (cm_id, address, is_primary) VALUES ('${S.cm_id}', '${S.address}', '${S.default}')`;
        await db.ExecQuery(query);
        res = 'ok';
    }
    catch (err) {
        logger.loginfo(`Add shipping address error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.EditShipAddr = async (S) => {
    let res;
    try{
        const query = `UPDATE cm_ship_address SET address='${S.address}', is_primary='${S.default}' WHERE ID='${S.ID}'`;
        await db.ExecQuery(query);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Edit shipping address error : ${err}`);
        res  = 'error';
    }
    return res;
}

module.exports.DeleteShipAddr = async (S) => {
    let res;
    try{
        const query = `DELETE FROM cm_ship_address WHERE ID='${S.ID}'`;
        await db.ExecQuery(query);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Delete Shipping address error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.getShipAddr = async (S) => {
    let res;
    try{
        let query;
        if(S.all === 1){
            query = 'SELECT * FROM cm_ship_address';
            res = await db.ExecQuery(query);
        }
        else{
            query = `SELECT * FROM cm_ship_address WHERE cm_id='${S.cm_id}'`;
            res = await db.ExecQuery(query);
        }
    }
    catch(err){
        logger.loginfo(`get shipping address error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.GetContact = async (Contact) => {
    let res;

    let query = `select * FROM cm_contacts WHERE ID='${Contact.ID}'`;

    const data = await db.ExecQuery(query);
    if (data.length > 0) {
        res = data[0];
    }
    else {
        res = 'error';
    }

    return res;
}


module.exports.NewContact = async (Contact) => {
    let res;

    let query = `select ID FROM cm_contacts WHERE name='${Contact.name}' AND cm_id='${Contact.cm_id}'`;

    const exist = await db.ExecQuery(query);
    if (exist.length === 0) {
        query = `INSERT INTO cm_contacts (cm_id, name, position, email, remark, phone) VALUES 
        ('${Contact.cm_id}', '${Contact.name}', '${Contact.position}', '${Contact.email}', '${Contact.remark}', '${Contact.phone}')`;
        try {
            await db.ExecQuery(query);
            res = 'ok';
        }
        catch (err) {
            logger.loginfo(`Insert contact error : ${err}`);
            res = 'error';
        }
    }
    else {
        res = ' duplicated'
    }

    return res;
}

module.exports.UpdateContact = async (Contact) => {
    let res;

    const query = `UPDATE cm_contacts SET cm_id='${Contact.cm_id}', name='${Contact.name}', position='${Contact.position}',
     email='${Contact.email}', remark='${Contact.remark}', phone='${Contact.phone}' WHERE ID='${Contact.ID}'`;

    try {
        await db.ExecQuery(query);
        res = 'ok';
    }
    catch (err) {
        logger.loginfo(`Update contact error : ${err}`);
    }

    return res;
}

module.exports.DelContact = async (ID) => {
    let res;
    const query = `DELETE FROM cm_contacts WHERE ID='${ID}'`;
    try {
        db.ExecQuery(query);
        res = 'ok';
    }
    catch (err) {
        logger.loginfo(`Delete contact error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.GetCustomer = async (cmid) => {
    let query = `SELECT * FROM cm_customers WHERE cm_id='${cmid}'`;
    const detail = await db.ExecQuery(query);

    query = `SELECT * FROM vw_cm_phones WHERE cm_id='${cmid}'`;
    const phones = await db.ExecQuery(query);

    query = `SELECT * FROM cm_contacts WHERE cm_id='${cmid}'`;
    const contacts = await db.ExecQuery(query);

    return { Details: detail, Phones: phones, Contacts: contacts };
}

module.exports.NewProject = async (Project, Files) => {
    let res;

    // try {

    let query = `SELECT name FROM pj_projects WHERE pj_id='${Project.Key}'`;

    const exist = await db.ExecQuery(query);

    if (exist.length === 0) {
        let IO;
        if(!Project.IO){
            IO = await generatePJID(Project.Type);
        }
        else{
            IO = Project.IO;
        }

        const Cdate = format(new Date(), 'yyyy-MM-dd');
        query = `INSERT INTO pj_projects (pj_id, io, name, type, cm_id, create_date, start_date, end_date, manager_id, warranty,
                 pay_term, status, contact, subtype) VALUES ('${Project.Key}', '${IO}', '${Project.Name}', '${Project.Type}', '${Project.CM_ID}', '${Cdate}',
                '${Project.Start_Date}', '${Project.End_Date}', '${Project.Mgm_id}', '${Project.Warranty}', '${Project.Payment}', '${Project.Status}','${Project.Contact}', '${Project.SubType}')`

        await db.ExecQuery(query);

        const [staffList] = await Promise.all([
            db.ExecQuery(`SELECT * FROM satdb.ee_staffs`)
        ]);

        if (staffList?.length) {
            const manager = staffList.find(s => s.ID == Project.Mgm_id) ?? null;

            if (manager?.mail) {
                const subject = `You’ve Been Assigned as Project Manager`;
                const message = [
                `Dear ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''},`,
                ``,
                `You have been assigned as the **Project Manager** for the project **"${Project.Name}"** via the SAT Portal System.`,
                ``,
                `Project Details:`,
                `- Project IO : ${IO}`,
                `- Project Name : ${Project.Name}`,
                `- Start Date   : ${Project.Start_Date}`,
                `- End Date     : ${Project.End_Date}`,
                `- View Project : http://sats1.myddns.me:3030`,
                ``,
                `As the Project Manager, you are responsible for overseeing project execution, managing team members, ensuring timelines are met, and coordinating with all relevant stakeholders.`,
                ``,
                `Please log in to the system to begin managing your project.`,
                ``,
                `Best regards,`,
                `SAT Solutions Co., Ltd.`
                ].join('\n');

                await mailSend(manager.mail, subject, message);
            }
        }

        if (Project.Teams.Staff.length > 0) {
            for await (const staff of Project.Teams.Staff) {
                query = `INSERT INTO pj_project_staffs (pj_id, staff_id) VALUES ('${Project.Key}', '${staff}')`;
                await db.ExecQuery(query);
                if (staffList?.length) {
                    const staffs = staffList.find(s => s.ID == staff) ?? null;
                    const manager = staffList.find(s => s.ID == Project.Mgm_id) ?? null;

                    if (staffs?.mail) {
                        const subject = `You’ve Been Added to a Project Team`;
                        const message = [
                        `Dear ${staffs.Fname} ${staffs.Lname},`,
                        ``,
                        `You have been added as a team member to the project **"${Project.Name}"** by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via the SAT Portal System.`,
                        ``,
                        `Project Details:`,
                        `- Project IO : ${IO}`,
                        `- Project Name : ${Project.Name}`,
                        `- Start Date   : ${Project.Start_Date}`,
                        `- End Date     : ${Project.End_Date}`,
                        `- Project Manager : ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''}`,
                        `- View Project : http://sats1.myddns.me:3030`,
                        ``,
                        `Please log in to the system to view full project details and your assigned responsibilities (if any).`,
                        ``,
                        `If you have any questions, please contact the Project Manager directly.`,
                        ``,
                        `Best regards,`,
                        `SAT Solutions Co., Ltd.`
                        ].join('\n');


                        await mailSend(staffs.mail, subject, message);
                    }
                }
            }
        }

        if (Project.Tasks.length > 0) {
            for await (const task of Project.Tasks) {
                query = `INSERT INTO pj_tasks (pj_id, task, start_date, end_date, hour_expected, staff_id, remark, require_doc, status) VALUES
                    ('${Project.Key}', '${task.Name}', '${task.Start_Date}', '${task.End_Date}', '${task.Man_Hour}', '${task.Staff_ID}', '${task.Remark}',
                    '${task.Require_Doc}', '${task.Status}')`;

                //console.log(query)
                
                await db.ExecQuery(query);
            }
        }

        if (Project.Products.length > 0) {
            for await (const p of Project.Products) {

                query = `INSERT INTO pj_project_products (pj_id, pd_id, product, qty) VALUES ('${Project.Key}', '${p.pd_id}', '${p.product}',
                     '${p.qty}')`
                await db.ExecQuery(query);
            }
        }

        if (Files) {

            let f;

            if (!Files.file.length) {
                f = Files.file
                const ext = getfileExtension(f.name);
                const doc = Project.Documents[0];
                const fileInfo = {
                    IO: IO, pj_id: Project.Key, filename: `${doc.docname}`/*`${doc.docname}_${doc.doc_no}.${ext}`*/, docname: doc.docname, description: doc.description
                    , type: doc.type, groupfile: doc.groupfile, doc_no: doc.doc_no
                }
                fdata.SaveFiles(fileInfo, f);
            }
            else {
                for await (const doc of Project.Documents) {
                    f = Files.file[doc.pos];
                    const ext = getfileExtension(f.name);
                    const fileInfo = {
                        IO: IO, pj_id: Project.Key, filename: `${doc.docname}`/*`${doc.docname}_${doc.doc_no}.${ext}`*/, docname: doc.docname, description: doc.description
                        , type: doc.type, groupfile: doc.groupfile, doc_no: doc.doc_no
                    }
                    fdata.SaveFiles(fileInfo, Files.file[doc.pos]);
                }
            }
        }

        res = 'ok'
    }
    else {
        res = 'duplicated'
    }
    // }
    // catch (err) {
    //     logger.loginfo(`New project ${Project.Key} error : ${err}`);
    //     res = 'error';
    // }

    return res;
}

module.exports.addTask = async (task) => {
    let res;
    try {
        const query = `INSERT INTO pj_tasks (pj_id, task, start_date, end_date, hour_expected, staff_id, remark, require_doc, status, parent) VALUES
        ('${task.pj_key}', '${task.Name}', ${task.Start_Date ? `'${task.Start_Date}'` : null}, ${task.End_Date ? `'${task.End_Date}'` : null}, '${task.Man_Hour}', '${task.Staff_ID}', '${task.Remark}',
        '${task.Require_Doc}', '${task.Status}', ${chkNull(task.Parent)})`;
        await db.ExecQuery(query);

        if (task.Staff_ID && task.Staff_ID >= 1 && task.pj_key) {
            const [staffList, projectList] = await Promise.all([
                db.ExecQuery(`SELECT * FROM satdb.ee_staffs`),
                db.ExecQuery(`SELECT * FROM satdb.pj_projects WHERE pj_id='${task.pj_key}'`)
            ]);

            if (staffList?.length && projectList?.length) {
                const staff = staffList.find(s => s.ID == task.Staff_ID) ?? null;
                const manager = staffList.find(s => s.ID == projectList[0].manager_id) ?? null;

                if (staff?.mail) {
                    const subject = `You’ve Been Assigned a New Task by the Project Manager`;
                    const message = [
                    `Dear ${staff.Fname} ${staff.Lname},`,
                    ``,
                    `You have been assigned a new task by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via SAT Portal System.`,
                    ``,
                    `Task Details:`,
                    `- Task Name : ${task.Name}`,
                    `- Project   : ${projectList[0].name}`,
                    `- Start Date: ${task.Start_Date}`,
                    `- End Date  : ${task.End_Date}`,
                    `- View Task : http://sats1.myddns.me:3030`,
                    ``,
                    `Please log in to the system to review the task details and proceed accordingly.`,
                    `If you have any questions, feel free to reach out directly to the Project Manager.`,
                    ``,
                    `Best regards,`,
                    `SAT Solutions Co.,Ltd.`
                    ].join('\n');

                    await mailSend(staff.mail, subject, message);
                }
            }
        }

        
        res = 'ok';
    }
    catch (err) {
        logger.loginfo(`Add Task error : ${err}`);
        res = 'error';
    }

    return res;
}


module.exports.copyTasksFromProject = async (data) => {
    let res = 'ok';
    const taskMap = new Map(); 

    const sourcePjKey = data.source_pj;
    const targetPjKey = data.target_pj;

    try {
        const oldTasks = await db.ExecQuery(`
            SELECT * FROM pj_tasks 
            WHERE pj_id = '${sourcePjKey}' 
            ORDER BY ID ASC
        `);

        let remaining = [...oldTasks];
        let insertedSomething = true;

        while (remaining.length > 0 && insertedSomething) {
            insertedSomething = false;
            const stillPending = [];

            for (const task of remaining) {
                const parent = task.parent;
                const hasParent = parent !== null;

                if (!hasParent || taskMap.has(parent)) {
                    const newParent = hasParent ? taskMap.get(parent) : null;

                    const safeParent = (newParent !== undefined && newParent !== null) ? newParent : 'NULL';

                    const insertQuery = `
                        INSERT INTO pj_tasks 
                        (pj_id, task, start_date, end_date, hour_expected, staff_id, remark, require_doc, status, parent)
                        VALUES (
                            '${targetPjKey}',
                            '${task.task}',
                            ${task.start_date ? `'${toMySQLDateTime(task.start_date)}'` : 'NULL'},
                            ${task.end_date ? `'${toMySQLDateTime(task.end_date)}'` : 'NULL'},
                            ${task.hour_expected ?? 'NULL'},
                            ${ 0 },
                            ${task.remark ? `'${task.remark}'` : 'NULL'},
                            ${task.require_doc ? `'${task.require_doc}'` : 'NULL'},
                            ${task.status ?? 'NULL'},
                            ${safeParent}
                        );
                    `;

                    const result = await db.ExecQuery(insertQuery);

                    const newID = result.insertId || 0;
                    taskMap.set(task.ID, newID);
                    insertedSomething = true;
                } else {
                    stillPending.push(task);
                }
            }

            remaining = stillPending;
        }

        return res;
    } catch (err) {
        logger.loginfo(`Copy Task error: ${err}`);
        return 'error';
    }
};


function toMySQLDateTime(isoDate) {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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

module.exports.editTask = async (task) => {
    let res;

    try{

        if (task.Staff_ID && task.Staff_ID >= 1 && task.pj_key && task.ID) {
            const [staffList, projectList, oldTask] = await Promise.all([
                db.ExecQuery(`SELECT * FROM satdb.ee_staffs`),
                db.ExecQuery(`SELECT * FROM satdb.pj_projects WHERE pj_id='${task.pj_key}'`),
                db.ExecQuery(`SELECT * FROM satdb.pj_tasks WHERE ID='${task.ID}'`),
            ]);

            if (staffList?.length && projectList?.length && oldTask?.length) {
                const staff = staffList.find(s => s.ID == task.Staff_ID) ?? null;
                const manager = staffList.find(s => s.ID == projectList[0].manager_id) ?? null;
                const oldStaff = staffList.find(s => s.ID == oldTask[0].staff_id) ?? null
                // console.log(oldStaff)
                // console.log(staff)
                if (staff?.mail && staff.mail != 'undefined' && staff.ID != oldStaff?.ID) {
                    const subject = `You’ve Been Assigned a New Task by the Project Manager`;
                    const message = [
                    `Dear ${staff.Fname} ${staff.Lname},`,
                    ``,
                    `You have been assigned a new task by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via SAT Portal System.`,
                    ``,
                    `Task Details:`,
                    `- Task Name : ${task.Name}`,
                    `- Project   : ${projectList[0].name}`,
                    `- Start Date: ${task.Start_Date}`,
                    `- End Date  : ${task.End_Date}`,
                    `- View Task : http://sats1.myddns.me:3030`,
                    ``,
                    `Please log in to the system to review the task details and proceed accordingly.`,
                    `If you have any questions, feel free to reach out directly to the Project Manager.`,
                    ``,
                    `Best regards,`,
                    `SAT Solutions Co.,Ltd.`
                    ].join('\n');

                    await mailSend(staff.mail, subject, message);
                }

                if (oldStaff?.mail && oldStaff.mail !== 'undefined' && oldStaff.ID !== staff.ID) {
                    const subject = `Your Task Has Been Reassigned`;
                    const message = [
                        `Dear ${oldStaff.Fname} ${oldStaff.Lname},`,
                        ``,
                        `Please be informed that your previously assigned task has been reassigned to ${staff.Fname} ${staff.Lname} by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via SAT Portal System.`,
                        ``,
                        `Task Details:`,
                        `- Task Name : ${task.Name}`,
                        `- Project   : ${projectList[0].name}`,
                        `- Start Date: ${task.Start_Date}`,
                        `- End Date  : ${task.End_Date}`,
                        ``,
                        `You are no longer responsible for this task. If you believe this change is incorrect or have any concerns, please contact the Project Manager.`,
                        ``,
                        `Best regards,`,
                        `SAT Solutions Co.,Ltd.`
                    ].join('\n');

                    await mailSend(oldStaff.mail, subject, message);
                }

            }
        };
        const query = `UPDATE pj_tasks SET task='${task.Name}', start_date=${task.Start_Date ? `'${task.Start_Date}'` : null}, end_date=${task.End_Date ? `'${task.End_Date}'` : null}, hour_expected='${task.Man_Hour}'
        , staff_id='${task.Staff_ID}', remark='${task.Remark}', require_doc='${task.Require_Doc}', status='${task.Status}', parent=${chkNull(task.Parent)} WHERE ID='${task.ID}' AND pj_id='${task.pj_key}'`;
        await db.ExecQuery(query);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Edit task error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.delTask = async (task) => {
    let res;
    try{
        const query  = `DELETE FROM pj_tasks WHERE ID='${task.ID}'`;
        await db.ExecQuery(query);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Delete task error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.getTask = async (task) => {
    let res;
    try{
        const query = `SELECT * FROM vw_project_tasks WHERE pj_id='${task.pj_key}'`
        res = await db.ExecQuery(query);
    }
    catch(err){
        logger.loginfo(`Get tasks error : ${err}`)
        res = 'error';
    }
    return res;
}

getfileExtension = (fname) => {
    const tfile = fname.split('.');
    return tfile[tfile.length - 1];
}

module.exports.UploadFile = async (Info, F) => {
    let res;
    try {
        const ext = getfileExtension(F.name);
        const fileInfo = {
            IO: Info.IO, pj_id: Info.pj_id, filename: `${F.name}`, docname: Info.docname, description: Info.description
            , type: Info.type, groupfile: Info.groupfile, doc_no: Info.doc_no
        }
        res = await fdata.SaveFiles(fileInfo, F);
    }
    catch (err) {
        logger.loginfo(`upload file error : ${err}`);
        res = 'error'
    }
    return res;
}

module.exports.DelFile = async (Info) => {
    let res;
    try {
        const result = await fdata.delFile(Info);
        //console.log(result)
        if(result && result == 'File deleted'){
            const query = `DELETE FROM pj_files WHERE ID='${Info.ID}'`;
            db.ExecQuery(query);
            res = 'ok';
        } else {
            res = 'error';
        }
    }
    catch (err) {
        res = 'error';
    }
    return res;
}

module.exports.UpdateProject = async (Project) => {
    let res;

    try {

        if (Project.Mgm_id && Project.Mgm_id >= 1 && Project.Key ) {
            const [staffList, projectList] = await Promise.all([
                db.ExecQuery(`SELECT * FROM satdb.ee_staffs`),
                db.ExecQuery(`SELECT * FROM satdb.pj_projects WHERE pj_id='${Project.Key}'`)
            ]);

            if (staffList?.length && projectList?.length) {
                const staff = staffList.find(s => s.ID == Project.Mgm_id) ?? null;
                const manager = staffList.find(s => s.ID == Project.user_id) ?? null;
                const oldStaff = staffList.find(s => s.ID == projectList[0].manager_id) ?? null
                // console.log(oldStaff)
                // console.log(staff)
                if (staff?.mail && staff.mail != 'undefined' && staff.ID != oldStaff?.ID) {
                    const subject = `You’ve Been Assigned as Project Manager`;
                    const message = [
                    `Dear ${staff?.Fname ?? '-'} ${staff?.Lname ?? ''},`,
                    ``,
                    `You have been assigned as the **Project Manager** for the project **"${Project.Name}"** via the SAT Portal System.`,
                    ``,
                    `Project Details:`,
                    `- Project IO : ${projectList[0].io}`,
                    `- Project Name : ${Project.Name}`,
                    `- Start Date   : ${Project.Start_Date}`,
                    `- End Date     : ${Project.End_Date}`,
                    `- View Project : http://sats1.myddns.me:3030`,
                    ``,
                    `As the Project Manager, you are responsible for overseeing project execution, managing team members, ensuring timelines are met, and coordinating with all relevant stakeholders.`,
                    ``,
                    `Please log in to the system to begin managing your project.`,
                    ``,
                    `Best regards,`,
                    `SAT Solutions Co., Ltd.`
                    ].join('\n');

                    await mailSend(staff.mail, subject, message);
                }

                if (oldStaff?.mail && oldStaff.mail !== 'undefined' && oldStaff.ID > 0 && oldStaff.ID !== staff.ID) {
                    const subject = `You Are No Longer the Project Manager`;
                    const message = [
                        `Dear ${oldStaff.Fname} ${oldStaff.Lname},`,
                        ``,
                        `Please be informed that your previous role as **Project Manager** for the project **"${projectList[0].name}"** has been reassigned to ${manager.Fname} ${manager.Lname} by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via the SAT Portal System.`,
                        ``,
                        `Project Details:`,
                        `- Project IO : ${projectList[0].io}`,
                        `- Project Name : ${projectList[0].name}`,
                        `- Start Date   : ${projectList[0].start_date}`,
                        `- End Date     : ${projectList[0].end_date}`,
                        `- View Project : http://sats1.myddns.me:3030`,
                        ``,
                        `If you believe this change was made in error or have any concerns, please contact your administrator or the new Project Manager.`,
                        ``,
                        `Best regards,`,
                        `SAT Solutions Co., Ltd.`
                    ].join('\n');

                    await mailSend(oldStaff.mail, subject, message);
                }

            }
        };


        let query = `UPDATE pj_projects SET name='${Project.Name}', type='${Project.Type}', cm_id='${Project.CM_ID}',
         start_date='${Project.Start_Date}', end_date='${Project.End_Date}', manager_id='${Project.Mgm_id}', warranty='${Project.Warranty}', 
         pay_term='${Project.Payment}', status='${Project.Status}', contact='${Project.Contact}', subtype='${Project.SubType}' WHERE pj_id='${Project.Key}'`;

        await db.ExecQuery(query);

        const [staffList] = await Promise.all([
            db.ExecQuery(`SELECT * FROM satdb.ee_staffs`)
        ]);

        if (Project.Teams.Staff) {
            const staffs = Project.Teams.Staff;

            for await (const staff of staffs) {
                const flag = staff.Flag;
                switch (flag) {
                    case 'i':
                        query = `INSERT INTO pj_project_staffs (pj_id, staff_id) VALUES ('${Project.Key}', '${staff.ID}')`;
                        await db.ExecQuery(query);
                        if (staffList?.length) {
                            const stff = staffList.find(s => s.ID == staff.ID) ?? null;
                            const manager = staffList.find(s => s.ID == Project.Mgm_id) ?? null;

                            if (stff?.mail) {
                                const subject = `You’ve Been Added to a Project Team`;
                                const message = [
                                `Dear ${stff.Fname} ${stff.Lname},`,
                                ``,
                                `You have been added as a team member to the project **"${Project.Name}"** by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via the SAT Portal System.`,
                                ``,
                                `Project Details:`,
                                `- Project Name : ${Project.Name}`,
                                `- Start Date   : ${Project.Start_Date}`,
                                `- End Date     : ${Project.End_Date}`,
                                `- Project Manager : ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''}`,
                                `- View Project : http://sats1.myddns.me:3030`,
                                ``,
                                `Please log in to the system to view full project details and your assigned responsibilities (if any).`,
                                ``,
                                `If you have any questions, please contact the Project Manager directly.`,
                                ``,
                                `Best regards,`,
                                `SAT Solutions Co., Ltd.`
                                ].join('\n');


                                await mailSend(stff.mail, subject, message);
                            }
                        }
                        break;
                    case 'd':
                        query = `DELETE FROM pj_project_staffs WHERE pj_id='${Project.Key}' AND staff_id='${staff.ID}'`;
                        await db.ExecQuery(query);

                        if (staffList?.length) {
                            const removedStaff = staffList.find(s => s.ID == staff.ID) ?? null;
                            const manager = staffList.find(s => s.ID == Project.Mgm_id) ?? null;

                            if (removedStaff?.mail) {
                                const subject = `You’ve Been Removed from a Project Team`;
                                const message = [
                                    `Dear ${removedStaff.Fname} ${removedStaff.Lname},`,
                                    ``,
                                    `This is to inform you that you have been **removed from the project team** of **"${Project.Name}"** by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via the SAT Portal System.`,
                                    ``,
                                    `Project Details:`,
                                    `- Project Name : ${Project.Name}`,
                                    `- Project Manager : ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''}`,
                                    `- View Projects : http://sats1.myddns.me:3030`,
                                    ``,
                                    `If you have any questions regarding this change, please contact the Project Manager directly.`,
                                    ``,
                                    `Best regards,`,
                                    `SAT Solutions Co., Ltd.`
                                ].join('\n');

                                await mailSend(removedStaff.mail, subject, message);
                            }
                        }
                        break;

                }
            }
        }

        if (Project.Tasks) {
            const tasks = Project.Tasks;
            for await (const task of tasks) {
                const flag = task.Flag;
                switch (flag) {
                    case 'i':
                        query = `INSERT INTO pj_tasks (pj_id, task, start_date, end_date, hour_expected, staff_id, remark, require_doc, status) VALUES
                        ('${Project.Key}', '${task.Name}', '${task.Start_Date}', '${task.End_Date}', '${task.Man_Hour}', '${task.Staff_ID}', '${task.Remark}',
                        '${task.Require_Doc}', '${task.Status}')`;
                        await db.ExecQuery(query);
                        break;
                    case 'u':
                        query = `UPDATE pj_tasks SET task='${task.Name}', start_date='${task.Start_Date}', end_date='${task.End_Date}', hour_expected='${task.Man_Hour}'
                        , staff_id='${task.Staff_ID}', remark='${task.Remark}', require_doc='${task.Require_Doc}', status='${task.Status}' WHERE ID='${task.ID}' AND pj_id='${Project.Key}'`;
                        await db.ExecQuery(query);
                        break;
                    case 'd':
                        query = `DELETE FROM pj_tasks WHERE ID='${task.ID}' AND pj_id ='${Project.Key}'`;
                        await db.ExecQuery(query);
                        break;
                }
            }

        }

        if (Project.Products) {
            for await (const p of Project.Products) {
                const flag = p.Flag;
                switch (flag) {
                    case 'i':
                        query = `INSERT INTO pj_project_products (pj_id, pd_id, product, qty) VALUES ('${Project.Key}', '${p.pd_id}', '${p.product}', 
                            '${p.qty}')`;
                        await db.ExecQuery(query);
                        break;
                    case 'u':
                        query = `UPDATE pj_project_products SET pd_id='${p.pd_id}', product='${p.product}', qty='${p.qty}' WHERE ID='${p.ID}'`;
                        await db.ExecQuery(query);
                        break;
                    case 'd':
                        query = `DELETE FROM pj_project_products WHERE ID='${p.ID}'`;
                        await db.ExecQuery(query);
                        break;
                }
            }
        }

        res = 'ok';

    }
    catch (err) {
        logger.loginfo(`Update project ${Project.Key} error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.getProjectDetail = async (pjkey) => {
    let res;

    let query = `SELECT * FROM vw_project WHERE pj_id='${pjkey}'`;

    const detail = await db.ExecQuery(query);

    const IO = await db.ExecQuery(`SELECT IO FROM pj_projects WHERE pj_id='${pjkey}'`)
    query = `SELECT ID,pj_id, docname, description, type, filename, group_file FROM vw_files WHERE pj_id='${IO[0].IO}'`;

    const docs = await db.ExecQuery(query);

    query = `SELECT ID, FirstName, LastName, Position, Department FROM satdb.vw_project_staffs WHERE pj_id='${pjkey}'`;

    const staffs = await db.ExecQuery(query);

    let Teams = [];

    staffs.forEach(s => {
        const T = { ID: staffs.ID, Name: `${s.FirstName} ${s.LastName}`, Position: s.Position, Department: s.Department };
        Teams.push(T);
    });

    query = `SELECT * FROM vw_project_tasks WHERE pj_id='${pjkey}'`;

    const tasks = await db.ExecQuery(query);

    query = `SELECT * FROM pj_project_products WHERE pj_id='${pjkey}'`;

    const product = await db.ExecQuery(query);

    const result = { Detail: detail, Docs: docs, Teams: Teams, Tasks: tasks, Products: product }

    res = result;

    return res;
}


module.exports.GetRequireInfo = async () => {
    let res;
    try {
        let result = { ProjectTypes: [], ProjectStatus: [], TaskStatus: [], Staffs: [], Customers: [], DocType: [], PhoneType: [] ,QTStatus: [], TSStatus:[],AccessModule:[] };
        let query = `SELECT * FROM pj_type`;
        let qres = await db.ExecQuery(query);
        let Types = [];
        for await (q of qres) {
            query = `SELECT ID, sub_type FROM pj_subtype WHERE main_type='${q.ID}'`;
            const subt = await db.ExecQuery(query);
            const st = { MainID: q.ID, Type: q.type, SubType: subt };
            Types.push(st);
        }
        result.ProjectTypes = Types;

        query = `SELECT * FROM pj_status`;
        qres = await db.ExecQuery(query);
        result.ProjectStatus = qres;

        query = `SELECT * FROM pj_task_status`;
        qres = await db.ExecQuery(query);
        result.TaskStatus = qres;

        query = `SELECT * FROM vw_staffs;`;
        qres = await db.ExecQuery(query);
        result.Staffs = qres;

        query = `SELECT * FROM cm_customers`;
        qres = await db.ExecQuery(query);
        result.Customers = qres;

        query = `SELECT * FROM pj_file_type`;
        qres = await db.ExecQuery(query);
        result.DocType = qres;

        query = `SELECT ID, Name AS Type FROM sys_phone_types`;
        qres = await db.ExecQuery(query);
        result.PhoneType = qres;

        query = `SELECT * FROM sl_qt_status`;
        qres = await db.ExecQuery(query);
        result.QTStatus = qres;

        query = `SELECT * FROM ee_timesheet_status`;
        qres = await db.ExecQuery(query);
        result.TSStatus =qres;

        query = `SELECT * FROM sys_module`;
        qres = await db.ExecQuery(query);
        result.AccessModule = qres;

        res = result;

    }
    catch (err) {
        logger.loginfo(`Get Project Info error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.GetProjectLists = async () => {
    let res;
    try {
        const query = `SELECT * FROM vw_project_lists`;
        res = await db.ExecQuery(query);
    }
    catch (err) {
        logger.loginfo(`get project lists error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.SaveProducts = async (Products) => {
    let res;
    try {
        let query;
        for await (const product of Products) {
            query = `INSERT INTO pd_products (name, description, warranty) VALUES ('${product.name}', '${product.description}',
             '${product.warranty}')`;

            await db.ExecQuery(query);
        }
        res = 'ok'
    }
    catch (err) {
        res = 'error';
        logger.loginfo(`Save product error : ${err}`);
    }

    return res;
}

module.exports.GetProducts = async () => {
    let res;
    try {
        const query = 'SELECT * FROM pd_products';
        res = await db.ExecQuery(query);
    }
    catch (err) {
        logger.loginfo(`Get product error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.SaveProjectProduct = async (Products) => {
    let res;
    try {
        let query;
        for await (const product of Products) {
            query = `INSERT INTO pj_project_products (pj_id, pd_id, qty, delivery_date, warranty, sn) VALUES ('${product.pj_id}', '${product.pd_id}',
            '${product.qty}', '${product.delivery_date}', '${product.warranty}', '${product.sn}')`;
            await db.ExecQuery(query);
            res = 'ok'
        }
    }
    catch (err) {
        logger.loginfo(`Save project product error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.getProjectProduct = async (pj_id) => {
    let res;
    try {
        const query = `SELECT * FROM pj_project_products WHERE pj_id='${pj_id}'`;
        res = await db.ExecQuery(query);
    }
    catch (err) {
        logger.loginfo(`Get project product error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.createDO = async (D) => {
    let res;
    const Cdate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const do_no = await generateDO();

    try {
        let query = `INSERT INTO pj_do (do_no, pj_id, cm_id, c_id, cm_phone, customer_ref, remark, create_date, ee_id, ship_id) VALUES 
    ('${D.do_no ? D.do_no : do_no}', '${D.pj_id}', '${D.cm_id}', '${D.c_id}', '${D.cm_phone}','${D.c_ref}', '${D.remark}', '${Cdate}', '${D.staff}', '${D.ship_id}')`;

        await db.ExecQuery(query);

        for await (const p of D.product) {
            query = `INSERT INTO pj_do_products (do_no, pd_id, sn, quantity, warranty) VALUES (
            '${D.do_no ? D.do_no : do_no}', '${p.pd_id}','${p.sn}', '${p.quantity}', '${p.warranty ? p.warranty : 0}')`;
            await db.ExecQuery(query);
        }

        res = 'ok';
    }
    catch (err) {
        logger.loginfo(`Create DO error : ${err}`);
        res = 'error';
    }

    return res;

}

module.exports.updateDO = async (D) => {
    let res;
    const Cdate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    try {
        let query = `UPDATE pj_do SET cm_id='${D.cm_id}', c_id='${D.c_id}', cm_phone='${D.c_phone}', 
    customer_ref='${D.c_ref}', edit_date='${Cdate}', ee_id='${D.staff}', ship_id='${D.ship_id}' WHERE do_no='${D.do_no}'`;

        await db.ExecQuery(query);

        for await (const p of D.product){
            if(p.flag === 'i'){
                query = `INSERT INTO pj_do_products (do_no, pd_id, sn, quantity, warranty) VALUES (
                    '${D.do_no}', '${p.pd_id}','${p.sn}', '${p.quantity}', '${p.warranty}')`;
            }
            else if(p.flag ==='u'){
                query = `UPDATE pj_do_products SET pd_id='${p.pd_id}', sn='${p.sn}', quantity='${p.quantity}', warranty='${p.warranty}' WHERE ID='${p.ID}'`;
            }
            else if(p.flag === 'd'){
                query = `DELETE FROM pj_do_products WHERE ID='${p.ID}'`;
            }
            await db.ExecQuery(query);
        }

        res = 'ok';
    }
    catch (err) {
        logger.loginfo(`Update DO error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.getDO = async (No) => {
    let res;

    try {
        let query = `SELECT * FROM vw_do WHERE do_no='${No}'`;
        const detail = await db.ExecQuery(query);

        query = `SELECT address from cm_ship_address WHERE ID='${detail[0].ship_id}'`;
        const shipadr = await db.ExecQuery(query);

        query = `SELECT * FROM pj_do_products WHERE do_no='${No}'`;
        const product = await db.ExecQuery(query);

        res = { Details: detail[0], ShipAddress: shipadr[0], Products: product }
    }
    catch (err) {
        logger.loginfo(`Get DO error : ${err}`)
        res = 'error';
    }

    return res;
}

module.exports.getDOList = async (pjid) => {
    let res;

    try {
        const query = `SELECT * from vw_do WHERE pj_id='${pjid}'`;
        res = await db.ExecQuery(query);
    }
    catch (err) {
        logger.loginfo(`GET DO list error : ${err}`);
        res = 'error';
    }
    return res;
}

generateDO = async () => {
    const now = new Date();
    let CYear = now.getFullYear().toString().substring(2, 4);
    const yyyy = now.getFullYear();

    const query = `SELECT count(*) AS cnt FROM pj_do WHERE YEAR(create_date)='${yyyy}'`;
    let res = await db.ExecQuery(query);
    res = padding(res[0].cnt + 1, '0000');

    return `DO${CYear}${res}`;
}

generatePJID = async (Type) => {

    let CYear = new Date().getFullYear().toString().substring(2, 4);

    let prefix, query, res;

    if (Type === 1) {
        //project
        prefix = 'PJ';
    }
    else if (Type === 2) {
        //engineering 
        prefix = 'EN';
    }
    else if (Type === 3) {
        //Product
        prefix = 'PD';

    }
    else if (Type === 4) {
        //MA
        prefix = 'MA';
    }
    else if(Type === 5){
        prefix = 'IN';
    }

    query = `SELECT count(*) as 'cnt' from satdb.pj_projects where io like '${prefix}%' AND YEAR(create_date)='${new Date().getFullYear()}'`;
    res = await db.ExecQuery(query);
    res = padding(res[0].cnt + 1, '000');
    const PJID = `${prefix}${CYear}${res}`;

    return PJID;
}

padding = (str, p) => {
    str = str.toString();
    const pad = p;
    const res = pad.substring(0, pad.length - str.length) + str;

    return res;
}

module.exports.createTicket = async (item, user) => {
    let res;
    try{

        const ticketKey = await generateSPID();
        const query = `INSERT INTO srv_services (ticket, name,  pj_id,  po_no,  cm_id,  cnt_id,  cc_id,  status,  priority,  department,  staff_id,  start_date,  source,  topic,  detail,  response,  remark, require_document ) VALUES
        (
            '${ ticketKey }', 
            '${item.Name}', 
            '${item.Pj_key}', 
            '${item.Po}', 
            '${item.Cm_id}', 
            '${item.Cnt_id}', 
            '${item.Cc_id}', 
            '${item.Status}', 
            '${item.Priority}', 
            '${item.Department}', 
            '${item.Staff_ID}', 
            '${item?.Start_Date??null}',
            '${item.Source}', 
            '${item.Topic}', 
            '${item.Detail}',
            '${item.Response}',
            '${item.Remark}',
            '${item.Require_Doc ? item.Require_Doc : 0}'
        )`;
        const result = await db.ExecQuery(query);
        if(result && result.insertId > 0 && item?.Task.length > 0){
            const promiseMap = item.Task.map(async(task) => {
                task.srv_key = ticketKey;
                return await this.addSrvTask(task);
            });
            await Promise.allSettled(promiseMap);
        }
        console.log(result)
        const [staffList] = await Promise.all([
                db.ExecQuery(`SELECT * FROM satdb.ee_staffs`)
        ]);
        const staff = staffList.find(s => s.ID == item.Staff_ID) ?? null;
        const manager = staffList.find(s => s.ID == item.user_id) ?? null;
        if (staff?.mail) {
            const subject = `You’ve Been Assigned a New Customer Support Ticket`;
            const message = [
                `Dear ${staff.Fname} ${staff.Lname},`,
                ``,
                `You have been assigned a new customer support ticket by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via SAT Portal System.`,
                ``,
                `Ticket Details:`,
                `- Ticket No : ${ticketKey}`,
                `- Title  : ${item.Name}`,
                `- Subject   : ${item.Topic}`,
                `- Start Date: ${item.Start_Date}`,
                `- End Date  : ${item.End_Date}`,
                `- View Ticket: http://sats1.myddns.me:3030`,
                ``,
                `Please log in to the system to review the ticket details and take appropriate action.`,
                `If you have any questions, feel free to contact your supervisor or the support coordinator.`,
                ``,
                `Best regards,`,
                `SAT Solutions Co.,Ltd.`
                ].join('\n');
            await mailSend(staff.mail, subject, message);
        }
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Create ticket error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.updateTicket = async (item) => {
    let res;
    try{
        if (item.Staff_ID && item.Staff_ID >= 1 && item.ID) {
            const [staffList, oldTask] = await Promise.all([
                db.ExecQuery(`SELECT * FROM satdb.ee_staffs`),
                db.ExecQuery(`SELECT * FROM satdb.srv_services WHERE ID='${item.ID}'`),
            ]);

            if (staffList?.length && oldTask?.length) {
                const staff = staffList.find(s => s.ID == item.Staff_ID) ?? null;
                const manager = staffList.find(s => s.ID == item.user_id) ?? null;
                const oldStaff = staffList.find(s => s.ID == oldTask[0].staff_id) ?? null
                //console.log(oldStaff)
                //console.log(staff)
                if (staff?.mail && staff.mail != 'undefined' && staff.ID != oldStaff?.ID) {
                    const subject = `You’ve Been Assigned a New Customer Support Ticket`;
                    const message = [
                        `Dear ${staff.Fname} ${staff.Lname},`,
                        ``,
                        `You have been assigned a new customer support ticket by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via SAT Portal System.`,
                        ``,
                        `Ticket Details:`,
                        `- Ticket No : ${oldTask[0].ticket}`,
                        `- Title  : ${item.Name}`,
                        `- Subject   : ${item.Topic}`,
                        `- Start Date: ${item.Start_Date}`,
                        `- End Date  : ${item.End_Date}`,
                        `- View Ticket: http://sats1.myddns.me:3030`,
                        ``,
                        `Please log in to the system to review the ticket details and take appropriate action.`,
                        `If you have any questions, feel free to contact your supervisor or the support coordinator.`,
                        ``,
                        `Best regards,`,
                        `SAT Solutions Co.,Ltd.`
                        ].join('\n');
                    await mailSend(staff.mail, subject, message);
                }

                if (oldStaff?.mail && oldStaff.mail !== 'undefined' && oldStaff.ID !== staff.ID) {
                    const subject = `Your Customer Support Ticket Has Been Reassigned`;
                    const message = [
                        `Dear ${oldStaff.Fname} ${oldStaff.Lname},`,
                        ``,
                        `Please be informed that your previously assigned customer support ticket has been reassigned to ${staff.Fname} ${staff.Lname} by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via SAT Portal System.`,
                        ``,
                        `Ticket Details:`,
                        `- Ticket No : ${oldTask[0].ticket}`,
                        `- Title  : ${item.Name}`,
                        `- Subject   : ${item.Topic}`,
                        `- Start Date: ${item.Start_Date}`,
                        `- End Date  : ${item.End_Date}`,
                        ``,
                        `You are no longer responsible for this task. If you believe this change is incorrect or have any concerns, please contact the Project Manager.`,
                        ``,
                        `Best regards,`,
                        `SAT Solutions Co.,Ltd.`
                    ].join('\n');

                    await mailSend(oldStaff.mail, subject, message);
                }

            }
        };
        const querys = `UPDATE srv_services SET name='${item.Name}', 
        po_no='${ item.Po }',  
        pj_id='${ item.Pj_key }', 
        cm_id='${ item.Cm_id }',  
        cnt_id='${ item.Cnt_id }',  
        cc_id='${ item.Cc_id }',  
        status='${ item.Status }',  
        priority='${ item.Priority }',  
        department='${ item.Department }',  
        staff_id='${ item.Staff_ID }',  
        start_date=${ item?.Start_Date ? `'${item.Start_Date}'` : 'NULL' },  
        end_date=${ item?.End_Date ? `'${item.End_Date}'` : 'NULL' },  
        finish_date=${ item.Finish_Date ? `'${item.Finish_Date}'` : 'NULL' },
        source='${ item.Source }',  
        topic='${ item.Topic }',  
        detail='${ item.Detail }',  
        response='${ item.Response }',  
        remark='${ item.Remark }',
        require_document='${item.Require_Doc ? item.Require_Doc : 0}'
        WHERE ID='${item.ID}'`;
        await db.ExecQuery(querys);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Update ticket error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.getAllTickets = async () => {
    let res;
    try{
        const query = `SELECT * FROM vw_service_lists`
        res = await db.ExecQuery(query);
    }
    catch(err){
        logger.loginfo(`Get tickets error : ${err}`)
        res = 'error';
    }
    return res;
}

// module.exports.getTicketsByStaff = async (data) => {
//     let res;
//     try{
        
//         if(data && data.Staff_id){
//             const staff = await db.ExecQuery(`SELECT * FROM satdb.ee_staffs WHERE ID='${ data.Staff_id }'`);
//             if(staff?.length){
//                 const query = `SELECT * FROM vw_service_lists WHERE Staff = '${staff[0].Fname}'`
//                 res = await db.ExecQuery(query);
//             }
//         }
//     }
//     catch(err){
//         logger.loginfo(`Get tickets error : ${err}`)
//         res = 'error';
//     }
//     return res;
// }

module.exports.getTicketsByStaff = async (data) => {
    let res = [];
    try {
        if (data && data.Staff_id) {
            
            const staff = await db.ExecQuery(`SELECT * FROM satdb.ee_staffs WHERE ID='${data.Staff_id}'`);
            
            if (staff?.length) {
                const staffFname = staff[0].Fname;

               
                const serviceListQuery = `SELECT * FROM vw_service_lists;`;
                const serviceList = await db.ExecQuery(serviceListQuery);

                
                const logQuery = `SELECT ticket_id FROM srv_srvlog WHERE staff_id = '${data.Staff_id}'`;
                const logTickets = await db.ExecQuery(logQuery);
                const logTicketIds = logTickets.map(t => t.ticket_id);

               
                const filteredServiceList = serviceList.filter(ticket => logTicketIds.includes(ticket.Ticket) || ticket.Staff == staffFname);

               
                res = [...filteredServiceList];
            }
        }
    } catch (err) {
        logger.loginfo(`Get tickets error : ${err}`);
        res = 'error';
    }
    return res;
};

module.exports.getTicketsByLogs = async (data) => {
    let res = [];
    try {
        //console.log(data)
        let serviceListQuery;
        if (data.Staff.toUpperCase() === 'ALL') {
            serviceListQuery = `
                SELECT * FROM vw_service_lists 
                WHERE 
                Customer='${data.Customer}'AND 
                Start_Date >= '${data.StartDate}' 
                AND End_Date <= '${data.EndDate}'
            `;
            } else {
            serviceListQuery = `
                SELECT * FROM vw_service_lists 
                WHERE Staff='${data.Staff}' 
                AND Customer='${data.Customer}'
                AND Start_Date >= '${data.StartDate}' 
                AND End_Date <= '${data.EndDate}'
            `;
        }
        const serviceList = await db.ExecQuery(serviceListQuery);
        //console.log(serviceList)
        if(serviceList){
            res = serviceList;
        } else {
            res = [];
        }
    } catch (err) {
        logger.loginfo(`Get tickets error : ${err}`);
        res = 'error';
    }
    return res;
};

module.exports.getTicketsDocument = async (data) => {
    let res;
    try{
        //console.log(data)
        if(data && data.Srv_id){
            const result = await db.ExecQuery(`SELECT * FROM satdb.srv_files WHERE srv_id='${ data.Srv_id }'`);
            //console.log(result)
            if(result){
                return result;
            } else {
                return [];
            }
        }
    }
    catch(err){
        logger.loginfo(`Get tickets error : ${err}`)
        res = 'error';
    }
    return res;
}

module.exports.GetSupportInfo = async () => {
    let res;
    try {
        let result = { Priority: [], Source: [], Topic: [], Department: [], Status: [], LogStatus: [] };

        const [priority, source, topic, department, status, logstatus] = await Promise.all([
            db.ExecQuery(`SELECT * FROM srv_priority`),
            db.ExecQuery(`SELECT * FROM srv_source`),
            db.ExecQuery(`SELECT * FROM srv_topic`),
            db.ExecQuery(`SELECT * FROM ee_departments`),
            db.ExecQuery(`SELECT * FROM srv_status`),
            db.ExecQuery(`SELECT * FROM srv_srvlog_status`),
        ])
        result.Priority = priority;
        result.Source = source;
        result.Topic = topic;
        result.Department = department;
        result.Status = status;
        result.LogStatus = logstatus;
        res = result;
    }
    catch (err) {
        logger.loginfo(`Get Project Info error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.uploadSupportFile = async (Info, Files) => {
    let res;
    try {
        //console.log(Files)
        if (Array.isArray(Files.files) === true) {

            for await (const f of Files.files) {
                await fdata.saveSRV(f, f.name, Info);
                const query = `INSERT INTO srv_files (srv_id, filename, docname, folder, description, type) VALUES  
                    ('${Info.srv_id}', '${f.name}', '${f.name}', '${Info.folder}', '${Info.description}', '${Info.type}')`;
                await db.ExecQuery(query);
            }
        }
        else {
            const f = Files.files;
            await fdata.saveSRV(f, Info.filename, Info);
            const query = `INSERT INTO srv_files (srv_id, filename, docname, folder, description, type) VALUES  
                    ('${Info.srv_id}', '${Info.filename}', '${Info.filename}', '${Info.folder}', '${Info.description}', '${Info.type}')`;
            await db.ExecQuery(query);
        }

        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Service upload file error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.addSrvTask = async (task) => {
    let res;
    try {
        const query = `INSERT INTO srv_srvlog (ticket_id, task, start_date, end_date, status, staff_id, remark) VALUES
        ( 
            '${task.srv_key}', 
            '${task.Name}', 
            ${task.Start_Date ? `'${task.Start_Date}'` : null}, 
            ${task.End_Date ? `'${task.End_Date}'` : null}, 
            '${task.Status}', 
            '${task.Staff_ID}', 
            '${task.Remark}'
        )`;
        await db.ExecQuery(query);

        if (task.Staff_ID && task.Staff_ID >= 1 && task.srv_key) {
            const [staffList, projectList] = await Promise.all([
                db.ExecQuery(`SELECT * FROM satdb.ee_staffs`),
                db.ExecQuery(`SELECT * FROM satdb.srv_services WHERE ticket='${task.srv_key}'`)
            ]);

            if (staffList?.length && projectList?.length) {
                const staff = staffList.find(s => s.ID == task.Staff_ID) ?? null;
                const manager = staffList.find(s => s.ID == projectList[0].staff_id) ?? null;

                if (staff?.mail) {
                    const subject = `You’ve Been Assigned a New Support Task`;
                    const message = [
                        `Dear ${staff.Fname} ${staff.Lname},`,
                        ``,
                        `You have been assigned a new support task by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via SAT Portal System.`,
                        ``,
                        `Ticket Details:`,
                        `- Ticket No : ${task.srv_key}`,
                        `- Title  : ${projectList[0].name}`,
                        `- Task   : ${task.Name}`,
                        `- Start Date: ${task.Start_Date??'-'}`,
                        `- End Date  : ${task.End_Date??'-'}`,
                        `- View Ticket: http://sats1.myddns.me:3030`,
                        ``,
                        `Please log in to the system to review the ticket details and take appropriate action.`,
                        `If you have any questions, feel free to contact your supervisor or the support coordinator.`,
                        ``,
                        `Best regards,`,
                        `SAT Solutions Co.,Ltd.`
                    ].join('\n');

                    await mailSend(staff.mail, subject, message);
                }
            }
        }

        
        res = 'ok';
    }
    catch (err) {
        logger.loginfo(`Add ticket task error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.editSrvTask = async (task) => {
    let res;
    const Cdate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    try{

        if (task.Staff_ID && task.Staff_ID >= 1 && task.srv_key && task.ID) {
            const [staffList, projectList, oldTask] = await Promise.all([
                db.ExecQuery(`SELECT * FROM satdb.ee_staffs`),
                db.ExecQuery(`SELECT * FROM satdb.srv_services WHERE ticket='${task.srv_key}'`),
                db.ExecQuery(`SELECT * FROM satdb.srv_srvlog WHERE ID='${task.ID}'`),
            ]);

            if (staffList?.length && projectList?.length && oldTask?.length) {
                const staff = staffList.find(s => s.ID == task.Staff_ID) ?? null;
                const manager = staffList.find(s => s.ID == projectList[0].staff_id) ?? null;
                const oldStaff = staffList.find(s => s.ID == oldTask[0].staff_id) ?? null
                // console.log(oldStaff)
                // console.log(staff)
                if (staff?.mail && staff.mail != 'undefined' && staff.ID != oldStaff?.ID) {
                    const subject = `You’ve Been Assigned a New Support Task`;
                    const message = [
                        `Dear ${staff.Fname} ${staff.Lname},`,
                        ``,
                        `You have been assigned a new support task by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via SAT Portal System.`,
                        ``,
                        `Ticket Details:`,
                        `- Ticket No : ${task.srv_key}`,
                        `- Title  : ${projectList[0].name}`,
                        `- Task   : ${task.Name}`,
                        `- Start Date: ${task.Start_Date??'-'}`,
                        `- End Date  : ${task.End_Date??'-'}`,
                        `- View Ticket: http://sats1.myddns.me:3030`,
                        ``,
                        `Please log in to the system to review the ticket details and take appropriate action.`,
                        `If you have any questions, feel free to contact your supervisor or the support coordinator.`,
                        ``,
                        `Best regards,`,
                        `SAT Solutions Co.,Ltd.`
                    ].join('\n');

                    await mailSend(staff.mail, subject, message);
                }

                if (oldStaff?.mail && oldStaff.mail !== 'undefined' && oldStaff.ID !== staff.ID) {
                    const subject = `Your Support Task Has Been Reassigned`;
                    const message = [
                        `Dear ${oldStaff.Fname} ${oldStaff.Lname},`,
                        ``,
                        `Please be informed that your previously assigned support task has been reassigned to ${staff.Fname} ${staff.Lname} by ${manager?.Fname ?? '-'} ${manager?.Lname ?? ''} via SAT Portal System.`,
                        ``,
                        `Ticket Details:`,
                        `- Ticket No : ${task.srv_key}`,
                        `- Title     : ${projectList[0].name}`,
                        `- Task      : ${task.Name}`,
                        `- Start Date: ${task.Start_Date ?? '-'}`,
                        `- End Date  : ${task.End_Date ?? '-'}`,
                        `- View Ticket: http://sats1.myddns.me:3030`,
                        ``,
                        `You are no longer responsible for this task.`,
                        `If you believe this change was made in error or have any questions, please contact your supervisor or the support coordinator.`,
                        ``,
                        `Best regards,`,
                        `SAT Solutions Co.,Ltd.`
                    ].join('\n');

                    await mailSend(oldStaff.mail, subject, message);
                }
            }
        };

        const query = `UPDATE srv_srvlog SET 
            task='${task.Name}', 
            start_date=${task.Start_Date ? `'${task.Start_Date}'` : null}, 
            end_date=${task.End_Date ? `'${task.End_Date}'` : null}, 
            staff_id='${task.Staff_ID}', 
            remark='${task.Remark}', 
            status='${task.Status}',
            update_time='${Cdate}'
        WHERE ID='${task.ID}'`;
        await db.ExecQuery(query);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Edit task error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.getSrvTask = async (task) => {
    let res;
    try{
        const query = `SELECT * FROM srv_srvlog WHERE ticket_id='${task.srv_key}'`
        res = await db.ExecQuery(query);
    }
    catch(err){
        logger.loginfo(`Get ticket tasks error : ${err}`)
        res = 'error';
    }
    return res;
}

module.exports.getSrvTaskByStaff = async (task) => {
    let res;
    try{
        const query = `SELECT * FROM srv_srvlog WHERE staff_id='${task.staff_id}'`
        res = await db.ExecQuery(query);
    }
    catch(err){
        logger.loginfo(`Get ticket tasks error : ${err}`)
        res = 'error';
    }
    return res;
}

module.exports.delSrvTask = async (task) => {
    let res;
    try{
        const query  = `DELETE FROM srv_srvlog WHERE ID='${task.ID}'`;
        await db.ExecQuery(query);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Delete ticket task error : ${err}`);
        res = 'error';
    }
    return res;
}

generateSPID = async () => {
    const now = new Date();
    let CYear = now.getFullYear().toString().substring(2, 4);
    const yyyy = now.getFullYear();

    const query = `SELECT count(*) AS cnt FROM srv_services WHERE YEAR(start_date)='${yyyy}'`;
    let res = await db.ExecQuery(query);
    res = padding(res[0].cnt + 1, '0000');

    return `SP${CYear}${res}`;
}