Date.prototype.getWeek = function(weekStart) {
	var januaryFirst = new Date(this.getFullYear(), 0, 1);
	weekStart = weekStart || 0;
	return Math.floor((((this - januaryFirst) / 86400000) + januaryFirst.getDay() - weekStart) / 7);
};

export default class Magazine {
	static async load() {
		// load coop
		var response = await fetch("https://epaper.coopzeitung.ch/aviator/_resources/php/getEditionsByYear.php?newspaper=CZ&edition=CZ51&year=2024")
		if (response.status == 200) {
			var coop = await response.json();
			console.log(coop)
		}
		
		// load migros

		
	}

	static async coop(issue) {
		var magazin_load = await fetch(`https://epaper.coopzeitung.ch/aviator/_resources/php/get_timone.php?newspaper=CZ&issue=${issue}&edition=CZ51`)
		if (magazin_load.status != 200) return;

		var magazin = await response.json();

		// 	List of all editions: https://epaper.coopzeitung.ch/aviator/_resources/php/getEditionsByYear.php?newspaper=CZ&edition=CZ51&year=2024
		// 	List of edition: https://epaper.coopzeitung.ch/aviator/_resources/php/get_timone.php?newspaper=CZ&issue=20241119&edition=CZ51
		// 	Link to PDF: https://epaper.coopzeitung.ch/_deploy/CZ/20241119/CZ51/20241118052356440/whole/CZ_20241119_CZ51.pdf
		return `https://epaper.coopzeitung.ch/_deploy/CZ/${issue}/CZ51/${magazin.timone.version}/whole/CZ_${issue}_CZ51.pdf`
	}

	static async migros(date) {
		// 	List with links to images of all pages: https://reader3.isu.pub/m-magazin/migros-magazin-45-2024-d-os/reader3_4.json
		return `https://reader3.isu.pub/m-magazin/migros-magazin-${date}-d-os/reader3_4.json`
	}
}

export class Public {
	static async buttonClick() {

	}
}