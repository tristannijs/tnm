"""Phone versions of the hero clips, with the framing from crop.html baked in.

  python3 tools/mobile.py [--all] [originals-dir ...]

For every clip in assets/clips/clips.js it writes <name>-mob.mp4 (and its first frame, -mob.jpg) next to it: a portrait
crop (the 390:844 window crop.html shows), following the clip's focus keyframes frame by
frame, and adds "mob" to clips.js. Phones play these as they are, so no framing is done
in the browser. A clip is redone when clips.js changes its framing (--all redoes every
clip). Sources: a file of the same name in one of the given dirs (the Resolve export), else
the H.264 clip on the site.
"""
import hashlib, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIST = os.path.join(ROOT, "assets", "clips", "clips.js")
W, H = 1920, 1080
CW = round(H * 390 / 844 / 2) * 2            # 500 px: the crop.html phone window
VIS = CW / W


def left_expr(c):
    """ffmpeg expression for the crop's left edge, in pixels, at time t (same maths as the site)."""
    f = c.get("focus") or [[0, c.get("x", .5), c.get("y", .5), 0]]
    def left(xe): return f"clip(({xe}-{VIS / 2:.6f})/{1 - VIS:.6f},0,1)*{W - CW}"
    def seg(i):
        t0, x0 = f[i][0], f[i][1]
        if i == len(f) - 1 or not f[i][3]: return left(f"{x0}")
        t1, x1 = f[i + 1][0], f[i + 1][1]
        return left(f"({x0}+({x1 - x0:.6f})*(1-cos(PI*clip((t-{t0})/{t1 - t0:.6f},0,1)))/2)")  # ease in and out
    e = seg(len(f) - 1)
    for i in range(len(f) - 2, -1, -1):
        e = f"if(lt(t+0.01,{f[i + 1][0]}),{seg(i)},{e})"
    return e


def main():
    args = sys.argv[1:]
    redo = "--all" in args
    dirs = [a for a in args if a != "--all"]
    s = open(LIST).read()
    data = json.loads(s[s.index("{"):s.rindex("}") + 1])
    for cat, clips in data.items():
        for c in clips:
            src = os.path.join(ROOT, c["src"])
            out = src[:-4] + "-mob.mp4"
            ease = ["ease"] if any(k[3] for k in c.get("focus") or []) else []
            key = hashlib.md5(json.dumps([c.get("x"), c.get("focus")] + ease).encode()).hexdigest()[:8]
            name = os.path.basename(src)
            inp = next((os.path.join(d, name) for d in dirs if os.path.exists(os.path.join(d, name))), src)
            if redo or c.get("mobkey") != key or not os.path.exists(out):
                vf = f"crop={CW}:{H}:x='{left_expr(c)}':y=0"
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", inp, "-map", "0:v:0", "-an", "-dn",
                                "-frames:v", str(round(c["dur"] * 25)), "-vf", vf,
                                "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-tune", "film", "-pix_fmt", "yuv420p",
                                "-write_tmcd", "0", "-movflags", "+faststart", out], check=True)
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-frames:v", "1", "-q:v", "3", out[:-4] + ".jpg"], check=True)
                print(name, flush=True)
            c["mob"] = c["src"][:-4] + "-mob.mp4"
            c["mobposter"] = c["src"][:-4] + "-mob.jpg"
            c["mobkey"] = key
    open(LIST, "w").write("window.CLIPS = " + json.dumps(data, indent=1) + ";\n")


if __name__ == "__main__":
    main()
