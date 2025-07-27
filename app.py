import os, urllib.parse, math
import pandas as pd
import numpy as np
import streamlit as st
import duckdb
from io import BytesIO
from functools import reduce

# ============ CONFIG ============ #
DB     = "my_db"
TABLE  = "main.tereos"
TOKEN  = os.getenv("MOTHERDUCK_TOKEN", "").strip() or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImF6YWQuaG9zc2VpbmlAc2tlbWEuZWR1Iiwic2Vzc2lvbiI6ImF6YWQuaG9zc2Vpbmkuc2tlbWEuZWR1IiwicGF0IjoiYkZMVHkydUUyMHFmNVhnMkE1TXh4M1FBZkhwclh0cTBRbnl2cHc4TjhLNCIsInVzZXJJZCI6IjllYTRjNDUzLTIyNWEtNGE5NS04Y2NmLWVhMjk1NTUyNmFjZCIsImlzcyI6Im1kX3BhdCIsInJlYWRPbmx5IjpmYWxzZSwidG9rZW5UeXBlIjoicmVhZF93cml0ZSIsImlhdCI6MTc1MzYwNjUyMn0.b8KgBs8dKKymTLu4hdQ-6ZHiwjJrec9JA7_9q764EzE"
con    = duckdb.connect(f"md:{DB}?motherduck_token={urllib.parse.quote_plus(TOKEN)}")

REGION_COL, COUNTRY_COL, SECTOR_COL = "Région", "Pays", "Secteur"
POSTE_COL, ENT_COL                  = "Poste", "Entreprise"

# ============ PAGE ============ #
st.set_page_config("Tereos – M&A Screener", page_icon="📈", layout="wide")
st.title("📈 Tereos – M&A Screener")
st.caption("Filtrage dynamique MotherDuck – export Excel")

# ============ UTILS ============ #
sql_list = lambda v: ",".join("'" + x.replace("'", "''") + "'" for x in v)

def distinct(col: str):
    q = f'''
    SELECT DISTINCT "{col}"
    FROM {TABLE}
    WHERE "{col}" IS NOT NULL
      AND TRIM("{col}") NOT IN ('', 'NaN', 'n/a')
    ORDER BY 1
    '''
    return [r[0] for r in con.execute(q).fetchall()]

def years():
    return [c[1] for c in con.execute(
        f"PRAGMA table_info('{TABLE}')"
    ).fetchall() if c[1].isdigit() and "_" not in c[1]]

def to_xlsx(df):
    b = BytesIO()
    with pd.ExcelWriter(b, engine="xlsxwriter") as xw:
        df.to_excel(xw, "Filtrage", index=False)
    b.seek(0)
    return b.getvalue()

def safe_min_max(series: pd.Series):
    s = pd.to_numeric(series, errors="coerce").replace([np.inf, -np.inf], np.nan).dropna()
    if s.empty or len(s.unique()) < 2:
        return None, None
    lo, hi = float(s.min()), float(s.max())
    if not (math.isfinite(lo) and math.isfinite(hi) and lo < hi):
        return None, None
    return lo, hi

# ============ SIDEBAR ============ #
st.sidebar.header("🎛️ Filtres")
regions   = st.sidebar.multiselect("🌍 Région",  distinct(REGION_COL))
countries = st.sidebar.multiselect("🏳️ Pays",    distinct(COUNTRY_COL))
sectors   = st.sidebar.multiselect("🏭 Secteur", distinct(SECTOR_COL))
postes    = st.sidebar.multiselect("📌 Postes",  distinct(POSTE_COL))

if st.sidebar.button("♻️ Reset"):
    for k in list(st.session_state.keys()):
        del st.session_state[k]
    st.experimental_rerun()

# ============ SLIDERS & ENTREPRISES FILTRÉES ============ #
filtered_ent_sets, yr = [], None
if postes:
    yr = st.sidebar.selectbox("📅 Année", sorted(years()))
    if yr:
        for p in postes:
            raw = con.execute(f'''
                SELECT TRY_CAST(NULLIF("{yr}", 'NaN') AS DOUBLE) AS val
                FROM {TABLE}
                WHERE "{POSTE_COL}" = ?
            ''', [p]).df()["val"]

            lo, hi = safe_min_max(raw)
            if lo is None or hi is None:
                continue

            key = f"{p}_{yr}".replace(" ", "_")
            st.sidebar.markdown(f"**{p} ({yr})**")
            slider = st.sidebar.slider(
                label="Plage",
                min_value=lo, max_value=hi,
                value=(lo, hi),
                key=f"slider_{key}"
            )

            col1, col2 = st.sidebar.columns(2)
            valmin = col1.number_input("Min", value=slider[0], key=f"min_{key}")
            valmax = col2.number_input("Max", value=slider[1], key=f"max_{key}")

            if valmin < valmax:
                query = f'''
                SELECT DISTINCT "{ENT_COL}"
                FROM {TABLE}
                WHERE "{POSTE_COL}" = ?
                  AND TRY_CAST(NULLIF("{yr}", 'NaN') AS DOUBLE) BETWEEN ? AND ?
                '''
                ents = [r[0] for r in con.execute(query, [p, valmin, valmax]).fetchall() if r[0]]
                filtered_ent_sets.append(set(ents))

# ============ WHERE GLOBAL ============ #
clauses = []
if regions:   clauses.append(f'"{REGION_COL}"  IN ({sql_list(regions)})')
if countries: clauses.append(f'"{COUNTRY_COL}" IN ({sql_list(countries)})')
if sectors:   clauses.append(f'"{SECTOR_COL}"  IN ({sql_list(sectors)})')

if filtered_ent_sets:
    intersect_ents = list(reduce(set.intersection, filtered_ent_sets)) if len(filtered_ent_sets) > 1 else list(filtered_ent_sets[0])
    if intersect_ents:
        clauses.append(f'"{ENT_COL}" IN ({sql_list(intersect_ents)})')
    else:
        clauses.append('FALSE')  # aucune entreprise matchée

where = " AND ".join(clauses) or "TRUE"

# ============ EXEC & DISPLAY ============ #
df = con.execute(f'SELECT * FROM {TABLE} WHERE {where}').df()

st.success(f"✅ {len(df):,} lignes affichées")
st.dataframe(df.head(10_000), use_container_width=True)
if len(df) > 10_000:
    st.caption("⚠️ Affichage limité à 10 000 lignes. L’export contient tout.")

st.download_button(
    "📥 Exporter Excel",
    data=to_xlsx(df),
    file_name="tereos_filtrage.xlsx",
    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)
