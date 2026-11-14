"""
build_dem.py - run ONCE on your computer. Packs NASA LOLA topography into small files
that index.html loads. Nothing else is needed; the website does the skyline maths itself.

Files to download from the PDS Geosciences Node (LRO LOLA gridded data, "LDEM"):
  1) the whole-Moon map, 16 pixels per degree:  LDEM_16.IMG  (+ LDEM_16.LBL)
  2) the south-polar map, 80S to the pole, any pixel size of about 100-250 m  (+ its .LBL)
Open each .LBL in Notepad. For the polar file note LINE_SAMPLES (n) and the pixel size in metres (mpp).

Run:   python build_dem.py LDEM_16.IMG LDEM_80S_240M.IMG <n> <mpp>
Result: data/dem_global.bin.gz, data/dem_south.bin.gz, data/dem_meta.json  -> upload the data folder.
Assumed (check the .LBL): 16-bit little-endian integers, 0.5 m per unit, 5760 x 2880 for LDEM_16,
longitude 0-360 east starting at the left edge, polar file centred on the south pole with +y at the top.
Needs only Python (no extra packages).
"""
import sys, gzip, json, os
g_path, s_path, n, mpp = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4])
os.makedirs("data", exist_ok=True)
for src, dst in ((g_path, "data/dem_global.bin.gz"), (s_path, "data/dem_south.bin.gz")):
    with open(src, "rb") as f, gzip.open(dst, "wb", 9) as o:
        o.write(f.read())
json.dump({"gp": 16, "gw": 5760, "gh": 2880, "pn": n, "pm": mpp}, open("data/dem_meta.json", "w"))
print("done: upload the 'data' folder to your repo")
