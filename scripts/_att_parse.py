import pymupdf,re,json,sys
CODES={'P','N','S','L','O','@','-','©','**'}
DATE=re.compile(r'(\d{1,2})[/-](\d{1,2})[/-](\d{3,5})')
def lines(p):
    out=[]
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines',[]):
            if abs(l['dir'][0])<.5:
                t=''.join(s['text'] for s in l['spans']).strip()
                x0,y0,x1,y1=l['bbox']
                out.append(dict(t=t,x0=x0,y0=y0,x1=x1,y1=y1,r=True,xc=(x0+x1)/2,yc=(y0+y1)/2))
    for w in p.get_text('words'):
        x0,y0,x1,y1,t=w[:5]
        if (y1-y0)>(x1-x0)*1.6 and len(t)>2: continue
        out.append(dict(t=t,x0=x0,y0=y0,x1=x1,y1=y1,r=False,xc=(x0+x1)/2,yc=(y0+y1)/2))
    return out
def cluster(xs,gap=8,minn=1):
    xs=sorted(xs);cl=[[xs[0]]]
    for x in xs[1:]:
        if x-cl[-1][-1]<gap: cl[-1].append(x)
        else: cl.append([x])
    return [sum(c)/len(c) for c in cl if len(c)>=minn]
def parse(path):
    d=pymupdf.open(path)
    P=[lines(p) for p in d]
    # header page
    hp=[i for i,L in enumerate(P) if any(l['r'] and l['x0']>150 for l in L)][-1]
    L=P[hp]
    H=[l for l in L if l['r'] and l['x0']>150]
    ymax=max(h['y1'] for h in H)
    # total-meetings row: first row of integers below header
    below=[l for l in L if not l['r'] and l['y0']>ymax-1 and re.fullmatch(r'\d+(:\d\d:\d\d)?',l['t']) and l['xc']>150]
    ytot=min(l['yc'] for l in below)
    totrow=sorted([l for l in below if abs(l['yc']-ytot)<3],key=lambda l:-l['xc'])
    # drop the duration cell (has colons) and the meetings-count cell (left)
    cols=[l['xc'] for l in totrow if ':' not in l['t']]
    # the count cell is the leftmost; members start after it -> detect via code tokens
    codex=[l['xc'] for PL in P for l in PL if not l['r'] and l['t'] in CODES and l['xc']>150]
    tm=[l['xc'] for PL in P for l in PL if not l['r'] and re.fullmatch(r'\d+:\d\d(:\d\d)?',l['t'])]
    tmax=max(tm)
    cc=[c for c in cluster(codex,minn=8) if c>tmax+8]
    # keep only code columns
    cols=sorted(cc,reverse=True)
    names=[]
    for c in cols:
        fr=[h for h in H if abs(h['xc']-c)<max(13,0)]
        fr=sorted(fr,key=lambda h:h['y0'])
        names.append(' | '.join(h['t'] for h in fr))
    # summary rows
    SL=['total','S','L','O','@','-','©','P','N','©+N','req','att','notatt']
    ints=[l for l in L if not l['r'] and l['y0']>ymax-1 and l['xc']>150 and re.fullmatch(r'\d+(:\d\d:\d\d)?',l['t'])]
    ys=cluster([l['yc'] for l in ints],gap=4)
    summ={}
    for k,y in enumerate(ys):
        vals=[]
        for c in cols:
            m=[r for r in ints if abs(r['yc']-y)<3 and abs(r['xc']-c)<12]
            vals.append(int(m[0]['t']) if m else None)
        summ[SL[k] if k<len(SL) else f'x{k}']=vals
    meets=[]
    dxs=[l['xc'] for PL in P for l in PL if not l['r'] and DATE.fullmatch(l['t']) and l['xc']<tmax-30]
    dxmax=max(dxs)
    tcols=sorted(cluster([x for x in tm],gap=6))
    nx0=dxmax+5; nx1=min(tcols)-5
    for pi,PL in enumerate(P):
        dts=[l for l in PL if not l['r'] and l['xc']<tmax-30 and DATE.fullmatch(l['t'])]
        cds=[l for l in PL if not l['r'] and l['t'] in CODES and l['xc']>tmax+8]
        # merge '© +N' style: ignore '+N'
        ns=[l for l in PL if not l['r'] and re.fullmatch(r'\d+',l['t']) and nx0<l['xc']<nx1 and not (pi==hp and l['y0']>ymax-1)]
        asg={id(n):[] for n in ns}
        for c in cds:
            if not ns: break
            nn=min(ns,key=lambda d:abs(d['yc']-c['yc']))
            asg[id(nn)].append(c)
        for nn in ns:
            dt=min(dts,key=lambda d:abs(d['yc']-nn['yc'])) if dts else None
            allrow=asg[id(nn)]
            ycl=cluster([c['yc'] for c in allrow],gap=2.2) if allrow else [nn['yc']]
            # split into sub-rows only when >1 cluster each with >=half the columns coded
            subs=[]
            for y in ycl:
                sub=[c for c in allrow if abs(c['yc']-y)<2.2]
                subs.append(sub)
            if len(subs)>1 and not all(len(x)>=len(cols)/2 for x in subs): subs=[allrow]
            for k,row in enumerate(subs):
                codes=[];toks=[]
                for c in cols:
                    m=sorted([r for r in row if abs(r['xc']-c)<12],key=lambda r:r['yc'])
                    toks.append([r['t'] for r in m])
                    codes.append(m[0]['t'] if m else '?')
                dd,mm,yy=DATE.fullmatch(dt['t']).groups(); yy='20'+yy[-2:]; dd=dd.zfill(2); mm=mm.zfill(2)
                meets.append(dict(date=f'{yy}-{mm}-{dd}',n=int(nn['t']),sub=k,codes=codes,toks=toks,page=pi,y=nn['yc'],dy=abs(dt['yc']-nn['yc'])))
    return dict(names=names,cols=cols,summ=summ,meets=meets)
if __name__=='__main__':
    r=parse(sys.argv[1])
    for i,n in enumerate(r['names']): print(i,round(r['cols'][i]),n)
    for k,v in r['summ'].items(): print(repr(k),v)
    print(len(r['meets']),'meeting rows')
    for m in r['meets']:
        print(m['date'],m['n'],''.join(c if len(c)==1 else '*' for c in m['codes']))
