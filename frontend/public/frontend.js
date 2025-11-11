document.getElementById("click-me-button").addEventListener("click", handleClickMe);

let query = {};
let value = document.getElementById("box1").value;
let value2 = document.getElementById("box2").value;

async function handleClickMe() {
	// console.log(value2);
	const value = document.getElementById("box1").value;
	const value3 = document.getElementById("box2").value;
	// alert(value);
	// console.log(value);
	let data = document.getElementById("data");
	let table = document.getElementById("table1");
	table.innerHTML = "";
	// httprequest  = new XMLHttpRequest();
	// list datasets
	// try catch
	// query result
	//
	let a = null;
	let print = null;
	if(value3==="") {
		a = query1(value);
		print = "\u274c No such department found"
	} else {
		a= query2(value,value3);
		print = "\u274c No such course found"
	}

	try {
		const response = await fetch("/query", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(a)
		});
		//.then(response=>response.json)
		// .then((data)=>{
		// 	console.log(data);
		// });
		const res = await response.json();
		// console.log(res);
		let b = Object.values(res.results);
		console.log(b);
		let header = table.insertRow(0);
		let cell10 = header.insertCell(0);
		let cell20 = header.insertCell(1);
		// let cell30 = header.insertCell(2);
		let temp1 = Object.keys(b[0])[0].toString().split("_")[1];
		let temp2 = Object.keys(b[1])[1].toString().split("_")[1];
		cell10.innerHTML = temp1.charAt(0).toUpperCase() + temp1.slice(1);
		cell20.innerHTML = temp2.charAt(0).toUpperCase() + temp2.slice(1);
		// cell30.innerHTML = Object.keys(b[2])[2].toString();
		for(let a of b){
			console.log(a);
			let item = document.createElement("item");
			// item.innerHTML = Object.values(a)[0].toString();
			// data.appendChild(item);
			let row = table.insertRow(-1);
			let cell1 = row.insertCell(0);
			let cell2 = row.insertCell(1);
			// let cell3  =row.insertCell(2);
			cell1.innerHTML = Object.values(a)[0].toString();
			cell2.innerHTML = Object.values(a)[1].toString();
			// cell3.innerHTML = Object.values(a)[2].toString();
		}
	} catch (err) {
		alert(print);
	}
	// httprequest.open("POST","http://localhost:4321/dataset/");
	// httprequest.send();
	// httprequest.onload = ()=>{
	// 	console.log(httprequest);
	// 	if(httprequest.status === 200) {
	// 		alert(httprequest.responseText);
	// 	}
	// }
	// httprequest.onreadystatechange = alertContents();

}

 function query1(dept){
	return {
		"WHERE":{
			"IS":{
				"sections_dept":dept
			}
		},
		"OPTIONS":{
			"COLUMNS":[
				"sections_id",
				"sections_year"
			],
			"ORDER":"sections_year"
		}
	};
 }
 function query2(dept,id){
	return {
		"WHERE":{
			"AND":[
				{
					"IS":{
						"sections_dept":dept
					}
				},
				{
					"IS":{
						"sections_id":id
					}
				}
			]
		},
		"OPTIONS":{
			"COLUMNS":[
				"sections_instructor",
				"sections_year"
			],
			"ORDER": "sections_year"
		}
	};
 }
function alertContents() {
	// if (httprequest.readyState === XMLHttpRequest.DONE) {
	// 	if (httprequest.status === 200) {
	// 		const response = JSON.parse(httprequest.responseText);
	// 		alert(response);
	// 	} else {
	// 		alert("There was a problem with the request.");
	// 	}
	// 	alert(value);
	// // }
	// alert(value);
}
