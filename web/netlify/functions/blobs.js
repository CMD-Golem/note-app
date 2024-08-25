import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
	var user_data = JSON.parse(event.body);
	console.log(user_data)
	console.log(req)
	console.log(context)

	await getStore("notes").set("nails", "For general carpentry");
	await getStore("keep").set("nails", "For general carpentry");
	await getStore("files").set("nails", "For general carpentry");
	await getStore("pages").set("nails", "For general carpentry");
	await getStore("wallet").set("nails", "For general carpentry");


	return new Response("Nail blobs set for Construction and Beauty stores");
};