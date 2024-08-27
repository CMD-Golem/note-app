import { connectLambda, getStore } from "@netlify/blobs";

exports.handler = async (event) => {
	connectLambda(event)

	if (event.httpMethod == "GET") {
		var {store, path, type} = JSON.parse(event.body);
		var response = await getStore(store).get(path, {type:type});
	}
	else if (event.httpMethod == "POST") {
		var {store, path, data} = JSON.parse(event.body);
		var response = await getStore(store).set(path, data);
	}
	else if (event.httpMethod == "DELETE") {
		var {store, path} = JSON.parse(event.body);
		var response = await getStore(store).delete(path);
	}
	else {
		var response = {statusCode:405, body:"Method Not Allowed"};
	}

	return {
		statusCode: 200,
		body: JSON.stringify(response)
	}
};