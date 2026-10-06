import sys,re,json; sys.path.insert(0,'scripts')
from collections import Counter
from _att_parse import parse
import pymupdf
R={r[5]:r for r in json.load(open('tmp/roster_ts.json',encoding='utf-8'))}
F={123:'tmp/docs/cmt-123-2.pdf',124:'tmp/docs/cmt-124-2.pdf',125:'tmp/docs/cmt-125-2.pdf',126:'tmp/docs/cmt-126-2.pdf',127:'tmp/docs/cmt-127-1.pdf',128:'tmp/docs/cmt-128-2.pdf',129:'tmp/docs/cmt-129-1.pdf',130:'tmp/docs/cmt-130-1.pdf'}
M={ # column index -> roster id (None = not in roster.ts)
123:'233 247 258 267 254 241 236 225 224 206 196 195 194 187 183 181 179 177',
124:'249 264 250 246 236 235 195 193 191 186 183 181 177',
125:'239 252 265 262 255 250 248 230 216 206 194 192 184 179 176',
126:'237 247 262 254 228 220 207 200 199 189 184 176',
127:'226 X 267 266 250 245 243 238 221 212 185 178',
128:'229 242 244 249 258 267 251 250 227 224 222 218 215 210 208 206 204 203 199 182',
129:'X 263 266 250 241 240 238 228 219 206 198 190 189 176',
130:'256 264 254 248 245 235 232 227 220 213 206 201 199 189 188 179'}
X=('Abdulla Sadiq','North Hithadhoo')
CODES={"P":"present","S":"salaam (excused absence)","L":"leave (chuttee)","O":"official travel/duty (rasmee); counted as officialTravel","@":"present at another committee's meeting (counted as officialTravel)","-":"absent (did not attend)","©":"not required to attend (not counted as eligible)","N":"not a member of the committee at that time (not counted as eligible)"}
rt=open('src/data/realCommittees.ts',encoding='utf-8').read()
rep=[]
for c,f in F.items():
    r=parse(f); ids=M[c].split(); assert len(ids)==len(r['cols']),(c,len(ids),len(r['cols']))
    sm=r['summ']; rows=r['meets']; first=[m for m in rows if m['sub']==0]
    i=rt.index('"id": "%d"'%c); blk=rt[i:rt.find('"fetchedAt"',i)]
    urls=[u for u in re.findall(r'"url": "(https://majlis[^"]+)"',blk)]
    members=[];mism=0
    for j,pid in enumerate(ids):
        tk=Counter(t for m in rows for t in m['toks'][j])
        mine=dict(present=tk['P'],onLeave=tk['S']+tk['L'],absent=tk['-'],officialTravel=tk['O']+tk['@'],eligible=sum(tk[k] for k in 'PSLO@-'))
        sd=dict(present=sm['P'][j],onLeave=sm['S'][j]+sm['L'][j],absent=sm['-'][j],officialTravel=sm['O'][j]+sm['@'][j],eligible=sm['req'][j])
        if mine!=sd: mism+=1; print(c,'col',j,pid,'sheet-rows',mine,'summary',sd)
        nm,co=(X if pid=='X' else (R[pid][0],R[pid][1]))
        members.append(dict(mpId=None if pid=='X' else 'mp-'+pid,name=nm,constituency=co,**sd))
    ml=[]
    for m in sorted(first,key=lambda m:(m['date'],m['n'])):
        elig=[t[0] for t in m['toks'] if t and t[0] in 'PSLO@-']
        ml.append(dict(date=m['date'],n=m['n'],present=sum(1 for t in elig if t=='P'),total=len(elig)))
    dates=[m['date'] for m in rows]
    d=dict(committeeId=str(c),period=f"{min(dates)} to {max(dates)}",meetings=len(first),codes=CODES,members=members,meetingsList=ml,sourceDocs=urls,
           pagesRead=len(pymupdf.open(f)),pagesTotal=len(pymupdf.open(f)),confidence='High' if mism==0 else 'Medium',model='claude-sonnet-5-5',generatedAt='2026-10-06')
    json.dump(d,open(f'src/data/attendance/{c}.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
    rep.append(f"{c} | {len(first)} (rows {len(rows)}) | {sum(1 for p in ids if p!='X')}/{len(ids)} | {d['confidence']}")
print('\n'.join(rep))
