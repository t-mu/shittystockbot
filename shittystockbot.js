// load node modules
var express = require("express");
// var fs = require("fs");
var request = require("request"); 
// var cheerio = require("cheerio"); // try to make and own module with prmomises?
// var app = express();

// include static files
var companies = require("./companies.json");
var texts = require("./status_texts.json");
var config = require("./config.js");

// module to get status parts for a tweet
var statusModule = require("./my_modules/statusModule.js");
var mod = new statusModule();	


// Twitter module and settings
var twit = require("twit");

// twit module constuctor
var tweeter = new twit({
    consumer_key:         config.consumer_key
  , consumer_secret:      config.consumer_secret
  , access_token:         config.access_token
  , access_token_secret:  config.access_token_secret
});



// ===== Some yelper funcs ===== //

// Stuff for handling company info

function getRandIndex(dataset) {
	return Math.floor(Math.random() * dataset.length);
}

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



// ===== Fetching stuff from APIs ===== //


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


// Get a stockquote for a random company from companies.json
function getRandomStockQuote() {
	return new Promise(function(resolve, reject){
		getStockQuoteBySymbol( companies.rand().symbol, shittyStockBot )
			.then(function(response) {
				resolve(response);
			});
	}); 
}

// Generate a full blown twitter status from shitty text parts
function generateStatus(data) {

	var stockName = getStockNameBySymbol( data.Symbol );
	var percentChange = data.PercentChange;
	var price = data.LastTradePriceOnly;

	var priceComment = mod.commentsPrice();
	var comment = mod.comment(percentChange);
	var modifier = mod.modifiers();
	var percentDirection = mod.percentText(percentChange);
	var priceDirection = mod.priceText(percentChange);
	var advice = mod.advice();
	
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





// ===== Tweeting ===== //


// mock the shitty advice
function mockTweetStockAdvice(status) {

	if (status.length > 140) {
		console.log("================  The tweet is too long! =================" + "\n" 
			+ "Tweet length: " + status.length + "\n" + status);
	}
	console.log(status + "\n");
}


// Actually tweet the shitty advice 
function tweetStockAdvice(status, callback) {

	if (status.length > 140) {
		callback(); 
	}
	else {
		tweeter.post('statuses/update', { status: status }, function(err, data, response) {
  			if (err && err.code === 187) {
  				callback(); 	// tweet too long -> get new tweet
  			}
  			else if (err && err.code != 187) {
  				console.log(err) // log into file
  				callback();		// error handling to the max -> get new tweet
  			}
		});
	}
		
}



// ===== This is where the magic happens ===== //

// This is the shitty bot
function shittyStockBot() {
	getRandomStockQuote()
		.then(function(quote){ generateStatus(quote)
		.then(function(status){ 
			mockTweetStockAdvice(status);
			// tweetStockAdvice(status, shittyStockBot);
		});
	});
}

// run the shitty bot
// shittyStockBot();



