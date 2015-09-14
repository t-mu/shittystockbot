var dataNames = $("#listedCompanies tbody tr td:nth-child(1) a")
var dataSymbols = $("#listedCompanies tbody tr td:nth-child(2)")

var fullList = [];


for (var i = 0; i < dataNames.length - 1; i++) {
    var tempObj = { name: dataNames[i].innerHTML, symbol: dataSymbols[i].innerHTML }
	fullList.push( tempObj );
};


var jsonList = JSON.stringify(fullList);