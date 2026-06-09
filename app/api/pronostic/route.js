import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { TEAMS } from "@/lib/teams";

const MODEL = "claude-sonnet-4-6";

export const maxDuration = 60;

const client = new Anthropic();

export async function POST(request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Anthropic manquante : ajoute la variable ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    const { team1, team2 } = await request.json();

    const validNames = new Set(TEAMS.map((t) => t.name));
    if (!validNames.has(team1) || !validNames.has(team2) || team1 === team2) {
      return NextResponse.json(
        { error: "Sélectionne deux équipes différentes parmi les 48 qualifiées." },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      temperature: 1,
      system:
        "Tu es un consultant football star de TV, expert de la Coupe du Monde 2026. " +
        "Tu produis des pronostics percutants, crédibles et divertissants, taillés pour TikTok. " +
        "Tu réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans texte autour.",
      messages: [
        {
          role: "user",
          content:
            `Pronostic complet pour le match de Coupe du Monde 2026 : ${team1} vs ${team2}.\n\n` +
            "Réponds avec exactement ce JSON :\n" +
            "{\n" +
            '  "score": "X-Y" (score prédit, X pour ' + team1 + ", Y pour " + team2 + "),\n" +
            '  "prob_team1": nombre entier (probabilité de victoire de ' + team1 + " en %),\n" +
            '  "prob_nul": nombre entier (probabilité de match nul en %),\n' +
            '  "prob_team2": nombre entier (probabilité de victoire de ' + team2 + " en %),\n" +
            '  "homme_du_match": "nom d\'un joueur réel et plausible avec son équipe",\n' +
            '  "stat_choc": "une statistique insolite et frappante liée à ce match, une phrase",\n' +
            '  "joueur_danger": "nom d\'un joueur réel à surveiller avec une raison courte",\n' +
            '  "analyse": "analyse percutante en 2-3 phrases, ton consultant TV"\n' +
            "}\n\n" +
            "Les trois probabilités doivent totaliser 100. Sois audacieux et précis.",
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    // Le modèle peut entourer le JSON de texte ou de backticks malgré la consigne
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Réponse du modèle illisible");
    }
    const pronostic = JSON.parse(match[0]);

    return NextResponse.json({ team1, team2, ...pronostic });
  } catch (error) {
    console.error("Erreur /api/pronostic:", error);
    const status = error?.status === 401 ? 500 : 502;
    const message =
      error?.status === 401
        ? "Clé API Anthropic manquante ou invalide (variable ANTHROPIC_API_KEY)."
        : "Impossible de générer le pronostic, réessaie dans un instant.";
    return NextResponse.json({ error: message }, { status });
  }
}
