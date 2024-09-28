import { connectLambda, getStore } from "@netlify/blobs";
import crypto from "crypto";

async function handleCrypto(user_key, iv) {
	// get encryption_key
	var encryption_key = await crypto.webcrypto.subtle.importKey("jwk", user_key, {name: 'AES-GCM'}, true, ['encrypt', 'decrypt']);

	// get iv from string
	var encoder = new TextEncoder();
	var hash_buffer = await crypto.subtle.digest("SHA-256", encoder.encode(iv));
	var iv_key = new Uint8Array(hash_buffer).slice(0, 12);

	return [encryption_key, iv_key];
}

exports.handler = async (event) => {
	connectLambda(event);

	var {request_data} = JSON.parse(event.body);
	var response_data = {};

	// decrypt and get data
	if (event.httpMethod == "POST") {
		var buffer = await getStore("files").get(request_data.path, {type:"arrayBuffer"});
		if (request_data.encrypted) {
			var [encryption_key, iv_key] = await handleCrypto(user_data.encryption_key, request_data.iv);
			var decrypted_buffer = await crypto.webcrypto.subtle.decrypt( {name: "AES-GCM", iv: iv_key}, encryption_key, buffer );
		}
		else var decrypted_buffer = buffer;

		var data_array = Array.from(new Uint8Array(decrypted_buffer));
		response_data.array = data_array;
	}
	// encrypt and upload data
	else if (event.httpMethod == "PUT") {
		var buffer = new Uint8Array(request_data.array).buffer;
		if (request_data.encrypted) {
			var key = await crypto.webcrypto.subtle.generateKey( {name: "AES-GCM", length: 256}, true, ["encrypt", "decrypt"] );
			var exported_key = await crypto.webcrypto.subtle.exportKey('jwk', key);

			var [encryption_key, iv_key] = await handleCrypto(user_data.encryption_key, request_data.iv);
			var encrypted_buffer = await crypto.webcrypto.subtle.encrypt( {name: "AES-GCM", iv: iv_key}, encryption_key, buffer );
		}
		else var encrypted_buffer = buffer;

		var response = await getStore("files").set(request_data.path, encrypted_buffer);
		response_data.response = response;
	}
	// delete data
	else if (event.httpMethod == "DELETE") {
		var response = await getStore("files").delete(request_data.path);
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