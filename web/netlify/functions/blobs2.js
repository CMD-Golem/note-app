import { connectLambda, getStore } from "@netlify/blobs";

exports.handler = async (event) => {
	connectLambda(event)

	var user_data = JSON.parse(event.body);
	console.log(user_data)

	await getStore("notes").set("max", "For general carpentry");
	await getStore("keep").set("max", "For general carpentry");
	await getStore("files").set("max", "For general carpentry");
	await getStore("pages").set("max", "For general carpentry");
	await getStore("wallet").set("max", "For general carpentry");

	return {
		statusCode: 200,
		body: JSON.stringify({text:"Happy"})
	}
};