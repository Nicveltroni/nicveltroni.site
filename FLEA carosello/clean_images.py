"""
Pulizia dataset immagini vestiti:
1. Duplicati (perceptual hash)
2. Basso contrasto sfondo/capo (bianco su bianco)
3. Watermark stock (Getty, Shutterstock, ecc.) rilevati da pattern colore
4. Qualità bassa (risoluzione, nitidezza)
5. Non abbigliamento (immagini troppo orizzontali, paesaggi, ecc.)
"""

import os
import shutil
from pathlib import Path
from io import BytesIO
import numpy as np
from PIL import Image, ImageFilter
import imagehash

INPUT_DIR  = "fashion_images"
OUTPUT_DIR = "fashion_clean"
TRASH_DIR  = "fashion_removed"

# Soglie
MIN_WIDTH        = 250
MIN_HEIGHT       = 250
MIN_SHARPNESS    = 80       # varianza del Laplacian (nitidezza)
MAX_ASPECT_RATIO = 3.0      # rimuove immagini troppo orizzontali (banner)
MIN_ASPECT_RATIO = 0.3      # rimuove immagini troppo orizzontali (landscape)
HASH_THRESHOLD   = 8        # distanza max per considerare due immagini duplicate
MIN_CONTRAST     = 18       # differenza minima luminosità centro vs bordi
MIN_STD_DEV      = 12       # deviazione standard minima dei pixel (misura varianza visiva)
WATERMARK_GRAY_RATIO = 0.08 # % pixel con grigio semitrasparente da watermark

# Regioni (pixel) da campionare per rilevare overlay watermark
WATERMARK_SAMPLE_Y_START = 0.6  # dal 60% in basso


def load_image(path: str):
    try:
        img = Image.open(path)
        img.load()
        return img
    except Exception:
        return None


def check_resolution(img: Image.Image) -> tuple[bool, str]:
    w, h = img.size
    if w < MIN_WIDTH or h < MIN_HEIGHT:
        return False, f"risoluzione troppo bassa ({w}x{h})"
    return True, ""


def check_aspect_ratio(img: Image.Image) -> tuple[bool, str]:
    w, h = img.size
    ratio = w / h
    if ratio > MAX_ASPECT_RATIO:
        return False, f"troppo orizzontale ({ratio:.1f}:1)"
    if ratio < MIN_ASPECT_RATIO:
        return False, f"troppo verticale ({ratio:.2f}:1) — probabile banner"
    return True, ""


def check_sharpness(img: Image.Image) -> tuple[bool, str]:
    gray = img.convert("L").resize((200, 200))
    arr = np.array(gray, dtype=float)
    # Varianza del Laplacian
    laplacian = np.array([
        [0,  1, 0],
        [1, -4, 1],
        [0,  1, 0],
    ])
    from PIL import ImageFilter as IF
    edges = gray.filter(IF.FIND_EDGES)
    sharpness = np.array(edges).var()
    if sharpness < MIN_SHARPNESS:
        return False, f"immagine sfocata (sharpness={sharpness:.1f})"
    return True, ""


def check_contrast(img: Image.Image) -> tuple[bool, str]:
    """
    Rileva immagini "bianco su bianco" dove il capo è invisibile.
    Usa due criteri combinati:
    1. differenza bordi/centro deve superare soglia minima
    2. la deviazione standard dell'immagine deve indicare contenuto visivo
    """
    gray = img.convert("L").resize((100, 100))
    arr = np.array(gray, dtype=float)

    # Deviazione standard globale: se troppo bassa = immagine quasi uniforme
    std_dev = arr.std()
    if std_dev < MIN_STD_DEV:
        return False, f"immagine quasi uniforme (std={std_dev:.1f}) - capo invisibile"

    # Bordi vs centro
    border_mask = np.zeros((100, 100), dtype=bool)
    border_mask[:8, :]  = True
    border_mask[-8:, :] = True
    border_mask[:, :8]  = True
    border_mask[:, -8:] = True
    center_mask = ~border_mask

    border_lum = arr[border_mask].mean()
    center_lum = arr[center_mask].mean()
    diff = abs(float(border_lum) - float(center_lum))

    # Solo se sfondo molto chiaro E differenza minima non raggiunta
    if border_lum > 220 and diff < MIN_CONTRAST:
        # Seconda verifica: edge strength nel centro
        from PIL import ImageFilter as IF
        edges = gray.filter(IF.FIND_EDGES)
        edge_arr = np.array(edges)
        center_edge_mean = edge_arr[center_mask].mean()
        # Se ci sono abbastanza bordi nel centro, il capo è comunque visibile
        if center_edge_mean < 8:
            return False, f"contrasto insufficiente (bg={border_lum:.0f}, centro={center_lum:.0f}, diff={diff:.0f})"
    return True, ""


def check_watermark(img: Image.Image) -> tuple[bool, str]:
    """
    Rileva overlay semitrasparente tipico di Getty/Shutterstock nella parte bassa.
    Caratteristiche: banda grigio medio-scuro uniforme con bassa saturazione.
    """
    w, h = img.size
    # Campiona striscia bassa (dove di solito sta il watermark)
    crop_y = int(h * WATERMARK_SAMPLE_Y_START)
    strip = img.convert("RGB").crop((0, crop_y, w, h))
    arr = np.array(strip, dtype=float)

    if arr.size == 0:
        return True, ""

    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]

    # Pixel grigi semitrasparenti: R≈G≈B, valore tra 80 e 180
    gray_like = (
        (np.abs(r - g) < 20) &
        (np.abs(g - b) < 20) &
        (r > 60) & (r < 200)
    )
    ratio = gray_like.sum() / gray_like.size

    # Se più dell'8% della striscia bassa è grigio uniforme → probabile watermark
    if ratio > WATERMARK_GRAY_RATIO:
        # Ulteriore check: la banda deve essere abbastanza uniforme (bassa deviazione std)
        if arr[gray_like].std() < 35:
            return False, f"watermark rilevato (copertura grigio={ratio:.1%})"

    # Check testo bianco su grigio scuro (stile Getty)
    dark_band = (r < 80) & (g < 80) & (b < 80)
    dark_ratio = dark_band.sum() / dark_band.size
    if dark_ratio > 0.25:
        return False, f"banda scura inferiore rilevata (watermark={dark_ratio:.1%})"

    return True, ""


def compute_hash(img: Image.Image) -> imagehash.ImageHash:
    return imagehash.phash(img, hash_size=16)


def classify_image(path: str) -> tuple[bool, str]:
    img = load_image(path)
    if img is None:
        return False, "file corrotto o non leggibile"

    img_rgb = img.convert("RGB")

    ok, reason = check_resolution(img_rgb)
    if not ok:
        return False, reason

    ok, reason = check_aspect_ratio(img_rgb)
    if not ok:
        return False, reason

    ok, reason = check_sharpness(img_rgb)
    if not ok:
        return False, reason

    ok, reason = check_contrast(img_rgb)
    if not ok:
        return False, reason

    ok, reason = check_watermark(img_rgb)
    if not ok:
        return False, reason

    return True, ""


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(TRASH_DIR, exist_ok=True)

    files = sorted(Path(INPUT_DIR).glob("*.jpg"))
    total = len(files)
    print(f"File da analizzare: {total}\n")

    kept = 0
    removed = 0
    reasons: dict[str, int] = {}

    # Fase 1: filtri qualitativi
    valid_files = []
    print("=== Fase 1: filtri qualità / contrasto / watermark ===")
    for path in files:
        ok, reason = classify_image(str(path))
        if ok:
            valid_files.append(path)
        else:
            category = reason.split("(")[0].strip()
            reasons[category] = reasons.get(category, 0) + 1
            dest = Path(TRASH_DIR) / path.name
            shutil.copy2(str(path), str(dest))
            removed += 1
            print(f"  [X] {path.name} — {reason}")

    print(f"\nPassate fase 1: {len(valid_files)}/{total}")

    # Fase 2: deduplicazione con perceptual hash
    print("\n=== Fase 2: deduplicazione ===")
    hashes: list[tuple[imagehash.ImageHash, Path]] = []
    duplicates = 0

    for path in valid_files:
        img = load_image(str(path))
        if img is None:
            continue
        h = compute_hash(img.convert("RGB"))

        is_dup = False
        for existing_hash, existing_path in hashes:
            if (h - existing_hash) <= HASH_THRESHOLD:
                is_dup = True
                dest = Path(TRASH_DIR) / path.name
                shutil.copy2(str(path), str(dest))
                duplicates += 1
                print(f"  [DUP] {path.name} ~ {existing_path.name}")
                break

        if not is_dup:
            hashes.append((h, path))

    unique_files = [p for _, p in hashes]
    print(f"\nUniche dopo dedup: {len(unique_files)}/{len(valid_files)}")

    # Copia file puliti nella cartella output
    print(f"\n=== Copia in '{OUTPUT_DIR}' ===")
    for path in unique_files:
        dest = Path(OUTPUT_DIR) / path.name
        shutil.copy2(str(path), str(dest))
        kept += 1

    # Riepilogo
    print(f"\n{'='*50}")
    print(f"Totale input:      {total}")
    print(f"Rimossi (qualità): {removed}")
    print(f"Duplicati rimossi: {duplicates}")
    print(f"Immagini finali:   {kept}")
    print(f"\nMotivi rimozione:")
    for reason, count in sorted(reasons.items(), key=lambda x: -x[1]):
        print(f"  {reason}: {count}")
    print(f"\nImmagini pulite in '{OUTPUT_DIR}/'")
    print(f"Rimossi in '{TRASH_DIR}/' (puoi verificare prima di eliminare)")


if __name__ == "__main__":
    main()
