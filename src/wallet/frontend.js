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
	static load() {
		var main = document.querySelector("main");

		for (var i = 0; i < wallet_data.length; i++) {
			var card = wallet_data[i];

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
					<img src="./wallet/assets/${card.path}/${card.image}_${card.barcode}.svg">
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