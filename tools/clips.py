#!/usr/bin/env python3
"""Turn exported clips into what the site plays.

    python3 tools/clips.py <folder with exports> <category> [--no-encode]

For every clip (e.g. nieuwGent_3.mp4) it writes to assets/clips/<category>/:
  nieuwGent_3.mp4       H.264, no audio (plays everywhere)
  nieuwGent_3-av1.mp4   AV1 10-bit, about half the size (used where the browser plays it smoothly)
  nieuwGent_3.jpg       first frame, shown while the clip loads
and works out the clip's point of interest, so narrow screens crop around it instead of the middle.
A position in the file name wins over the automatic one: nieuwGent_3_x30.mp4 = 30% from the left
(add _y40 for the height). Afterwards it rewrites assets/clips/clips.js (the list the site reads)
and saves assets/clips/<category>-review.jpg: every clip with the phone crop drawn on it.
"""
import json, os, re, subprocess, sys
import numpy as np
import cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "clips")
CP = ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709"]
PHONE = (390 / 844) / (16 / 9)          # share of a 16:9 frame a portrait phone shows

def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode().strip())

def frames(path, n=10):
    """n frames spread over the clip, as BGR images 640 px wide"""
    cap = cv2.VideoCapture(path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    out = []
    for i in range(n):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int((i + .5) * total / n))
        ok, f = cap.read()
        if ok:
            out.append(cv2.resize(f, (640, int(640 * f.shape[0] / f.shape[1]))))
    cap.release()
    return out

def active_rows(gray):
    """rows inside letterbox bars (2.39:1 shots inside a 16:9 frame)"""
    rows = gray.mean(1)
    lit = np.where(rows > 10)[0]
    return (lit[0], lit[-1] + 1) if len(lit) else (0, gray.shape[0])

def saliency(gray):
    """spectral-residual saliency: where the image is unlike the rest of it"""
    small = cv2.resize(gray, (128, int(128 * gray.shape[0] / gray.shape[1]))).astype(np.float32)
    f = np.fft.fft2(small)
    logamp = np.log(np.abs(f) + 1e-6)
    sr = logamp - cv2.blur(logamp, (3, 3))
    sal = np.abs(np.fft.ifft2(np.exp(sr + 1j * np.angle(f)))) ** 2
    sal = cv2.GaussianBlur(sal, (9, 9), 2.5)
    return cv2.resize(sal, (gray.shape[1], gray.shape[0]))

# People and their faces: the YOLO11 pose model (Ultralytics, AGPL-3.0). It is fetched on first use
# into tools/.models and never published with the site.
MODEL_URL = "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n-pose.onnx"
MODEL = os.path.join(ROOT, "tools", ".models", "yolo11n-pose.onnx")
_sess = None
def pose_session():
    global _sess
    if _sess is None:
        import onnxruntime as ort, urllib.request
        if not os.path.exists(MODEL):
            os.makedirs(os.path.dirname(MODEL), exist_ok=True)
            urllib.request.urlretrieve(MODEL_URL, MODEL)
        _sess = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
    return _sess

def people_in(img):
    """[(face_x, face_y, weight)] in pixels of img: one entry per person found"""
    h, w = img.shape[:2]
    s = 640 / max(h, w)
    canvas = np.full((640, 640, 3), 114, np.uint8)
    canvas[:int(h * s), :int(w * s)] = cv2.resize(img, (int(w * s), int(h * s)))
    blob = cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB).transpose(2, 0, 1)[None].astype(np.float32) / 255
    out = pose_session().run(None, {"images": blob})[0][0].T          # 8400 x 56
    out = out[out[:, 4] > .45]
    if not len(out): return []
    boxes = [[float(c[0] - c[2] / 2), float(c[1] - c[3] / 2), float(c[2]), float(c[3])] for c in out]
    keep = cv2.dnn.NMSBoxes(boxes, out[:, 4].tolist(), .45, .5)
    found = []
    for i in np.ravel(keep):
        cx, cy, bw, bh, conf = out[i, :5]
        kp = out[i, 5:].reshape(17, 3)[:5]                             # nose, eyes, ears
        seen = kp[kp[:, 2] > .5]
        fx, fy = (seen[:, 0].mean(), seen[:, 1].mean()) if len(seen) else (cx, cy - bh * .35)
        found.append((fx / s, fy / s, float(conf) * (bw * bh / s / s) ** 1.25))
    return found

STEP = .4                                # seconds between analysed frames

def scan(path):
    """decode the clip once: frames every STEP s (640 px wide), the shot each belongs to (hard cuts found by
    comparing colour histograms), the cut times, and the clip's length in s"""
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    every = max(1, round(fps * STEP))
    samples, cuts, prev, shot, i = [], [], None, 0, 0
    while True:
        ok, f = cap.read()
        if not ok: break
        hsv = cv2.cvtColor(cv2.resize(f, (160, 90)), cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1, 2], None, [12, 6, 6], [0, 180, 0, 256, 0, 256])
        cv2.normalize(hist, hist)
        if prev is not None and cv2.compareHist(prev, hist, cv2.HISTCMP_BHATTACHARYYA) > .45 and (not cuts or i / fps - cuts[-1] > .4):
            cuts.append(i / fps); shot += 1
            samples.append((i / fps, shot, cv2.resize(f, (640, int(640 * f.shape[0] / f.shape[1])))))
        elif i % every == every // 2:
            samples.append((i / fps, shot, cv2.resize(f, (640, int(640 * f.shape[0] / f.shape[1])))))
        prev, i = hist, i + 1
    cap.release()
    return samples, cuts, i / fps

def point_in(f):
    """(x, y) of the main person in a frame as fractions, or None; plus a saliency guess"""
    h, w = f.shape[:2]
    gray = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    y0, y1 = active_rows(gray)
    ppl = [p for p in people_in(f) if y0 <= p[1] <= y1]
    person = None
    if ppl:
        top = max(p[2] for p in ppl)
        big = [p for p in ppl if p[2] > top * .4]              # the main person; others only when nearly as big
        if max(p[0] for p in big) - min(p[0] for p in big) > PHONE * .8 * w:
            # too far apart for one crop: the person nearest the middle (out-of-focus shoulders at the edges
            # of the frame are often bigger than the subject)
            big = [min((p for p in ppl if p[2] > top * .2), key=lambda p: abs(p[0] / w - .5))]
        ppl = big
        a = sum(p[2] for p in ppl)
        person = (sum(p[0] * p[2] for p in ppl) / a / w, sum(p[1] * p[2] for p in ppl) / a / h)
    sm = saliency(gray); sm[:y0] = 0; sm[y1:] = 0
    ys, xs = np.nonzero(sm >= np.quantile(sm[y0:y1], .93))
    sal = (.5 + (xs.mean() / w - .5) * .8, .5 + (ys.mean() / h - .5) * .8) if len(xs) else (.5, .5)
    return person, sal

def focus(path):
    """the point of interest through the clip: [{t, x, y, how}] key points as fractions of the frame. Between
    two key points the crop glides; at a cut it jumps (a key point just before the cut holds the old spot)."""
    samples, cuts, length = scan(path)
    rows = [(t, shot) + point_in(f) for t, shot, f in samples]
    shot_of, extra = [], 0
    for i, r in enumerate(rows):
        if i and r[1] == rows[i - 1][1] and r[2] and rows[i - 1][2] and abs(r[2][0] - rows[i - 1][2][0]) > .15 \
           and (i + 1 == len(rows) or not rows[i + 1][2] or abs(rows[i + 1][2][0] - r[2][0]) < .1):
            extra += 1; cuts = sorted(cuts + [r[0]])
        shot_of.append(r[1] + extra)
    cuts = sorted(set(round(c, 2) for c in cuts))
    shots = {}
    for r, shot in zip(rows, shot_of):
        shots.setdefault(shot, []).append((r[0],) + r[2:])
    keys = []
    for shot in sorted(shots):
        rows = shots[shot]
        people = [r for r in rows if r[1]]
        if len(people) >= max(1, len(rows) * .3):
            how = "persoon"
            # frames without a person keep the nearest person's spot
            pts = [(t, (p or min(people, key=lambda r: abs(r[0] - t))[1])) for t, p, _ in rows]
        else:
            how = "opvallend"
            m = (float(np.mean([r[2][0] for r in rows])), float(np.mean([r[2][1] for r in rows])))
            pts = [(rows[0][0], m)]                            # saliency jumps around: one spot per shot
        xs = np.array([p[1][0] for p in pts]); ys = np.array([p[1][1] for p in pts])
        if len(xs) >= 3:                                       # smooth out detector jitter
            xs = np.convolve(np.pad(xs, 1, mode="edge"), [1/3] * 3, "valid"); ys = np.convolve(np.pad(ys, 1, mode="edge"), [1/3] * 3, "valid")
        ts = [p[0] for p in pts]
        if shot == min(shots): ts[0] = 0             # every other shot starts on its cut frame
        # keep only the points that change the path: drop those the straight line between neighbours already gives
        idx = [0]
        for i in range(1, len(ts) - 1):
            a, b = idx[-1], i + 1
            lerp = xs[a] + (xs[b] - xs[a]) * (ts[i] - ts[a]) / max(ts[b] - ts[a], 1e-6)
            if abs(lerp - xs[i]) > .04: idx.append(i)
        if len(ts) > 1 and abs(xs[-1] - xs[idx[-1]]) > .02: idx.append(len(ts) - 1)
        if shot and keys:                                      # hold the old spot up to the cut
            keys.append({**keys[-1], "t": round(ts[0] - .04, 2)})
        for i in idx:
            keys.append({"t": round(ts[i], 2), "x": round(float(np.clip(xs[i], 0, 1)), 3), "y": round(float(np.clip(ys[i], 0, 1)), 3), "how": how})
    # a shot framed like the one before it needs no jump
    out = []
    for k in keys:
        if out and abs(out[-1]["x"] - k["x"]) < .03 and abs(out[-1]["y"] - k["y"]) < .06: continue
        out.append(k)
    return out

def frames_at(path, ts):
    """frames at the given times (s), decoded in order, 640 px wide"""
    cap = cv2.VideoCapture(path); fps = cap.get(cv2.CAP_PROP_FPS) or 25
    want = sorted(range(len(ts)), key=lambda k: ts[k]); got = {}; i = 0; last = None
    while want:
        ok, f = cap.read()
        if not ok: break
        last = f
        while want and i >= ts[want[0]] * fps - .5:
            got[want.pop(0)] = f
        i += 1
    cap.release()
    for k in want: got[k] = last
    return [cv2.resize(got[k], (640, int(640 * got[k].shape[0] / got[k].shape[1]))) for k in range(len(ts))]

def crop_left(x, vis):
    """left edge of a window `vis` wide that keeps x in view, centred on it where possible"""
    return min(max(x - vis / 2, 0), 1 - vis)

def review(cat, items):
    tiles = []
    for it in items:
        tr = it["track"]
        for i, k in enumerate(tr):
            if i + 1 < len(tr) and tr[i + 1]["t"] - k["t"] < .1: continue      # the hold point before a cut
            f = frames_at(it["path"], [k["t"] + .05])[0]
            h, w = f.shape[:2]
            for left, col in ((crop_left(.5, PHONE), (110, 110, 110)), (crop_left(k["x"], PHONE), (60, 200, 255))):
                x0 = int(left * w); cv2.rectangle(f, (x0, 1), (x0 + int(PHONE * w), h - 2), col, 2)
            cv2.circle(f, (int(k["x"] * w), int(k["y"] * h)), 6, (60, 200, 255), -1)
            txt = f'{it["file"]} {k["t"]:.1f}s  x{round(k["x"]*100)} ({k["how"]})'
            cv2.putText(f, txt, (10, 24), cv2.FONT_HERSHEY_SIMPLEX, .6, (0, 0, 0), 3, cv2.LINE_AA)
            cv2.putText(f, txt, (10, 24), cv2.FONT_HERSHEY_SIMPLEX, .6, (255, 255, 255), 1, cv2.LINE_AA)
            tiles.append(f)
    cols = 4
    while len(tiles) % cols: tiles.append(np.zeros_like(tiles[0]))
    sheet = np.vstack([np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)])
    cv2.imwrite(os.path.join(OUT, f"{cat}-review.jpg"), sheet, [cv2.IMWRITE_JPEG_QUALITY, 82])

def main():
    src, cat = sys.argv[1], sys.argv[2]
    encode = "--no-encode" not in sys.argv
    os.makedirs(os.path.join(OUT, cat), exist_ok=True)
    listing = os.path.join(OUT, "clips.js")
    data = {}
    if os.path.exists(listing):
        data = json.loads(open(listing).read().split("=", 1)[1].rstrip().rstrip(";"))
    items = []
    for name in sorted(os.listdir(src)):
        if not name.lower().endswith((".mp4", ".mov", ".m4v")): continue
        stem = os.path.splitext(name)[0]
        mx = re.search(r"_x(\d{1,3})(?=_|$)", stem); my = re.search(r"_y(\d{1,3})(?=_|$)", stem)
        key = re.sub(r"_(x|y)\d{1,3}(?=_|$)", "", stem)
        project = re.sub(r"_\d+$", "", key).lower()
        inp, base = os.path.join(src, name), os.path.join(OUT, cat, key)
        if encode:
            run(["ffmpeg", "-y", "-i", inp, "-map", "0:v:0", "-an", "-dn", "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-tune", "film",
                 "-x264-params", "aq-mode=3", "-pix_fmt", "yuv420p", "-write_tmcd", "0", "-movflags", "+faststart", *CP, base + ".mp4"])
            run(["ffmpeg", "-y", "-i", inp, "-map", "0:v:0", "-an", "-dn", "-c:v", "libsvtav1", "-preset", "6", "-crf", "30",
                 "-svtav1-params", "tune=0", "-pix_fmt", "yuv420p10le", "-write_tmcd", "0", "-movflags", "+faststart", *CP, base + "-av1.mp4"])
            run(["ffmpeg", "-y", "-i", inp, "-frames:v", "1", "-vf", "scale=1280:-2", "-q:v", "4", base + ".jpg"])
        path = base + ".mp4" if os.path.exists(base + ".mp4") else inp
        track = focus(path)
        for k in track:
            if mx: k["x"], k["how"] = int(mx.group(1)) / 100, "handmatig"
            if my: k["y"] = int(my.group(1)) / 100
        x, y, how = track[0]["x"], track[0]["y"], track[0]["how"]
        rel = f"assets/clips/{cat}/{key}"
        items.append({"file": key + ".mp4", "src": rel + ".mp4", "av1": rel + "-av1.mp4", "poster": rel + ".jpg",
                      "project": project, "dur": round(duration(base + ".mp4" if os.path.exists(base + ".mp4") else inp), 2),
                      "x": x, "y": y, "how": how, "path": path,
                      **({"focus": [[k["t"], k["x"], k["y"]] for k in track]} if len(track) > 1 else {}), "track": track})
        print(f"{key:16} " + "  ".join(f'{k["t"]:.1f}s x={k["x"]:.2f} y={k["y"]:.2f} ({k["how"]})' for k in track), flush=True)
    data[cat] = [{k: v for k, v in it.items() if k not in ("file", "how", "path", "track")} for it in items]
    with open(listing, "w") as fh:
        fh.write("// written by tools/clips.py — the background clips per hero button, with each clip's point of interest\n")
        fh.write("window.CLIPS = " + json.dumps(data, indent=1) + ";\n")
    review(cat, items)

if __name__ == "__main__":
    main()
