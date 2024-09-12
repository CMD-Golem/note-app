import { connectLambda, getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";

// site:fabian
// 	wallet/
// 	pages.json
// 	notes/
// 	keep/
// 	user.json
	
// site:files

exports.handler = async (event) => {
	connectLambda(event)

	// check login attempt
	if (event.httpMethod == "POST") {
		var {user, password_secret, device_id} = JSON.parse(event.body);

		// get user data
		var json = await getStore(user).setJSON("user.json");
		if (json == null) return {
			statusCode: 404,
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({ data:"This user doesn't exitsts" })
		}

		var data = JSON.parse(json);

		// relogin with device id
		if (device_id != undefined) {
			var index = data.devices.findIndex(obj => obj.id == device_id && obj.secret == password_secret);
			if (index >= 0) {
				var new_secret = crypto.randomBytes(32);
				data.devices[index].secret = new_secret;

				var response = await getStore(user).setJSON("user.json", JSON.stringify(data));
				console.log(response)
				return  {
					statusCode: 200,
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify({
						secret: new_secret
					})
				}
			}
			// return error when device id doesnt match secret
			else {
				return {
					statusCode: 406,
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify({ data:"Stored authentication mismatched, new login now required" })
				}
			}
		}
		// run new login
		else if (device_id == undefined && bcrypt.compare(password_secret, data.password_hash)) {
			var new_device = crypto.randomBytes(32)
			var secret = crypto.randomBytes(32);
			data.devices.push({ id:new_device, secret:secret });

			var response = await getStore(user).setJSON("user.json", JSON.stringify(data));
			console.log(response)
			return  {
				statusCode: 200,
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					id: device_id,
					secret: secret
				})
			}
		}
		// return error when password doesnt match
		else {
			return {
				statusCode: 406,
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({ data:"User or Password is wrong" })
			}
		}
	}
	// new user
	else if (event.httpMethod == "PUT") {
		var {user, password} = JSON.parse(event.body);

		// check for existing user
		var user = await getStore(user).get("user.json");
		if (user == null) return {
			statusCode: 409,
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({ data:"This user already exitsts" })
		}

		// create new user
		var device_id = crypto.randomBytes(32)
		var secret = crypto.randomBytes(32);
		var hash = await bcrypt.hash(password, 10);

		var response = await getStore(user).setJSON("user.json", JSON.stringify({
			user_name: user,
			password_hash: hash,
			devices: [{ id:device_id, secret:secret }]
		}));
		console.log(response)

		return  {
			statusCode: 200,
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				id: device_id,
				secret: secret
			})
		}
	}
	else {
		return {statusCode:405, body:"Method Not Allowed"};
	}
}