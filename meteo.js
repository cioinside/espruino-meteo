const SSID = "";
const PASSWORD = "";
var debug = false;

const CORA = 0.00035;
const CORB = 0.02718;
const CORC = 1.39538;
const CORD = 0.0018;
//CORA * t * t - CORB * t + CORC - (h-33.)*CORD

var sealevel = 99867; // for Your location

I2C1.setup({scl:D5,sda:D4});
var bmp = require("BMP085").connect(I2C1);

var wifi = require("Wifi");
  wifi.stopAP();

var state = [];
state['WiFi'] = 0;

var http = require("http");

var CO2 = 0;
var p = 0;
var p0 = 101325;
var t = 0;
var altitude = 0;
var page = "";
var delta = "";

function onPageRequest(req, res) {
  var a = url.parse(req.url, true);
  if (a.pathname == "/t") {
    res.writeHead(t, {'Content-Type': 'text/html'});
    page = t; 
  } else if (a.pathname == "/p") {
    res.writeHead(p, {'Content-Type': 'text/html'});
    page = p;
  } else if (a.pathname == "/a") {
    res.writeHead(p, {'Content-Type': 'text/html'});
    page = altitude;
  } else if (a.pathname == "/co2") {
    res.writeHead(CO2, {'Content-Type': 'text/html'});
    page = CO2;
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    var page = "ok";
  }
   res.end(page);
}

function connect() {
  wifi.connect(SSID, {password: PASSWORD}, function(err){
    if (debug) console.log("connected? err=", err, "info=", wifi.getIP());});
    setTimeout(function(){
      wifi.getIP(function(data){
        if (data.ip == "0.0.0.0") {
          state['WiFi'] = 0;
          connect();
        } else {
          state['WiFi'] = 1;
          require("http").createServer(onPageRequest).listen(80);
        }
      });
    }, 15000);
}

function check_connect() {
  wifi.getStatus(function(data) {
    if (data.station == "connected"){
      state['WiFi'] = 1;
      if (debug) console.log("Wi-Fi ok");
    } else {
      state['WiFi'] = 0;
      if (debug) console.log("Wi-Fi error");
      connect();
    }
  });
}

function onInit() {
  setTimeout(function(){
    connect();
  }, 1000);
  setInterval(function(){
    check_connect();
  }, 60000);
  setInterval(function() {
    bmp.getPressure(function(d) {
    p = d.pressure;
    if (p > p0){
      delta = ">";
    } else if (p < p0) {
      delta = "<";
    } else {
      delta = "";
    }
    t = d.temperature;
    altitude = bmp.getAltitude(p, sealevel);
    CO2 = Math.round(analogRead("A0")*10000)*(CORA * t * t - CORB * t + CORC);
    if (debug) {
      console.log("Temperature: " + t + " C");
      console.log("Pressure: " + p + " Pa " + delta);
      console.log("CO2 "+ CO2);
      console.log("Altitude: " + altitude + " m");
    }
  });
  }, 1000);
}