const db = require('./mysql');
const logger = require('./log');
const fs = require('fs');
const fdata = require('./file');
const { format } = require('date-fns');
const { fi, el } = require('date-fns/locale');

module.exports.NewCustomer = async (Customer) => {

    let query = `INSERT INTO cm_customers (cm_id, name_th, address_th, branch_th, name_eng, address_eng, branch_eng, taxid, bill_condition, credit_term)  VALUES ('${Customer.key}', '${Customer.name_th}', 
    '${Customer.address_th}', '${Customer.branch_th}',, '${Customer.name_eng}', '${Customer.address_eng}', '${Customer.branch_eng}', '${Customer.taxid}', '${Customer.bill_con}', '${Customer.credit_term}');`

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
     taxid='${C.taxid}', bill_condition='${C.bill_con}', credit_term='${C.credit_term}' WHERE cm_id='${C.cm_id}'`;
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

        if (Project.Teams.Staff.length > 0) {
            for await (const staff of Project.Teams.Staff) {
                query = `INSERT INTO pj_project_staffs (pj_id, staff_id) VALUES ('${Project.Key}', '${staff}')`;
                await db.ExecQuery(query);
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

                query = `INSERT INTO pj_project_products (pj_id, pd_id, qty, warranty, sn) VALUES ('${Project.Key}', '${p.pd_id}', '${p.qty}',
                     '${p.warranty}', '${p.sn}')`


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
                    IO: IO, pj_id: Project.Key, filename: `${doc.docname}_${doc.doc_no}.${ext}`, docname: doc.docname, description: doc.description
                    , type: doc.type, groupfile: doc.groupfile, doc_no: doc.doc_no
                }
                fdata.SaveFiles(fileInfo, f);
            }
            else {
                for await (const doc of Project.Documents) {
                    f = Files.file[doc.pos];
                    const ext = getfileExtension(f.name);
                    const fileInfo = {
                        IO: IO, pj_id: Project.Key, filename: `${doc.docname}_${doc.doc_no}.${ext}`, docname: doc.docname, description: doc.description
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

getfileExtension = (fname) => {
    const tfile = fname.split('.');
    return tfile[tfile.length - 1];
}

module.exports.UploadFile = async (Info, F) => {
    let res;
    try {
        const ext = getfileExtension(F.name);
        const fileInfo = {
            IO: Info.IO, pj_id: Info.pj_id, filename: `${Info.docname}_${Info.doc_no}.${ext}`, docname: Info.docname, description: Info.description
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
        fdata.delFile(Info);
        const query = `DELETE FROM pj_files WHERE ID='${Info.ID}'`;
        db.ExecQuery(query);
        res = 'ok';
    }
    catch (err) {
        res = 'error';
    }
    return res;
}

module.exports.UpdateProject = async (Project) => {
    let res;

    try {
        let query = `UPDATE pj_projects SET name='${Project.Name}', type='${Project.Type}', cm_id='${Project.CM_ID}',
         start_date='${Project.Start_Date}', end_date='${Project.End_Date}', manager_id='${Project.Mgm_id}', warranty='${Project.Warranty}', 
         pay_term='${Project.Payment}', status='${Project.Status}', contact='${Project.Contact}', subtype='${Project.SubType}' WHERE pj_id='${Project.Key}'`;

        await db.ExecQuery(query);

        if (Project.Teams.Staff) {
            const staffs = Project.Teams.Staff;

            for await (const staff of staffs) {
                const flag = staff.Flag;
                switch (flag) {
                    case 'i':
                        query = `INSERT INTO pj_project_staffs (pj_id, staff_id) VALUES ('${Project.Key}', '${staff.ID}')`;
                        await db.ExecQuery(query);
                        break;
                    case 'd':
                        query = `DELETE FROM pj_project_staffs WHERE pj_id='${Project.Key}' AND staff_id='${staff.ID}'`;
                        await db.ExecQuery(query);
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
                        query = `INSERT INTO pj_project_products (pj_id, pd_id, qty, warranty, sn) VALUES ('${Project.Key}', '${p.pd_id}', '${p.qty}',
                 '${p.warranty}', '${p.sn}')`;
                        await db.ExecQuery(query);
                        break;
                    case 'u':
                        query = `UPDATE pj_project_products SET pd_id='${p.pd_id}', qty='${p.qty}', warranty='${p.warranty}', sn='${p.sn}' WHERE ID='${p.ID}'`;
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
    query = `SELECT ID,pj_id, docname, description, type, filename FROM vw_files WHERE pj_id='${IO[0].IO}'`;

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

    query = `SELECT * FROM vw_project_products WHERE pj_id='${pjkey}'`;

    const product = await db.ExecQuery(query);

    const result = { Detail: detail, Docs: docs, Teams: Teams, Tasks: tasks, Products: product }

    res = result;

    return res;
}


module.exports.GetRequireInfo = async () => {
    let res;
    try {
        let result = { ProjectTypes: [], ProjectStatus: [], TaskStatus: [], Staffs: [], Customers: [], DocType: [], PhoneType: [] ,QTStatus: [], TSStatus:[] };
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
        let query = `INSERT INTO pj_do (do_no, pj_id, cm_id, c_id, cm_phone, customer_ref, remark, create_date, ee_id) VALUES 
    ('${do_no}', '${D.pj_id}', '${D.cm_id}', '${D.c_id}', '${D.cm_phone}','${D.c_ref}', '${D.remark}', '${Cdate}', '${D.staff}')`;

        await db.ExecQuery(query);

        for await (const p of D.p_id) {
            query = `UPDATE pj_project_products SET do_no='${do_no}' WHERE ID='${p}'`
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
        let query = `UPDATE pj_do SET cm_id='${D.cm_id}', c_id='${D.c_id}', cm_phone='${D.cm_phone}', 
    customer_ref='${D.c_ref}', edit_date='${Cdate}', ee_id='${D.staff}' WHERE do_no='${D.do_no}'`;

        await db.ExecQuery(query);

        for await (const ip of D.p_id) {
            query = `UPDATE pj_project_products SET do_no='${D.do_no}' WHERE ID='${ip}'`
            await db.ExecQuery(query);
        }

        for await (const rp of D.rp_id) {
            query = `UPDATE pj_project_products SET do_no=null WHERE ID='${rp}'`
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

        query = `SELECT * FROM vw_project_products WHERE do_no='${No}'`;
        const product = await db.ExecQuery(query);

        res = { Details: detail[0], Products: product }
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