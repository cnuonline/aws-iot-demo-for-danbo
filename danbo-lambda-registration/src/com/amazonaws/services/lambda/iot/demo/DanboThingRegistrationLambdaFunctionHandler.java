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

package com.amazonaws.services.lambda.iot.demo;

import com.amazonaws.services.iot.AWSIotClient;
import com.amazonaws.services.iot.model.CreateThingRequest;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

public class DanboThingRegistrationLambdaFunctionHandler implements
		RequestHandler<DanboRegistrationPojo, Object> {

	@Override
	public Object handleRequest(DanboRegistrationPojo input, Context context) {
		context.getLogger().log("Input: " + input);

		// uses the AWS IoT Java SDK to register the thing (creates a new thing)
		AWSIotClient iotClient = new AWSIotClient();
		context.getLogger().log("Registering Thing: " + input.getThingName());
		CreateThingRequest ctr = new CreateThingRequest();
		ctr.setThingName(input.getThingName());
		iotClient.createThing(ctr);
		context.getLogger().log(input.getThingName() + " registered");

		return null;
	}

}
