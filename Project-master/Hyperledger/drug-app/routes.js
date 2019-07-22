//SPDX-License-Identifier: Apache-2.0

var drug = require('./controller.js');
module.exports = function(app){

  app.get('/get_drug/:id', function(req, res){
    drug.get_drug(req, res);
  });
  app.get('/sold_drug/:data', function(req, res){
    drug.sold_drug(req, res);
  });
  app.get('/add_drug/:drug', function(req, res){
    drug.add_drug(req, res);
  });
  app.get('/get_all_drug', function(req, res){
    drug.get_all_drug(req, res);
  });
  app.get('/get_batch', function(req, res){
    drug.get_batch(req, res);
  });
  app.get('/change_manufacturer/:manufacturer', function(req, res){
    drug.change_manufacturer(req, res);
  });
  app.get('/update_batch/:upbatch', function(req, res){
    drug.update_batch(req, res);
  });
}
