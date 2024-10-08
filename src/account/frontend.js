export default class Account {
	static load() {
		var main = document.querySelector("main");
		var element = document.createElement("div");
		var register_button = document.createElement("button");
		var login_button = document.createElement("button");

		register_button.addEventListener("click", app.buttonClick.bind(null, true));
		login_button.addEventListener("click", app.buttonClick.bind(null, false));
		register_button.innerHTML = "Create Data";
		login_button.innerHTML = "Login";

		element.innerHTML = `
			<input placeholder="User Name" id="login_user" autocomplete="username">
			<input placeholder="Password" id="login_password" type="password" autocomplete="current-password">
			<input placeholder="Identifier" id="login_identifier" type="password" autocomplete="one-time-code">
			<div id="login_info"></div>
		`;

		element.appendChild(register_button);
		element.appendChild(login_button);
		main.appendChild(element);

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
	static async buttonClick(register) {
		// check if device already
		Account.login(register);
	}
}