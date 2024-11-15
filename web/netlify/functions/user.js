import { connectLambda, getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// site:fabian
// 	wallet/
// 	pages.json
// 	notes/
// 	keep/
// 	user.json
	
// site:files

exports.handler = async (event) => {
	connectLambda(event);

	console.log(event.header)

	var {Authorization, Action} = event.header;
	var data = await getStore(Authorization.user).get("user.json", {type:"json", consistency:"strong"});

	if (Action == "login") {
		// check if user exists
		if (data == null) return {
			statusCode: 406,
			body: "Incorrect user or password"
		}

		// check password and send new device_id, secret
		var correct_password = await bcrypt.compare(Authorization.password, data.password_hash);
		if (correct_password) {

			// device identification
			var new_device = crypto.randomBytes(32).toString("hex");
			var secret = crypto.randomBytes(32).toString("hex");
			var time = new Date().toISOString();
			data.devices.push({ id:new_device, secret:secret, timestamp:time });

			var response = await getStore(Authorization.user).setJSON("user.json", data);
			return  {
				statusCode: 200,
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					response: response,
					id: new_device,
					secret: secret,
					salt: data.salt
				})
			}
		}
		// return error when password doesnt match
		else {
			return {
				statusCode: 406,
				body: "Incorrect user or password"
			}
		}
	}
	// new user
	else if (Action == "register") {
		// check if username is already taken
		if (data != null) return {
			statusCode: 409,
			body: "This user already exitsts"
		}

		// create new user
		var hash = await bcrypt.hash(Authorization.password, 10); // password hash

		// device identification
		var device_id = crypto.randomBytes(32).toString("hex");
		var secret = crypto.randomBytes(32).toString("hex");
		var time = new Date().toISOString();

		// generate random values and store mek
		var encoder = new TextEncoder();

		var iv = crypto.randomBytes(32).toString("hex"); // iv to encrypt mek
		var mek = crypto.randomBytes(32).toString("hex"); // Master Encryption Key (MEK)
		var pdk_key = await crypto.subtle.importKey('raw', encoder.encode(request_data.pdk), { name: 'AES-GCM' }, false, ['encrypt']);  // Password-Derived Key (PDK)
		var mek_key = await crypto.subtle.encrypt({name: 'AES-GCM', iv: iv }, pdk_key, encoder.encode(mek));

		// encryption key
		var key = await crypto.webcrypto.subtle.generateKey( {name: "AES-GCM", length: 256}, true, ["encrypt", "decrypt"] );
		var exported_key = await crypto.webcrypto.subtle.exportKey('jwk', key);
		
		// store data
		var request_data = JSON.parse(event.body);

		var response = await getStore(Authorization.user).setJSON("user.json", {
			user_name: Authorization.user,
			password_hash: hash,
			encryption_key: exported_key,
			iv: iv,
			mek: new Uint8Array(mek_key),
			salt: request_data.salt,
			devices: [{ id:device_id, secret:secret, timestamp:time }]
		});

		return  {
			statusCode: 200,
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				response: response,
				id: device_id,
				secret: secret,
				salt: salt
			})
		}
	}
	else if (Action == "reset_pw") {
		// check if user exists
		if (data == null) return {
			statusCode: 406,
			body: "Incorrect user or password"
		}

		// check password and reset password
		var correct_password = await bcrypt.compare(Authorization.password, data.password_hash);
		if (correct_password) {
			var request_data = JSON.parse(event.body);
			var encoder = new TextEncoder();

			data.password_hash = await bcrypt.hash(request_data.new, 10); // password hash
			data.salt = request_data.salt;

			// decrypt mek with old pdk
			var old_pdk = await crypto.subtle.importKey('raw', encoder.encode(request_data.old_pdk), { name: 'AES-GCM' }, false, ['decrypt']);  // get current pdk
			var mek_key = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: data.iv }, old_pdk, data.mek); // decrypt mek

			// decrypt mek with new pdk and store everything
			data.iv = crypto.randomBytes(32).toString("hex"); // iv to encrypt mek
			var new_pdk = await crypto.subtle.importKey('raw', encoder.encode(request_data.new_pdk), { name: 'AES-GCM' }, false, ['encrypt']);
			var mek = await crypto.subtle.encrypt({name: 'AES-GCM', iv: data.iv }, new_pdk, mek_key);
			data.mek = new Uint8Array(mek);

			var response = await getStore(Authorization.user).setJSON("user.json", data);
			return  {
				statusCode: 200,
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					response: response,
					id: request_data.id,
					secret: request_data.secret,
					salt: data.salt
				})
			}
		}
		else {
			return {
				statusCode: 406,
				body: "Incorrect user or password"
			}
		}
	}
	else {
		return {statusCode:405, body:"Method Not Allowed"};
	}
}