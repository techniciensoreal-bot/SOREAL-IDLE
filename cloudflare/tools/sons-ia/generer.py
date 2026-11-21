"""
Génère des variantes de sons avec AudioLDM2 (modèle libre, tourne en local sur la carte graphique).
Usage :  python generer.py <fichier-sons.json> <dossier-sortie> [--steps 100] [--modele cvssp/audioldm2-large]
Chaque son du JSON : { id, titre, duree (s), n (variantes par description), prompts: [descriptions en anglais] }.
Écrit <sortie>/<id>/<k>.wav (16 kHz) et <sortie>/candidats.json (liste pour la page d'écoute).
Le modèle est téléchargé une seule fois (cache Hugging Face). Aucune clé, aucun compte.
"""
import json, os, argparse
import torch, numpy as np
from scipy.io import wavfile
from diffusers import AudioLDM2Pipeline

ap = argparse.ArgumentParser()
ap.add_argument("sons")
ap.add_argument("sortie")
ap.add_argument("--steps", type=int, default=100)
ap.add_argument("--modele", default="cvssp/audioldm2-large")
a = ap.parse_args()

sons = json.load(open(a.sons, encoding="utf-8"))
os.makedirs(a.sortie, exist_ok=True)
pipe = AudioLDM2Pipeline.from_pretrained(a.modele, torch_dtype=torch.float16).to("cuda")
neg = "low quality, noisy, distorted, music, speech, voice, singing"
manifeste = []
for s in sons:
    dossier = os.path.join(a.sortie, s["id"])
    os.makedirs(dossier, exist_ok=True)
    k = 0
    for p in s["prompts"]:
        graine = torch.Generator("cuda").manual_seed(1000 + k)
        audio = pipe(p, negative_prompt=neg, num_inference_steps=a.steps, audio_length_in_s=float(s["duree"]),
                     num_waveforms_per_prompt=int(s["n"]), generator=graine).audios
        for w in audio:
            k += 1
            w = np.clip(w, -1, 1)
            wavfile.write(os.path.join(dossier, f"{k}.wav"), 16000, (w * 32767).astype(np.int16))
            manifeste.append({"son": s["id"], "titre": s["titre"], "n": k, "prompt": p, "fichier": f"{s['id']}/{k}.wav"})
        print(s["id"], k, "variantes", flush=True)
    json.dump(manifeste, open(os.path.join(a.sortie, "candidats.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("terminé :", len(manifeste), "variantes")
