export default class Account {
	static async load() {
		var main = document.querySelector("main");
		// button.addEventListener("click", app.buttonClick.bind(null, true));

		// check if logged in
		// var user_data = JSON.parse(localStorage.getItem("user"));
		// if (user_data == null) {
			
		// }
		// else {
		// 	var response = await fetch("/.netlify/functions/encryption", {
		// 		method: "POST",
		// 		headers: {"Content-Type": "application/json"},
		// 		body: JSON.stringify({
		// 			user: user_data.user,
		// 			secret: user_data.secret,
		// 			device_id: user_data.id,
		// 			request_data: {
		// 				iv: user_data.iv,
		// 				encrypted: true,
		// 				paths: ["account.json.enc"]
		// 			}
		// 		})
		// 	});
	
		// 	var result = await response.json();
		// 	var decoder = new TextDecoder("utf-8");
		// 	var json = decoder.decode(new Uint8Array(result.arrays[0]));
		// 	var account_data = JSON.parse(json);
		// }


		main.innerHTML = `
			<div class="selection">
				<button id="login" onclick="app.changeButtons('login')">Login</button>
				<button id="register" onclick="app.changeButtons('register')">Register</button>
				<button id="generate" onclick="app.changeButtons('generate')">Generate</button>
			</div>


			<input placeholder="User Name" id="login_user" autocomplete="username" class="login register">
			<input placeholder="Page" id="login_page" autocomplete="one-time-code" class="generate">
			<input placeholder="Password" id="login_password" type="password" autocomplete="current-password" class="login register generate">
			<input placeholder="Confirm Password" id="login_confirm" type="password" autocomplete="one-time-code" class="register">
			<input placeholder="Identifier" id="login_identifier" type="password" autocomplete="one-time-code" class="generate">
			<button id="main_button" onlick="app.buttonClick()"></button>
			<div id="login_info"></div>
		`;
		
		Public.changeButtons("generate");

		console.log("loaded Account");
	}

	static async login(create_account) {
		var user = document.getElementById("login_user").value;
		var password = document.getElementById("login_password").value;
	
		if (create_account) var method = "PUT";
		else var method = "POST";
	
		var response = await fetch("/.netlify/functions/user", {
			method: method,
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				user: user,
				password: password
			})
		});
		if (response.status != 200) {
			console.log(response.text());
			return
		}
	
		var user_data = await response.json();

		user_data.iv = await Account.generateIv(password, user, user_data.salt, 32);
		user_data.user = user;
		delete user_data.salt;
	
		localStorage.setItem("user", JSON.stringify(user_data));
		console.log(user_data);
	}

	static async showIv() {
		var user = document.getElementById("login_user").value;
		var password = document.getElementById("login_password").value;
		var identifier = document.getElementById("login_identifier").value;

		var iv = generateIv(password, user, identifier, length);
	}

	static async generateIv(masterKey, domain, masterString, string) {
		var encoder = new TextEncoder();
		var crypto_key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(masterKey),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"]
		);
	
		var iv_string = "";
		var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?@#$%^&*()_+-=[]{}|/;:,.<>";
		var signature = await crypto.subtle.sign("HMAC", crypto_key, encoder.encode(domain + masterString));
		var iv_array = Array.from(new Uint8Array(signature));
		
		for (let i = 0; i < iv_array.length; i++) {
			iv_string += charset[iv_array[i] % charset.length];
		}

		return iv_string.slice(0, string);
	}
}

export class Public {
	static active_type;
	static type_dictionary = {login:"Login", register:"Register", generate:"Generate"};

	static async buttonClick() {
		// check if device already
		if (active_type == "login") Account.login(false);
		else if (active_type == "register") Account.login(true);
		
	}

	static changeButtons(type) {
		this.active_type = type;
		document.getElementById("main_button").innerHTML = this.type_dictionary[type];
		document.querySelector("main").setAttribute("data-type", type);
	}
}