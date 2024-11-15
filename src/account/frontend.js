export default class Account {
	static active_type;
	static uuid_list;
	static type_dictionary = {login:"Login", register:"Register", generate:"Generate", reset_pw:"Reset Password", logout:"Logout"};

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
		// 				pdk: user_data.pdk,
		// 				encrypted: true,
		// 				paths: ["account.json.enc"]
		// 			}
		// 		})
		// 	});
	
		// 	var result = await response.json();
		// 	var decoder = new TextDecoder("utf-8");
		// 	var json = decoder.decode(new Uint8Array(result.arrays[0]));
		// 	var account_data = JSON.parse(json);

		// Public.uuid_list = account_data.
		// }

		document.querySelector("main").setAttribute("data-loggedin", true);
		document.querySelector("main").setAttribute("data-loggedin", false);


		main.innerHTML = `
			<div class="selection">
				<button id="login" class="unkown_user" onclick="app.changeButtons('login')">Login</button>
				<button id="register" class="unkown_user" onclick="app.changeButtons('register')">Register</button>
				<button id="generate" class="unkown_user know_user" onclick="app.changeButtons('generate')">Generate</button>
				<button id="reset_pw" class="know_user" onclick="app.changeButtons('reset_pw')">Reset Login</button>
				<button id="logout" class="know_user" onclick="app.changeButtons('logout')">Logout</button>
			</div>


			<input placeholder="User Name" id="login_user" autocomplete="username" class="login register">
			<input placeholder="UUID" id="login_uuid" autocomplete="one-time-code" class="generate" list="uuids">
			<input placeholder="Password" id="login_password" type="password" autocomplete="current-password" class="login register generate">
			<input placeholder="Old Password" id="login_old" type="password" autocomplete="current-password" class="reset_pw">
			<input placeholder="New Password" id="login_new" type="password" autocomplete="current-password" class="reset_pw">
			<input placeholder="Confirm Password" id="login_confirm" type="password" autocomplete="one-time-code" class="register reset_pw">
			<input placeholder="Identifier" id="login_identifier" type="password" autocomplete="one-time-code" class="generate">
			<button id="main_button" onclick="app.buttonClick()"></button>
			<div id="login_info"></div>
			<datalist id="uuids"></datalist>
		`;
		
		Public.changeButtons("generate");

		console.log("loaded Account");
	}

	static async account(action, user, password, data) {	
		console.log(data)

		var response = await fetch("/.netlify/functions/user", {
			method: "POST",
			headers: JSON.stringify({
				"Content-Type": "application/json",
				Authorization: {
					user: user,
					password: password
				},
				Action: action
			}),
			body: JSON.stringify(data)
		});

		if (response.status != 200) {
			console.log(response.text());
			return
		}
	
		var user_data = await response.json();

		user_data.pdk = await Account.generatePdk(password, user, user_data.salt, 32);
		user_data.user = user;
		delete user_data.salt;
	
		localStorage.setItem("user", JSON.stringify(user_data));
		console.log(user_data);
	}

	static async login() {
		var user = document.getElementById("login_user").value;
		var password = document.getElementById("login_password").value;
	
		if (user.length == 0 || password.length == 0) return "Inputs must be filled out";
		else return await Account.account("login", user, password, undefined);
	}

	static async register() {
		var user = document.getElementById("login_user").value;
		var password = document.getElementById("login_password").value;
		var login_confirm = document.getElementById("login_confirm").value;
	
		if (user.length == 0 || password.length == 0 || login_confirm.length == 0) return "Inputs must be filled out";
		else if (password != login_confirm) return "Passwords don't match";
		else {
			var data = {};
			data.salt = Account.generateSalt();
			data.pdk = await Account.generatePdk(password, user, data.salt, 32);
			return await Account.account("register", user, password, data);
		}
	}

	static async resetPassword() {
		var login_old = document.getElementById("login_user").value;
		var login_new = document.getElementById("login_password").value;
		var login_confirm = document.getElementById("login_confirm").value;

		var user_data = JSON.parse(localStorage.getItem("user"));
	
		if (user_data == null) return "Log in first";
		else if (login_old.length == 0 || login_new.length == 0 || login_confirm.length == 0) return "Inputs must be filled out";
		else if (login_new != login_confirm) return "Passwords don't match";
		else  {
			var data = {};
			data.new = login_new;
			data.old_pdk = user_data.pdk;
			data.secret = user_data.secret;
			data.id = user_data.id;
			data.salt = Account.generateSalt();
			data.new_pdk = await Account.generatePdk(login_new, user_data.user, data.salt, 32);
			return await Account.account("reset_password", user_data.user, login_old, data);
		}
	}

	static async showPdk() {
		var user = document.getElementById("login_uuid").value;
		var password = document.getElementById("login_password").value;
		var identifier = document.getElementById("login_identifier").value;

		return await Account.generatePdk(password, user, identifier, 20);
	}

	static async generatePdk(masterKey, domain, masterString, string) {
		var encoder = new TextEncoder();
		var crypto_key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(masterKey),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"]
		);
	
		var pdk_string = "";
		var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?@#$%^&*()_+-=[]{}|/;:,.<>";
		var signature = await crypto.subtle.sign("HMAC", crypto_key, encoder.encode(domain + masterString));
		var pdk_array = Array.from(new Uint8Array(signature));

		console.log(signature)
		
		for (let i = 0; i < pdk_array.length; i++) {
			pdk_string += charset[pdk_array[i] % charset.length];
		}

		return pdk_string.slice(0, string);
	}

	static generateSalt() {
		var salt_array = crypto.getRandomValues(new Uint8Array(64));
		return btoa(String.fromCharCode.apply(null, salt_array));
	}
}

export class Public {
	static async buttonClick() {
		document.getElementById("login_info").innerHTML = "";

		switch (Account.active_type) {
			case "login":
				var response = await Account.login();
				break;
			case "register":
				var response = await Account.register();
				break;
			case "generate": 
				var response = await Account.showPdk();
				break;
			case "reset_pw":
				var response = await Account.resetPassword();
				break;
			case "logout":
				localStorage.removeItem("user");
				// location.reload();
				break;
		}

		document.getElementById("login_info").innerHTML = response || "";
		// clear inputs
	}

	static changeButtons(type) {
		Account.active_type = type;
		document.getElementById("main_button").innerHTML = Account.type_dictionary[type];
		document.querySelector("main").setAttribute("data-type", type);
		document.getElementById("login_info").innerHTML = "";
		// clear inputs
	}
}