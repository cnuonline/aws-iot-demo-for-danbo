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

var chart; 
var counter = 0;

var thingid = getParameterByName('thingid');

currentTemperatureCelsius = 0;
currentHumidity = 0;
function returnCurrentHumidity() {
	return currentHumidity;
}
function returnCurrentTemperatureCelsius() {
	var db = new AWS.DynamoDB();
    db.query({
        TableName : 'IoTDemo',
		AttributesToGet : ['payload'],
        Limit : 1,
	ScanIndexForward: false,
	KeyConditions: {
		'thingid': {
			ComparisonOperator: 'EQ',
			AttributeValueList: [ { S: thingid } ]
        	},
	}
    }, function(err, data) {
        if (err) { console.log(err); return; }
        for (var ii in data.Items) {        	
			ii = data.Items[ii];
		    currentHumidity = parseInt(ii.payload.M.humidity.S);
		    currentTemperatureCelsius = parseInt(ii.payload.M.temperature.S);
        }
    });

	return currentTemperatureCelsius;
} 

function firstTime() {
	var initialPoints = [];
	var db = new AWS.DynamoDB();
   	db.query({
        TableName : 'IoTDemo',
		AttributesToGet : ['payload'],
       	Limit : 10,
		ScanIndexForward: false,
		KeyConditions: {
			'thingid': {
				ComparisonOperator: 'EQ',
				AttributeValueList: [ { S: thingid } ]
       		},
		}
    }, function(err, data) {
    	if (err) { console.log(err); return; }
        for (var ii in data.Items) {
        	ii = data.Items[ii];
    	    currentHumidity = parseInt(ii.payload.M.humidity.S);
    	    currentTemperatureCelsius = parseInt(ii.payload.M.temperature.S);
			initialPoints.push({
            	counter: counter,
            	temperature: currentTemperatureCelsius,
            	humidity: currentHumidity
           	});
			counter = counter + 1;
		}
        
    	if (initialPoints==0) {
    		for (i=0;i<10;i++) {
    			initialPoints.push({
                	counter: counter,
                	temperature: 0,
                	humidity: 0
               	});
    			counter = counter + 1;
    		}    		
    	} else {
    		for (i=initialPoints.length;i<10;i++) {
    			initialPoints.push({
                	counter: counter,
                	temperature: 0,
                	humidity: 0
               	});
    			counter = counter + 1;
    		}
    	}
        
    	chart = c3.generate({
    		data: {
    			json: initialPoints,
    	        keys: {
    	            x: 'counter',
    	            value: ['temperature', 'humidity']
    	        },
    			type: 'spline'
    		},
    	    axis : {
    	    	y: {
    	    		min: 10,
    	    		max: 90
    	    	},
    	        x: {
    	            type : 'timeseries',
    	            tick: {
    	                fit: true
    	            }
    			}
    	    }
    	});
    });

	return initialPoints;
} 

firstTime(); 

window.setInterval(function(){
	chart.flow({
    	columns: [
       		["counter", counter],
        	["temperature", returnCurrentTemperatureCelsius()],
        	["humidity", returnCurrentHumidity()],
    	],
  		length: 1
	});
	counter++;
}, 1000);
	
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}