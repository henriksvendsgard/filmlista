import { supabase } from "../../lib/supabaseClient";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === "POST") {
		const { title, poster_path, user_id } = req.body;

		// Insert the new movie into Supabase
		const { data, error } = await supabase.from("Watchlist").insert([{ title, poster_path, user_id }]);

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		return res.status(200).json({ data });
	} else {
		res.status(405).send({ message: "Only POST requests allowed" });
	}
}
