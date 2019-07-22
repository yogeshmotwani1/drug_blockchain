## Hyperledger Fabric Application

This application demonstrates the creation and transfer of drug/medicine shipments between actors leveraging Hyperledger Fabric in the supply chain.
Project document can be found [here](https://sites.google.com/view/bruteforce/projects/hyperledger)

(every command found here should be run under BASH only)

Instruction to run web-app:
- Go to drug-app
```
sudo npm install
sudo ./startFabric.sh
```
- Go to /.hfc-key-store
delete all files residing in this folder
```
node registerAdmin.js
node registerUser.js
node server.js &
```
- You should see a message saying that 'live on port 8000'
> type **localhost:8000** in your broswer and play with it

:blush:
