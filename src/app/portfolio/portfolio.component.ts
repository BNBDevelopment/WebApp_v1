import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {


  constructor(private http: HttpClient) { }
  pf_container = []
  display_error = false

  owned = {}
  owned_qty = {}
  money = 0;

  //Buying and Selling Modal
  is_buyable_amt = 'no'
  is_sellable_amt = 'no'
  num_shares = 0
  calculated_total = 0
  close = 0
  ticker = ""
  notification_present = false;
  soldorbought = " Bought "
  cur_qty = 0;

  ngOnInit(): void {
    // @ts-ignore
    this.owned = JSON.parse(window.localStorage.getItem("owned"));
    // @ts-ignore
    this.money = rdToTwo(JSON.parse(window.localStorage.getItem("money")));

    if (Object.keys(this.owned).length == 0) {
      this.display_error = true;
    } else {
      this.display_error = false;

      for (var i = 0; i < Object.keys(this.owned).length; i++) {
        // @ts-ignore
        this.http.get("server/wlprice/" +  Object.keys(this.owned)[i]).subscribe(function(i, res) {

          var pf_item = {}
          // @ts-ignore
          pf_item["ticker"] = Object.keys(this.owned)[i]
          // @ts-ignore
          pf_item["compName"] = Object.values(this.owned)[i]
          // @ts-ignore
          pf_item["cur_price"] = rdToTwo(res[pf_item["ticker"]]["c"])


          var tot_cost = 0;
          var tot_qty_owned = 0;

          // @ts-ignore
          for(var p_idx=0; p_idx<Object.keys(this.owned[pf_item["ticker"]]).length; p_idx++){
            // @ts-ignore
            var purchase = this.owned[pf_item["ticker"]][p_idx]
            tot_qty_owned = tot_qty_owned + purchase["shares"]
            tot_cost = tot_cost + purchase["total_val"]
          }

          // @ts-ignore
          pf_item["quantity_owned"] = tot_qty_owned;
          // @ts-ignore
          pf_item["avg_cost_share"] = rdToTwo(tot_cost / tot_qty_owned);
          // @ts-ignore
          pf_item["total_cost"] = rdToTwo(tot_cost);
          // @ts-ignore
          pf_item["mkt_val"] = rdToTwo(tot_qty_owned * pf_item["cur_price"]);

          // @ts-ignore
          pf_item["change"] = rdToTwo(pf_item["avg_cost_share"] - pf_item["cur_price"])

          // @ts-ignore
          if(pf_item["avg_cost_share"] - pf_item["cur_price"] < 0){
            // @ts-ignore
            pf_item["color"] = "red"
            // @ts-ignore
          } else if(pf_item["avg_cost_share"] - pf_item["cur_price"] == 0){
            // @ts-ignore
            pf_item["color"] = "black"
          }else {
            // @ts-ignore
            pf_item["color"] = "green"
          }

            // @ts-ignore
          this.pf_container.push(pf_item);
          // @ts-ignore
          this.updateAllOwnedQty()

        }.bind(this, i));
      }

    }


  }

  updateBuy(ticker: string, close: number){
    this.ticker = ticker;
    this.close = close;
    // @ts-ignore
    this.cur_qty = this.owned_qty[ticker]

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
    money = money - rdToTwo(this.calculated_total);

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
    this.money = rdToTwo(money);
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
        // @ts-ignore
        for (var i = 0; i < this.pf_container.length; i++) {
          // @ts-ignore
          if(ticker.toUpperCase() == this.pf_container[i]["ticker"].toUpperCase()){
            this.pf_container.splice(i, 1);
            // @ts-ignore
          }
        }
        if(this.pf_container.length ==0){
          this.display_error = true
        }
      } else {

        for (var j = 0; j < Object.keys(this.pf_container).length; j++) {
          if (this.pf_container[j]['ticker'] == ticker) {
            // @ts-ignore
            this.pf_container[j]['quantity_owned'] = tot_qty_owned

            var tot_cost = 0;
            var tot_qty_owned = 0;
            // @ts-ignore
            for (var p_idx = 0; p_idx < Object.keys(this.owned[ticker]).length; p_idx++) {
              // @ts-ignore
              var purchase = this.owned[ticker][p_idx]
              tot_qty_owned = tot_qty_owned + purchase["shares"]
              tot_cost = tot_cost + purchase["total_val"]
            }
            // @ts-ignore
            this.pf_container[j]["avg_cost_share"] = rdToTwo(tot_cost / tot_qty_owned);
            // @ts-ignore
            this.pf_container[j]["total_cost"] = rdToTwo(tot_cost);

          }
        }
      }



    }
  }

  updateSell(ticker: string, close: number){
    this.ticker = ticker;
    this.close = close;
    // @ts-ignore
    this.cur_qty = this.owned_qty[ticker]

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
    money = money + rdToTwo(this.calculated_total);

    // @ts-ignore
    owned[this.ticker.toUpperCase()][Object.keys(owned[this.ticker.toUpperCase()]).length] = {"shares": parseFloat(-this.num_shares), "total_val": parseFloat(this.calculated_total)};

    window.localStorage.setItem("money", JSON.stringify(money));
    window.localStorage.setItem("owned", JSON.stringify(owned));
    this.owned = owned
    this.money = rdToTwo(money);
    this.updateAllOwnedQty()
    this.buySellNotification(" sold ");

    //Reset
    this.is_sellable_amt = 'no';
    this.num_shares = 0;
  }

  buySellNotification(sORb: string) : void {
    this.soldorbought = sORb;
      this.notification_present = true;
      setTimeout(()=> this.notification_present = false,10000); // hide the alert after 2.5s
  }
}

function rdToTwo(given: number){
  return (Math.round(given * 100) / 100)
}

function fmtDate(given: number){
  var dateForm = new Date(given * 1000);
  return dateForm.getFullYear() + "-" + String(dateForm.getMonth() + 1 ).padStart(2, '0') + "-" + String(dateForm.getDate()).padStart(2, '0') + " " + String(dateForm.getHours()).padStart(2, '0') + ":" + String(dateForm.getMinutes()).padStart(2, '0') + ":" + String(dateForm.getSeconds()).padStart(2, '0');
}
