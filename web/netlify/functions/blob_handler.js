import { connectLambda, getStore } from "@netlify/blobs";

exports.handler = async (event) => {
	connectLambda(event)
	console.log(event)

	if (event.httpMethod == "GET") {
		var {store, path, type} = JSON.parse(event.body);
		var response = await getStore(store).get(path, {type:type});
	}
	else if (event.httpMethod !== "POST") {
		var {store, path, type, data} = JSON.parse(event.body);
		if (type == "base64") {
			var base64 = data.replace(/^data:image\/\w+;base64,/, "");
			console.log(base64)
			var buffer = Buffer.from(base64, "base64");

			var response = await getStore(store).set(path, buffer);
		}
		else var response = await getStore(store).set(path, data);
	}
	else if (event.httpMethod !== "DELETE") {
		var {store, path} = JSON.parse(event.body);
		var response = await getStore(store).get(path);
	}
	else {
		var response = {statusCode:405, body:"Method Not Allowed"};
	}

	return {
		statusCode: 200,
		body: JSON.stringify(response)
	}
};