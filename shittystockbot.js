/*
	WHAT 
	The main file. Pretty much bundles things together and
	somehow makes it work too. Also contains some some helper
	functions and other things I didn't know where to put.

	Should work something like this:
	1. Get some random company's stockquote from Yahoo
	2. Get some random shitty advice
	3. Generate a shitty advice tweet from 1 and 2
	4. Post the shitty tweet to Twitter
	
	WHY
	For shits and giggles.
*/

var request = require("request"); 

// static files
var companies = require("./data/companies.json");
var texts = require("./data/status_texts.json");
var config = require("./data/config.js");

// load custom modules
var statusModule = require("./my_modules/statusModule.js");
var tweeterModule = require("./my_modules/tweeter.js");

var status = new statusModule();	
var tweeter = new tweeterModule( shittyStockBot );



// ===== Some yelper funcs ===== //

// Stuff for handling company info

Array.prototype.rand = function() {
    return this[Math.floor(Math.random() * this.length)]
}

function getCompanyFromJson(index) {
	return JSON.stringify({ "name": companies[index].name, "symbol": companies[index].symbol });	
}

function getCompanySymbol(company) {
	return company.symbol;
}

function getCompanyName(company) {
	return company.name;
}

// Get value from JSON by key
// TODO: Remove as unnecessary???
function getValueByKey(data, key) {
	return data[key]
}

// Get correctly formatted company name from companies.json
function getStockNameBySymbol(symbol) {
	var stockName = "";

	for (var i = 0; i < companies.length; i++) {
		if (companies[i].symbol === symbol) {
			stockName = companies[i].name;
		} 
	}
	return stockName;
}


// ----------------------------------------- //

// Get company's stockquote by symbol from yahoo API
function getStockQuoteBySymbol(symbol, callback) {

	var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + 
			symbol + 
			"%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";	

	return new Promise(function(resolve, reject) {

		request(url, "utf8", function (error, response, body) {

			if (!error && response.statusCode === 200) {

				var stockQuery = JSON.parse(body);		
				var parsedQuote = stockQuery.query.results.quote;

				if (parsedQuote.Change === null) {
					callback();
				}
				else {
					resolve(parsedQuote);
				}
			}
			else {
				console.log(error);
				//TODO: log errors to file
			}
		});
	});
} 



// ===== Generating the tweet ===== //

// Generate a full blown twitter status from shitty status parts
function generateStatus(data) {	

	var stockName 			= getStockNameBySymbol( data.Symbol );
	var percentChange 		= data.PercentChange;
	var price 				= data.LastTradePriceOnly;

	var priceComment 		= status.commentsPrice();
	var comment 			= status.comment(percentChange);
	var modifier 			= status.modifiers();
	var percentDirection 	= status.percentText(percentChange);
	var priceDirection 		= status.priceText(percentChange);
	var advice 				= status.advice();
	
	var hashtag = "#porssivinkki";

	var roundedPrice = function() {
						if (parseFloat(percentChange) < 0) {
							return Math.floor(price);
						}
						else {
							return Math.ceil(price);
							}	
						}

	var template_1 = [	stockName, 
						modifier, 
						percentDirection,
						percentChange.replace(".",",").replace("%"," %."),
						advice
					];

	var template_2 = [	comment,
						stockName, 
						modifier, 
						percentDirection,
						percentChange.replace(".",",").replace("%"," %."),
						advice
					];

	var template_3 = [	stockName,
						priceDirection, 
						roundedPrice(),
						"euroon.", 
						advice
					];

	var template_4 = [	comment, 
						stockName,
						priceComment,
						price.replace(".",","),
						"euroa.",
						advice
					];

	var templates = [template_1, template_2, template_3, template_4];

	return new Promise(function(resolve, reject){

		Promise.all( templates.rand() )
		.then(function(values){
			var status = "";
			for (value of values) {
				status = status + value + " ";
			}
			resolve(status + hashtag);
		});
	});
}


// ===== This is where the magic happens ===== //

// Define the shitty bot
function shittyStockBot() {

	var quote =	getStockQuoteBySymbol( companies.rand().symbol, shittyStockBot )

	Promise.resolve(quote)
		.then(function(quote){ 
			generateStatus(quote)
		.then(function(status){ 
			tweeter.mock(status);
			// tweeter.tweet(status);
		});
	});
}

// run the shitty bot
shittyStockBot();



