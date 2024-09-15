var footer_spacer = document.getElementById("footer_spacer");
var footer_buttons = document.getElementsByClassName("footer_button");

// load page und change footer
for (var i = 0; i < footer_buttons.length; i++) {
	footer_buttons[i].addEventListener("click", function(e) {
		if (!e.currentTarget.classList.contains("active")) {
			document.querySelector("main").innerHTML = "";

			// position and play footer animation
			footer_spacer.style.width = e.currentTarget.getBoundingClientRect().x - 33 + "px";
			document.querySelector("body").style.minWidth = footer_buttons.length * 68 + 58 + "px";
			document.querySelector(".background").style.minWidth = footer_buttons.length * 68 + 58 + "px";
			document.querySelector(".buttons").style.minWidth = footer_buttons.length * 68 + 58 + "px";

			document.querySelector(".active").classList.remove("active");
			e.currentTarget.classList.add("active");

			footer_spacer.nextElementSibling.style.setProperty("--footer-animation", "footer 0.2s linear 0s 1 normal");

			// update url
			window.history.replaceState({}, '', `${window.location.pathname}?app=${e.currentTarget.id}`);

			// load data 
			document.getElementById("head_style").innerHTML = `@import url("/src/${e.currentTarget.id}/style.css")`;
			import(`/src/${e.currentTarget.id}/frontend.js`).then((Module) => {
				var Application = Module.default;
				Application.load();
			});
		}
	});
}

// reload footer animation
footer_spacer.nextElementSibling.addEventListener("animationend", function() {
	footer_spacer.nextElementSibling.style.removeProperty("--footer-animation");
});

// load page from url param
var url_parameter = new URLSearchParams(window.location.search);
var selected_app = url_parameter.get("app");

if (selected_app == null || selected_app == "") document.getElementById("account").click();
else document.getElementById(selected_app).click();

footer_spacer.nextElementSibling.style.display = "block";