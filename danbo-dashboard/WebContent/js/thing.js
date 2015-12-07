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

var currentList = [];
var retrievedList = [];

var lambda = new AWS.Lambda();

// connects to the local danbo-proxy
var socket = io('http://localhost:3000');

socket.on('connect to websockets server', function(){
	console.log('connected');
});

socket.on('event', function(data){
	var thing = JSON.parse(data);
	if (thing.state) {
		if (thing.state.reported) {
			var name = thing.state.reported.name;
			var temperature = thing.state.reported.temperature;
			var humidity = thing.state.reported.humidity;
			$("#status_" + name).html("<span style='display:block;margin:0px auto;' class='pulse-green'></span>");
			$("#temperature_" + name).html("<a href='#' onclick=\"javascript:window.open('/chart.html?thingid=" + name + "','Windows','width=650,height=350,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,directories=no,status=no')\">" + temperature + "&nbsp;C</a>");
			$("#humidity_" + name).html("<a href='#' onclick=\"javascript:window.open('/chart.html?thingid=" + name + "','Windows','width=650,height=350,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,directories=no,status=no')\">" + humidity + "&nbsp;%</a>");
			$("#lastcontact_" + name).html(moment().format('MM/DD/YYYY hh:mm:ss'));
			$("#lastcontacthidden_" + name).val("" + moment());
			$("#btn_movehead_" + name).prop('disabled', false);
			$("#btn_blinkeyes_" + name).prop('disabled', false);
			$("#btn_playtune_" + name).prop('disabled', false);
		}
	}
});

socket.on('disconnect', function(){
	console.log('connect to websockets server');
});

function setCurrentList() {
	currentList = [];
	 $("#thingsTable tr").each(function() {
		 if (!(this.id=="header")) {
			 currentList.push(this.id);
		 }
	 });
}

function listThings() {
	setCurrentList();
	
	lambda.invoke({FunctionName: 'DanboThingListThings'}, function(err, data) {
		if (err) console.log(err, err.stack);
		else {
			retrievedList = [];
			$.each($.parseJSON(data.Payload), 
				function() {
					entry = this;
					if (entry.thingName != "Controller") {
						retrievedList.push(entry.thingName);
						$("#noresults").remove();
					    if (currentList.indexOf(entry.thingName) == -1) {
							register(entry.thingName);
						    var row = "<tr id='"+entry.thingName+"'>" +
						    		"<td style='text-align: center'>" +
							    	"<center>" +
						    		"<img src='images/danboard.jpg' width='96px' height='96px'/>" +
						    		"</center>" +
						    		"</td>" +
						    		"<td style='text-align: center'>" +
						    		entry.thingName + 
						    		"</td>" +
						    		"<td id='status_" + entry.thingName + "' style='text-align: center'>" +
							    	"<span style='display:block;margin:0px auto;' class='pulse-red'></span>" +
						    		"</td>" +
						    		"<td id='lastcontact_" + entry.thingName + "' style='text-align: center'>" +
						    		"</td>" +
						    		"<input type='hidden' id='lastcontacthidden_" + entry.thingName + "' value='" +  moment() + "'>" +
						    		"</input>" +
						    		"<td id='temperature_" + entry.thingName + "' style='text-align: center'>" +
						    		"</td>" +
						    		"<td id='humidity_" + entry.thingName + "' style='text-align: center'>" +
						    		"</td>" +
						    		"<td style='text-align: center'>" +
						    		"<button type='button' id='btn_movehead_" + entry.thingName + "' class='btn btn-danger btn-lg btn3d' disabled onclick='moveHead(\"" + entry.thingName + "\");'>Move&nbsp;Head</button>" +
						    		"</td>" +
						    		"<td style='text-align: center'>" +
						    		"<button type='button' id='btn_blinkeyes_" + entry.thingName + "' class='btn btn-success btn-lg btn3d' disabled onclick='blinkEyes(\"" + entry.thingName + "\");'>Blink&nbsp;Eyes</button>" +
						    		"</td>" +
						    		"<td style='text-align: center'>" +
						    		"<button type='button' id='btn_playtune_" + entry.thingName + "' class='btn btn-primary btn-lg btn3d' disabled onclick='playTune(\"" + entry.thingName + "\");'>Play&nbsp;Tune</button>" +
						    		"</td>" +
						    		"</tr>";
					        $("#thingsTable").append(row);
					    }						
					}
			    }
			);
			
			currentList.forEach(function(entry) {
				if (retrievedList.indexOf(entry)==-1) {
					$("#" + entry).remove();
					deregister(entry);
				}
			});
			
			if (retrievedList.length==0) {
			    var row = "<tr id='noresults'>" +
			    "<td colspan='9' style='text-align: center'>" +
			    "<b><font color='red'>No registered things were found</font></b>"
			    "</td>" +
	    		"</tr>";
		        $("#thingsTable").append(row);
			}
			setCurrentList();
			checkStatuses();			
		} 
	});

	window.setTimeout(listThings, 10000);
}

function moveHead(thingName) {
	var $message = $('<div align="center"></div>');
	$message.append('<br>Move the slider <b>left</b> or <b>right</b> to move the head<br/><br/>');
	$message.append('<b>-90 degrees</b>&nbsp;&nbsp;&nbsp;<input id="slider1" data-slider-id="ex1Slider" type="text" data-slider-min="-90" data-slider-max="+90" data-slider-step="1" data-slider-value="1" style="width: 350px"/>&nbsp;&nbsp;&nbsp; <b>+ 90 degrees</b><br><br>');
	
	BootstrapDialog.show({
    	title: 'Move Head',
        message: $message,
        onshown: function(dialogRef){
        	$('#slider1').slider({
        		formatter: function(value) {
        			return value;
        		}
        	});
        	$("#slider1").on("slideStop", function(slideEvt) {
                socket.emit('movehead', thingName + "_" + slideEvt.value);
        	});
        },
        buttons: [
        {
            label: 'Done',
            cssClass: 'primary',
            action: function(dialogItself) {
                dialogItself.close();
            }
        }]
    });
}

function playTune(thingName) {
	var $message = $('<div align="center"></div>');
	$message.append('Choose a tune or type an RTTTL String');
	$message.append('<div class="checkbox" style="text-align:left"><label><input name="tune" id="tune" value="mario" type="radio"/>&nbsp;Super Mario Bros Theme</label></div><div class="checkbox" style="text-align:left"><label><input name="tune" id="tune" value="star" type="radio"/>&nbsp;Star Wars Theme</label></div><div class="checkbox" style="text-align:left"><label><input name="tune" id="tune" value="custom" type="radio"/>&nbsp;<input type="text" placeholder="d=4,o=5,b=180:8f,8f,8f,2a#.,2f.6,8d#6,8d6,8c6,2a#.6,f.6,8d#6,8d6,8c6,2a#.6,f.6,8d#6,8d6,8d#6,2c6,p,8f,8f,8f,2a#.,2f.6,8d#6,8d6,8c6,2a#.6,f.6,8d#6,8d6,8c6,2a#.6,f.6,8d#6,8d6,8d#6,2c6" id="customTune"/></label></div>');
	BootstrapDialog.show({
		size: BootstrapDialog.SIZE_SMALL,
    	title: 'Play Tune',
        message: $message,
        onshown: function(dialogRef){
        	console.log('shown');
        },
        buttons: [
        {
            label: 'Done',
            cssClass: 'primary',
            action: function(dialogItself) {
            	console.log('play tune');
            	var tune = '';
            	if ($('input:radio:checked').val()=='mario') {
            		tune = 'smb:d=4,o=5,b=135:16e6,50p,16e6,28p,8e6,40p,16c6,8e6,8g6,8p,8g,8p,';
            	};
            	
            	if ($('input:radio:checked').val()=='star') {
            		tune = 'StarWars:d=4,o=5,b=45:32p,32f#,32f#,32f#,8b.,8f#.6,32e6,32d#6,32c#6,8b.6,16f#.6,32e6,32d#6,32c#6,8b.6,16f#.6,32e6,32d#6,32e6,8c#.6,32f#,32f#,32f#,8b.,8f#.6,32e6,32d#6,32c#6,8b.6,16f#.6,32e6,32d#6,32c#6,8b.6,16f#.6,32e6,32d#6,32e6,8c#6,';
            	};
            	
            	if ($('input:radio:checked').val()=='custom') {
            		tune = $('#customTune').val() + ",";
            	};

            	socket.emit('playtune', thingName + "_tune|" + tune);
                dialogItself.close();
            }
        }]
    });
}

function blinkEyes(thingName) {
	var $message = $('<div align="center"></div>');
	$message.append('Click on the eyes to choose the color');
	$message.append('<div style="background-image: url(images/danboard-face.jpg); height: 188px; width: 300px; border: 1px solid black;"><input type="hidden" id="hidden-input" class="eye1" value="#000000"><input type="hidden" id="hidden-input" class="eye2" value="#000000"><br><br><br><br><br><br></div>');
	$message.append('<br><b>Slower</b>&nbsp;&nbsp;&nbsp;<input id="slider5" data-slider-id="ex1Slider" type="text" data-slider-min="1" data-slider-max="5" data-slider-step="1" data-slider-value="3" style="width: 150px"/>&nbsp;&nbsp;&nbsp;<b>Faster</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>1&nbsp;time&nbsp;&nbsp;&nbsp;</b><input id="slider6" data-slider-id="ex1Slider" type="text" data-slider-min="1" data-slider-max="10" data-slider-step="1" data-slider-value="5" style="width: 150px"/>&nbsp;&nbsp;&nbsp;<b>10 times</b>');
	BootstrapDialog.show({
    	title: 'Blink Eyes',
        message: $message,
        onshown: function(dialogRef){
        	$('.eye1').minicolors({
                    eye: '1',
                    control: $(this).attr('data-control') || 'hue',
                    defaultValue: $(this).attr('data-defaultValue') || '',
                    format: $(this).attr('data-format') || 'hex',
                    keywords: $(this).attr('data-keywords') || '',
                    inline: $(this).attr('data-inline') === 'true',
                    letterCase: $(this).attr('data-letterCase') || 'lowercase',
                    opacity: $(this).attr('data-opacity'),
                    position: $(this).attr('data-position') || 'bottom left',
                    theme: 'bootstrap'
                });
        	$('.eye2').minicolors({
                eye: '2',
                control: $(this).attr('data-control') || 'hue',
                defaultValue: $(this).attr('data-defaultValue') || '',
                format: $(this).attr('data-format') || 'hex',
                keywords: $(this).attr('data-keywords') || '',
                inline: $(this).attr('data-inline') === 'true',
                letterCase: $(this).attr('data-letterCase') || 'lowercase',
                opacity: $(this).attr('data-opacity'),
                position: $(this).attr('data-position') || 'bottom left',
                theme: 'bootstrap'
            });        
        	$('#slider5').slider({
        		formatter: function(value) {
        			return value;
        		}
        	});
        	$('#slider6').slider({
        		formatter: function(value) {
        			return value;
        		}
        	});
        },
        buttons: [
        {
            label: 'Done',
            cssClass: 'primary',
            action: function(dialogItself) {
            	console.log($('.eye1').minicolors('rgbString'));
            	console.log($('.eye2').minicolors('rgbString'));
                socket.emit('blinkeyes', thingName + "_eye1:" + $('.eye1').minicolors('rgbString') + "|eye2:" + $('.eye2').minicolors('rgbString') + "|repetitions:" + $('#slider6').slider('getValue') + "|speed:" + $('#slider5').slider('getValue'));
                dialogItself.close();
            }
        }]
    });
}

function register(thing) {
	socket.emit('register', thing);
}

function deregister(thing) {
	socket.emit('deregister', thing);
}

function checkStatuses() {
	currentList.forEach(function(entry) {
		var lastContact = $("#lastcontacthidden_" + entry).val();
		var lastContactSeconds = moment.duration(moment() - lastContact).get("seconds");
		if (lastContactSeconds > 5) {
			$("#status_" + entry).html("<span style='display:block;margin:0px auto;' class='pulse-red'></span>");
			$("#btn_movehead_" + entry).prop('disabled', true);
			$("#btn_blinkeyes_" + entry).prop('disabled', true);
			$("#btn_playtune_" + entry).prop('disabled', true);
		}
	});
	setTimeout(checkStatuses, 5000);
}

$(document).ready(function() {
	listThings(); 
});
