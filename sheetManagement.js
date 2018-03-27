const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const urlshortener = google.urlshortener('v1');
const readline = require('readline');

var SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
var TOKEN = "./token.json";

var promise = new Promise(function(resolve, reject) {
  fs.readFile('./client_secret.json', 'utf8', function(err, content) {
    if(err) {
      reject(err);
    }
    resolve(JSON.parse(content));
  });
}).then(function(metadata) {
  // console.log(metadata);
  let client_id = metadata.installed.client_id;
  let project_id = metadata.installed.project_id;
  let auth_uri = metadata.installed.auth_uri;
  let token_uri = metadata.installed.token_uri;
  let auth_privider_x509_cert_url = metadata.installed.auth_provider_x509_cert_url;
  let client_secret = metadata.installed.client_secret;
  let redirect_uris = metadata.installed.redirect_uris;
  let auth = new googleAuth();
  let oauth2Client = new auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if(!fs.existsSync(TOKEN)) {
    let SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    let authUrl = oauth2Client.generateAuthUrl({
      access_types: 'offline',
      scope: SCOPES
    });

    console.log("Please redirect to this link to retrive code:", authUrl);
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("Input code:", function(code) {
      rl.close();
      oauth2Client.getToken(code, function(err, tokens) {
        if(err) throw err;
        fs.writeFile(TOKEN, JSON.stringify(tokens), function(err) {
          if(err) throw err;
          console.log("The token has been saved!");
        });
      });
    });
  }

  fs.readFile(TOKEN, 'utf8', function(err, token) {
    // console.log(content);
    if(err) throw err;
    oauth2Client.credentials = JSON.parse(token);
    var sheets = google.sheets('v4');

    sheets.spreadsheets.values.get({
      auth: oauth2Client,
      spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      range: 'Class Data!A1:F' //<tab>!<range>
    }, function(err, response) {
      if(err) throw err;
      var rows = response.values;
      if(rows.length == 0) {
        console.log("No data found.");
      } else {
        for(let i=0;i< rows.length;i++) {
          let row = rows[i];
          console.log(`${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}, ${row[5]}`);
        }
      }
    });
  });
}).catch(function(reason) {
  console.log(reason);
});
