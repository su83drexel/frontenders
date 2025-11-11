// handles login to existing account

import { neon } from '@neondatabase/serverless';

export default function handler (req, res) {
    try {
        if (req.method !== "POST") {
            res.setHeader("Allow", "POST");
            return res.status(405).json({ error: "Method Not Allowed" });
        }
    } catch (err) {
        console.error("discover error", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}