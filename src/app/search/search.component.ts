import { Component, OnInit,} from '@angular/core';
import { ActivatedRoute } from '@angular/router'
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { Inject }  from '@angular/core';
import { MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';

import * as Highcharts from "highcharts/highstock";
import Indicators_module from 'highcharts/indicators/indicators';
Indicators_module(Highcharts);
import VBP_module from 'highcharts/indicators/volume-by-price';
import {Subscription, interval} from "rxjs";
VBP_module(Highcharts);


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})


export class SearchComponent implements OnInit {
  mySubscription: Subscription

  searchControl = new FormControl()
  searched_val = ''

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router, @Inject(DOCUMENT) document: Document ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.mySubscription= interval(15000).subscribe((x =>{
      this.refreshSummaryAndDetailsData();
    }));

    this.searchControl.valueChanges.subscribe(searched_val => {
      console.log('form value changed')
      console.log(searched_val)

      this.searched_val = searched_val

      this.http.get("server/autocomplete/" + searched_val).subscribe((res)=>{
        var matches = []
        // @ts-ignore
        for(var i=0; i<res['auto']['result'].length; i++){
          if (Object.keys(matches).length >= 10){
            // @ts-ignore
            this.options = matches;
            return
          }
          // @ts-ignore
          if(res['auto']['result'][i]['type'] == 'Common Stock' && res['auto']['result'][i]['symbol'].startsWith(this.searched_val.toUpperCase())){
            // @ts-ignore
            matches.push([res['auto']['result'][i]['symbol'], res['auto']['result'][i]['description']])
          }
        }
        // @ts-ignore
        this.options = matches;
      })
    })
  }

  pageType = "search"
  //General Details
  tkr_on_watch = false;
  ticker: string | null = '';
  private data: any = [];
  money = 0;
  owned = {};
  owned_qty = {};
  options = []

  //Selection Details
  tab_if_condition: string = "summary";

  //Charts Details
  updateFlag = true
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions_summary: Highcharts.Options = {
    series: [{
      data: [1, 2, 3],
      type: 'line'
    }]
  };
  chartOptions_recTrends: Highcharts.Options = {
    series: [
      {type: 'column'},
      {type: 'column'},
      {type: 'column'},
      {type: 'column'},
      {type: 'column'}],
    plotOptions: {column: {stacking: "normal"}},
  };

  chartOptions_EPS: Highcharts.Options = {
    series: [{type: 'spline'},{type: 'spline'}]
  };

  chartOptions_charts: Highcharts.Options = {
    series: [
      {type: 'candlestick'},
      {type: 'column'},
      {type: 'vbp'},
      {type: 'sma'}],
    yAxis: [{
      startOnTick: false,
      endOnTick: false,
      labels: {align: 'right', x: -3},
      title: {text: 'OHLC'},
      height: '60%',
      lineWidth: 2,
      resize: {enabled: true}
    }, {
      labels: {align: 'right', x: -3},
      title: {text: 'Volume'},
      top: '65%',
      height: '35%',
      offset: 0,
      lineWidth: 2
    }]
  };

  //News Details
  containers = [];
  newsmodal_source = ""
  newsmodal_datetime = ""
  newsmodal_headline = ""
  newsmodal_summary = ""
  newsmodal_url = ""

  //Search Page Details
  tick = '';
  comp_name = '';
  exchange = '';
  logo_image = '';
  close: number = 0;
  change = '';
  change_p = '';
  datetime = '';
  high = 0;
  low = 0;
  open = 0;
  prevclose = 0;
  ipo = '';
  industry = '';
  site = '';
  peersList = []
  if_sellable = false;
  calculated_total = 0;
  num_shares = 0;
  is_buyable_amt: string ="no";
  is_sellable_amt: string = "no";
  change_color = "green";
  market_close_time = ""
  notification_present = false;
  soldorbought = " Bought "
  cur_qty = 0;

  //Insights Details
  TOT_REDDIT = 0;
  TOT_TWITTER = 0;
  P_REDDIT = 0;
  P_TWITTER = 0;
  N_REDDIT = 0;
  N_TWITTER = 0;



  ngOnInit(): void {

    if (this.route.snapshot.url.length < 2){
      window.localStorage.setItem("last_search", JSON.stringify(""));
      this.router.navigateByUrl('/search/home');
    } else {

      // @ts-ignore
      var saved_search = JSON.parse(window.localStorage.getItem("last_search"));
      this.ticker = this.route.snapshot.paramMap.get('ticker')

      // @ts-ignore
      this.money = JSON.parse(window.localStorage.getItem("money"));
      // @ts-ignore
      this.owned = JSON.parse(window.localStorage.getItem("owned"));
      this.updateAllOwnedQty()

      //Handle last search or no ticker available
      if (this.ticker == null) {
        if (saved_search != null && saved_search != "" && typeof (saved_search) != "undefined") {
          this.router.navigateByUrl('/search/' + saved_search);
        } else {
          this.tab_if_condition = "";
        }
      } else {
        if (this.ticker == "home") {
          this.tab_if_condition = "";
        } else {
          this.selectSummary()
        }
        window.localStorage.setItem("last_search", JSON.stringify(this.ticker));
      }

      // @ts-ignore
      if (Object.keys(this.owned).includes(this.ticker.toUpperCase())){
        this.if_sellable = true;
      } else{
        this.if_sellable = false;
      }
    }

    this.createFBPost();

    var today = new Date();
    var date_to_use = new Date();
    if (date_to_use.getHours() < 6)
    { // @ts-ignore
      date_to_use = new Date().setDate(today.getDate() - 1);
    }
    //This is ridiculous - changing the var type on a set method??
    var marketClose = new Date(new Date(new Date(new Date(date_to_use).setHours(13)).setMinutes(0)).setSeconds(0))
    var fmt_dt = marketClose.getFullYear() + "-" + String(marketClose.getMonth() + 1).padStart(2, '0') + "-" + String(marketClose.getDate()).padStart(2, '0') + " " + String(marketClose.getHours()).padStart(2, '0') + ":" + String(marketClose.getMinutes()).padStart(2, '0') + ":" + String(marketClose.getSeconds()).padStart(2, '0');


    // @ts-ignore
    if (marketClose <= today){
      this.market_close_time = fmt_dt;
    } else {
      this.market_close_time = "";
    }
  }

  changeWatchlistStatus(event?: MouseEvent) {
    // @ts-ignore
    var watchlist = JSON.parse(window.localStorage.getItem("watchlist_storage"));

    if(this.tkr_on_watch == false){
      // @ts-ignore
      watchlist[this.ticker.toUpperCase()] = this.comp_name
      this.tkr_on_watch = true
    } else {
      // @ts-ignore
      if(watchlist[this.ticker.toUpperCase()] != undefined) {
        // @ts-ignore
        delete watchlist[this.ticker.toUpperCase()];
      }
      this.tkr_on_watch = false
    }
    window.localStorage.setItem("watchlist_storage", JSON.stringify(watchlist));

  }

  updateBuy(){

    // @ts-ignore
    this.num_shares = document.getElementById("buy_quantity")["value"];
    this.calculated_total = (this.num_shares * this.close);


    if (this.calculated_total > this.money) {
      this.is_buyable_amt = 'high';
    } else if(this.num_shares < 1){
      this.is_buyable_amt = 'no';
    } else {
      this.is_buyable_amt = 'yes';
    }
  }

  buyStock(){
    // @ts-ignore

    var owned = JSON.parse(window.localStorage.getItem("owned"));
    // @ts-ignore
    var money = JSON.parse(window.localStorage.getItem("money"));
    money = money - this.calculated_total;

    // @ts-ignore
    if(owned[this.ticker.toUpperCase()] == null || typeof(owned[this.ticker.toUpperCase()]) == "undefined"){
      // @ts-ignore
      owned[this.ticker.toUpperCase()] = {};
      // @ts-ignore
      owned[this.ticker.toUpperCase()][0] = {"shares": parseFloat(this.num_shares), "total_val": parseFloat(this.calculated_total)};
    } else {
      // @ts-ignore
      owned[this.ticker.toUpperCase()][Object.keys(owned[this.ticker.toUpperCase()]).length] = {"shares": parseFloat(this.num_shares), "total_val": parseFloat(this.calculated_total)};
    }

    window.localStorage.setItem("money", JSON.stringify(money));
    window.localStorage.setItem("owned", JSON.stringify(owned));
    this.owned = owned;
    this.money = money;
    this.if_sellable = true;
    this.updateAllOwnedQty()
    this.buySellNotification(" bought ");

    //Reset
    this.is_buyable_amt = 'no';
    this.num_shares = 0;
  }

  updateAllOwnedQty(){
    for(var i=0; i<Object.keys(this.owned).length; i++) {
      var ticker = Object.keys(this.owned)[i]
      var tot_qty_owned = 0
      // @ts-ignore
      for (var p_idx = 0; p_idx < Object.keys(this.owned[ticker]).length; p_idx++) {
        // @ts-ignore
        var purchase = this.owned[ticker][p_idx]
        tot_qty_owned = tot_qty_owned + purchase["shares"]
      }
      // @ts-ignore
      this.owned_qty[ticker] = tot_qty_owned

      if(tot_qty_owned == 0){
        // @ts-ignore
        delete this.owned[ticker]
        window.localStorage.setItem("owned", JSON.stringify(this.owned));
        this.if_sellable = false
      }
    }
  }

  updateSell(){

    // @ts-ignore
    this.num_shares = document.getElementById("sell_quantity")["value"];
    this.calculated_total = (this.num_shares * this.close);

    // @ts-ignore
    if (this.owned_qty[this.ticker.toUpperCase()] < Number.parseInt(this.num_shares)) {
      this.is_sellable_amt = 'high';
    } else if(this.num_shares < 1){
      this.is_sellable_amt = 'no';
    } else {
      this.is_sellable_amt = 'yes';
    }
  }

  sellStock(){
    // @ts-ignore

    var owned = JSON.parse(window.localStorage.getItem("owned"));
    // @ts-ignore
    var money = JSON.parse(window.localStorage.getItem("money"));
    money = money + this.calculated_total;

    // @ts-ignore
    owned[this.ticker.toUpperCase()][Object.keys(owned[this.ticker.toUpperCase()]).length] = {"shares": parseFloat(-this.num_shares), "total_val": parseFloat(this.calculated_total)};

    window.localStorage.setItem("money", JSON.stringify(money));
    window.localStorage.setItem("owned", JSON.stringify(owned));
    this.owned = owned
    this.money = money;
    this.updateAllOwnedQty()
    this.buySellNotification(" sold ");

    //Reset
    this.is_sellable_amt = 'no';
    this.num_shares = 0;
  }

  onSearch() {
    var element = document.getElementById("search_value");
    // @ts-ignore
    this.router.navigateByUrl('/search/' + element['value']);
  }

  onClear() {
    // @ts-ignore
    this.router.navigateByUrl('/search/home');
  }

  selectSummary() {
    this.tab_if_condition = "summary";

    // @ts-ignore
    var watchlist = JSON.parse(window.localStorage.getItem("watchlist_storage"));

    // @ts-ignore
    if(watchlist[this.ticker.toUpperCase()] != undefined){
      this.tkr_on_watch = true
    } else {
      this.tkr_on_watch = false
    }

    this.http.get("server/search/" + this.ticker).subscribe((res)=>{
      this.data = res
      console.log(this.data)

      this.tick = this.data['profile']['ticker'].toUpperCase()
      this.comp_name = this.data['profile']['name']
      this.exchange = this.data['profile']['exchange']
      this.logo_image = this.data['profile']['logo']
      this.close = rdToTwo(this.data['price']['c'] )
      // @ts-ignore
      this.cur_qty = this.owned_qty[this.tick]
      this.change = rdToTwo(this.data['price']['d']) + " (" + rdToTwo(this.data['price']['dp']) + "%)"
      this.datetime = fmtDate(this.data['price']['t'])
      this.high = this.data['price']['h']
      this.low = this.data['price']['l']
      this.open = this.data['price']['o']
      this.prevclose = this.data['price']['pc']
      this.ipo = this.data['profile']['ipo']
      this.industry = this.data['profile']['finnhubIndustry']
      this.site = this.data['profile']['weburl']

      this.peersList = []
      for (var p=0; p<this.data["peers"].length; p++){

        // @ts-ignore
        this.peersList.push(this.data["peers"][p])
      }

      // @ts-ignore
      if (parseFloat(this.change) > 0){
        this.change_color = "green"
      } else if(parseFloat(this.change) == 0){
        this.change_color = "black"
      }else {
        this.change_color = "red"
      }

      // @ts-ignore
      var title = this.ticker.toUpperCase() + ' Hourly Price Variation';
      this.chartOptions_summary = {
        // @ts-ignore
        title: {
          text: title
        },
        yAxis: [{title: {text: ''}, opposite: true}],
        xAxis: {
          labels: {
            formatter: function() {
              // @ts-ignore
              return (String((this.value / 10) + 6).padStart(2, '0') + ":00");
            }
          }, max: 70
        },
        plotOptions: {line: {marker: {enabled: false}}},
        legend: {enabled: false},
        series: [
          {
            name: 'Stock Price',
            data: this.data["hist"]["c"],
            type: 'line',
            color: this.change_color
          }]

      }
    })


  }

  refreshSummaryAndDetailsData(){
    this.http.get("server/search/" + this.ticker).subscribe((res)=> {
      this.data = res
      console.log("refreshing data...")
      console.log(this.data)

      this.tick = this.data['profile']['ticker'].toUpperCase()
      this.comp_name = this.data['profile']['name']
      this.exchange = this.data['profile']['exchange']
      this.logo_image = this.data['profile']['logo']
      this.close = rdToTwo(this.data['price']['c'])
      // @ts-ignore
      this.cur_qty = this.owned_qty[this.tick]
      this.change = rdToTwo(this.data['price']['d']) + " (" + rdToTwo(this.data['price']['dp']) + "%)"
      this.datetime = fmtDate(this.data['price']['t'])
      this.high = this.data['price']['h']
      this.low = this.data['price']['l']
      this.open = this.data['price']['o']
      this.prevclose = this.data['price']['pc']
      this.ipo = this.data['profile']['ipo']
      this.industry = this.data['profile']['finnhubIndustry']
      this.site = this.data['profile']['weburl']

      this.peersList = []
      for (var p = 0; p < this.data["peers"].length; p++) {
        // @ts-ignore
        this.peersList.push(this.data["peers"][p])
      }

      // @ts-ignore
      if (parseFloat(this.change) >= 0) {
        this.change_color = "green"
      } else {
        this.change_color = "red"
      }
    });
  }

  selectNews() {
    this.tab_if_condition = "news";

    var newsCounter = 5
    var savedElements = []
    this.containers = []

    //document.getElementById('news_container').innerHTML = ""

    this.http.get("server/news/" + this.ticker).subscribe((res)=>{
      console.log(res)


      if (typeof(res) != "undefined") {
        // @ts-ignore
        for (var i = 0; i < res['news'].length && newsCounter > 0; i++) {
          // @ts-ignore
          if (res['news'][i]['image'] != '' && res['news'][i]['datetime'] != '') {
            // @ts-ignore
            var d = res['news'][i];
            newsCounter = newsCounter - 1
            d['modal_name'] = i + "_modal"
            savedElements.push(d);
            // @ts-ignore
            this.containers.push(d)

          }
        }
      }

    })
  }

  updateNewsModal(src: string, dt: string, hl: string, sum: string, url: string){
    this.newsmodal_source = src
    this.newsmodal_datetime = fmtDate(Number.parseInt(dt))
    this.newsmodal_headline = hl
    this.newsmodal_summary = sum
    this.newsmodal_url = url
  }

  selectCharts() {
    this.tab_if_condition = "charts";

    this.http.get("server/charts/" + this.ticker).subscribe((res)=>{
      console.log(res)

      // split the data set into ohlc and volume
      var ohlc = []
      var volume = []

      var groupingUnits = [[
        'week',                         // unit name
        [1]                             // allowed multiples
      ], [
        'month',
        [1, 2, 3, 4, 6]
      ]]

      // @ts-ignore
      for (var i=0; i < res['hist']['c'].length; i++) {
        ohlc.push([// @ts-ignore
          res['hist']['t'][i] * 1000, // @ts-ignore// the date
          res['hist']['o'][i], // @ts-ignore// open
          res['hist']['h'][i], // @ts-ignore// high
          res['hist']['l'][i], // @ts-ignore// low
          res['hist']['c'][i] // close
        ]);

        volume.push([// @ts-ignore
          res['hist']['t'][i]  * 1000, // @ts-ignore// the date
          res['hist']['v'][i] // the volume
        ]);
      }

      var chart_title = this.tick + " Historical";
      // @ts-ignore
      this.chartOptions_charts = {
        rangeSelector: { enabled: true },
        scrollbar: { enabled: true },
        navigator: { enabled: true },
        title: {
          text: chart_title
        },
        subtitle: {
          text: 'With SMA and Volume by Price technical indicators'
        },
        xAxis: {
          type: "datetime"
        },
        yAxis: [{
          startOnTick: false,
          endOnTick: false,
          labels: {
            align: 'right',
            x: -3
          },
          title: {
            text: 'OHLC'
          },
          height: '60%',
          lineWidth: 2,
          resize: {
            enabled: true
          }
        }, {
          labels: {
            align: 'right',
            x: -3
          },
          title: {
            text: 'Volume'
          },
          top: '65%',
          height: '35%',
          offset: 0,
          lineWidth: 2
        }],

        tooltip: {
          split: true
        },
        legend: {enabled: false},
        plotOptions: {
          line: {marker: {enabled: false}},
          series: {
            dataGrouping: {
              //@ts-ignore
              units: groupingUnits
            }
          }
        },
        series: [
          {
            name: chart_title,
            data: ohlc,
            type: 'candlestick',
            id: 'my_candlestick'
          },{
            type: 'column',
            name: 'Volume',
            id: 'volume',
            data: volume,
            yAxis: 1
          }, {
            type: 'vbp',
            linkedTo: 'my_candlestick',
            params: {
              volumeSeriesID: 'volume'
            },
            dataLabels: {
              enabled: false
            },
            zoneLines: {
              enabled: false
            }
          }, {
            type: 'sma',
            linkedTo: 'my_candlestick',
            zIndex: 1,
            marker: {
              enabled: false
            }
          }]

      }










    })
  }

  selectInsight(event?: MouseEvent) {
    this.tab_if_condition = "insights";

    this.http.get("server/insights/" + this.ticker).subscribe((res)=> {
      console.log(res)

      var r_t = 0
      var r_p = 0
      var r_n = 0
      var t_t = 0
      var t_p = 0
      var t_n = 0

      // @ts-ignore
      for (var i=0; i<res["socsent"]["reddit"].length; i++){
        // @ts-ignore
        r_t = r_t + res["socsent"]["reddit"][i]["mention"]
        // @ts-ignore
        r_p = r_p + res["socsent"]["reddit"][i]["positiveMention"]
        // @ts-ignore
        r_n = r_n + res["socsent"]["reddit"][i]["negativeMention"]
        // @ts-ignore
        t_t = t_t + res["socsent"]["twitter"][i]["mention"]
        // @ts-ignore
        t_p = t_p + res["socsent"]["twitter"][i]["positiveMention"]
        // @ts-ignore
        t_n = t_n + res["socsent"]["twitter"][i]["negativeMention"]
      }

      this.TOT_REDDIT = r_t
      this.TOT_TWITTER = t_t
      this.P_REDDIT = r_p
      this.P_TWITTER = t_p
      this.N_REDDIT = r_n
      this.N_TWITTER = t_n

      var sSell: Highcharts.SeriesOptionsType[] = []
      var sell: Highcharts.SeriesOptionsType[] = []
      var hold: Highcharts.SeriesOptionsType[] = []
      var buy: Highcharts.SeriesOptionsType[] = []
      var sBuy: Highcharts.SeriesOptionsType[] = []
      var catgs = []
      // @ts-ignore
      for (var i=0; i<res["recs"].length; i++){
        // @ts-ignore
        catgs.push(res["recs"][i]["period"])
        // @ts-ignore
        sSell.push(res["recs"][i]["strongSell"])
        // @ts-ignore
        sell.push(res["recs"][i]["sell"])
        // @ts-ignore
        hold.push(res["recs"][i]["hold"])
        // @ts-ignore
        buy.push(res["recs"][i]["buy"])
        // @ts-ignore
        sBuy.push(res["recs"][i]["strongBuy"])
      }

      this.chartOptions_recTrends = {
        chart: {type: 'column'},
        title: {text: "Recommendation Trends"},
        xAxis: {categories: catgs},
        plotOptions: {
          column: {
            stacking: "normal",
            dataLabels: {
              enabled: true
            }
          }
        },
        yAxis: {title: {text: '#Analysis', align: 'high'}},
        series: [{
          name: "Strong Buy",
          // @ts-ignore
          data: sBuy,
          color: '#176F37'
        }, {
          name: "Buy",
          // @ts-ignore
          data: buy,
          color: '#1DB954'
        }, {
          name: "Hold",
          // @ts-ignore
          data: hold,
          color: '#B98B1D'
        }, {
          name: "Sell",
          // @ts-ignore
          data: sell,
          color: '#F45B5B'
        }, {
          name: "Strong Sell",
          // @ts-ignore
          data: sSell,
          color: '#813131'
        }],
      }

      var actual: Highcharts.SeriesOptionsType[] = []
      var earnings: Highcharts.SeriesOptionsType[] = []
      var catgs = []
      // @ts-ignore
      for (var i=0; i<res["recs"].length; i++) {
        // @ts-ignore
        actual.push(res["earnings"][i]["actual"])
        // @ts-ignore
        earnings.push(res["earnings"][i]["estimate"])
        // @ts-ignore
        catgs.push(res["earnings"][i]["period"] + "<br/>Surprise: " + res["earnings"][i]["surprise"])
      }

      this.chartOptions_EPS = {
        chart: {type: 'spline'},
        title: {text: "Historical EPS Surprises"},
        xAxis: {categories: catgs},
        yAxis: {title: {text: 'Quarterly EPS'}},
        series: [{
          name: "Actual",
          // @ts-ignore
          data: actual
        }, {
          name: "Estimate",
          // @ts-ignore
          data: earnings
        }],
      }
    })

  }

  buySellNotification(sORb: string) : void {
    this.soldorbought = sORb;
      this.notification_present = true;
      setTimeout(()=> this.notification_present = false,10000); // hide the alert after 2.5s

  }

  createFBPost(){
    var s = 'script'
    var id = 'facebook-jssdk'
    var d = document
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    // @ts-ignore
    js.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0";
    // @ts-ignore
    fjs.parentNode.insertBefore(js, fjs);
  }

}

function rdToTwo(given: number){
  return (Math.round(given * 100) / 100)
}

function fmtDate(given: number){
  var dateForm = new Date(given * 1000);
  return dateForm.getFullYear() + "-" + String(dateForm.getMonth() + 1 ).padStart(2, '0') + "-" + String(dateForm.getDate()).padStart(2, '0') + " " + String(dateForm.getHours()).padStart(2, '0') + ":" + String(dateForm.getMinutes()).padStart(2, '0') + ":" + String(dateForm.getSeconds()).padStart(2, '0');
}
