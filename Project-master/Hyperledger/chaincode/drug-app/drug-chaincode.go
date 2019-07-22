package main
import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)
type SmartContract struct {
}
type Drug struct {
	BatchNo string `json:"batchno"`
	Expiry string `json:"expiry"`
	Manufacturer  string `json:"manufacturer"`
	SerialNo  string `json:"serialno"`
	DrugName  string `json:"drugname"`
	Owner  string `json:"owner"`
	Stemp  string `json:"stemp"`
	Shumidity  string `json:"shumidity"`
	Utemp  string `json:"utemp"`
	Uhumidity  string `json:"uhumidity"`
	Sold string `json:"sold"`
}
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {
	function, args := APIstub.GetFunctionAndParameters()
	if function == "queryDrug" {
		return s.queryDrug(APIstub, args)
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "recordDrug" {
		return s.recordDrug(APIstub, args)
	} else if function == "queryAllDrug" {
		return s.queryAllDrug(APIstub)
	} else if function == "changeDrugManufacturer" {
		return s.changeDrugManufacturer(APIstub, args)
	} else if function == "soldDrug" {
		return s.soldDrug(APIstub, args)
	} else if function == "updateBatch" {
		return s.updateBatch(APIstub, args)
	}
	return shim.Error("Invalid Smart Contract function name.")
}
func (s *SmartContract) queryDrug(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	drugAsBytes, _ := APIstub.GetState(args[0])
	if drugAsBytes == nil {
		return shim.Error("Could not locate drug")
	}
	return shim.Success(drugAsBytes)
}
func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	drug := []Drug{
		Drug{BatchNo: "9230", Expiry: "122021", Manufacturer: "cipla", SerialNo: "123456", DrugName: "Zithromax", Owner: "cipla", Stemp: "23", Shumidity: "49", Utemp: "32", Uhumidity: "49", Sold: "N"},
		Drug{BatchNo: "9230", Expiry: "122022", Manufacturer: "cipla", SerialNo: "987654", DrugName: "Advil", Owner: "cipla", Stemp: "22", Shumidity: "48", Utemp: "32", Uhumidity: "49", Sold: "N"},
		Drug{BatchNo: "9230", Expiry: "122023", Manufacturer: "cipla", SerialNo: "267739", DrugName: "Amantadine", Owner: "cipla", Stemp: "24", Shumidity: "50", Utemp: "32", Uhumidity: "49", Sold: "N"},
		Drug{BatchNo: "9230", Expiry: "122024", Manufacturer: "cipla", SerialNo: "943821", DrugName: "Decadron", Owner: "cipla", Stemp: "25", Shumidity: "48", Utemp: "32", Uhumidity: "49", Sold: "N"},
		Drug{BatchNo: "2456", Expiry: "122025", Manufacturer: "ranbaxy", SerialNo: "956473", DrugName: "Betadin", Owner: "ranbaxy", Stemp: "26", Shumidity: "47", Utemp: "30", Uhumidity: "46", Sold: "N"},
		Drug{BatchNo: "9230", Expiry: "122026", Manufacturer: "cipla", SerialNo: "948375", DrugName: "Neproxen", Owner: "cipla", Stemp: "25", Shumidity: "46", Utemp: "32", Uhumidity: "49", Sold: "N"},
		Drug{BatchNo: "2456", Expiry: "122027", Manufacturer: "ranbaxy", SerialNo: "357485", DrugName: "Biaxin", Owner: "ranbaxy", Stemp: "25", Shumidity: "46", Utemp: "30", Uhumidity: "46", Sold: "N"},
		Drug{BatchNo: "2456", Expiry: "122028", Manufacturer: "ranbaxy", SerialNo: "948576", DrugName: "Miralax", Owner: "ranbaxy", Stemp: "25", Shumidity: "45", Utemp: "30", Uhumidity: "46", Sold: "N"},
		Drug{BatchNo: "2456", Expiry: "122029", Manufacturer: "ranbaxy", SerialNo: "284756", DrugName: "Botox", Owner: "ranbaxy", Stemp: "24", Shumidity: "48", Utemp: "30", Uhumidity: "46", Sold: "N"},
		Drug{BatchNo: "2456", Expiry: "122023", Manufacturer: "ranbaxy", SerialNo: "583746", DrugName: "Cefuroxime", Owner: "ranbaxy", Stemp: "24", Shumidity: "49", Utemp: "30", Uhumidity: "46", Sold: "N"},
	}
	i := 0
	for i < len(drug) {
		fmt.Println("i is ", i)
		drugAsBytes, _ := json.Marshal(drug[i])
		APIstub.PutState(strconv.Itoa(i+1), drugAsBytes)
		fmt.Println("Added", drug[i])
		i = i + 1
	}
	return shim.Success(nil)
}
func (s *SmartContract) recordDrug(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	var drug = Drug{ BatchNo: args[1], Expiry: args[2], Manufacturer: args[3], SerialNo: args[4], DrugName: args[5], Owner: args[6], Stemp: args[7], Shumidity: args[8], Utemp: args[9], Uhumidity: args[10], Sold: args[11] }
	drugAsBytes, _ := json.Marshal(drug)
	err := APIstub.PutState(args[0], drugAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to record drug catch: %s", args[0]))
	}
	return shim.Success(nil)
}
func (s *SmartContract) queryAllDrug(APIstub shim.ChaincodeStubInterface) sc.Response {
	startKey := "0"
	endKey := "999"
	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	var buffer bytes.Buffer
	buffer.WriteString("[")
	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")
		buffer.WriteString(", \"Record\":")
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	fmt.Printf("- queryAllDrug:\n%s\n", buffer.String())
	return shim.Success(buffer.Bytes())
}
func (s *SmartContract) soldDrug(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	drugAsBytes, _ := APIstub.GetState(args[0])
	if drugAsBytes == nil {
		return shim.Error(fmt.Sprintf("Could not locate drug %s",args[0]))
	}
	drug := Drug{}
	json.Unmarshal(drugAsBytes, &drug)
	if(drug.Owner == args[1]){
		drug.Sold = "Y"
		drugAsBytes, _ = json.Marshal(drug)
		err := APIstub.PutState(args[0], drugAsBytes)
		if err != nil {
			return shim.Error(fmt.Sprintf("Failed to change drug sold: %s", args[0]))
		}
	}
	return shim.Success(nil)
}
func (s *SmartContract) changeDrugManufacturer(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	startKey := "0"
	endKey := "999"
	mainkey := "0"
	resultsIterator, err:= APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		fmt.Sprintf(queryResponse.Key)
		drug := Drug{}
		json.Unmarshal(queryResponse.Value, &drug)
		if(drug.BatchNo == args[0] && drug.Owner == args[2]) {
			mainkey = queryResponse.Key
			drug.Owner = args[1]
			queryResponse.Value, _ = json.Marshal(drug)
			err := APIstub.PutState(mainkey, queryResponse.Value)
			if err != nil {
				return shim.Error(fmt.Sprintf("Failed to change drug owner of batch: %s", args[0]))
			}
		}	
	}
	return shim.Success(nil)
}
func (s *SmartContract) updateBatch(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	startKey := "0"
	endKey := "999"
	mainkey := "0"
	resultsIterator, err:= APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		fmt.Sprintf(queryResponse.Key)
		drug := Drug{}
		json.Unmarshal(queryResponse.Value, &drug)
		if(drug.BatchNo == args[0] && drug.Owner == args[3]) {
			mainkey = queryResponse.Key
			drug.Utemp = args[1]
			drug.Uhumidity = args[2]
			queryResponse.Value, _ = json.Marshal(drug)
			err := APIstub.PutState(mainkey, queryResponse.Value)
			if err != nil {
				return shim.Error(fmt.Sprintf("Failed to change drug owner of batch: %s", args[0]))
			}
		}	
	}
	return shim.Success(nil)
}
func main() {
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}