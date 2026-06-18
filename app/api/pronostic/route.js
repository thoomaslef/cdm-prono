import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { TEAMS } from "@/lib/teams";

const MODEL = "claude-sonnet-4-6";

export const maxDuration = 60;

const client = new Anthropic();

// Résultats réels CDM 2026 — Journée 1 (11-12 juin 2026)
const RESULTATS_CDM = `
RÉSULTATS RÉELS DE LA COUPE DU MONDE 2026 (à prendre en compte pour ajuster les probabilités) :

Journée 1 :
• Groupe A : Mexique 2-0 Afrique du Sud | Corée du Sud 2-1 Tchéquie
• Groupe B : Canada 1-1 Bosnie-Herzégovine | Qatar 1-1 Suisse
• Groupe C : Brésil 1-1 Maroc | Écosse 1-0 Haïti
• Groupe D : USA 4-1 Paraguay | Australie 2-0 Turquie
• Groupe E : Allemagne 7-1 Curaçao | Côte d'Ivoire 1-0 Équateur
• Groupe F : Pays-Bas 2-2 Japon | Suède 5-1 Tunisie
• Groupe G : Belgique 1-1 Égypte | Iran 2-2 Nouvelle-Zélande
• Groupe H : Espagne 0-0 Cap-Vert | Arabie Saoudite 1-1 Uruguay
• Groupe I : France 3-1 Sénégal | Norvège 4-1 Irak
• Groupe J : Argentine 3-0 Algérie | Autriche 3-1 Jordanie
• Groupe K : Portugal 1-1 RD Congo | Colombie 3-1 Ouzbékistan
• Groupe L : Angleterre 4-2 Croatie | Ghana 1-0 Panama

Journée 2 (partielle) :
• Groupe A : Tchéquie 1-1 Afrique du Sud

Utilise ces résultats pour calibrer la forme des équipes, leurs forces offensives/défensives réelles, et ajuster les probabilités en conséquence.
`;

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
        "Tu te bases UNIQUEMENT sur les résultats officiels de la Coupe du Monde 2026 pour ajuster ta lecture des équipes : forme actuelle, solidité défensive, puissance offensive. " +
        "IGNORE totalement les matchs amicaux, les qualifications, les Nations League et tout match hors CDM 2026. Seuls les matchs de la phase de groupes du tournoi comptent. " +
        "Si une équipe a perdu ou déçu en J1, c'est dans ton analyse. Si elle a écrasé son adversaire, c'est une info clé. " +
        "Tu réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans texte autour.",
      messages: [
        {
          role: "user",
          content:
            RESULTATS_CDM + "\n\n" +
            `Pronostic complet pour le match de Coupe du Monde 2026 : ${team1} vs ${team2}.\n\n` +
            "Réponds avec exactement ce JSON :\n" +
            "{\n" +
            '  "score": "X-Y" (score prédit, X pour ' + team1 + ", Y pour " + team2 + "),\n" +
            '  "prob_team1": nombre entier (probabilité de victoire de ' + team1 + " en %),\n" +
            '  "prob_nul": nombre entier (probabilité de match nul en %),\n' +
            '  "prob_team2": nombre entier (probabilité de victoire de ' + team2 + " en %),\n" +
            '  "homme_du_match": "nom d\'un joueur réel et plausible avec son équipe",\n' +
            '  "stat_choc": "une statistique insolite ou un fait réel de ce tournoi lié à ces équipes, une phrase percutante",\n' +
            '  "joueur_danger": "nom d\'un joueur réel à surveiller avec une raison basée sur sa forme actuelle",\n' +
            '  "analyse": "analyse percutante en 2-3 phrases basée sur leur forme en CDM 2026, ton consultant TV"\n' +
            "}\n\n" +
            "Les trois probabilités doivent totaliser 100. Sois audacieux, précis, et ancré dans la réalité du tournoi.",
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
