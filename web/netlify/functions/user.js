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

	var {user, password} = JSON.parse(event.body);
	var data = await getStore(user).get("user.json", {type:"json"});

	// check login attempt
	if (event.httpMethod == "POST") {
		// check if user exists
		if (data == null) return {
			statusCode: 404,
			body: "This user doesn't exitsts"
		}

		// check password and send new device_id, secret
		var correct_password = await bcrypt.compare(password, data.password_hash)
		if (correct_password) {
			var new_device = crypto.randomBytes(32).toString("hex");
			var secret = crypto.randomBytes(32).toString("hex");
			var time = new Date().toISOString();
			data.devices.push({ id:new_device, secret:secret, timestamp:time });

			var response = await getStore(user).setJSON("user.json", data);
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
				body: "User or Password is wrong"
			}
		}
	}
	// new user
	else if (event.httpMethod == "PUT") {
		// check if username is already taken
		if (data != null) return {
			statusCode: 409,
			body: "This user already exitsts"
		}

		// create new user
		var device_id = crypto.randomBytes(32).toString("hex");
		var secret = crypto.randomBytes(32).toString("hex");
		var salt = crypto.randomBytes(32).toString("hex");
		var hash = await bcrypt.hash(password, 10);
		var key = await crypto.webcrypto.subtle.generateKey( {name: "AES-GCM", length: 256}, true, ["encrypt", "decrypt"] );
		var exported_key = await crypto.webcrypto.subtle.exportKey('jwk', key);
		var time = new Date().toISOString();

		var response = await getStore(user).setJSON("user.json", {
			user_name: user,
			password_hash: hash,
			encryption_key: exported_key,
			salt: salt,
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
	else {
		return {statusCode:405, body:"Method Not Allowed"};
	}
}