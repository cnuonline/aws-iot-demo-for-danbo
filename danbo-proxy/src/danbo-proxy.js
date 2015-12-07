/*
	Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

	Licensed under the Apache License, Version 2.0 (the "License"). You may not 
	use this file except in compliance with the License. A copy of the License is 
	located at

    	http://aws.amazon.com/apache2.0/

	or in the "license" file accompanying this file. This file is distributed on an 
	"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or 
	implied. See the License for the specific language governing permissions and 
	limitations under the License.
 */

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mqtt = require('mqtt');
var fs = require('fs');


var KEY = '<PATH_TO_PRIVATE_KEY>-private.pem.key (i.e /Users/silfabio/danbo-proxy/certs/XXXXXXXXXX-private.pem.key)';
var CERT = '<PATH_TO_CERTIFICATE>-certificate.pem.crt (i.e /Users/silfabio/danbo-proxy/certs/XXXXXXXXXX-certificate.pem.crt)';

var options = {
  key: fs.readFileSync(KEY),
  cert: fs.readFileSync(CERT),
  rejectUnauthorized : true,
  port: 8883
};

app.use(express.static('<PATH_TO_SRC>/danbo-dashboard/WebContent/ (i.e /Users/silfabio/aws-iot-demo-for-danbo/danbo-dashboard/WebContent/)'));

var client = mqtt.connect('mqtts://<YOUR_AWS_IOT_ENDPOINT_ID> (i.e. mqtts://XXXXXXXXXXXXX.iot.us-east-1.amazonaws.com)', options);

io.on('connection', function(socket){
  console.log('[socketio] a user connected');
  socket.on('disconnect', function(){
    console.log('[socketio] user disconnected');
  });

  socket.on('register', function(msg){
    var topic = '$aws/things/' + msg + '/shadow/update/accepted';
    console.log('[socketio] registering: ' + msg);
    console.log('[socketio] subscribing to: ' + topic);
    client.subscribe(topic);
  });

  socket.on('deregister', function(msg){
    var topic = '$aws/things/' + msg + '/shadow/update/accepted';
    console.log('[socketio] deregistering: ' + msg);
    console.log('[socketio] unsubscribing from: ' + topic);
    client.subscribe(topic);
  });

  socket.on('movehead', function(msg){
    console.log('[socketio] movehead: ' + msg);
    var angle = msg.substring(msg.lastIndexOf('_')+1, msg.length);
    var thing = msg.substring(0, msg.lastIndexOf('_'));
    console.log('angle: ' + angle);
    console.log('thing: ' + thing);
    
    var statusMessage = '{"state":{"desired":{"head":"movehead_' + angle + '"}}}';

    var topic='$aws/things/' + thing + '/shadow/update';
    console.log("publishing " + statusMessage + " on " + topic);
    client.publish(topic, statusMessage);
  });

  socket.on('blinkeyes', function(msg){
    console.log('[socketio] blinkeyes: ' + msg);
    var colors = msg.substring(msg.lastIndexOf('_')+1, msg.length);
    var thing = msg.substring(0, msg.lastIndexOf('_'));
    console.log('colors: ' + colors);
    console.log('thing: ' + thing);
    
    var statusMessage = '{"state":{"desired":{"eyes":"blinkeyes_' + colors + '"}}}';

    var topic='$aws/things/' + thing + '/shadow/update';
    console.log("publishing " + statusMessage + " on " + topic);
    client.publish(topic, statusMessage);
  });

  socket.on('playtune', function(msg){
    console.log('[socketio] playtune: ' + msg);
    var tune = msg.substring(msg.lastIndexOf('_')+1, msg.length);
    var thing = msg.substring(0, msg.lastIndexOf('_'));
    console.log('tune: ' + tune);
    console.log('thing: ' + thing);
    
    var statusMessage = '{"state":{"desired":{"mouth":"playtune_' + tune + '"}}}';

    var topic='$aws/things/' + thing + '/shadow/update';
    console.log("publishing " + statusMessage + " on " + topic);
    client.publish(topic, statusMessage);
  });
});

client.on('connect', function() {
	console.log('[mqtt] connected');
});

client.on('message', function(topic, message) {
  console.log('[mqtt] new message: ' + topic + ":" + message.toString());
  io.emit('event', message.toString());
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});
