var express       = require('express');
var app           = express();
var bodyParser    = require('body-parser');
var http          = require('http')
var fs            = require('fs');
var Fabric_Client = require('fabric-client');
var path          = require('path');
var util          = require('util');
var os            = require('os');

module.exports = (function() {
return{
	get_all_drug: function(req, res){
		var fabric_client = new Fabric_Client();
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		var tx_id = null;
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);
		    return fabric_client.getUserContext('user1', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get user1.... run registerUser.js');
		    }
		    const request = {
		        chaincodeId: 'drug-app',
		        txId: tx_id,
		        fcn: 'queryAllDrug',
		        args: ['']
		    };
		    return channel.queryByChaincode(request);
		}).then((query_responses) => {
		    if (query_responses && query_responses.length == 1) {
		        if (query_responses[0] instanceof Error) {
		            console.error("error from query = ", query_responses[0]);
		        } else {
		            res.json(JSON.parse(query_responses[0].toString()));
		        }
		    } else {
		        console.log("No payloads were returned from query");
		    }
		}).catch((err) => {
		    console.error('Failed to query successfully :: ' + err);
		});
	},
	add_drug: function(req, res){
		var array = req.params.drug.split("-");
		var key = array[0]
		var expiry = array[1]
		var batchno = array[3]
		var manufacturer = array[2]
		var serialno = array[4]
		var drugname = array[5]
		var owner = array[6]
		var stemp = array[7]
		var shumidity = array[8]
		var utemp = array[9]
		var uhumidity = array[10]
		var sold = array[11]
		var fabric_client = new Fabric_Client();
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		var tx_id = null;
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);
		    return fabric_client.getUserContext('user1', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get user1.... run registerUser.js');
		    }
		    tx_id = fabric_client.newTransactionID();
		    const request = {
		        chaincodeId: 'drug-app',
		        fcn: 'recordDrug',
		        args: [key, batchno, expiry, manufacturer, serialno, drugname, owner, stemp, shumidity, utemp, uhumidity, sold],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
		    return channel.sendTransactionProposal(request);
		}).then((results) => {
		    var proposalResponses = results[0];
		    var proposal = results[1];
		    let isProposalGood = false;
		    if (proposalResponses && proposalResponses[0].response &&
		        proposalResponses[0].response.status === 200) {
		            isProposalGood = true;
		        } else {
		            console.error('Transaction proposal was bad');
		        }
		    if (isProposalGood) {
		        console.log(util.format(
		            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
		            proposalResponses[0].response.status, proposalResponses[0].response.message));
		        var request = {
		            proposalResponses: proposalResponses,
		            proposal: proposal
		        };
		        var transaction_id_string = tx_id.getTransactionID();
		        var promises = [];
		        var sendPromise = channel.sendTransaction(request);
		        promises.push(sendPromise);
				let event_hub = fabric_client.newEventHub();
		        event_hub.setPeerAddr('grpc://localhost:7053');
				let txPromise = new Promise((resolve, reject) => {
		            let handle = setTimeout(() => {
		                event_hub.disconnect();
		                resolve({event_status : 'TIMEOUT'});
		            }, 3000);
		            event_hub.connect();
		            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
		                clearTimeout(handle);
		                event_hub.unregisterTxEvent(transaction_id_string);
		                event_hub.disconnect();
		                var return_status = {event_status : code, tx_id : transaction_id_string};
		                if (code !== 'VALID') {
		                    console.error('The transaction was invalid, code = ' + code);
		                    resolve(return_status);
		                } else {
		                    console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
		                    resolve(return_status);
		                }
		            }, (err) => {
		                reject(new Error('There was a problem with the eventhub ::'+err));
		            });
		        });
		        promises.push(txPromise);
		        return Promise.all(promises);
		    } else {
		        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		    }
		}).then((results) => {
		    if (results && results[0] && results[0].status === 'SUCCESS') {
		        res.send(tx_id.getTransactionID());
		    } else {
		        console.error('Failed to order the transaction. Error code: ' + response.status);
		    }
		    if(results && results[1] && results[1].event_status === 'VALID') {
		        res.send(tx_id.getTransactionID());
		    } else {
		        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
		    }
		}).catch((err) => {
			console.error('Successfully invoked');
		});
	},
	get_drug: function(req, res){
		var fabric_client = new Fabric_Client();
		var key = req.params.id
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		var tx_id = null;
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);
		    return fabric_client.getUserContext('user1', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get user1.... run registerUser.js');
		    }
		    const request = {
		        chaincodeId: 'drug-app',
		        txId: tx_id,
		        fcn: 'queryDrug',
		        args: [key]
		    };
		    return channel.queryByChaincode(request);
		}).then((query_responses) => {
		    if (query_responses && query_responses.length == 1) {
		        if (query_responses[0] instanceof Error) {
		            console.error("error from query = ", query_responses[0]);
		            res.send("Could not locate drug")
		            
		        } else {
		            console.log("Response is ", query_responses[0].toString());
		            res.send(query_responses[0].toString())
		        }
		    } else {
		        res.send("Could not locate drug")
		    }
		}).catch((err) => {
		    console.error('Failed to query successfully :: ' + err);
		    res.send("Could not locate drug")
		});
	},
	sold_drug: function(req, res){

		var array = req.params.data.split("-");
		var id = array[0]
		var human = array[1];

		var key = req.params.id;
		var fabric_client = new Fabric_Client();
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		var tx_id = null;
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);
		    return fabric_client.getUserContext('user1', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get user1.... run registerUser.js');
		    }
		    tx_id = fabric_client.newTransactionID();
		    var request = {
		        chaincodeId: 'drug-app',
		        fcn: 'soldDrug',
		        args: [id, human],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
		    return channel.sendTransactionProposal(request);
		}).then((results) => {
		    var proposalResponses = results[0];
		    var proposal = results[1];
		    let isProposalGood = false;
		    if (proposalResponses && proposalResponses[0].response &&
		        proposalResponses[0].response.status === 200) {
		            isProposalGood = true;
		        } else {
		            console.error('Transaction proposal was bad');
		        }
		    if (isProposalGood) {
		        console.log(util.format(
		            'Successfully sent Proposal and received ProposalResponse SOLD: Status - %s, message - "%s"',
		            proposalResponses[0].response.status, proposalResponses[0].response.message));
		        var request = {
		            proposalResponses: proposalResponses,
		            proposal: proposal
		        };
		        var transaction_id_string = tx_id.getTransactionID();
		        var promises = [];
		        var sendPromise = channel.sendTransaction(request);
		        promises.push(sendPromise);
		        let event_hub = fabric_client.newEventHub();
		        event_hub.setPeerAddr('grpc://localhost:7053');
		        let txPromise = new Promise((resolve, reject) => {
		            let handle = setTimeout(() => {
		                event_hub.disconnect();
		                resolve({event_status : 'TIMEOUT'});
		            }, 3000);
		            event_hub.connect();
		            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
		                clearTimeout(handle);
		                event_hub.unregisterTxEvent(transaction_id_string);
		                event_hub.disconnect();
		                var return_status = {event_status : code, tx_id : transaction_id_string};
		                if (code !== 'VALID') {
		                    console.error('The transaction was invalid, code = ' + code);
		                    resolve(return_status);
		                } else {
		                    resolve(return_status);
		                }
		            }, (err) => {
		                reject(new Error('There was a problem with the eventhub ::'+err));
		            });
		        });
		        promises.push(txPromise);
		        return Promise.all(promises);
		    } else {
		        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		        res.send("Error: no drug catch found");
		    }
		}).then((results) => {
		    if (results && results[0] && results[0].status === 'SUCCESS') {
		        res.json(tx_id.getTransactionID())
		    } else {
		        console.error('Failed to order the transaction. Error code: ' + response.status);
		        res.send("Error: no drug catch found");
		    }
		    if(results && results[1] && results[1].event_status === 'VALID') {
		        res.json(tx_id.getTransactionID())
		    } else {
		        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
		    }
		}).catch((err) => {
			console.error('Successfully invoked :)');
		    res.send("Error: no drug catch found");
		});
	},
	change_manufacturer: function(req, res){
		var array = req.params.manufacturer.split("-");
		var key = array[0]
		var manufacturer = array[1];
		var login = array[2];
		console.log("insode controller");
		console.log(login);
		var fabric_client = new Fabric_Client();
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		var tx_id = null;
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);
		    return fabric_client.getUserContext('user1', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get user1.... run registerUser.js');
		    }
		    tx_id = fabric_client.newTransactionID();
		    var request = {
		        chaincodeId: 'drug-app',
		        fcn: 'changeDrugManufacturer',
		        args: [key, manufacturer, login],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
		    return channel.sendTransactionProposal(request);
		}).then((results) => {
		    var proposalResponses = results[0];
		    var proposal = results[1];
		    let isProposalGood = false;
		    if (proposalResponses && proposalResponses[0].response &&
		        proposalResponses[0].response.status === 200) {
		            isProposalGood = true;
		        } else {
		            console.error('Transaction proposal was bad');
		        }
		    if (isProposalGood) {
		        console.log(util.format(
		            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
		            proposalResponses[0].response.status, proposalResponses[0].response.message));
		        var request = {
		            proposalResponses: proposalResponses,
		            proposal: proposal
		        };
		        var transaction_id_string = tx_id.getTransactionID();
		        var promises = [];
		        var sendPromise = channel.sendTransaction(request);
		        promises.push(sendPromise);
		        let event_hub = fabric_client.newEventHub();
		        event_hub.setPeerAddr('grpc://localhost:7053');
		        let txPromise = new Promise((resolve, reject) => {
		            let handle = setTimeout(() => {
		                event_hub.disconnect();
		                resolve({event_status : 'TIMEOUT'});
		            }, 3000);
		            event_hub.connect();
		            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
		                clearTimeout(handle);
		                event_hub.unregisterTxEvent(transaction_id_string);
		                event_hub.disconnect();
		                var return_status = {event_status : code, tx_id : transaction_id_string};
		                if (code !== 'VALID') {
		                    console.error('The transaction was invalid, code = ' + code);
		                    resolve(return_status);
		                } else {
		                    resolve(return_status);
		                }
		            }, (err) => {
		                reject(new Error('There was a problem with the eventhub ::'+err));
		            });
		        });
		        promises.push(txPromise);
		        return Promise.all(promises);
		    } else {
		        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		        res.send("Error: no drug catch found");
		    }
		}).then((results) => {
		    if (results && results[0] && results[0].status === 'SUCCESS') {
		        res.json(tx_id.getTransactionID())
		    } else {
		        console.error('Failed to order the transaction. Error code: ' + response.status);
		        res.send("Error: no drug catch found");
		    }
		    if(results && results[1] && results[1].event_status === 'VALID') {
		        res.json(tx_id.getTransactionID())
		    } else {
		        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
		    }
		}).catch((err) => {
			console.error('Successfully invoked :)');
		    res.send("Error: no drug catch found");
		});

	},
	update_batch: function(req, res){
		var array = req.params.upbatch.split("-");
		var batch = array[0]
		var temp = array[1];
		var humid = array[2];
		var human = array[3];
		var fabric_client = new Fabric_Client();
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		var tx_id = null;
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);
		    return fabric_client.getUserContext('user1', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get user1.... run registerUser.js');
		    }
		    tx_id = fabric_client.newTransactionID();
		    var request = {
		        chaincodeId: 'drug-app',
		        fcn: 'updateBatch',
		        args: [batch, temp, humid, human],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
		    return channel.sendTransactionProposal(request);
		}).then((results) => {
		    var proposalResponses = results[0];
		    var proposal = results[1];
		    let isProposalGood = false;
		    if (proposalResponses && proposalResponses[0].response &&
		        proposalResponses[0].response.status === 200) {
		            isProposalGood = true;
		        } else {
		            console.error('Transaction proposal was bad');
		        }
		    if (isProposalGood) {
		        console.log(util.format(
		            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
		            proposalResponses[0].response.status, proposalResponses[0].response.message));
		        var request = {
		            proposalResponses: proposalResponses,
		            proposal: proposal
		        };
		        var transaction_id_string = tx_id.getTransactionID();
		        var promises = [];
		        var sendPromise = channel.sendTransaction(request);
		        promises.push(sendPromise);
		        let event_hub = fabric_client.newEventHub();
		        event_hub.setPeerAddr('grpc://localhost:7053');
		        let txPromise = new Promise((resolve, reject) => {
		            let handle = setTimeout(() => {
		                event_hub.disconnect();
		                resolve({event_status : 'TIMEOUT'});
		            }, 3000);
		            event_hub.connect();
		            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
		                clearTimeout(handle);
		                event_hub.unregisterTxEvent(transaction_id_string);
		                event_hub.disconnect();
		                var return_status = {event_status : code, tx_id : transaction_id_string};
		                if (code !== 'VALID') {
		                    console.error('The transaction was invalid, code = ' + code);
		                    resolve(return_status);
		                } else {
		                    resolve(return_status);
		                }
		            }, (err) => {
		                reject(new Error('There was a problem with the eventhub ::'+err));
		            });
		        });
		        promises.push(txPromise);
		        return Promise.all(promises);
		    } else {
		        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		        res.send("Error: no drug catch found");
		    }
		}).then((results) => {
		    if (results && results[0] && results[0].status === 'SUCCESS') {
		        res.json(tx_id.getTransactionID())
		    } else {
		        console.error('Failed to order the transaction. Error code: ' + response.status);
		        res.send("Error: no drug catch found");
		    }
		    if(results && results[1] && results[1].event_status === 'VALID') {
		        res.json(tx_id.getTransactionID())
		    } else {
		        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
		    }
		}).catch((err) => {
			console.error('Successfully invoked :)');
		    res.send("Error: no drug catch found");
		});
	}
}
})();