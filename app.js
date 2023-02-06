// Include the cluster module
var cluster = require('cluster');

//var AWS = require('aws-sdk');
var express = require('express');
var bodyParser = require('body-parser');
const {response} = require("express");
fh_token = 'c8at6m2ad3ifo5nsceeg';


//built_page = null;
orig_res = null;
requestIdCounter = 0;
requestMapping = [];

//AWS.config.region = process.env.REGION

var app = express();
var port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());


function getNewRequestId(){
    this.requestIdCounter = this.requestIdCounter + 1;
    console.log("New Id: " + this.requestIdCounter)
    return this.requestIdCounter;
}

app.get('/server/search/:ticker', function(req, res) {
    returnSummaryData(res, (req.params.ticker).toUpperCase())
});

app.get('/server/news/:ticker', function(req, res) {
    returnNewsData(res, (req.params.ticker).toUpperCase())
});

app.get('/server/charts/:ticker', function(req, res) {
    returnChartsData(res, (req.params.ticker).toUpperCase())
});

app.get('/server/insights/:ticker', function(req, res) {
    returnInsightData(res, (req.params.ticker).toUpperCase())
});

app.get('/server/autocomplete/:ticker', function(req, res) {
    returnACData(res, (req.params.ticker).toUpperCase())
});

app.get('/server/wlprice/:ticker', function(req, res) {
    returnWLPrices(res, (req.params.ticker).toUpperCase())
});



var server = app.listen(port, function () {
    console.log('Server running at http://127.0.0.1:' + port + '/');
});



function makeAPICall(orig_res, id, path, req_name, data_container){
    const https = require('https')
    const options = {hostname: 'finnhub.io', port: 443, path: path, method: 'GET'}

    var response_data = '';

    const req = https.request(options, function(orig_res, id, req_name, response_data, data_container, res) {
        console.log(`statusCode: ${res.statusCode}`);

        res.on('data', function (chunk) {
            response_data += chunk;
        });

        res.on('end', data => {
            //response_data = response_data.replace("}{", ",")
             try {
                var processed_data = JSON.parse(response_data)
             } catch (error){
                 console.log("ERROR!")
                 console.error(error);
                 console.log(response_data)
            }
            data_container[req_name] = processed_data
            requestMapping[id] = requestMapping[id] -1

            console.log("remaining requests: " + requestMapping[id])
            if (requestMapping[id] == 0) {
                //built_page = build_page_function(data_container);

                orig_res.writeHead(200, { 'Content-Type': 'application/json' });
                orig_res.write(JSON.stringify(data_container));
                orig_res.end();
                resetRequestData();
            }
        });
    }.bind(this, orig_res, id, req_name, response_data, data_container))

    req.on('error', error => {
        console.error(error);
    })

    req.end();

}

function resetRequestData(){
    //var remove_val = num_requests
    //data_container = {};
    //num_requests = num_requests - remove_val;
    //num_responses = num_responses - remove_val;
    //built_page = null;
    orig_res = null;
    //response_data = '';
}

function getProfile(orig_res, id, ticker, data_container){
    makeAPICall(orig_res, id, '/api/v1/stock/profile2?symbol=' + ticker + '&token=' + fh_token, "profile", data_container);
}

function getHistoricalData(orig_res, id, ticker, data_container){
    var resolution = 5;



    var date_to_use = new Date();
    if (date_to_use.getHours() < 6)
        date_to_use = new Date().setDate(date_to_use.getDate() - 1);

    var marketOpen = new Date(new Date(new Date(date_to_use).setHours(6)).setMinutes(0)).setSeconds(0)
    var marketClose = new Date(new Date(new Date(date_to_use).setHours(13)).setMinutes(0)).setSeconds(0)

    var from = Math.floor(marketOpen / 1000);
    var to = Math.floor(marketClose / 1000);

    makeAPICall(orig_res, id, '/api/v1/stock/candle?symbol=' + ticker + '&resolution=' + resolution + '&from=' + from + '&to=' + to + '&token=' + fh_token, "hist", data_container);
}

function getMainChartData(orig_res, id, ticker, data_container){
  var resolution = "D";

  var to = new Date()
  var from = new Date().setFullYear(to.getFullYear() - 2)

  to = Math.floor(to.getTime() / 1000);
  from = Math.floor(from / 1000);


  makeAPICall(orig_res, id, '/api/v1/stock/candle?symbol=' + ticker + '&resolution=' + resolution + '&from=' + from + '&to=' + to + '&token=' + fh_token, "hist", data_container);
}

function getPrice(orig_res, id, ticker, data_container, obj_handle="price"){
    makeAPICall(orig_res, id, '/api/v1/quote?symbol=' + ticker + '&token=' + fh_token, obj_handle, data_container);
}

function getAutocomplete(orig_res, id, ticker, data_container){
    makeAPICall(orig_res, id, '/api/v1/search?q=' + ticker + '&token=' + fh_token, "auto", data_container);
}

function getNews(orig_res, id, ticker, data_container){
    var today = new Date();
    var priorDate = new Date(new Date().setDate(today.getDate() - 30));
    var from = priorDate.toISOString().split('T')[0];
    var to = today.toISOString().split('T')[0];

    makeAPICall(orig_res, id, '/api/v1/company-news?symbol=' + ticker + '&from=' + from + '&to=' + to + '&token=' + fh_token, "news", data_container);
}

function getRecommendation(orig_res, id, ticker, data_container){

    makeAPICall(orig_res, id, '/api/v1/stock/recommendation?symbol=' + ticker + '&token=' + fh_token, "recs", data_container);
}

function getSocialSentiment(orig_res, id, ticker, data_container){
    var from = "2022-01-01";

    makeAPICall(orig_res, id, '/api/v1/stock/social-sentiment?symbol=' + ticker + '&from=' + from + '&token=' + fh_token, "socsent", data_container);
}

function getCompanyPeers(orig_res, id, ticker, data_container){
    makeAPICall(orig_res, id, '/api/v1/stock/peers?symbol=' + ticker + '&token=' + fh_token, "peers", data_container);
}

function getCompanyEarnings(orig_res, id, ticker, data_container){
    makeAPICall(orig_res, id, '/api/v1/stock/earnings?symbol=' + ticker + '&token=' + fh_token, "earnings", data_container);
}



function returnSummaryData(orig_res, ticker){
    console.log(`Returning summary data`);

    var id = getNewRequestId();
    this.requestMapping[id] = 4
    var data_container = {};

    getProfile(orig_res, id, ticker, data_container);
    getPrice(orig_res, id, ticker, data_container);
    getCompanyPeers(orig_res, id, ticker, data_container);
    getHistoricalData(orig_res, id, ticker, data_container);
}

function returnNewsData(orig_res, ticker){
    console.log(`Returning news data`);

    var id = getNewRequestId();
    this.requestMapping[id] = 1
    var data_container = {};

    getNews(orig_res, id, ticker, data_container);
}

//TODO
function returnChartsData(orig_res, ticker){
    console.log(`Returning charts data`);

    var id = getNewRequestId();
    this.requestMapping[id] = 1
    var data_container = {};

  getMainChartData(orig_res, id, ticker, data_container);
}

function returnInsightData(orig_res, ticker){
    console.log(`Returning summary data`);

    var id = getNewRequestId();
    this.requestMapping[id] = 3
    var data_container = {};

    getSocialSentiment(orig_res, id, ticker, data_container)
    getRecommendation(orig_res, id, ticker, data_container)
    getCompanyEarnings(orig_res, id, ticker, data_container)
}

function returnACData(orig_res, ticker){
    console.log(`Returning autocomplete data`);

    var id = getNewRequestId();
    this.requestMapping[id] = 1
    var data_container = {};

    getAutocomplete(orig_res, id, ticker, data_container);
}

function returnWLPrices(orig_res, ticker){
    console.log(`Returning wl price data`);

    var list_of_tickers = ticker.split("+");

    var id = getNewRequestId();
    this.requestMapping[id] = list_of_tickers.length;
    var data_container = {};

    for (var i=0; i<list_of_tickers.length; i++){
        getPrice(orig_res, id, list_of_tickers[i], data_container, list_of_tickers[i]);
    }

}
