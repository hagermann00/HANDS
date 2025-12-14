const ParserService = require('../services/ParserService');

class PlanController {

    async parse(req, res) {
        try {
            const { input } = req.body;
            if (!input) return res.status(400).json({ error: "Missing input" });

            const result = await ParserService.parseInput(input);
            res.json(result);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "Parse failed", details: e.message });
        }
    }
}

module.exports = new PlanController();
