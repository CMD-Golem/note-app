import { connectLambda, getStore } from "@netlify/blobs";
import crypto from "crypto";

exports.handler = async (event) => {
	connectLambda(event);

	// check user
	var {user, secret, device_id, request_data} = JSON.parse(event.body);
	var response_data = {};

	if (user == "files") {
		// request_data.iv = null; // gets sent along and is in qrcode
		user_data.encryption_key = null; // defined somewhere for anyone
		// request_data.encrypted = true;
		// request_data.paths = null; // generate random number
	}
	else {
		// get user data
		var user_data = await getStore(user).get("user.json", {type:"json", consistency:"strong"});
		if (user_data == null) return {
			statusCode: 404,
			body: "This user doesn't exitsts"
		};

		var index = user_data.devices.findIndex(obj => obj.id == device_id && obj.secret == secret);
		// return error when device id doesnt match secret
		if (index == -1) {
			user_data.devices = [];
			var response = await getStore(user).setJSON("user.json", user_data);

			var devices = [];
			for (var i = 0; i < user_data.devices.length; i++) {
				devices.push({
					id: user_data.devices[i].id.slice(0,10),
					secret: user_data.devices[i].secret.slice(0,10)
				});
			}

			console.log(devices);
			console.log(device_id.slice(0,10), secret.slice(0,10));

			return {
				statusCode: 406,
				body: "Stored authentication mismatched, new login now required"
			}
		}
		// create new secret if it is time
		// else if (user_data.timestamp) {
		// 	var new_secret = crypto.randomBytes(32).toString("hex");
		// 	user_data.devices[index].secret = new_secret;

		// 	var response = await getStore(user).setJSON("user.json", user_data);

		// 	response_data.secret = new_secret;
		// }
	}

	if (request_data.encrypted) {
		// get encryption_key
		var encryption_key = await crypto.webcrypto.subtle.importKey("jwk", user_data.encryption_key, {name: 'AES-GCM'}, true, ['encrypt', 'decrypt']);

		// get iv from string
		var encoder = new TextEncoder();
		var hash_buffer = await crypto.subtle.digest("SHA-256", encoder.encode(request_data.iv));
		var iv_key = new Uint8Array(hash_buffer).slice(0, 12);
	}
	
	// decrypt and get data
	if (event.httpMethod == "POST") {
		response_data.arrays = [];
		for (var i = 0; i < request_data.paths.length; i++) {
			var buffer = await getStore(user).get(request_data.paths[i], {type:"arrayBuffer", consistency:"strong"});
			if (request_data.encrypted) var decrypted_buffer = await crypto.webcrypto.subtle.decrypt( {name: "AES-GCM", iv: iv_key}, encryption_key, buffer );
			else var decrypted_buffer = buffer;

			var data_array = Array.from(new Uint8Array(decrypted_buffer));
			response_data.arrays.push(data_array);
		}
	}
	// encrypt and upload data
	else if (event.httpMethod == "PUT") {
		response_data.responses = [];
		for (var i = 0; i < request_data.arrays.length; i++) {
			var buffer = new Uint8Array(request_data.arrays[i]).buffer;
			if (request_data.encrypted) var encrypted_buffer = await crypto.webcrypto.subtle.encrypt( {name: "AES-GCM", iv: iv_key}, encryption_key, buffer );
			else var encrypted_buffer = buffer;

			var response = await getStore(user).set(request_data.paths[i], encrypted_buffer);
			response_data.responses.push(response);
		}
	}
	// delete data
	else if (event.httpMethod == "DELETE") {
		response_data.responses = [];
		for (var i = 0; i < request_data.paths.length; i++) {
			var response = await getStore(user).delete(request_data.paths[i]);
			response_data.responses.push(response);
		}
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