"""
build_horizons.py - run ONCE on your computer (not on the website).
Turns NASA LOLA topography into a 360-degree skyline ("horizon mask") for each site
and saves data/horizons.json, which index.html loads. The website never touches the big map,
so it stays fast.

1. Download a south-polar LOLA file (80S-90S) from the PDS LOLA archive, for example
   LDEM_80S_240M.IMG (+ its .LBL). Check exact names on pds-geosciences.wustl.edu (LRO LOLA GDR, polar).
2. Open the .LBL and read LINE_SAMPLES (= n) and MAP_RESOLUTION / pixel size in metres (= mpp).
3. pip install numpy ; python build_horizons.py LDEM_80S_240M.IMG <n> <mpp>

Assumes: int16 values, 0.5 m per unit, heights measured from a 1737.4 km sphere, south polar
stereographic with the pole at the image centre and +y at the top. Confirm against the .LBL.
"""
import sys, json
import numpy as np

R = 1737400.0                 # Moon reference radius (m)
MAST = 2.0                    # lander/rover height above ground (m)
MAX_KM, STEP_M = 200, None    # look this far; step = one pixel
SITES = {"mal": (-85.99, 0.12), "hay": (-87.45, -5.0), "nob": (-85.4, 31.4),
         "con": (-89.45, -137.1), "sha": (-89.54, 129.8)}   # same ids as index.html

path, n, mpp = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
dem = np.fromfile(path, dtype="<i2").reshape(n, n).astype(np.float32) * 0.5

def height(lat, lon):         # bilinear lookup, lat/lon in radians (south polar stereographic)
    rho = 2 * R * np.tan((np.pi / 2 + lat) / 2)
    px = (n - 1) / 2 + rho * np.sin(lon) / mpp
    py = (n - 1) / 2 - rho * np.cos(lon) / mpp
    x0 = np.clip(np.floor(px).astype(int), 0, n - 2); y0 = np.clip(np.floor(py).astype(int), 0, n - 2)
    fx, fy = px - x0, py - y0
    return (dem[y0, x0] * (1 - fx) * (1 - fy) + dem[y0, x0 + 1] * fx * (1 - fy)
            + dem[y0 + 1, x0] * (1 - fx) * fy + dem[y0 + 1, x0 + 1] * fx * fy)

def skyline(lat_d, lon_d):
    la, lo = np.radians(lat_d), np.radians(lon_d)
    h0 = float(height(np.array([la]), np.array([lo]))[0]) + MAST
    th = np.arange(mpp, MAX_KM * 1000, mpp) / R            # angular distance along each ray
    out = []
    for az in np.radians(np.arange(360)):                   # 0 = north, clockwise
        lat = np.arcsin(np.sin(la) * np.cos(th) + np.cos(la) * np.sin(th) * np.cos(az))
        lon = lo + np.arctan2(np.sin(az) * np.sin(th) * np.cos(la), np.cos(th) - np.sin(la) * np.sin(lat))
        z = height(lat, lon)
        # angle above the observer's flat plane; the cos/sin terms include the Moon's curved edge
        el = np.degrees(np.arctan2((R + z) * np.cos(th) - (R + h0), (R + z) * np.sin(th)))
        out.append(round(float(max(0.0, el.max())), 2))
    return out

result = {k: skyline(*v) for k, v in SITES.items() if v[0] < -80}
json.dump(result, open("data/horizons.json", "w"))
print("wrote data/horizons.json for", list(result))
