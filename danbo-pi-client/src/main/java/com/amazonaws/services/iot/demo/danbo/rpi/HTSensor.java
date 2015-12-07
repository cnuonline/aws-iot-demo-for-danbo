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

import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import se.hirt.w1.Sensor;
import se.hirt.w1.Sensors;

/**
 * This class encapsulates the calls to the java library that reads data from
 * the DHT11 temperature and humidity sensor.
 * 
 * @author Fabio Silva (silfabio@amazon.com)
 */
public class HTSensor implements Runnable {
	private static Log log = LogFactory.getLog(HTSensor.class);
	private String threadName = "";

	HTSensor(String threadName) {
		this.threadName = threadName;
	}

	public void run() {
		try {
			log.debug("starting execution of thread: " + threadName);
			Set<Sensor> sensors = Sensors.getSensors();
			log.debug("sensors: " + sensors.size());

			while (true) {
				log.debug(String.format("Found %d sensors!", sensors.size()));
				while (true) {
					for (Sensor sensor : sensors) {
						log.debug(sensor.getPhysicalQuantity() + ": "
								+ sensor.getValue());
					}
					Thread.sleep(2000);
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			log.debug("finishing execution of thread: " + threadName);
		}
	}
}