"use client";

import { useEffect, useState } from "react";
import { TEAMS } from "@/lib/teams";

const MESSAGES_CHARGEMENT = [
  "Analyse des compos probables…",
  "Calcul des probabilités…",
  "Consultation des stats…",
  "Claude rédige son pronostic…",
];

function BottomSheet({ titre, exclu, onSelect, onClose }) {
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const filtre = recherche.trim().toLowerCase();
  const equipes = TEAMS.filter((t) => t.name.toLowerCase().includes(filtre));

  return (
    <>
      <div className="voile" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="poignee" />
        <h2>{titre}</h2>
        <input
          className="recherche"
          type="text"
          placeholder="Rechercher une équipe…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <div className="liste-equipes">
          {equipes.map((t) => (
            <button
              key={t.name}
              className={`item-equipe${t.name === exclu ? " indispo" : ""}`}
              onClick={() => onSelect(t)}
            >
              <span className="drapeau">{t.flag}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function CarteEquipe({ equipe, cote, placeholder, onClick }) {
  return (
    <button className={`carte-equipe ${cote}`} onClick={onClick}>
      {equipe ? (
        <>
          <span className="drapeau">{equipe.flag}</span>
          <span className="nom">{equipe.name}</span>
        </>
      ) : (
        <>
          <span className="drapeau">⚽</span>
          <span className="placeholder">{placeholder}</span>
        </>
      )}
    </button>
  );
}

function BarreProba({ label, pct, couleur, anime }) {
  return (
    <div className="proba">
      <div className="ligne">
        <span>{label}</span>
        <span className="pct">{pct}%</span>
      </div>
      <div className="piste">
        <div
          className={`remplissage ${couleur}`}
          style={{ width: anime ? `${pct}%` : "0%" }}
        />
      </div>
    </div>
  );
}

export default function Page() {
  const [team1, setTeam1] = useState(null);
  const [team2, setTeam2] = useState(null);
  const [sheet, setSheet] = useState(null); // null | 1 | 2
  const [chargement, setChargement] = useState(false);
  const [messageIdx, setMessageIdx] = useState(0);
  const [pronostic, setPronostic] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [barresAnimees, setBarresAnimees] = useState(false);

  useEffect(() => {
    if (!chargement) return;
    const timer = setInterval(
      () => setMessageIdx((i) => (i + 1) % MESSAGES_CHARGEMENT.length),
      1800
    );
    return () => clearInterval(timer);
  }, [chargement]);

  useEffect(() => {
    if (!pronostic) return;
    // Laisse le DOM peindre les barres à 0% avant de déclencher la transition
    const t = setTimeout(() => setBarresAnimees(true), 80);
    return () => clearTimeout(t);
  }, [pronostic]);

  async function genererPronostic() {
    setChargement(true);
    setErreur(null);
    setPronostic(null);
    setBarresAnimees(false);
    setMessageIdx(0);
    try {
      const res = await fetch("/api/pronostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team1: team1.name, team2: team2.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");
      setPronostic(data);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  function rejouer() {
    setPronostic(null);
    setErreur(null);
    setBarresAnimees(false);
  }

  return (
    <main className="app">
      <h1 className="titre">
        Pronostic <span className="tricolore">Coupe du Monde</span> 2026
      </h1>
      <p className="sous-titre">L&apos;IA prédit ton match</p>

      <div className="selecteurs">
        <CarteEquipe
          equipe={team1}
          cote="team1"
          placeholder="Équipe 1"
          onClick={() => setSheet(1)}
        />
        <span className="vs">VS</span>
        <CarteEquipe
          equipe={team2}
          cote="team2"
          placeholder="Équipe 2"
          onClick={() => setSheet(2)}
        />
      </div>

      {!pronostic && !chargement && (
        <button
          className="btn-generer"
          disabled={!team1 || !team2}
          onClick={genererPronostic}
        >
          🔮 Générer le pronostic
        </button>
      )}

      {erreur && <p className="erreur">{erreur}</p>}

      {chargement && (
        <div className="chargement">
          <span className="ballon">⚽</span>
          <p>{MESSAGES_CHARGEMENT[messageIdx]}</p>
        </div>
      )}

      {pronostic && (
        <div className="resultat">
          <div className="affiche-match">
            <span className="drapeau">{team1.flag}</span>
            <span>{team1.name}</span>
            <span className="vs">—</span>
            <span>{team2.name}</span>
            <span className="drapeau">{team2.flag}</span>
          </div>

          <div className="score-geant">{pronostic.score}</div>
          <div className="label-score">Score prédit</div>

          <div className="probas">
            <BarreProba
              label={`Victoire ${team1.name}`}
              pct={pronostic.prob_team1}
              couleur="bleu"
              anime={barresAnimees}
            />
            <BarreProba
              label="Match nul"
              pct={pronostic.prob_nul}
              couleur="blanc"
              anime={barresAnimees}
            />
            <BarreProba
              label={`Victoire ${team2.name}`}
              pct={pronostic.prob_team2}
              couleur="rouge"
              anime={barresAnimees}
            />
          </div>

          <div className="infos">
            <div className="info">
              <div className="etiquette">🏆 Homme du match</div>
              <div className="valeur">{pronostic.homme_du_match}</div>
            </div>
            <div className="info blanc">
              <div className="etiquette">📊 Stat choc</div>
              <div className="valeur">{pronostic.stat_choc}</div>
            </div>
            <div className="info rouge">
              <div className="etiquette">⚡ Joueur danger</div>
              <div className="valeur">{pronostic.joueur_danger}</div>
            </div>
            <div className="info">
              <div className="etiquette">🎙️ L&apos;analyse</div>
              <div className="valeur">{pronostic.analyse}</div>
            </div>
          </div>

          <button className="btn-rejouer" onClick={rejouer}>
            🔁 Nouveau pronostic
          </button>
        </div>
      )}

      <footer className="footer">
        Powered by Claude AI · Coupe du Monde 2026
      </footer>

      {sheet !== null && (
        <BottomSheet
          titre={sheet === 1 ? "Choisis l'équipe 1" : "Choisis l'équipe 2"}
          exclu={sheet === 1 ? team2?.name : team1?.name}
          onSelect={(t) => {
            if (sheet === 1) setTeam1(t);
            else setTeam2(t);
            setSheet(null);
            setPronostic(null);
            setBarresAnimees(false);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
