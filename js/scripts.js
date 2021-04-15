var data;
var sheetID;

function getValues(object, level = 0) {
	if(typeof(object) == "string") {
		return object;
	}

	if(level >= 10) {
		return null;
	}
	var keys = Object.keys(object);

	var outputStr = "<br><div class='test'></div>"
	for(key of keys) {
		if(key != "0") {
			for(var i = 0; i < level; i++) {
				outputStr+="--";
			}
			 outputStr+=key+": "+(getValues(object[key], level+1))+"<br>";
		}
	}

	return outputStr;
}

function showParticipant(eventKey, participantID) {
	console.log(eventKey, participantID);

	// Populate table keys
	var tableKeys = document.getElementById("table-keys");
	var keys = Object.keys(data[eventKey][1]); // get keys from data object
	var outputStr = "";
	// add keys to table
	for(key of keys) {
		outputStr +="<th>"+key+"</th>\n";
	}
	tableKeys.innerHTML = outputStr;
	outputStr = ""; // reset outputStr to be used for table body

	var tableBody = document.getElementById("table-body");
	tableBody.innerHTML = ""; // clear current table body
	// populate table with all participants if "all" option is passed in as ID
	if(participantID=="all"){
		for(participant in data[eventKey]) {
			outputStr += "<tr>\n"; // new table entry
			// add all the values for this entry
			for(key of keys) {
				outputStr +="<td>"+data[eventKey][participant][key]+"</td>\n";
			}
			outputStr += "</tr>\n"; // close table entry
		}
	}
	// else, just print the passed in ID
	else {
		outputStr += "<tr>\n";
		for(key of keys) {
			outputStr +="<td>"+data[eventKey][participantID][key]+"</td>\n";
		}
		outputStr += "</tr>\n";
	}
	tableBody.innerHTML = outputStr; // update table body
}

function exportData() {
	//this function gets the json data ready to push to sheets
	var exportMode = document.getElementById("exportMode").value;

	if(exportMode == "select") {
		//export only selected events"
		console.log("exporting selected events");
		var newObject = {};
		var checkboxes = document.getElementsByClassName("eventSelectionCheckbox");
		for(checkbox of checkboxes) {
			if(checkbox.checked) {
				newObject[checkbox.value] = data[checkbox.value];
			}
		}
		console.log(Object.keys(newObject));
		pushToSheets(newObject);
	} else {
		//export all events in data
		console.log("exporting all events");
		pushToSheets(data);
	}
}

function importData() {
	var importMode = document.getElementById("importMode").value;

	if(importMode == "select") {

		console.log("importing selected events");
		var newObject = {};
		var checkboxes = document.getElementsByClassName("eventImportSelectionCheckbox");
		for(checkbox of checkboxes) {
			if(checkbox.checked) {
				newObject[checkbox.value] = data[checkbox.value];
			}
		}
		console.log(Object.keys(newObject));

		pushToRedcap(newObject)

	} else {
		pushToRedcap("All Events");
	}
}

function pushToRedcap(object) {
	var r = new XMLHttpRequest();
	r.open("POST","/import_sheets_to_redcap",true);
	r.setRequestHeader("Content-Type","application/json");
	r.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200) {
			console.log(this.response);
		}
	}

	var data = JSON.stringify(object);
	data = data.replace("\n","");
	data = data.replace("'", "\"");
	console.log(data);

	r.send(data);
}

function pushToSheets(object) {
	//put code to write to a sheet here
	//the "object" parameter is the json data we're writing
	if(window.localStorage.getItem("googleCreds") != undefined) {

		//if we're doing sheet destination control, use this outline
		var sheetDestination = document.getElementById("sheetMode").value;
		if(sheetDestination == "new") {
			//put code to create/write to a new sheet here
			console.log("writing to new sheet");
			var pushObject = {"mode":"new", "object":object, "creds":window.localStorage.getItem("googleCreds")};

			var r = new XMLHttpRequest();
			var spreadsheet_address = "https://docs.google.com/spreadsheets/d/";
			r.open("POST","/pushData",true);
			r.setRequestHeader("Content-Type","application/json");
			r.onreadystatechange = function() {
				if(this.readyState == 4 && this.status == 200) {
					console.log(this.response);
					var id = this.response;
					window.open(spreadsheet_address+this.response);
				}
			}

			var reqData = JSON.stringify(pushObject);
			reqData = reqData.replace("\n","");
			reqData = reqData.replace("'", "\"");

			r.send(reqData);
		} else {
			var sheetID = document.getElementById("sheetIDSelect").value;
			if(sheetID != null) {
				switch(sheetDestination) {
					case "replace":
						//put code to replace an existing sheet's data here
						console.log("writing to an existing sheet (replacing) with id "+sheetID);

						var pushObject = {"mode":"replace", "id":sheetID, "object":object, "creds":window.localStorage.getItem("googleCreds")};

						var r = new XMLHttpRequest();
						var spreadsheet_address = "https://docs.google.com/spreadsheets/d/";
						r.open("POST","/pushData",true);
						r.setRequestHeader("Content-Type","application/json");
						r.onreadystatechange = function() {
							if(this.readyState == 4 && this.status == 200) {
								console.log(this.response);
								var id = this.response;
								window.open(spreadsheet_address+this.response);
							}
						}

						var reqData = JSON.stringify(pushObject);
						reqData = reqData.replace("\n","");
						reqData = reqData.replace("'", "\"");

						r.send(reqData);

						break;
					default:
						alert("there was an error exporting to an existing sheet: unknown export mode");
						break;
				}
			} else {
				alert("there was an error exporting to an existing sheet: sheet not selected");
			}
		}
	} else {
		alert("there was an error exporting to an existing sheet: not signed in to google");
	}
}

function showEventCheckboxes(value) {
	var eventCheckboxes = document.getElementById("selectedEvents");
	if(value == "select") {
		eventCheckboxes.style.display = "block";
	} else {
		eventCheckboxes.style.display = "none";
	}
}

function showEvent(eventKey) {
	var object = data[eventKey];
	var keys = Object.keys(object);
	var selection = document.getElementById("participantSelection");
	selection.innerHTML = "";
	selection.oninput = function() {
		showParticipant(eventKey, this.value);
	}
	var option = document.createElement("option");
	option.value = "all";
	option.innerHTML = "all";
	selection.appendChild(option);
	for(key of keys) {
		var option = document.createElement("option");
		option.value = key;
		option.innerHTML = key;
		selection.appendChild(option);
	}
	selection.value = "all";
	showParticipant(eventKey, "all");
}

function setButtons(object) {
	var keys = Object.keys(object);
	var buttons = document.getElementById("eventSelection");
	buttons.innerHTML = "";
	buttons.oninput = function() {
		showEvent(this.value);
	}

	var eventCheckboxes = document.getElementById("selectedEvents");
	var eventImportCheckboxes = document.getElementById("selectedImportEvents");

	for(key of keys) {
		var option = document.createElement("option");
		option.value = key;
		option.innerHTML = key;
		buttons.appendChild(option);

		var checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.className = "eventSelectionCheckbox";
		checkbox.value = key;
		checkbox.checked = true;
		var label = document.createElement("label");
		label.htmlFor = key;
		label.innerHTML = key;
		eventCheckboxes.appendChild(checkbox);
		eventCheckboxes.appendChild(label);
		eventCheckboxes.appendChild(document.createElement("br"));

		checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.className = "eventImportSelectionCheckbox";
		checkbox.value = key;
		checkbox.checked = true;
		label = document.createElement("label");
		label.htmlFor = key;
		label.innerHTML = key;
		eventImportCheckboxes.appendChild(checkbox);
		eventImportCheckboxes.appendChild(label);
		eventImportCheckboxes.appendChild(document.createElement("br"));
	}
	buttons.value = keys[0];
	showEvent(keys[0]);
}

var sheetIDs = {};
var sheetsRefreshing = false;

function refreshSheets() {
	//TODO: put code to choose a sheet here and set the global "sheetID" variable to the id or however sheets are identified
	if(!sheetsRefreshing) {
		sheetsRefreshing = true;
		document.getElementById("sheetName").innerHTML = "Loading sheets...";
		document.getElementById("refreshSheetsButton").innerHTML = "Refreshing...";

		var req = new XMLHttpRequest();
		req.open("POST","/getSheets", true);
		req.setRequestHeader("Content-Type","application/json");
		req.onreadystatechange = function() {
			if(this.status == 200 && this.readyState == 4) {
				var res = JSON.parse(this.response);
				document.getElementById("sheetIDSelect");
				if(res == {}) {
					document.getElementById("sheetName").innerHTML = "No sheets found.";
					document.getElementById("sheetIDSelect").style.display = "none";
				} else {
					document.getElementById("sheetName").innerHTML = "Pick a sheet";
					document.getElementById("sheetIDSelect").style.display = "block";
				}


				document.getElementById("refreshSheetsButton").innerHTML = "Refresh";
				sheetsRefreshing = false;


				var selectContainer = document.getElementById("sheetIDSelect");
				selectContainer.innerHTML = "<option value=\"NONE\">Select A Sheet</option>";

				for(var key in res) {
					var option = document.createElement("option");
					option.value = key;
					option.innerHTML = res[key];
					selectContainer.appendChild(option);
				}
			}
		}
		if(window.localStorage.getItem("googleCreds") != undefined) {
			var pushObject = {"creds":window.localStorage.getItem("googleCreds")};
			var reqData = JSON.stringify(pushObject);
			reqData = reqData.replace("\n","");
			reqData = reqData.replace("'", "\"");

			req.send(reqData);
		} else {
			alert("There was an error reading your google credentials. please make sure you are logged in");
		}
	}
}

function showSheetSelection(value) {
	let sheetSelection = document.getElementById("sheetSelection");
	if(value == "new") {
		sheetSelection.style.display = "none";
	} else {
		sheetSelection.style.display = "block";
	}
}

function getData() {
	document.getElementById("refresh-btn").classList.add("btn-loading");
	var r = new XMLHttpRequest();
	r.open("GET", "/pullData", true);
	r.onreadystatechange = function() {
		if(this.status == 200 && this.readyState == 4) {
			var parsedRes = JSON.parse(r.response);
			data = parsedRes;
			setButtons(data);
			document.getElementById("refresh-btn").classList.remove("btn-loading");
		}
	}
	r.send();
}