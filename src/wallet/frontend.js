const wallet_data = [
	{name:"Migros", image:"migros_cumulus", barcode:"ean13", path:"own"},
	{name:"COOP", image:"coop_supercard", barcode:"ean13", path:"own"},
	{name:"Migros", image:"migros_cumulus", barcode:"ean13", path:"fam"},
	{name:"COOP", image:"coop_supercard", barcode:"ean13", path:"fam"},
	{name:"C&A", image:"ca", barcode:"itf", path:"fam"},
	{name:"H&M", image:"hm", barcode:"unknown", path:"fam"},
	{name:"Ochnser Sport", image:"ochsner_sport", barcode:"code128", path:"fam"},
	{name:"MediaMarkt", image:"mediamarkt", barcode:false, path:"fam"},
	{name:"Manor", image:"manor", barcode:"mobileqrcode", path:"own"},
	{name:"Lehner Versand", image:"lehner_versand", barcode:"code128", path:"fam"},
	{name:"TCS", image:"tcs", barcode:"ean13", path:"own"}
]

export default class Wallet {
	static async load() {
		var main = document.querySelector("main");

		// TODO: Create an array of paths and load them all at once.

		// load images
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
					path: `wallet/${card.image}_${card.barcode}.svg`,
					encrypted: true
				}
			})
		});

			

		for (var i = 0; i < wallet_data.length; i++) {
			var card = wallet_data[i];

			// load images
			

			var result = await response.json();
			var data_array = new Uint8Array(result.array);
			var binary_string = String.fromCharCode.apply(null, data_array);

			// create html
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
				document.querySelector(".selected")?.classList.remove("active");
				e.currentTarget.classList.toggle("selected");
			});

			main.appendChild(element);
		}

		console.log("loaded Wallet");
	}
}