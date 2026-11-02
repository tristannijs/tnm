#!/usr/bin/env python3
"""Turn exported clips into what the site plays.

    python3 tools/clips.py <folder with exports> <category> [--no-encode]

For every clip (e.g. nieuwGent_3.mp4) it writes to assets/clips/<category>/:
  nieuwGent_3.mp4       H.264, no audio (plays everywhere)
  nieuwGent_3-av1.mp4   AV1 10-bit, about half the size (used where the browser plays it smoothly)
  nieuwGent_3.jpg       first frame, shown while the clip loads
and works out the clip's point of interest, so narrow screens crop around it instead of the middle.
Framing set by hand in crop.html (on the site: /tnm/crop.html) is kept on later runs.
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

EVERY = 3                                # look for people in every 3rd frame (0.12 s at 25 fps)

def scan(path):
    """decode the clip once. Returns the frames looked at for people [(t, frame 640 px wide)], the hard cuts
    (times of the first frame of each new shot), the frame rate and the length in s.
    A cut is a frame that differs from the one before it far more than the frames around it do: colour
    histogram plus a brightness-free comparison of the picture, so dark shots and busy action both work."""
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    samples, diff, prev, i = [], [0.0], None, 0
    while True:
        ok, f = cap.read()
        if not ok: break
        small = cv2.resize(f, (96, 54), interpolation=cv2.INTER_AREA)
        hist = cv2.calcHist([cv2.cvtColor(small, cv2.COLOR_BGR2HSV)], [0, 1, 2], None, [12, 6, 6], [0, 180, 0, 256, 0, 256])
        cv2.normalize(hist, hist)
        g = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY).astype(np.float32)
        g = (g - g.mean()) / (g.std() + 8)
        if prev is not None:
            diff.append(cv2.compareHist(prev[0], hist, cv2.HISTCMP_BHATTACHARYYA) + .5 * float(np.abs(g - prev[1]).mean()))
        prev = (hist, g)
        samples.append((i, cv2.resize(f, (640, int(640 * f.shape[0] / f.shape[1])))) if i % EVERY == 0 else (i, None))
        i += 1
    cap.release()
    d = np.array(diff); cut_frames = []
    for k in range(1, len(d)):
        around = np.concatenate([d[max(1, k - 6):k], d[k + 1:k + 7]])
        base = float(np.median(around)) if len(around) else 0.0
        if d[k] > .5 and d[k] > 2 * base + .15 and (not cut_frames or k - cut_frames[-1] > 3): cut_frames.append(k)
    # always look at the first frame of every shot too
    keep = set(cut_frames)
    frames_out = [(k / fps, f if f is not None else None) for k, f in samples if f is not None or k in keep]
    if keep:   # frames on a cut that were skipped above: decode them
        need = [k for k, f in samples if f is None and k in keep]
        if need:
            got = frames_at(path, [k / fps for k in need])
            fix = dict(zip(need, got))
            frames_out = [(t, f if f is not None else fix[round(t * fps)]) for t, f in frames_out]
    return frames_out, [k / fps for k in cut_frames], fps, i / fps

def point_in(f):
    """(x, y) of the main person in a frame as fractions, or None"""
    h, w = f.shape[:2]
    gray = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    y0, y1 = active_rows(gray)
    ppl = [p for p in people_in(f) if y0 <= p[1] <= y1]
    if not ppl: return None
    top = max(p[2] for p in ppl)
    big = [p for p in ppl if p[2] > top * .4]                  # the main person; others only when nearly as big
    if max(p[0] for p in big) - min(p[0] for p in big) > PHONE * .8 * w:
        # too far apart for one crop: the person nearest the middle (out-of-focus shoulders at the edges
        # of the frame are often bigger than the subject)
        big = [min((p for p in ppl if p[2] > top * .2), key=lambda p: abs(p[0] / w - .5))]
    a = sum(p[2] for p in big)
    return (sum(p[0] * p[2] for p in big) / a / w, sum(p[1] * p[2] for p in big) / a / h)

def simplify(ts, xs, tol):
    """indices of the points a line through them needs (Ramer-Douglas-Peucker)"""
    def rdp(a, b):
        if b - a < 2: return []
        line = lambda i: xs[a] + (xs[b] - xs[a]) * (ts[i] - ts[a]) / max(ts[b] - ts[a], 1e-6)
        k = max(range(a + 1, b), key=lambda i: abs(xs[i] - line(i)))
        return rdp(a, k) + [k] + rdp(k, b) if abs(xs[k] - line(k)) > tol else []
    return [0] + rdp(0, len(ts) - 1) + [len(ts) - 1]

CENTRE = .04     # a subject this close to the middle is already in the centred crop: leave it centred
MOVES = .12      # a subject that travels further than this within one shot is followed; otherwise one spot

def focus(path):
    """the point of interest through the clip, per shot: [{t, x, y, glide, how}].
    Every shot gets its own spot from its first frame on (a step at each cut, never a slide across one).
    Only when the subject clearly travels within a shot does the crop follow it (glide: move in a straight
    line to the next key point). Shots without a person, or with the person already near the middle, stay
    centred."""
    samples, cuts, fps, length = scan(path)
    bounds = [0.0] + cuts + [length + 1]
    keys = []
    for s0, s1 in zip(bounds, bounds[1:]):
        rows = [(t, point_in(f)) for t, f in samples if s0 - 1e-6 <= t < s1 - 1e-6]
        if not rows: continue
        seen = [r for r in rows if r[1]]
        if len(seen) < max(1, len(rows) * .3):
            keys.append({"t": s0, "x": .5, "y": .5, "glide": 0, "how": "midden"}); continue
        pts = [(t, p or min(seen, key=lambda r: abs(r[0] - t))[1]) for t, p in rows]
        ts = [t for t, _ in pts]
        xs = np.array([p[0] for _, p in pts]); ys = np.array([p[1] for _, p in pts])
        if len(xs) >= 5:                                       # detector jitter out, real movement stays
            xs = np.array([np.median(xs[max(0, i - 2):i + 3]) for i in range(len(xs))])
            ys = np.array([np.median(ys[max(0, i - 2):i + 3]) for i in range(len(ys))])
        # the detector sometimes hops to another person, and a dissolve swaps the subject without a hard cut:
        # a jump that then stays put starts a new part (a step, like a cut); small wobbles don't
        parts, start = [], 0
        for i in range(1, len(xs)):
            if abs(xs[i] - xs[i - 1]) > .15 and all(abs(xs[j] - xs[i]) < .1 for j in range(i, min(len(xs), i + 4))):
                parts.append((start, i)); start = i
        parts.append((start, len(xs)))
        merged = []                                    # a part too short to be a real swap joins the one before
        for a, b in parts:
            if merged and b - a < 4: merged[-1] = (merged[-1][0], b)
            else: merged.append((a, b))
        if len(merged) > 1 and merged[0][1] - merged[0][0] < 4: merged[1] = (0, merged[1][1]); merged.pop(0)
        parts = merged
        for a, b in parts:
            px, py, pt = xs[a:b], ys[a:b], ts[a:b]
            t0 = s0 if a == 0 else pt[0]
            steps = np.abs(np.diff(px)) if len(px) > 1 else np.array([0.0])
            moving = (np.percentile(px, 90) - np.percentile(px, 10) >= MOVES and steps.max() <= .06
                      and pt[-1] - pt[0] >= .8)
            if not moving:
                x, y = float(np.median(px)), float(np.median(py))
                if abs(x - .5) < CENTRE: x = .5
                if abs(y - .5) < .15: y = .5
                keys.append({"t": t0, "x": x, "y": y, "glide": 0, "how": "persoon"})
            else:                                          # the subject travels through the shot: follow it
                idx = simplify(pt, px, .05)
                for n, i in enumerate(idx):
                    keys.append({"t": t0 if n == 0 else pt[i], "x": float(px[i]), "y": float(py[i]),
                                 "glide": int(n < len(idx) - 1), "how": "volgt"})
    out = []
    for k in keys:
        k = {**k, "t": round(k["t"], 3), "x": round(float(np.clip(k["x"], 0, 1)), 3), "y": round(float(np.clip(k["y"], 0, 1)), 3)}
        # the next shot framed the same: nothing to change
        if out and not out[-1]["glide"] and not k["glide"] and abs(out[-1]["x"] - k["x"]) < .03 and abs(out[-1]["y"] - k["y"]) < .06: continue
        out.append(k)
    return out, [round(c, 3) for c in cuts]

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
            f = frames_at(it["path"], [k["t"] + .05])[0]
            h, w = f.shape[:2]
            for left, col in ((crop_left(.5, PHONE), (110, 110, 110)), (crop_left(k["x"], PHONE), (60, 200, 255))):
                x0 = int(left * w); cv2.rectangle(f, (x0, 1), (x0 + int(PHONE * w), h - 2), col, 2)
            cv2.circle(f, (int(k["x"] * w), int(k["y"] * h)), 6, (60, 200, 255), -1)
            txt = f'{it["file"]} {k["t"]:.2f}s  x{round(k["x"]*100)} ({k["how"]})'
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
        done = all(os.path.exists(base + e) and os.path.getmtime(base + e) >= os.path.getmtime(inp) for e in (".mp4", "-av1.mp4", ".jpg"))
        if encode and not done:                                # clips encoded before are left as they are
            run(["ffmpeg", "-y", "-i", inp, "-map", "0:v:0", "-an", "-dn", "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-tune", "film",
                 "-x264-params", "aq-mode=3", "-pix_fmt", "yuv420p", "-write_tmcd", "0", "-movflags", "+faststart", *CP, base + ".mp4"])
            run(["ffmpeg", "-y", "-i", inp, "-map", "0:v:0", "-an", "-dn", "-c:v", "libsvtav1", "-preset", "6", "-crf", "30",
                 "-svtav1-params", "tune=0", "-pix_fmt", "yuv420p10le", "-write_tmcd", "0", "-movflags", "+faststart", *CP, base + "-av1.mp4"])
            run(["ffmpeg", "-y", "-i", inp, "-frames:v", "1", "-vf", "scale=1280:-2", "-q:v", "4", base + ".jpg"])
        path = base + ".mp4" if os.path.exists(base + ".mp4") else inp
        track, cuts = focus(path)
        for k in track:
            if mx: k["x"], k["how"] = int(mx.group(1)) / 100, "handmatig"
            if my: k["y"] = int(my.group(1)) / 100
        x, y, how = track[0]["x"], track[0]["y"], track[0]["how"]
        rel = f"assets/clips/{cat}/{key}"
        items.append({"file": key + ".mp4", "src": rel + ".mp4", "av1": rel + "-av1.mp4", "poster": rel + ".jpg",
                      "project": project, "dur": round(duration(base + ".mp4" if os.path.exists(base + ".mp4") else inp), 2),
                      "x": x, "y": y, "how": how, "path": path, "cuts": cuts,
                      **({"focus": [[k["t"], k["x"], k["y"], k["glide"]] for k in track]} if len(track) > 1 else {}), "track": track})
        print(f"{key:16} " + "  ".join(f'{k["t"]:.2f}s x={k["x"]:.2f}{"~" if k["glide"] else ""} ({k["how"]})' for k in track), flush=True)
    data[cat] = [{k: v for k, v in it.items() if k not in ("file", "how", "path", "track")} for it in items]
    # clips framed by hand in crop.html (marked "manual") keep their framing and cuts
    old = {c["src"]: c for c in (json.loads(open(listing).read().split("=", 1)[1].rstrip().rstrip(";")) if os.path.exists(listing) else {}).get(cat, [])}
    for c in data[cat]:
        o = old.get(c["src"])
        if o and o.get("manual"):
            c.pop("focus", None)
            for k in ("x", "y", "focus", "cuts", "manual"):
                if k in o: c[k] = o[k]
    with open(listing, "w") as fh:
        fh.write("// written by tools/clips.py — the background clips per hero button, with each clip's point of interest\n")
        fh.write("window.CLIPS = " + json.dumps(data, indent=1) + ";\n")
    review(cat, items)

if __name__ == "__main__":
    main()
