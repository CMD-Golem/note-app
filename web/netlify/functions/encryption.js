import { connectLambda, getStore } from "@netlify/blobs";
import crypto from "crypto";

exports.handler = async (event) => {
	connectLambda(event);

	// check user
	var {user, secret, device_id, request_data} = JSON.parse(event.body);

	// get user data
	var user_data = await getStore(user).get("user.json", {type:"json"});
	console.log(user_data);
	if (user_data == null) return {
		statusCode: 404,
		body: "This user doesn't exitsts"
	}

	var response_data = {};
	var index = user_data.devices.findIndex(obj => obj.id == device_id && obj.secret == secret);
	// return error when device id doesnt match secret
	if (index == -1) {
		user_data.devices = [];
		user_data.info = "Your cookies"
		var response = await getStore(user).setJSON("user.json", JSON.stringify(user_data));
		console.log(response);

		return {
			statusCode: 406,
			body: "Stored authentication mismatched, new login now required"
		}
	}
	// create new secret if it is time
	// else if (user_data.timestamp) {
	// 	var new_secret = crypto.randomBytes(32);
	// 	user_data.devices[index].secret = new_secret;

	// 	var response = await getStore(user).setJSON("user.json", JSON.stringify(user_data));

	// 	response_data.secret = new_secret;
	// }
	

	// decrypt and get data
	if (event.httpMethod == "POST") {
		var buffer = await getStore(user).get(request_data.path, {type:"arrayBuffer"});
		if (request_data.encrypted) var decrypted_buffer = await crypto.webcrypto.subtle.decrypt( {name: "AES-GCM", iv: request_data.iv}, user_data.encryption_key, buffer );
		else var decrypted_buffer = buffer;

		var data_array = Array.from(new Uint8Array(decrypted_buffer));
		response_data.array = data_array;
	}
	// encrypt and upload data
	else if (event.httpMethod == "PUT") {
		var buffer = new Uint8Array(request_data.array).buffer;
		if (request_data.encrypted) var encrypted_buffer = await crypto.webcrypto.subtle.encrypt( {name: "AES-GCM", iv: request_data.iv}, user_data.encryption_key, buffer );
		else var encrypted_buffer = buffer;

		var response = await getStore(user).set(request_data.path, encrypted_buffer);
		response_data.response = response;
	}
	// delete data
	else if (event.httpMethod == "DELETE") {
		var response = await getStore(user).delete(request_data.path);
		response_data.response = response;
	}
	// unknown http methode
	else {
		return {
			statusCode: 405,
			body: "Method Not Allowed"
		};
	}

	// return data with status 200
	return {
		statusCode: 200,
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(response_data)
	}
};