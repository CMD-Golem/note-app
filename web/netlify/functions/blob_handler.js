import { connectLambda, getStore } from "@netlify/blobs";

exports.handler = async (event) => {
	connectLambda(event)

	// Get data
	if (event.httpMethod == "POST") {
		var {store, path} = JSON.parse(event.body);
		var data = await getStore(store).get(path, {type:"arrayBuffer"});
		var array_buffer = await data.arrayBuffer();

		return {
			statusCode: 200,
			body: JSON.stringify(Array.from(new Uint8Array(array_buffer)))
		}
	}
	// upload data
	else if (event.httpMethod == "PUT") {
		var {store, path, data} = JSON.parse(event.body);

		var buffer = new Uint8Array(data).buffer;

		var response = await getStore(store).set(path, buffer);

		return {
			statusCode: 200,
			body: JSON.stringify(response)
		}
	}
	// delete data
	else if (event.httpMethod == "DELETE") {
		var {store, path} = JSON.parse(event.body);
		var response = await getStore(store).delete(path);

		return {
			statusCode: 200,
			body: JSON.stringify(response)
		}
	}
	else {
		return {statusCode:405, body:"Method Not Allowed"};
	}
};

