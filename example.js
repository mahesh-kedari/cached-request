var request = require("./index");
/*request
  .get('http://www.google.com/favicon.ico')
  .on('response', function(response) {
    console.log(response.statusCode) // 200
    request.get('http://www.google.com/favicon.ico')
    .on('response', function(){
       console.log("New Status Code is"+response.statusCode); 
    });
  });*/
  
  
  
  request('http://www.google.com/favicon.ico', function (error, response, body) {
  if (!error && response.statusCode == 200) {
     request('http://www.google.com/favicon.ico', function (er, res, b) {
        console.log("Status Code is : "+res.statusCode); 
     });
  }
})