const { Router } = require('express');
const ctrl = require('../controllers/ctrl');
const { randomInt } = require('crypto');


const router = Router();

router.post('/authen', ctrl.Authen);
router.post('/customer', ctrl.Customer);
router.post('/project', ctrl.Project);
router.post('/info', ctrl.Info);
router.post('/upload', ctrl.SaveFiles);
router.post('/getfile', ctrl.getFile);
router.post('/delfile', ctrl.delFile);
router.post('/saveproduct', ctrl.SaveProducts);
router.post('/savepjproduct', ctrl.SaveProjectProducts);
router.post('/contact', ctrl.Contact);

router.post('/projectlists', ctrl.GetProjectLists);
router.post('/getprojectdetail', ctrl.getProjectDetail);
router.post('/getproduct', ctrl.getProduct);
router.post('/getpjproduct', ctrl.getProjectProduct);
router.post('/newproduct', ctrl.SaveProducts);

router.post('/do',ctrl.DO);
router.post('/staff', ctrl.Staff);

module.exports = router;