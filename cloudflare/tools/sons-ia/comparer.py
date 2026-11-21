"""Diagnostic de qualité : crêtes réelles de la sortie du modèle (avant tout écrêtage) et platitude spectrale."""
import numpy as np, torch
from diffusers import AudioLDM2Pipeline

neg = "low quality, noisy, distorted, music, speech, voice, singing"
prompts = ["an old wooden door creaking slowly, long squeaky hinge, close microphone, no music",
           "a short funny cartoon fart sound effect, wet flatulence, close microphone"]


def stats(w):
    S = np.abs(np.fft.rfft(w * np.hanning(len(w)))) + 1e-9
    fr = np.fft.rfftfreq(len(w), 1 / 16000)
    return "pic_brut=%.2f rms=%.3f platitude=%.2f centroide=%dHz" % (np.abs(w).max(), np.sqrt((w ** 2).mean()), np.exp(np.log(S).mean()) / S.mean(), (fr * S).sum() / S.sum())


pipe = AudioLDM2Pipeline.from_pretrained("cvssp/audioldm2-large", torch_dtype=torch.float16).to("cuda")
for p in prompts:
    g = torch.Generator("cuda").manual_seed(1000)
    a = pipe(p, negative_prompt=neg, num_inference_steps=100, audio_length_in_s=4.0, num_waveforms_per_prompt=4, generator=g).audios
    for i, w in enumerate(a):
        print(p[:30], "v", i + 1, stats(w), flush=True)
