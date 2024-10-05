export default class Wallet {
	static async load() {
		var main = document.querySelector("main");

		// load data
		var user_data = JSON.parse(localStorage.getItem("user"));
		if (user_data == null) return Error("No Account loged in");

		var response = await fetch("/.netlify/functions/encryption", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				user: user_data.user,
				secret: user_data.secret,
				device_id: user_data.id,
				request_data: {
					iv: user_data.iv,
					encrypted: true,
					paths: ["wallet/data.json.enc"]
				}
			})
		});

		var result = await response.json();
		var decoder = new TextDecoder("utf-8");
    	var json = decoder.decode(new Uint8Array(result.arrays[0]));
		var wallet_data = JSON.parse(json);

		// get bar codes
		var path_array = [];
		for (var i = 0; i < wallet_data.length; i++) path_array.push(`wallet/${wallet_data[i].path}/${wallet_data[i].image}_${wallet_data[i].barcode}.svg.enc`);

		var response = await fetch("/.netlify/functions/encryption", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({
				user: user_data.user,
				secret: user_data.secret,
				device_id: user_data.id,
				request_data: {
					iv: user_data.iv,
					paths: path_array,
					encrypted: true
				}
			})
		});

		// create html
		var result = await response.json();	

		for (var i = 0; i < wallet_data.length; i++) {
			var card = wallet_data[i];

			var data_array = new Uint8Array(result.arrays[i]);
			var binary_string = String.fromCharCode.apply(null, data_array);

			
			var element = document.createElement('div');
			if (card.path == "fam") var subtitle = "Familie";
			else var subtitle = "";

			element.innerHTML = `
				<div class="card-face front">
					<img src="/src/wallet/assets/${card.image}.svg">
					<span>${subtitle}</span>
				</div>
				<div class="card-face back">
					<span>${card.name} ${subtitle}</span>
					<img src=${"data:image/svg+xml;base64," + btoa(binary_string)}>
				</div>
			`;

			element.classList.add("card")
			element.addEventListener("click", function(e) {
				document.querySelector(".selected")?.classList.remove("selected");
				e.currentTarget.classList.toggle("selected");
			});

			main.appendChild(element);
		}

		console.log("loaded Wallet");
	}
}