const fs = require('fs');
const csv = require('csv-parser');
const db = require('./mysql');

module.exports.importCustomer = async () => {
    let rcsv = [];
    const promise = await new Promise((resolve, reject) => {
        let trow = [];
        fs.createReadStream('C:\\ProgramData\\MySQL\\MySQL Server 8.0\\Uploads\\customer_utf8.csv')
        .pipe(csv())
        .on('data', (row) => {
            trow.push(row);
            resolve(trow);
        })
    })
    rcsv = promise


    for await(let c of rcsv){
        let taxid = c.taxid.slice(1)
        taxid = taxid.slice(0,-1)

        let query = `INSERT INTO cm_customers (cm_id, name_th, address_th, branch_th, name_eng, address_eng, branch_eng, taxid
        , bill_condition, credit_term) VALUES ('${c.cm_id}','${c.name_th}','${c.address_th}','${c.branch_th}','${c.name_eng}','${c.address_eng}'
        ,'${c.branch_eng}','${taxid}', '${c.bill_condition}', '${c.credit_term}')`

        await db.ExecQuery(query)

        if(c.Tel.trim() !== '-'){
            if(c.Tel.length > 3){
            query = `INSERT INTO cm_phones (cm_id,phone_type,phone_number) VALUES ('${c.cm_id}','1', '${c.Tel}')`;
            await db.ExecQuery(query)
            }
        }

        if(c.Fax.trim() !== '-'){
            query = `INSERT INTO cm_phones (cm_id,phone_type,phone_number) VALUES ('${c.cm_id}','2', '${c.Fax}')`;
            await db.ExecQuery(query)
        }

        if(c.contact.trim() !== '-'){
            query = `INSERT INTO cm_contacts (cm_id, name, phone) VALUES ('${c.cm_id}', '${c.contact}','${c.cphone}')`
            await db.ExecQuery(query)
        }


    }
}

