var http = require('http');
var port = process.env.PORT || 8000;
const request = require('request');

var express = require('express');
var app = express();

app.use('./config.js');

//crolling
const axios = require("axios");
const cheerio = require("cheerio");

var url = "https://flood-warning-information.service.gov.uk/warnings?location="

const getHtml = async()=>{
    try{
        return await axios.get(url);
    }catch(error){
        console.error(error);
    }
}
app.get('/', function (req, res) {
    res.json({'hid':0})
});

//twilio
var accountSid = ACCOUNT_SID; // Your Account SID from www.twilio.com/console
var authToken = AUTH_TOK;   // Your Auth Token from www.twilio.com/console
const client = require('twilio')(accountSid, authToken);

app.get('/call', function(req, res){
    client.messages
    .create({
        body: 'I\'m in emergency...!',
        from: PHONE_NO,
        to: PHONE_DES
    })
    .then(message => res.end("Message Sent! ID: " + message.sid))
})

app.get('/get_flood', function(req, res){

    let loc = req.query.location

    url+= loc;

    getHtml()
  .then(html => {
    let ulList = [];
    const $ = cheerio.load(html.data);
    const $bodyList = $(".accordion").children(".subsection");

    $bodyList.each(function(i, elem) {
        p = $(this).find('.notice').text().split('\n');
        loc = $(this).find('.list-warnings').find('span').text();
        ulList[i] = {
            warn: $(this).find('.bold-medium').text(),
            num: parseInt(p[4]),
            loc: loc
        };
    });

    const data = ulList.filter(n => n.loc);
    var max = -100;
    var maxStatus = 'nolonger'
    for(i=0;i<data.length;i++){
        data[i].num
        if(max < data[i].num){
            max = data[i].num;
            maxStatus = data[i].warn;
        }
    }
    var status = "GREEN";
    if(maxStatus == "Flood warnings" && maxStatus == "Severe flood warnings"){
        status = "RED";
    }
    else if(maxStatus == "Flood alerts"){
        status = "YELLOW";
    }

    var sendData = {
        disaster : 'Flood',
        status : status,
        dataset : data
    }

    res.json(sendData);
    //return data;
  })
  .then(r => res.json(r));
})

app.get('/get_warn', function (req, res) {
    // let lati = req.query('latitude')
    // let long = req.query('longitude')
    let lati = req.query.latitude
    let long = req.query.longitude

    var latLng = {lat: lati, lng: long}
    var uri_v = "https://maps.googleapis.com/maps/api/geocode/json?address='London'"
    request.get({
        url: uri_v,
        json: true,
        method: 'GET',
        qs: {
            'key':'AIzaSyBb9lPPXqe2FIdN-G153zPqxMPvhvfOYMI',
            'location': latLng,
            'address' : 'London'
        },
        rejectUnauthorized: false
    }, (err, res1, data) => {
        if (err) {
            console.log('Error:', err);
        } else if (res1.statusCode == 200) {
            console.log(data)
        }
        else{
            console.log(res1.statusCode);
        }
    });
getHtml()
  .then(html => {
    let ulList = [];
    const $ = cheerio.load(html.data);
    const $bodyList = $(".accordion").children(".subsection");

    $bodyList.each(function(i, elem) {
        p = $(this).find('.notice').text().split('\n');
        loc = $(this).find('.list-warnings').find('span').text();
        
        ulList[i] = {
            warn: $(this).find('.bold-medium').text(),
            loc: loc
        };
    });

    const data = ulList.filter(n => n.loc);
    res.json(data);
    //return data;
  })
  .then(res => res.json(res));
});
http.createServer(app).listen(port);