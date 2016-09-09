/*eslint-env node, express*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------


// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require("express");


// moment provides time and format functionality
var moment = require("moment");

// create a new express server
var app = express();

// Load the Cloudant library.
var Cloudant = require("cloudant");


// Use the VCAP variables to authenticate with Cloudant.
var cloudant = Cloudant({
	account : "82322df4-f94c-4c51-801e-112b60b09fd1-bluemix",
	password : "5e9ba2d1666ae333828cfd3c2d9d8d1e400b95f3cf6388c17eca8fdabe24c598"
});

//var greatwest = cloudant.db.use('greatwestsports');
var greatwest = cloudant.db.use("greatoutdoors");

// serve the files out of ./public as our main files
app.use(express.static(__dirname + "/public"));

// This construct allows the same code to be run locally or in the cloud
var port = 3000;
var host = "localhost";

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
	console.log("server starting on " + appEnv.url);
});

// Create routes for the web page to call into


// Route to get most recent time stamp in database
app.get("/evict_ts", function(req, res) {

	//var today = moment().format("YYYY-MM-DD");
	//console.log("Today: ", today);

	// Run query to find latest TS in database
	greatwest.find({
		"selector" : { "evictTS" : { "$gt" : "0" },
			"storeID" : "GO-CO-001"
		},
		"fields" : [ "evictTS" ],
		"sort" : [ {
			"evictTS" : "desc"
		} ],
		"limit" : 1
	}, function(er, result) {
		if (er) {
			console.log("Find Error: ", er);
			throw er;
		}

		console.log("Found %d documents with name StoreID GO-CO-001",
				result.docs.length);
		for (var i = 0; i < result.docs.length; i++) {
			console.log("  Doc TS: %s", result.docs[i].evictTS);
		}

		// In this case we know there is only one record returned. Need to
		// investigate how to
		// receive a JSON structure and parse it.
		// NOTE: res.send sends the contents as Content-Type: text/html;
		// charset=utf-8
		// res.json sends the contents as Content-Type application/json;
		// charset=utf-8
		res.json(result.docs[0].evictTS);
		res.end;
	});
});

// Route to get shoppers for a specific time stamp
app.get("/get_shoppers", function(req, res) {

	// Run query to find latest evictTS in database
	greatwest.find({
		"selector" : { "evictTS" : { "$gt" : "0" },
			"storeID" : "GO-CO-001"
		},
		"fields" : [ "evictTS" ],
		"sort" : [ {
			"evictTS" : "desc"
		} ],
		"limit" : 1
	}, function(er, result) {
		if (er) {
			console.error("Error querying for evictTS: ", er);
			throw er;
		}

		//console.log("Latest evictTS found: ", String(result.docs[0].evictTS));
		getShoppersByEvictTS(String(result.docs[0].evictTS), res);
	});

	// Run query using evictTS to find latest shopper data
	function getShoppersByEvictTS(evictTSLatest, res) {
		greatwest.find({
			"selector" : {
				"evictTS" : { "$eq" : evictTSLatest },
				"storeID" : "GO-CO-001",
			},
			"fields" : [ "zoneID" ],
			"sort" : [ {
				"zoneID:number" : "desc"
			} ],
		}, function(er, result) {
			if (er) {
				console.log("Error querying for shoppers: ", er);
				throw er;
			}

			//console.log("Results of query by evictTS: ", result.docs);
			res.send(result.docs);
			res.end;

		});
	} // end function
});