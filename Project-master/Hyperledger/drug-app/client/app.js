'use strict';
var app = angular.module('application', []);
app.controller('appController', function($scope, appFactory){

	$("#success_holder").hide();
	$("#success_create").hide();
	$("#error_holder").hide();
	$("#error_query").hide();
	
	$scope.redirect1 = function(){
		window.location = "/notcustomer.html";
	}
	$scope.redirect2 = function(){
		window.location = "/allfun.html";
	}
	$scope.queryAllDrug = function(){
		appFactory.queryAllDrug(function(data){
			var array = [];
			for (var i = 0; i < data.length; i++){
				parseInt(data[i].Key);
				data[i].Record.Key = parseInt(data[i].Key);
				array.push(data[i].Record);
			}
			array.sort(function(a, b) {
			    return parseFloat(a.Key) - parseFloat(b.Key);
			});
			$scope.all_drug = array;
		});
	}
	$scope.queryDrug = function(){
		var id = $scope.drug_id;
		appFactory.queryDrug(id, function(data){
			$scope.query_drug = data;
			if ($scope.query_drug == "Could not locate drug"){
				$("#error_query").show();
			} else{
				$("#error_query").hide();
			}
		});
	}
	$scope.soldDrug = function(msg){
		var id = $scope.drug_id;
		appFactory.soldDrug(id, msg, function(data){
			$scope.query_drug = data;
			if ($scope.query_drug == "Could not locate drug"){
				$("#error_query").show();
			} else{
				$("#error_query").hide();
			}
		});
	}
	$scope.queryBatch = function(){
		appFactory.queryAllDrug(function(data){
			var array = [];
			var bn = $scope.batch_no;
			for (var i = 0; i < data.length; i++){
				parseInt(data[i].Key);
				data[i].Record.Key = parseInt(data[i].Key);
				if(data[i].Record.batchno == bn)
				{
					array.push(data[i].Record);
				}
			}
			array.sort(function(a, b) {
			    return parseFloat(a.Key) - parseFloat(b.Key);
			});
			$scope.all_batch = array;
		});
	}
	$scope.queryManufacturer = function(msg){
		var ow = msg;
		appFactory.queryAllDrug(function(data){
			var array = [];
			for (var i = 0; i < data.length; i++){
				parseInt(data[i].Key);
				data[i].Record.Key = parseInt(data[i].Key);
				if(data[i].Record.manufacturer == ow)
				{
					array.push(data[i].Record);
				}
			}
			array.sort(function(a, b) {
			    return parseFloat(a.Key) - parseFloat(b.Key);
			});
			$scope.all_owner = array;
		});
	}
	$scope.queryOwner = function(msg){
		var ow = msg;
		appFactory.queryAllDrug(function(data){
			var array = [];
			for (var i = 0; i < data.length; i++){
				parseInt(data[i].Key);
				data[i].Record.Key = parseInt(data[i].Key);
				if(data[i].Record.owner == ow)
				{
					array.push(data[i].Record);
				}
			}
			array.sort(function(a, b) {
			    return parseFloat(a.Key) - parseFloat(b.Key);
			});
			$scope.all_owner = array;
		});
	}
	$scope.recordDrug = function(msg){
		console.log(msg);
		appFactory.recordDrug($scope.drug, msg, function(data){
			$scope.create_drug = data;
			console.log("asd");
			$("#success_create").show();
		});
	}
	$scope.changeManufacturer = function(msg){
		appFactory.changeManufacturer($scope.manufacturer, msg, function(data){
			$scope.change_manufacturer = data;
			if ($scope.change_manufacturer == "Error: no drug found"){
				$("#error_holder").show();
				$("#success_holder").hide();
			} else{
				$("#success_holder").show();
				$("#error_holder").hide();
			}
		});
	}
	$scope.updateBatch = function(msg){
		appFactory.updateBatch($scope.manufacturer1, msg, function(data){
			$scope.change_manufacturer = data;
			if ($scope.change_manufacturer == "Error: no drug found"){
				$("#error_holder").show();
				$("#success_holder").hide();
			} else{
				$("#success_holder").show();
				$("#error_holder").hide();
			}
		});
	}
});
app.factory('appFactory', function($http){
	var factory = {};
    factory.queryAllDrug = function(callback){
    	$http.get('/get_all_drug/').success(function(output){
			callback(output)
		});
	}
	factory.queryDrug = function(id, callback){
    	$http.get('/get_drug/'+id).success(function(output){
			callback(output)
		});
	}
	factory.soldDrug = function(id, manu, callback){
		var data = id + "-" + manu;
    	$http.get('/sold_drug/'+data).success(function(output){
			callback(output)
		});
	}
	factory.recordDrug = function(data, manu, callback){
		var drug = data.id + "-" + data.expiry + "-" + manu + "-" + data.batchno + "-" + data.serialno + "-" + data.drugname + "-" + manu + "-" + data.stemp + "-" + data.shumidity + "-" + "" + "-" + "" + "-" + "N";
    	$http.get('/add_drug/'+drug).success(function(output){
			callback(output)
		});
	}
	factory.changeManufacturer = function(data, manu, callback){
		var manufacturer = data.id + "-" + data.name + "-" + manu;
    	$http.get('/change_manufacturer/'+manufacturer).success(function(output){
			callback(output)
		});
	}
	factory.updateBatch = function(data, manu, callback){
		var upbatch = data.batch + "-" + data.temp + "-" + data.humd + "-" + manu;
    	$http.get('/update_batch/'+upbatch).success(function(output){
			callback(output)
		});
	}
	return factory;
});