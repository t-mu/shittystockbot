var express = require("express");
var fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");
var app = express();

var companies = require("./companies.json");

var twit = require("twit");

var tweeter = new twit({
    consumer_key:         'lLa03OyyvaHCLtzWFuDTBQJIl'
  , consumer_secret:      'x6UYIzO0OiHt04TCdMgUKSUPnoSrSVZpmDVjieECD3ydfZCQ3a'
  , access_token:         '3405822838-K00ij7isbMPrmWcLZM0yiHx0Uc0KGYExe3c8wWv'
  , access_token_secret:  'mLdPKDinQyGRbB7EozecHmsijY0x0EXA0w2WuscchZG0h'
});

function getRandIndex(dataset) {
	return Math.floor(Math.random() * dataset.length);
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


// Get company's stockquote by symbol from yahoo API
function getStockQuoteBySymbol(symbol) {

	var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + 
			symbol + 
			"%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";	

	request(url, "utf8", function (error, response, body) {

		if (!error && response.statusCode === 200) {

			var stockQuery = JSON.parse(body);		
			
			var parsedQuote = stockQuery.query.results.quote;

			if (parsedQuote.Change === null) {
				getRandomStockQuote();
			}

			// else {
			// 	tweetStockAdvice(generateStatus(parsedQuote));
			// }

			else {
				mockTweetStockAdvice(generateStatus(parsedQuote));
			}
		
		}
		else {
			console.log(error);
			//TODO: log errors to file
		}

	});

} 


// Get a stockquote for a random company from companies.json
function getRandomStockQuote() {
	var company = JSON.parse( getCompanyFromJson( getRandIndex(companies) ) );
	return getStockQuoteBySymbol( company.symbol );
}


// Get value from JSON by key
function getValueByKey(data, key) {
	return data[key]
}


function getStockNameBySymbol(symbol) {
	var stockName = "";

	for (var i = 0; i < companies.length; i++) {
		if (companies[i].symbol === symbol) {
			stockName = companies[i].name;
		} 
	};

	return stockName;
}

// Generate tweet
function generateStatus(data) {
	var stockName = getStockNameBySymbol( getValueByKey(data, "Symbol") );
	var stockChange = getValueByKey(data, "Change");
	
	// function returnValueFromIndex( array )

	var comment = function() {

		// TODO: better way to construct tweets

		var posCommentPool = [	
							"Onko tämä todellista? ", 
							"Nyt mennään ja lujaa! ", 
							"Nyt alkoi nousukausi! ", 
							"Sijoittajien luottamus palaamassa? ",
							"Helsingissä meneillään oikea Bull Market! ",
							"Päivän musta hevonen havaittu: ",
							"Rahalla saa ja hevosella pääsee. ",
							"Kurssiriski lähentelee nollaa. ",
							"Päivän nousija:  ",
							"Toverit, tämä nousu ei jää tähän! ",
							"Täällä on Delta-kertoimet paikallaan! ",
							"Positiivista supinaa markkinoilla. ",
							"Tämä enteilee hyvää. ",
							"Voiton puolella ollaan. ",
							"Suunta on ylöspäin! ",
							"Etene omalla vastuulla. ",
							"Herkullista!",
							"Markkinoilla seilaaminen vaatii taitoa. ",
							"Nami nami! ",
							"Pidä silmällä: ",
							"Loppuvuosi vaikuttaa lupaavalta. ",
							"Tämä kortti kannattaa katsoa. ",
							"Mä tunnen sen jo kasvavan... ",
							"Mielenkiintoista kehitystä. ",
							"Paistaa se aurinko risukasaankin: ",
							"Loppuviikosta isota isot rahat: ",
							"Joulubonukset matkalla. ",
							"Nousukiito jatkuu! ",
							"Big money! ",
							"Vahva avaus: ",
							"Nyt saa naattia! ",
							"Ny rillataan! ",
							"Jättidiili Keski-Eurooppaan: ",
							"Amerikan markkinat kovassa imussa: ",
							"Iso enkelisijoittaja Unkarista. ",
							"Everything went better than expected. ",
							"Ei kun pullo pöytääm, sitten miettimään! ",
							"Iso tilaus metsäteollisuudelta: ",
							"Laskuvirhe pankissa sinun eduksesi: ",
							"Lisenssisopimukset solmittu: "
							];

		var negCommentPool = [	
							"Voiko tästä suosta enää nousta? ", 
							"Sijoittajien luottamus mennyttä! ", 
							"Tämä ei jatku pitkään. ", 
							"Pitäisikö nyt itkeä vai nauraa? ",
							"Päivän pettymys: ",
							"Limiitit paukkuvat! ",
							"Elämme lopun aikoja ystävät. ",
							"Oij, mikä rekyyli! ",
							"Saturaatiota havaittavissa! ",
							"Eihän tällaista volatiliteettiä ole olemassakaan! ",
							"Ei tämä ainakaan paremmaksi muutu. ",
							"Tällä et tule tienaamaan. ",
							"Tulevaisuuden näkymät ovat synkkiä. ",
							"Usko koetuksella. ",
							"Tuurilla ne laivatkin seilaa. ",
							"Toimialavaikeudet näkyvät: ",
							"Mihin asti mennään? ",
							"Loppua ei ole näkyvissä. ",
							"Olisiko huomenna parempi päivä. ",
							"Takkiin tulee. ",
							"Epävarmalta näyttää. ",
							"Tulenarkaa tavaraa. Älä hätiköi. ",
							"Game over! ",
							"Me ollaan hävitty tää peli! ",
							"Ojasta allikkoon... ",
							"Suo siellä, vetelä täällä. ",
							"On niitä parempiakin kohteita. ",
							"Säälittävää! ",
							"Nyt ei kunnian kukko laula! ",
							"Nyt päitä vadille! ",
							"Always look on the bright side of life! ",
							"Pikkujuttuja. ",
							"Aikamoista vuoristorataa! ",
							"Rati riti ralla, ollaan pakkasella. ",
							"Seuratkaa pörssitiedotteita. ",
							"Myynti laskussa Kiinassa: ",
							"Aasian markkinat huonossa vedossa: ",
							"Tulos tai ulos! ",
							"Sipilän talkoot käynnissä? ",
							"Lunta tupaan ja jäitä porstuaan! "
							];

		if (stockChange < 0) {
			return negCommentPool[getRandIndex(negCommentPool)]; 
		}
		else {
			return posCommentPool[getRandIndex(posCommentPool)]; 
		}
	}


	var analysis = function() {	

		var analysisArray = [" nousussa ", " laskussa "];
		
		if (stockChange < 0) {
			return analysisArray[1];
		}
		else {
			return analysisArray[0];
		}		
	};

	var modifier = function() {
		var modifiers = [
							" hurjassa",
							" lievässä",
							" loivassa",
							" jyrkässä",
							" hirvittävässä",
							" kovassa"
						];
		return modifiers[getRandIndex(modifiers)];

	}

	var shittyAdvice = function() {
		var advicePool = [	
							" Nyt joukolla ostamaan!", 
							" Tänään on hyvä päivä myydä!", 
							" Näistä kannattaa pitää kiinni!", 
							" Tämä tuottaa tulevaisuudessa!",
							" Myyminen kannattaa aina!",
							" Koskaan ei ole tyhmää ostaa!",
							" Uskallatko ottaa riskin?",
							" Osta varauksella!",
							" Myy!",
							" Osta!",
							" Sijoita vähintään tuhat euroa!",
							" Tänään sijoitettu on huomenna kääritty.",
							" Parempi pyy pivossa kuin osake salkussa, myykää!",
							" Komissiot kiikarissa? Myy, myy, myy!",
							" Edesmenneen isoisäni sanoin: Myy poika, myy!",
							" Beta-kertoimet sikseen, nyt on aika ostaa!",
							" Ei laatu vaan määrä. Osta vähintään 1 000 kpl!",
							" Ei osinkoja tänä vuonna. Myyntiin ja äkkiä!",
							" Miksi myydä, kun voi ostaa?",
							" Pikavippi taskuun ja rahat kiinni!",
							" Osta. Odota kuukausi. Myy.",
							" Osta vähintään 150 kpl!",
							" Sijoita 1 500 euroa!",
							" Myy puolet. Tulevaisuus näyttää epävarmalta.",
							" Osta 875 kpl!",
							" Myyntiin menee!",
							" Osta tai myy. Takkiin tulee joka tapauksessa.",
							" Ehkä ostoon, ehkä ei.",
							" Halpaa kuin saippua! Ostoon!",
							" Vain hullu harkitsee myymistä!",
							" Osta pois, vaikka lahjaksi.",
							" Tyhmäkin voi olla viisas, jos uskaltaa myydä.",
							" Markka-aikana olisin ostanut. Nyt myntiin!",
							" Pitkällä tähtäimellä osta, lyhyellä myy!",
							" 2 000 kpl ostoon ja sassiin!",
							" Tonni sinne, tonni tänne. Osta!",
							" Älä vaihda suuntaan tai toiseen.",
							" Säästä ensi viikkoon ja myy.",
							" Ylihuomenna myyt isommalla voitolla!",
							" Varaudu myymään loppuviikosta.",
							" Odota Q3:n loppuun ja osta enintään 3 200 kpl.",
							" Kerran se vaan kirpasee, osta 400 kpl!",
							" Aika on rahaa. Nyt on aika ostaa.",
							" Sijoita 800 euroa.",
							" M niin kuin myyntiin!",
							" Osta, jos et muuta keksi.",
							" Tuottoa luvassa. Osta 100 kpl.",
							" Älä suotta vaivaudu.",
							" Osta tai myy. Määrä ratkaisee!",
							" Kelpaa ehkä koiranruuaksi.",
							" Älä osta.",
							" Osakeanti tulossa. Pidä kiinni!",
							" 5/5 Ostaisin uudelleen!",
							" 0/5 paska ostos.",
							" Osto omalla vastuulla.",
							" Parempi katsoa kuin katua. Osta!",
							" Älä nuolaise ennen kuin tipahtaa. Myy huomenna.",
							" Köyhät kyykkyyn! 2 000 eurolla ostoon!",
							" Q4 on ostajan aikaa."
							];

		return advicePool[getRandIndex(advicePool)]; 
	}

	var status = comment() + stockName + modifier() + analysis() + stockChange + " %." + shittyAdvice() + " #porssivinkki";
	
	// TODO: Add hashtags into status

	return status;
}

function generateFakeQuotes() {
	var quotes = [];
}

function isSimilar(tweet) { // if latest isSimilar == true -> new advice
	return true;
}

function mockTweetStockAdvice(status) {

	if (status.length > 140) {
		console.log("================  The tweet is too long! =================" + "\n" 
			+ "Tweet length: " + status.length + "\n" + status);
	};

	console.log(status);
}

// function tweetStockAdvice(status) {

// 	if (status.length > 140) {
// 		getRandomStockQuote();
// 	}

// 	else {

// 		tweeter.post('statuses/update', { status: status }, function(err, data, response) {
//   			if (err && err.code === 187) {
//   				getRandomStockQuote();
//   			}
//   			else if (err && err.code != 187) {
//   				console.log(err) // log into file
//   			}

//   			console.log(data);
// 		});
// 	}
		
// }

getRandomStockQuote();















