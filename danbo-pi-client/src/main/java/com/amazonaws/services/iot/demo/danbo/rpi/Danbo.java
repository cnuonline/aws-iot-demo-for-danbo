/** 
 * Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use 
 * this file except in compliance with the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations under the License.
 */

package com.amazonaws.services.iot.demo.danbo.rpi;

/**
 * Main Class that implements the client behavior of the Danbo in a Raspberry Pi.
 *
 * @author  Fabio Silva (silfabio@amazon.com)
 */

import java.awt.Color;
import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Properties;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.eclipse.paho.client.mqttv3.MqttException;

import se.hirt.w1.Sensor;
import se.hirt.w1.Sensors;

import com.amazonaws.services.iot.demo.danbo.rpi.mqtt.MQTTPublisher;
import com.amazonaws.services.iot.demo.danbo.rpi.mqtt.MQTTSubscriber;
import com.amazonaws.services.iot.demo.danbo.rpi.shadow.ControllerShadow;
import com.amazonaws.services.iot.demo.danbo.rpi.shadow.DanboShadow;
import com.amazonaws.services.iot.demo.danbo.rpi.shadow.DanboShadowDeltaCallback;
import com.amazonaws.services.iot.demo.danbo.rpi.shadow.DanboShadowRejectedCallback;
import com.google.gson.Gson;

public class Danbo {

	// pin layout used by the RGB LEDs (eyes)
	public static final PinLayout pinLayout1 = new PinLayout(2, 3, 14);
	public static final PinLayout pinLayout2 = new PinLayout(10, 9, 11);

	private static String endpoint = " "; // awsiot.endpoint
	private static String rootCA = ""; // awsiot.rootCA
	private static String privateKey = ""; // awsiot.privateKey
	private static String certificate = ""; // awsiot.certificate

	private static Log log = LogFactory.getLog(Danbo.class);
	private static Gson gson = new Gson();
	private static int qos = 1;
	private static int port = 8883;
	private static boolean cleanSession = true;
	private static String clientId = "Danbo";
	private static String protocol = "ssl://";
	private static String url = "";

	private static String controllerUpdateTopic = "";
	private static String updateTopic = "";
	private static String deltaTopic = "";
	private static String rejectedTopic = "";

	private static Random rand = new Random();

	public static void main(String[] args) throws Exception {
		log.debug("starting");

		// uses pin 6 for the red Led
		final Led redLed = new Led(6);
		// uses pin 26 for the green Led
		final Led greenLed = new Led(26);

		// turns the red led on initially
		redLed.on();

		// turns the green led off initially
		greenLed.off();

		// loads properties from danbo.properties file - make sure this file is
		// available on the pi's home directory
		InputStream input = new FileInputStream("/home/pi/danbo/danbo.properties");
		Properties properties = new Properties();
		properties.load(input);
		endpoint = properties.getProperty("awsiot.endpoint");
		rootCA = properties.getProperty("awsiot.rootCA");
		privateKey = properties.getProperty("awsiot.privateKey");
		certificate = properties.getProperty("awsiot.certificate");
		url = protocol + endpoint + ":" + port;

		log.debug("properties loaded");

		// turns off both eyes
		RGBLed rgbLed = new RGBLed("RGBLed1", Danbo.pinLayout1,
				Danbo.pinLayout2, new Color(0, 0, 0), new Color(0, 0, 0), 0,
				100);
		new Thread(rgbLed).start();

		// resets servo to initial positon
		Servo servo = new Servo("Servo", 1);
		new Thread(servo).start();

		// gets the Pi serial number and uses it as part of the thing
		// registration name
		clientId = clientId + getSerialNumber();

		// AWS IoT things shadow topics
		updateTopic = "$aws/things/" + clientId + "/shadow/update";
		deltaTopic = "$aws/things/" + clientId + "/shadow/update/delta";
		rejectedTopic = "$aws/things/" + clientId + "/shadow/update/rejected";

		// AWS IoT controller things shadow topic (used to register new things)
		controllerUpdateTopic = "$aws/things/Controller/shadow/update";

		// defines an empty danbo shadow POJO
		final DanboShadow danboShadow = new DanboShadow();
		DanboShadow.State state = danboShadow.new State();
		final DanboShadow.State.Reported reported = state.new Reported();
		reported.setEyes("readyToBlink");
		reported.setHead("readyToMove");
		reported.setMouth("readyToSing");
		reported.setName(clientId);
		state.setReported(reported);
		danboShadow.setState(state);

		// defines an empty controller shadow POJO
		final ControllerShadow controllerShadow = new ControllerShadow();
		ControllerShadow.State controllerState = controllerShadow.new State();
		final ControllerShadow.State.Reported controllerReported = controllerState.new Reported();
		controllerReported.setThingName(clientId);
		controllerState.setReported(controllerReported);
		controllerShadow.setState(controllerState);

		try {
			log.debug("registering");

			// registers the thing (creates a new thing) by updating the
			// controller
			String message = gson.toJson(controllerShadow);
			MQTTPublisher controllerUpdatePublisher = new MQTTPublisher(
					controllerUpdateTopic, qos, message, url, clientId
							+ "-controllerupdate" + rand.nextInt(100000),
					cleanSession, rootCA, privateKey, certificate);
			new Thread(controllerUpdatePublisher).start();

			log.debug("registered");

			// clears the thing status (in case the thing already existed)
			Danbo.deleteStatus("initialDelete");

			// creates an MQTT subscriber to the things shadow delta topic
			// (command execution notification)
			MQTTSubscriber deltaSubscriber = new MQTTSubscriber(
					new DanboShadowDeltaCallback(), deltaTopic, qos, url,
					clientId + "-delta" + rand.nextInt(100000), cleanSession,
					rootCA, privateKey, certificate);
			new Thread(deltaSubscriber).start();

			// creates an MQTT subscriber to the things shadow error topic
			MQTTSubscriber errorSubscriber = new MQTTSubscriber(
					new DanboShadowRejectedCallback(), rejectedTopic, qos, url,
					clientId + "-rejected" + rand.nextInt(100000),
					cleanSession, rootCA, privateKey, certificate);
			new Thread(errorSubscriber).start();

			// turns the red LED off
			redLed.off();

			ScheduledExecutorService exec = Executors
					.newSingleThreadScheduledExecutor();
			exec.scheduleAtFixedRate(new Runnable() {
				@Override
				public void run() {
					// turns the green LED on
					greenLed.on();

					log.debug("running publish state thread");

					int temp = -300;
					int humid = -300;

					reported.setTemperature(new Integer(temp).toString());
					reported.setHumidity(new Integer(humid).toString());

					try {
						// reads the temperature and humidity data
						Set<Sensor> sensors = Sensors.getSensors();
						log.debug(sensors.size());

						for (Sensor sensor : sensors) {
							log.debug(sensor.getPhysicalQuantity());
							log.debug(sensor.getValue());
							if (sensor.getPhysicalQuantity().toString()
									.equals("Temperature")) {
								temp = sensor.getValue().intValue();
							}
							if (sensor.getPhysicalQuantity().toString()
									.equals("Humidity")) {
								humid = sensor.getValue().intValue();
							}
						}

						log.debug("temperature: " + temp);
						log.debug("humidity: " + humid);
						reported.setTemperature(new Integer(temp).toString());
						reported.setHumidity(new Integer(humid).toString());
					} catch (Exception e) {
						log.error("an error has ocurred: " + e.getMessage());
						e.printStackTrace();
					}

					try {
						// reports current state - last temperature and humidity
						// read
						String message = gson.toJson(danboShadow);
						MQTTPublisher updatePublisher = new MQTTPublisher(
								updateTopic, qos, message, url, clientId
										+ "-update" + rand.nextInt(100000),
								cleanSession, rootCA, privateKey, certificate);
						new Thread(updatePublisher).start();
					} catch (Exception e) {
						log.error("an error has ocurred: " + e.getMessage());
						e.printStackTrace();
					}

					// turns the green LED off
					greenLed.off();
				}
			}, 0, 5, TimeUnit.SECONDS); // runs this thread every 5 seconds,
										// with an initial delay of 5 seconds
		} catch (MqttException me) {
			// Display full details of any exception that occurs
			log.error("reason " + me.getReasonCode());
			log.error("msg " + me.getMessage());
			log.error("loc " + me.getLocalizedMessage());
			log.error("cause " + me.getCause());
			log.error("excep " + me);
			me.printStackTrace();
		} catch (Throwable th) {
			log.error("msg " + th.getMessage());
			log.error("loc " + th.getLocalizedMessage());
			log.error("cause " + th.getCause());
			log.error("excep " + th);
			th.printStackTrace();
		}
	}

	// this method returns the Pi serial number
	public static String getSerialNumber() throws Exception {
		Process p = Runtime.getRuntime().exec("cat /proc/cpuinfo");

		BufferedReader stdInput = new BufferedReader(new InputStreamReader(
				p.getInputStream()));

		String s = "";
		String serial = "";

		// read the output from the command
		while ((s = stdInput.readLine()) != null) {
			if (s.contains("Serial")) {
				serial = s.split(":")[1].trim().substring(8, 16);
			}
		}

		return serial;
	}

	// deletes/resets the thing shadow state by publishing a '{"state": null}'
	// json as update for the thing shadow
	public static void deleteStatus(String operation) throws Exception {
		String deleteMessage = "{ \"state\": null }";
		// deletes the thing shadows (in case it existed in the past, this
		// will clear it's state)
		MQTTPublisher deletePublisher = new MQTTPublisher(updateTopic, qos,
				deleteMessage, url,
				clientId + operation + rand.nextInt(100000), cleanSession,
				rootCA, privateKey, certificate);
		new Thread(deletePublisher).start();
	}
}
