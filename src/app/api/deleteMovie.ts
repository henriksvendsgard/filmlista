import { supabase } from "../../lib/supabaseClient";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === "DELETE") {
		const { id } = req.body;

		// Remove the movie from Supabase
		const { data, error } = await supabase.from("movies").delete().eq("id", id);

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		return res.status(200).json({ data });
	} else {
		res.status(405).send({ message: "Only DELETE requests allowed" });
	}
}
