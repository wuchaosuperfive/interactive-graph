import wixData from 'wix-data';
import {graphs} from 'backend/BackendParameter.js';
import {graphs_phase2} from 'backend/BackendParameter.js';

let DBName = "GraphConfiguration";
let ComplianceDB = "ComplianceDatabase";

function map(GraphID) {
	switch (GraphID) {
		case graphs.Continuous_Intravenous_Analgesic: 
			return "2a193fa7-458e-4a62-8c80-8706bd28b197";
		case graphs.Multiple_Dose_IV_Infusion: 
			return "b9e3408c-4255-4e58-8d35-d98039aae721";
		case graphs.Multiple_Oral_Dose_NSAID: 
			return "0c0273f5-5caf-45ac-b149-dc7c3e1cbb44";
		case graphs.Multiple_Oral_Dose_Antithrombotic: 
			return "f64b76be-ed50-45df-9e36-942cf80219e7";
		case graphs.Multiple_Oral_Dose_Anticoagulant: 
			return "e9ef9234-435d-426f-9ead-07379957b1bf";
		case graphs.Multiple_Oral_Dose_Antibiotics: 
			return "4d63b5c9-3128-4230-b2cf-5dacbfc6e2ea";
		case graphs.Phenytoin_Formulation: 
			return "0bd46e15-2a36-4909-a812-a0b40b309df3";
		case graphs_phase2.Multiple_Oral_Dose_Compliance:
			return "";
		default:
			console.error("DBConnection: Invalid graph ID");
			break;
	}
}

export function ReadGraphDataFromDB(GraphID) {
	let options = {
  		"suppressAuth": true,
  		"suppressHooks": true
	};

	return wixData.get(DBName, map(GraphID), options);
}

export function ReadCompliance(GraphID) {
	let options = {
		"suppressAuth": true,
		"suppressHooks": true
  	};
	
	  return wixData.get(ComplianceDB, map(GraphID), options);
}