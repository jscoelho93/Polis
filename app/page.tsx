"use client";

import { useState, useEffect, useRef } from "react";

const CANDIDATE = {
  name: "Sen. Jon Ossoff", short: "Ossoff", initials: "JO", party: "D",
  approval: 47.8, net: 3.7, dApproval: 1.1, dNet: 1.6,
  social: { twitter: 312400, instagram: 198000, facebook: 441000, twitterGrowth: 2.1, igGrowth: 3.4, fbGrowth: 0.8 },
  demos: [
    { label: "Overall", net: 3.7, delta: 1.6 }, { label: "Black voters", net: 74.0, delta: 0.2 },
    { label: "Women 30-55", net: 24.0, delta: 2.1 }, { label: "Atlanta suburbs", net: 14.0, delta: 1.8 },
    { label: "Independents", net: 3.0, delta: 0.9 }, { label: "Rural GA", net: -33.0, delta: 0.3 },
  ]
};

const OPPONENTS = [
  { name: "Rep. Mike Collins", short: "Collins", initials: "MC", party: "R", role: "opponent", label: "GOP primary leader", color: "#f27070",
    approval: 39.2, net: 2.4, dApproval: 0.6, dNet: 0.4,
    demos: [{ label: "Overall", net: 2.4, delta: 0.4 }, { label: "Rural GA", net: 38.1, delta: 0.6 }, { label: "Independents", net: -4.1, delta: -0.2 }],
    vulnerabilities: ["Voted against ACA Medicaid expansion twice", "41% of voters have no opinion of him"],
    attackLines: [{ line: "Ossoff is out of touch with Georgia values", vol: 58, vel: "+14", trend: "rising" }]
  },
  { name: "Brian Jack", short: "Jack", initials: "BJ", party: "R", role: "tracker", label: "GOP primary candidate", color: "#f5b944",
    approval: 18.3, net: -3.8, dApproval: 0.4, dNet: -0.2,
    demos: [{ label: "Overall", net: -3.8, delta: -0.2 }, { label: "Rural GA", net: 14.2, delta: 0.3 }],
    vulnerabilities: ["Lower primary polling than Collins"], attackLines: []
  }
];

const BASE_POLLS = [
  { id:"p1", pollster:"Atlanta Journal-Constitution / UGA", short:"AJC/UGA", date:"Apr 1, 2026", type:"public", status:"in_signal", weight:28, ossoff:48, collins:41, jack:18, moe:2.9, n:800, method:"Live phone / LV", takeaway:"Ossoff leads Atlanta suburbs (+9 net).", crosstabs:[{g:"Overall",o:48,c:41},{g:"Black voters",o:84,c:10},{g:"Atlanta suburbs",o:53,c:39}] },
  { id:"p2", pollster:"Ossoff Campaign Internal", short:"Internal", date:"Mar 30, 2026", type:"private", status:"in_signal", weight:22, ossoff:51, collins:39, jack:18, moe:2.1, n:1200, method:"Online panel / RV", takeaway:"Women 30-55 at Ossoff +14 net.", crosstabs:[{g:"Overall",o:51,c:39},{g:"Women 30-55",o:57,c:33}] },
];

const NARRATIVES_SEED = [
  { id:"n1", label:"Savannah port jobs + infrastructure investment", sentiment:"positive", vol:84, vel:28, detail:"Ossoff port expansion projecting 12,000 jobs generating sustained positive coverage.", sources:[{name:"Atlanta Journal-Constitution",type:"newspaper",share:36,reachFormatted:"4M"},{name:"WSB-TV",type:"broadcast",share:29,reachFormatted:"2M"}], articleUrls:[] },
  { id:"n2", label:"Medicaid coverage gap Georgia uninsured", sentiment:"positive", vol:61, vel:14, detail:"Coverage of Georgia Medicaid non-expansion gaining traction.", sources:[{name:"Georgia Public Broadcasting",type:"broadcast",share:38,reachFormatted:"1.2M"}], articleUrls:[] },
  { id:"n3", label:"Collins inflation attack ads statewide broadcast", sentiment:"negative", vol:68, vel:16, detail:"Collins campaign launched statewide broadcast ad buy linking Ossoff to Biden-era inflation.", sources:[{name:"WSB-TV",type:"broadcast",share:54,reachFormatted:"2M"}], articleUrls:[] },
];

const ALERTS_SEED = [
  {id:"a1",sev:"critical",title:"Collins inflation ad buy surging 900k impressions in 12h",body:"Atlanta, Savannah, Augusta, and Macon DMAs all showing penetration.",time:"2h ago",ack:false},
  {id:"a2",sev:"high",title:"Too liberal social framing: velocity +19 in 6h",body:"Not yet penetrating independents but approaching inflection threshold.",time:"5h ago",ack:false},
  {id:"a3",sev:"high",title:"Quinnipiac Georgia poll releasing tonight at 9 PM",body:"Field dates Apr 2-4 captures post-port-jobs presser movement.",time:"1h ago",ack:false},
  {id:"a4",sev:"medium",title:"Ossoff +1.1pts in 48h Savannah port narrative confirmed",body:"Strongest single-week gain since campaign launch.",time:"8h ago",ack:true},
];

const CALENDAR = [
  {id:"c1",title:"WSB-TV Atlanta Morning Interview",type:"interview",date:"Apr 7",time:"7:30 AM",loc:"Atlanta, GA",prep:"briefed",urgency:"high",brief:{context:"Entering at a multi-week poll baseline high.",attacks:["Inflation reframe to Savannah port jobs","Collins framing pivot to voting record"],message:"Georgia is building again. 12,000 jobs in Savannah.",ask:"Stay on infrastructure and jobs for 90 seconds.",basedOn:"AJC/UGA poll Apr 1"}},
  {id:"c2",title:"Albany Town Hall South Georgia",type:"town_hall",date:"Apr 10",time:"6:00 PM",loc:"Albany, GA",prep:"unbriefed",urgency:"high",brief:null},
  {id:"c3",title:"Georgia Senate Debate #1",type:"debate",date:"Apr 18",time:"8:00 PM",loc:"Georgia Tech, Atlanta",prep:"briefed",urgency:"critical",brief:{context:"Ossoff enters at +3.7 net. Collins needs a game-changer.",attacks:["Inflation Counter: Georgia jobs numbers","Too liberal: Collins voted against Medicaid expansion twice"],message:"Georgia first. 12,000 jobs. Medicaid expansion Collins blocked.",ask:"Win the first 3 minutes.",basedOn:"AJC/UGA + Internal poll"}},
];

const INIT_PLATFORM = [
  {id:"pl1",title:"Georgia Infrastructure and Jobs Plan",status:"published",category:"Economy",summary:"Federal investment in Savannah port expansion, broadband rural buildout, and workforce training programs.",tags:["jobs","infrastructure"],updated:"Apr 1, 2026"},
  {id:"pl2",title:"Medicaid Expansion Georgia Access Plan",status:"published",category:"Healthcare",summary:"Full ACA Medicaid expansion covering 500,000 uninsured Georgians.",tags:["healthcare","medicaid"],updated:"Mar 28, 2026"},
  {id:"pl3",title:"Climate and Clean Energy Georgia",status:"draft",category:"Environment",summary:"Transition Georgia toward clean energy manufacturing.",tags:["climate","energy"],updated:"Apr 3, 2026"},
  {id:"pl4",title:"Rural Georgia Economic Opportunity Zone",status:"idea",category:"Economy",summary:"Explore federal opportunity zone expansion for rural Georgia counties.",tags:["rural","economy"],updated:"Apr 4, 2026"},
];

const INIT_CONTACTS = [
  {id:"ct1",name:"Marcus Webb",role:"Campaign Manager",org:"Ossoff for Senate",type:"team",phone:"404-555-0182",email:"m.webb@ossoff2026.com",note:"Primary decision-maker on comms strategy.",priority:"primary"},
  {id:"ct2",name:"Dr. Yolanda Price",role:"Communications Director",org:"Ossoff for Senate",type:"team",phone:"404-555-0291",email:"y.price@ossoff2026.com",note:"Oversees all earned media and talking points.",priority:"primary"},
  {id:"ct3",name:"Rev. Claudette Simmons",role:"Community Leader",org:"Greater Atlanta Faith Coalition",type:"community",phone:"404-555-0447",email:"csimmons@gafaithcoalition.org",note:"Key endorser. Connects to Black church network.",priority:"high"},
  {id:"ct4",name:"Tom and Erica Greenberg",role:"Major Donors",org:"Greenberg Family Foundation",type:"donor",phone:"770-555-0561",email:"tgreenberg@greenbergff.org",note:"$250k bundlers. Interested in healthcare and climate.",priority:"high"},
  {id:"ct5",name:"Patricia Okafor",role:"Finance Chair",org:"Ossoff for Senate",type:"team",phone:"404-555-0819",email:"p.okafor@ossoff2026.com",note:"Oversees donor relations.",priority:"primary"},
];

const EXT_CONTEXT = [
  {id:"e1",label:"Georgia Unemployment Rate",val:"3.4%",change:"-0.2%",trend:"down",period:"Mar 2026",src:"GA Dept of Labor",note:"Below national avg (3.8%)."},
  {id:"e2",label:"Georgia GDP Growth",val:"2.9%",change:"+0.4%",trend:"up",period:"Q4 2025",src:"BEA",note:"Outperforming Southeast avg."},
  {id:"e3",label:"GA Healthcare Uninsured Rate",val:"16.1%",change:"-0.3%",trend:"down",period:"2025",src:"KFF",note:"2nd highest in nation."},
  {id:"e4",label:"GA Inflation Rate (CPI)",val:"3.1%",change:"-0.6%",trend:"down",period:"Mar 2026",src:"BLS",note:"Declining. Collins inflation narrative loses traction."},
];

const CORE_TEAM = INIT_CONTACTS.filter(c => c.priority === "primary");

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number | null, d: number = 1) => n == null ? "—" : (n >= 0 ? "+" : "") + n.toFixed(d);
const SEV_COLOR: Record<string,string> = {critical:"#ef4444",high:"#f97316",medium:"#eab308",low:"#22c55e"};
const SEV_BG: Record<string,string> = {critical:"rgba(239,68,68,0.12)",high:"rgba(249,115,22,0.10)",medium:"rgba(234,179,8,0.10)",low:"rgba(34,197,94,0.10)"};
const SENT_COLOR: Record<string,string> = {positive:"#22c55e",negative:"#ef4444",mixed:"#eab308",neutral:"#94a3b8"};
const CONTACT_COLOR: Record<string,string> = {team:"#3b82f6",donor:"#f59e0b",community:"#22c55e",ally:"#8b5cf6"};
const STATUS_COLOR: Record<string,string> = {published:"#22c55e",draft:"#3b82f6",idea:"#f59e0b"};
const TYPE_ICON: Record<string,string> = {newspaper:"📰",broadcast:"📺",social:"💬",reddit:"🔗",blog:"✍️",upload:"📁",wire:"📡",digital:"🖥️"};

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

function Badge({label,color="#334155",bg="rgba(51,65,85,0.4)"}: any) {
  return <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase" as const,color,background:bg,borderRadius:4,padding:"2px 6px"}}>{label}</span>;
}
function DeltaBadge({v}: any) {
  return <span style={{fontSize:11,fontWeight:600,color:v>=0?"#22c55e":"#ef4444"}}>{v>=0?"▲":"▼"} {Math.abs(v).toFixed(1)}pts</span>;
}
function Card({children,style}: any) {
  return <div style={{background:"rgba(15,23,42,0.7)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:10,padding:16,...style}}>{children}</div>;
}
function SL({children}: any) {
  return <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#475569",marginBottom:8}}>{children}</div>;
}
function MiniBar({val,max=100,color="#3b82f6",h=4}: any) {
  return <div style={{background:"rgba(51,65,85,0.4)",borderRadius:2,height:h,overflow:"hidden"}}>
    <div style={{width:`${Math.min(100,(val/max)*100)}%`,height:"100%",background:color,borderRadius:2}}/>
  </div>;
}
function Divider() { return <div style={{height:1,background:"rgba(51,65,85,0.4)",margin:"12px 0"}}/>; }

function Input({value,onChange,placeholder,style}: any) {
  return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{background:"rgba(15,23,42,0.8)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"#e2e8f0",outline:"none",width:"100%",boxSizing:"border-box" as const,...style}}/>;
}
function TextArea({value,onChange,placeholder,rows=3}: any) {
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{background:"rgba(15,23,42,0.8)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"#e2e8f0",outline:"none",width:"100%",boxSizing:"border-box" as const,resize:"vertical" as const,fontFamily:"inherit"}}/>;
}

// ─── AI UPLOAD EXTRACTOR ──────────────────────────────────────────────────────

async function extractFromFile(file: File, type: "platform"|"contact"): Promise<any> {
  const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv");
  let content = "";

  if (isExcel || file.type === "text/csv") {
    content = await file.text();
  } else {
    const reader = new FileReader();
    content = await new Promise((res) => {
      reader.onload = () => res(reader.result as string);
      reader.readAsText(file);
    });
  }

  const prompt = type === "platform"
    ? `Extract policy platform information from this document and return ONLY valid JSON: {"title":"string","category":"Economy|Healthcare|Environment|Education|Democracy|Other","summary":"string","tags":["string"],"status":"draft"}. Document: ${content.slice(0,3000)}`
    : `Extract contact information from this document. This could be a business card, email signature, contact list, or Excel/CSV file. Return ONLY valid JSON array of contacts: [{"name":"string","role":"string","org":"string","type":"team|donor|community|ally","phone":"string","email":"string","note":"string","priority":"primary|high|medium"}]. Document: ${content.slice(0,3000)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  const text = data.content?.map((c: any) => c.text || "").join("") || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ─── MORNING BRIEF ────────────────────────────────────────────────────────────

function MorningBrief() {
  const recentPosts = [
    {who:"Ossoff",platform:"Twitter",content:"Georgia is building again. 12,000 new jobs at the Port of Savannah.",likes:4821,shares:1204,time:"3h ago",sent:"positive"},
    {who:"Collins",platform:"Twitter",content:"Ossoff voted with Biden 96% of the time. Inflation is still hammering Georgia families.",likes:2341,shares:891,time:"8h ago",sent:"negative"},
  ];
  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
      <div style={{fontSize:11,color:"#64748b"}}>Sunday, April 5, 2026 · 6:00 AM ET</div>
      <Badge label="Daily Brief" color="#3b82f6" bg="rgba(59,130,246,0.12)"/>
    </div>
    <Card style={{marginBottom:10}}>
      <SL>How am I doing?</SL>
      <div style={{display:"flex",alignItems:"flex-end",gap:16,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:48,fontWeight:800,color:"#f1f5f9",lineHeight:1}}>47.8<span style={{fontSize:22}}>%</span></div>
          <div style={{fontSize:12,color:"#64748b",marginTop:4}}>Blended approval · 4 polls in signal</div>
        </div>
        <div style={{marginBottom:4}}>
          <div style={{fontSize:20,fontWeight:700,color:"#22c55e"}}>+3.7 net</div>
          <DeltaBadge v={1.6}/> <span style={{fontSize:11,color:"#64748b"}}>this week</span>
        </div>
        <div style={{background:"rgba(59,130,246,0.08)",borderRadius:8,padding:"10px 14px",textAlign:"center"}}>
          <div style={{fontSize:11,color:"#64748b"}}>Lead over Collins</div>
          <div style={{fontSize:28,fontWeight:800,color:"#22c55e"}}>+8.6</div>
        </div>
      </div>
    </Card>
    <Card style={{marginBottom:10}}>
      <SL>What changed and why</SL>
      <p style={{fontSize:13,color:"#cbd5e1",lineHeight:1.6,margin:"0 0 10px"}}>Women 30-55 moved <strong style={{color:"#f1f5f9"}}>+3.2 pts</strong> driven by Savannah port jobs narrative. Collins inflation ads at 900k impressions — no polling movement yet.</p>
      <div style={{fontSize:14,fontWeight:600,color:"#3b82f6",marginBottom:6}}>"Georgia is building again. 12,000 jobs in Savannah. Collins voted against it."</div>
    </Card>
    <Card style={{marginBottom:10}}>
      <SL>Social media pulse</SL>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
        {[{p:"Twitter/X",o:312,c:89,og:2.1},{p:"Instagram",o:198,c:41,og:3.4},{p:"Facebook",o:441,c:127,og:0.8}].map((s,i)=>(
          <div key={i} style={{background:"rgba(15,23,42,0.6)",borderRadius:8,padding:10}}>
            <div style={{fontSize:10,color:"#64748b",marginBottom:6}}>{s.p}</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,color:"#3b82f6"}}>Ossoff</span><span style={{fontSize:11,fontWeight:700,color:"#e2e8f0"}}>{s.o}k</span></div>
            <MiniBar val={s.o} max={500} color="#3b82f6" h={3}/>
            <div style={{fontSize:9,color:"#22c55e",marginBottom:4}}>+{s.og}% / wk</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,color:"#f27070"}}>Collins</span><span style={{fontSize:11,fontWeight:700,color:"#e2e8f0"}}>{s.c}k</span></div>
            <MiniBar val={s.c} max={500} color="#f27070" h={3}/>
          </div>
        ))}
      </div>
      {recentPosts.map((p,i)=>(
        <div key={i} style={{padding:"8px 0",borderBottom:i<recentPosts.length-1?"1px solid rgba(51,65,85,0.3)":"none"}}>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:SENT_COLOR[p.sent]}}/>
            <Badge label={p.who} color={p.who==="Ossoff"?"#3b82f6":"#f27070"} bg={p.who==="Ossoff"?"rgba(59,130,246,0.1)":"rgba(242,112,112,0.1)"}/>
            <Badge label={p.platform} color="#64748b" bg="rgba(51,65,85,0.3)"/>
            <span style={{fontSize:10,color:"#475569",marginLeft:"auto"}}>{p.time}</span>
          </div>
          <div style={{fontSize:12,color:"#94a3b8",fontStyle:"italic"}}>"{p.content}"</div>
        </div>
      ))}
    </Card>
    <Card style={{marginBottom:10}}>
      <SL>Active threats</SL>
      {ALERTS_SEED.filter(a=>!a.ack).slice(0,2).map(a=>(
        <div key={a.id} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:SEV_COLOR[a.sev],marginTop:5,flexShrink:0}}/>
          <div style={{fontSize:11,color:"#94a3b8"}}><span style={{color:SEV_COLOR[a.sev],fontWeight:600}}>{a.sev.toUpperCase()}</span> · {a.title}</div>
        </div>
      ))}
    </Card>
    <Card>
      <SL>Today schedule</SL>
      {CALENDAR.slice(0,3).map(e=>(
        <div key={e.id} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
          <Badge label={e.prep==="briefed"?"Briefed":"Unbriefed"} color={e.prep==="briefed"?"#22c55e":"#f97316"} bg={e.prep==="briefed"?"rgba(34,197,94,0.1)":"rgba(249,115,22,0.1)"}/>
          <div style={{fontSize:12,color:"#cbd5e1"}}>{e.date} {e.time} · {e.title}</div>
        </div>
      ))}
    </Card>
  </div>;
}

// ─── APPROVAL ────────────────────────────────────────────────────────────────

function ApprovalScreen() {
  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      {[{name:"Jon Ossoff",i:"JO",a:47.8,n:3.7,da:1.1,dn:1.6,c:"#3b82f6",r:"Candidate"},{name:"Mike Collins",i:"MC",a:39.2,n:2.4,da:0.6,dn:0.4,c:"#f27070",r:"Opponent"},{name:"Brian Jack",i:"BJ",a:18.3,n:-3.8,da:0.4,dn:-0.2,c:"#f5b944",r:"Tracker"}].map((x,i)=>(
        <Card key={i} style={{flex:1,minWidth:140}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:x.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{x.i}</div>
            <div><div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{x.name}</div><div style={{fontSize:10,color:"#64748b"}}>{x.r}</div></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <div><div style={{fontSize:22,fontWeight:700,color:"#f1f5f9"}}>{x.a.toFixed(1)}<span style={{fontSize:12}}>%</span></div><DeltaBadge v={x.da}/></div>
            <div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontSize:18,fontWeight:700,color:x.n>=0?"#22c55e":"#ef4444"}}>{fmt(x.n)}</div><DeltaBadge v={x.dn}/></div>
          </div>
        </Card>
      ))}
    </div>
    <Card style={{marginBottom:12}}>
      <SL>Demographic breakdown</SL>
      {CANDIDATE.demos.map((d,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <div style={{width:130,fontSize:11,color:"#94a3b8"}}>{d.label}</div>
          <div style={{flex:1,position:"relative",height:6,background:"rgba(51,65,85,0.4)",borderRadius:3,overflow:"hidden"}}>
            <div style={{position:"absolute",left:d.net>=0?"50%":`${50+(d.net/80)*50}%`,width:`${Math.abs(d.net)/80*50}%`,height:"100%",background:d.net>=0?"#3b82f6":"#ef4444",borderRadius:3}}/>
            <div style={{position:"absolute",left:"50%",top:0,width:1,height:"100%",background:"rgba(100,116,139,0.5)"}}/>
          </div>
          <div style={{width:40,fontSize:11,fontWeight:600,color:d.net>=0?"#22c55e":"#ef4444",textAlign:"right"}}>{fmt(d.net)}</div>
        </div>
      ))}
    </Card>
  </div>;
}

// ─── OPPOSITION ───────────────────────────────────────────────────────────────

function OppositionScreen() {
  const [sel,setSel]=useState(0);
  const opp=OPPONENTS[sel];
  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      {OPPONENTS.map((o,i)=>(
        <div key={i} onClick={()=>setSel(i)} style={{flex:1,padding:"10px 14px",borderRadius:8,cursor:"pointer",border:`1px solid ${sel===i?o.color:"rgba(51,65,85,0.5)"}`,background:sel===i?`${o.color}18`:"rgba(15,23,42,0.5)"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{o.short}</div>
          <div style={{fontSize:18,fontWeight:700,color:o.color,marginTop:4}}>{o.approval?.toFixed(1)}%</div>
        </div>
      ))}
    </div>
    <Card style={{marginBottom:12}}>
      <SL>Vulnerabilities</SL>
      {opp.vulnerabilities.map((v,i)=><div key={i} style={{fontSize:12,color:"#cbd5e1",padding:"5px 0",borderBottom:i<opp.vulnerabilities.length-1?"1px solid rgba(51,65,85,0.3)":"none"}}><span style={{color:"#f59e0b",marginRight:6}}>◆</span>{v}</div>)}
    </Card>
    {opp.attackLines.length>0&&<Card>
      <SL>Active attack lines</SL>
      {opp.attackLines.map((a,i)=>(
        <div key={i} style={{padding:"8px 0"}}>
          <div style={{fontSize:12,color:"#e2e8f0",fontStyle:"italic",marginBottom:4}}>"{a.line}"</div>
          <div style={{display:"flex",gap:12}}>
            <span style={{fontSize:10,color:"#64748b"}}>Vol: <strong style={{color:"#94a3b8"}}>{a.vol}</strong></span>
            <span style={{fontSize:10,color:"#64748b"}}>Vel: <strong style={{color:"#f97316"}}>{a.vel}</strong></span>
            <Badge label={a.trend} color={a.trend==="rising"?"#ef4444":"#64748b"} bg={a.trend==="rising"?"rgba(239,68,68,0.1)":"rgba(51,65,85,0.3)"}/>
          </div>
        </div>
      ))}
    </Card>}
  </div>;
}

// ─── NARRATIVES ───────────────────────────────────────────────────────────────

function NarrativesScreen() {
  const [sel,setSel]=useState<string|null>(null);
  const [liveNarratives,setLiveNarratives]=useState<any[]|null>(null);
  const [loading,setLoading]=useState(false);
  const [fetchedAt,setFetchedAt]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const displayed=liveNarratives||NARRATIVES_SEED;

  const fetchLive=async(force=false)=>{
    const CACHE_KEY="polis_narratives",CACHE_TS="polis_narratives_ts",TWELVE=12*60*60*1000;
    if(!force){
      try{const c=sessionStorage.getItem(CACHE_KEY),t=sessionStorage.getItem(CACHE_TS);
        if(c&&t&&Date.now()-parseInt(t)<TWELVE){const d=JSON.parse(c);setLiveNarratives([...d.narratives].sort((a:any,b:any)=>b.vel-a.vel));setFetchedAt(d.fetchedAt);return;}}catch(e){}
    }
    setLoading(true);setError(null);
    try{
      const res=await fetch("/api/narratives");
      const text=await res.text();
      const data=JSON.parse(text);
      if(data.error)throw new Error(data.error);
      sessionStorage.setItem(CACHE_KEY,JSON.stringify(data));
      sessionStorage.setItem(CACHE_TS,Date.now().toString());
      setLiveNarratives([...data.narratives].sort((a:any,b:any)=>b.vel-a.vel));
      setFetchedAt(data.fetchedAt);
    }catch(e:any){setError(e.message);}
    setLoading(false);
  };

  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:11,color:"#64748b"}}>{liveNarratives?`${liveNarratives.length} live narratives · fetched ${new Date(fetchedAt!).toLocaleTimeString()}`:`${NARRATIVES_SEED.length} seed narratives · not yet live`}</div>
      <div style={{display:"flex",gap:6}}>
        <div onClick={()=>fetchLive(false)} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",fontSize:11,color:"#22c55e"}}>{loading?"Fetching...":"Fetch live narratives"}</div>
        <div onClick={()=>fetchLive(true)} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",background:"transparent",border:"1px solid rgba(51,65,85,0.5)",fontSize:11,color:"#475569"}}>Force refresh</div>
      </div>
    </div>
    {error&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#fca5a5"}}>{error}</div>}
    {displayed.map((n:any)=>(
      <Card key={n.id} style={{marginBottom:8,cursor:"pointer",border:`1px solid ${sel===n.id?"rgba(59,130,246,0.4)":"rgba(51,65,85,0.5)"}`}}>
        <div onClick={()=>setSel(sel===n.id?null:n.id)}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <div style={{flex:1,paddingRight:12,display:"flex",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:SENT_COLOR[n.sentiment]||"#94a3b8",marginTop:5,flexShrink:0}}/>
              <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{n.label}</div>
            </div>
            <div style={{display:"flex",gap:12,flexShrink:0}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>{n.vol}</div><div style={{fontSize:9,color:"#64748b"}}>Volume</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:n.vel>0?"#22c55e":n.vel<0?"#ef4444":"#94a3b8"}}>{n.vel>0?"+":""}{n.vel}</div><div style={{fontSize:9,color:"#64748b"}}>Velocity</div></div>
            </div>
          </div>
          <MiniBar val={n.vol} max={100} color={SENT_COLOR[n.sentiment]||"#94a3b8"} h={3}/>
        </div>
        {sel===n.id&&<div><Divider/>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:10}}>{n.detail}</div>
          {n.sources&&n.sources.length>0&&<><SL>Source influence</SL>
          {n.sources.map((s:any,i:number)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:5}}>
              <div style={{fontSize:10}}>{TYPE_ICON[s.type]||"📰"}</div>
              <div style={{width:140,fontSize:11,color:"#94a3b8"}}>{s.name}</div>
              <div style={{flex:1}}><MiniBar val={s.share} max={100} color="#3b82f6" h={5}/></div>
              <div style={{fontSize:11,color:"#94a3b8",width:28,textAlign:"right"}}>{s.share}%</div>
              {s.reachFormatted&&<div style={{fontSize:10,color:"#475569",width:36}}>{s.reachFormatted}</div>}
            </div>
          ))}</>}
          {n.articleUrls&&n.articleUrls.length>0&&<><Divider/><SL>Source articles</SL>
          {n.articleUrls.map((url:string,i:number)=>(
            <div key={i} style={{marginBottom:6}}>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#3b82f6",wordBreak:"break-all" as const,textDecoration:"none"}}>
                → {url.replace(/https?:\/\/(www\.)?/,"").slice(0,80)}{url.length>80?"...":""}
              </a>
            </div>
          ))}</>}
        </div>}
      </Card>
    ))}
  </div>;
}

// ─── OUR PLATFORM ─────────────────────────────────────────────────────────────

function PlatformScreen() {
  const [items,setItems]=useState(INIT_PLATFORM);
  const [sel,setSel]=useState<string|null>(null);
  const [filter,setFilter]=useState("all");
  const [editing,setEditing]=useState<any>(null);
  const [showNew,setShowNew]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [deleteConfirm,setDeleteConfirm]=useState<string|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const [newItem,setNewItem]=useState({title:"",category:"Economy",summary:"",tags:"",status:"draft"});

  const filtered=filter==="all"?items:items.filter(p=>p.status===filter);

  const saveEdit=()=>{
    setItems(prev=>prev.map(p=>p.id===editing.id?editing:p));
    setEditing(null);setSel(null);
  };

  const deleteItem=(id:string)=>{
    setItems(prev=>prev.filter(p=>p.id!==id));
    setDeleteConfirm(null);setSel(null);
  };

  const addItem=()=>{
    const item={...newItem,id:`pl${Date.now()}`,tags:newItem.tags.split(",").map((t:string)=>t.trim()).filter(Boolean),updated:"Apr 9, 2026"};
    setItems(prev=>[item,...prev]);
    setShowNew(false);setNewItem({title:"",category:"Economy",summary:"",tags:"",status:"draft"});
  };

  const handleUpload=async(e:any)=>{
    const file=e.target.files?.[0]; if(!file)return;
    setUploading(true);
    try{
      const result=await extractFromFile(file,"platform");
      const item={...result,id:`pl${Date.now()}`,tags:result.tags||[],updated:"Apr 9, 2026"};
      setItems(prev=>[item,...prev]);
    }catch(err){alert("Could not extract content. Please check the file and try again.");}
    setUploading(false);
    if(fileRef.current)fileRef.current.value="";
  };

  return <div style={{maxWidth:720}}>
    <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx,.csv,.xlsx,.xls" style={{display:"none"}} onChange={handleUpload}/>
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
      {["all","published","draft","idea"].map(s=><div key={s} onClick={()=>setFilter(s)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:filter===s?"rgba(59,130,246,0.15)":"transparent",border:`1px solid ${filter===s?"rgba(59,130,246,0.4)":"rgba(51,65,85,0.5)"}`,fontSize:11,color:filter===s?"#3b82f6":"#64748b",textTransform:"capitalize" as const}}>{s}</div>)}
      <div style={{marginLeft:"auto",display:"flex",gap:6}}>
        <div onClick={()=>fileRef.current?.click()} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.3)",fontSize:11,color:"#a78bfa"}}>{uploading?"Extracting...":"Upload doc"}</div>
        <div onClick={()=>setShowNew(true)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",fontSize:11,color:"#22c55e"}}>+ New</div>
      </div>
    </div>

    {showNew&&<Card style={{marginBottom:12,border:"1px solid rgba(34,197,94,0.3)"}}>
      <SL>New platform item</SL>
      <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
        <Input value={newItem.title} onChange={(v:string)=>setNewItem(p=>({...p,title:v}))} placeholder="Title"/>
        <Input value={newItem.category} onChange={(v:string)=>setNewItem(p=>({...p,category:v}))} placeholder="Category"/>
        <TextArea value={newItem.summary} onChange={(v:string)=>setNewItem(p=>({...p,summary:v}))} placeholder="Summary"/>
        <Input value={newItem.tags} onChange={(v:string)=>setNewItem(p=>({...p,tags:v}))} placeholder="Tags (comma separated)"/>
        <select value={newItem.status} onChange={e=>setNewItem(p=>({...p,status:e.target.value}))} style={{background:"rgba(15,23,42,0.8)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"#e2e8f0",outline:"none"}}>
          <option value="idea">Idea</option><option value="draft">Draft</option><option value="published">Published</option>
        </select>
        <div style={{display:"flex",gap:8}}>
          <div onClick={addItem} style={{padding:"6px 14px",borderRadius:6,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",fontSize:12,color:"#22c55e",cursor:"pointer"}}>Save</div>
          <div onClick={()=>setShowNew(false)} style={{padding:"6px 14px",borderRadius:6,background:"rgba(51,65,85,0.3)",border:"1px solid rgba(51,65,85,0.5)",fontSize:12,color:"#64748b",cursor:"pointer"}}>Cancel</div>
        </div>
      </div>
    </Card>}

    {filtered.map(item=>(
      <Card key={item.id} style={{marginBottom:8,borderLeft:`3px solid ${STATUS_COLOR[item.status]}`}}>
        {editing?.id===item.id?(
          <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
            <Input value={editing.title} onChange={(v:string)=>setEditing((p:any)=>({...p,title:v}))} placeholder="Title"/>
            <Input value={editing.category} onChange={(v:string)=>setEditing((p:any)=>({...p,category:v}))} placeholder="Category"/>
            <TextArea value={editing.summary} onChange={(v:string)=>setEditing((p:any)=>({...p,summary:v}))} placeholder="Summary"/>
            <Input value={editing.tags?.join(", ")} onChange={(v:string)=>setEditing((p:any)=>({...p,tags:v.split(",").map((t:string)=>t.trim())}))} placeholder="Tags"/>
            <select value={editing.status} onChange={e=>setEditing((p:any)=>({...p,status:e.target.value}))} style={{background:"rgba(15,23,42,0.8)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"#e2e8f0",outline:"none"}}>
              <option value="idea">Idea</option><option value="draft">Draft</option><option value="published">Published</option>
            </select>
            <div style={{display:"flex",gap:8}}>
              <div onClick={saveEdit} style={{padding:"6px 14px",borderRadius:6,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",fontSize:12,color:"#22c55e",cursor:"pointer"}}>Save</div>
              <div onClick={()=>setEditing(null)} style={{padding:"6px 14px",borderRadius:6,background:"rgba(51,65,85,0.3)",border:"1px solid rgba(51,65,85,0.5)",fontSize:12,color:"#64748b",cursor:"pointer"}}>Cancel</div>
            </div>
          </div>
        ):(
          <div onClick={()=>setSel(sel===item.id?null:item.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div><div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{item.title}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{item.category} · {item.updated}</div></div>
              <Badge label={item.status} color={STATUS_COLOR[item.status]} bg={`${STATUS_COLOR[item.status]}18`}/>
            </div>
            <div style={{fontSize:12,color:"#94a3b8"}}>{item.summary}</div>
          </div>
        )}
        {sel===item.id&&!editing&&<div><Divider/>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <div onClick={()=>setEditing({...item})} style={{padding:"5px 10px",borderRadius:5,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",fontSize:11,color:"#3b82f6",cursor:"pointer"}}>Edit</div>
            {deleteConfirm===item.id?(
              <><div onClick={()=>deleteItem(item.id)} style={{padding:"5px 10px",borderRadius:5,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",fontSize:11,color:"#ef4444",cursor:"pointer"}}>Confirm delete</div>
              <div onClick={()=>setDeleteConfirm(null)} style={{padding:"5px 10px",borderRadius:5,background:"rgba(51,65,85,0.3)",border:"1px solid rgba(51,65,85,0.5)",fontSize:11,color:"#64748b",cursor:"pointer"}}>Cancel</div></>
            ):(
              <div onClick={()=>setDeleteConfirm(item.id)} style={{padding:"5px 10px",borderRadius:5,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",fontSize:11,color:"#ef4444",cursor:"pointer"}}>Delete</div>
            )}
          </div>
        </div>}
      </Card>
    ))}
  </div>;
}

// ─── CONTACTS ─────────────────────────────────────────────────────────────────

function ContactsScreen() {
  const [contacts,setContacts]=useState(INIT_CONTACTS);
  const [filter,setFilter]=useState("all");
  const [sel,setSel]=useState<string|null>(null);
  const [search,setSearch]=useState("");
  const [editing,setEditing]=useState<any>(null);
  const [showNew,setShowNew]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [deleteConfirm,setDeleteConfirm]=useState<string|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const [newContact,setNewContact]=useState({name:"",role:"",org:"",type:"team",phone:"",email:"",note:"",priority:"medium"});

  const filtered=contacts.filter(c=>(filter==="all"||c.type===filter)&&(search===""||c.name.toLowerCase().includes(search.toLowerCase())||c.role.toLowerCase().includes(search.toLowerCase())));

  const saveEdit=()=>{setContacts(prev=>prev.map(c=>c.id===editing.id?editing:c));setEditing(null);setSel(null);};
  const deleteContact=(id:string)=>{setContacts(prev=>prev.filter(c=>c.id!==id));setDeleteConfirm(null);setSel(null);};
  const addContact=()=>{
    setContacts(prev=>[{...newContact,id:`ct${Date.now()}`},...prev]);
    setShowNew(false);setNewContact({name:"",role:"",org:"",type:"team",phone:"",email:"",note:"",priority:"medium"});
  };

  const handleUpload=async(e:any)=>{
    const file=e.target.files?.[0]; if(!file)return;
    setUploading(true);
    try{
      const result=await extractFromFile(file,"contact");
      const arr=Array.isArray(result)?result:[result];
      const newContacts=arr.map((c:any)=>({...c,id:`ct${Date.now()}-${Math.random()}`}));
      setContacts(prev=>[...newContacts,...prev]);
    }catch(err){alert("Could not extract contacts. Please check the file and try again.");}
    setUploading(false);
    if(fileRef.current)fileRef.current.value="";
  };

  const EditForm=({data,setData,onSave,onCancel}:any)=>(
    <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      <Input value={data.name} onChange={(v:string)=>setData((p:any)=>({...p,name:v}))} placeholder="Full name"/>
      <Input value={data.role} onChange={(v:string)=>setData((p:any)=>({...p,role:v}))} placeholder="Role / Title"/>
      <Input value={data.org} onChange={(v:string)=>setData((p:any)=>({...p,org:v}))} placeholder="Organization"/>
      <Input value={data.phone} onChange={(v:string)=>setData((p:any)=>({...p,phone:v}))} placeholder="Phone"/>
      <Input value={data.email} onChange={(v:string)=>setData((p:any)=>({...p,email:v}))} placeholder="Email"/>
      <div style={{display:"flex",gap:8}}>
        <select value={data.type} onChange={e=>setData((p:any)=>({...p,type:e.target.value}))} style={{flex:1,background:"rgba(15,23,42,0.8)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"#e2e8f0",outline:"none"}}>
          <option value="team">Team</option><option value="donor">Donor</option><option value="community">Community</option><option value="ally">Ally</option>
        </select>
        <select value={data.priority} onChange={e=>setData((p:any)=>({...p,priority:e.target.value}))} style={{flex:1,background:"rgba(15,23,42,0.8)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"#e2e8f0",outline:"none"}}>
          <option value="primary">Primary</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
      </div>
      <TextArea value={data.note} onChange={(v:string)=>setData((p:any)=>({...p,note:v}))} placeholder="Notes" rows={2}/>
      <div style={{display:"flex",gap:8}}>
        <div onClick={onSave} style={{padding:"6px 14px",borderRadius:6,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",fontSize:12,color:"#22c55e",cursor:"pointer"}}>Save</div>
        <div onClick={onCancel} style={{padding:"6px 14px",borderRadius:6,background:"rgba(51,65,85,0.3)",border:"1px solid rgba(51,65,85,0.5)",fontSize:12,color:"#64748b",cursor:"pointer"}}>Cancel</div>
      </div>
    </div>
  );

  return <div style={{maxWidth:720}}>
    <input ref={fileRef} type="file" accept=".pdf,.txt,.csv,.xlsx,.xls,.vcf" style={{display:"none"}} onChange={handleUpload}/>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      <Input value={search} onChange={setSearch} placeholder="Search contacts..." style={{flex:"1 1 160px"}}/>
      {["all","team","donor","community","ally"].map(t=><div key={t} onClick={()=>setFilter(t)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:filter===t?"rgba(59,130,246,0.15)":"transparent",border:`1px solid ${filter===t?"rgba(59,130,246,0.4)":"rgba(51,65,85,0.5)"}`,fontSize:11,color:filter===t?"#3b82f6":"#64748b",textTransform:"capitalize" as const}}>{t}</div>)}
      <div onClick={()=>fileRef.current?.click()} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.3)",fontSize:11,color:"#a78bfa"}}>{uploading?"Extracting...":"Upload list"}</div>
      <div onClick={()=>setShowNew(true)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",fontSize:11,color:"#22c55e"}}>+ Add</div>
    </div>

    {showNew&&<Card style={{marginBottom:12,border:"1px solid rgba(34,197,94,0.3)"}}>
      <SL>New contact</SL>
      <EditForm data={newContact} setData={setNewContact} onSave={addContact} onCancel={()=>setShowNew(false)}/>
    </Card>}

    {filtered.map(ct=>(
      <Card key={ct.id} style={{marginBottom:8,borderLeft:`3px solid ${CONTACT_COLOR[ct.type]}`}}>
        {editing?.id===ct.id?(
          <EditForm data={editing} setData={setEditing} onSave={saveEdit} onCancel={()=>setEditing(null)}/>
        ):(
          <div onClick={()=>setSel(sel===ct.id?null:ct.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:CONTACT_COLOR[ct.type],display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0}}>{ct.name.split(" ").map((n:string)=>n[0]).slice(0,2).join("")}</div>
                <div><div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{ct.name}</div><div style={{fontSize:11,color:"#64748b"}}>{ct.role} · {ct.org}</div></div>
              </div>
              <div style={{display:"flex",gap:6}}><Badge label={ct.type} color={CONTACT_COLOR[ct.type]} bg={`${CONTACT_COLOR[ct.type]}18`}/></div>
            </div>
          </div>
        )}
        {sel===ct.id&&!editing&&<div><Divider/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div><div style={{fontSize:10,color:"#475569",marginBottom:2}}>PHONE</div><div style={{fontSize:12,color:"#3b82f6"}}>{ct.phone}</div></div>
            <div><div style={{fontSize:10,color:"#475569",marginBottom:2}}>EMAIL</div><div style={{fontSize:12,color:"#3b82f6",wordBreak:"break-all" as const}}>{ct.email}</div></div>
          </div>
          {ct.note&&<div style={{fontSize:12,color:"#94a3b8",fontStyle:"italic",background:"rgba(15,23,42,0.5)",borderRadius:6,padding:"8px 10px",marginBottom:10}}>{ct.note}</div>}
          <div style={{display:"flex",gap:8}}>
            <div onClick={()=>setEditing({...ct})} style={{padding:"5px 10px",borderRadius:5,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",fontSize:11,color:"#3b82f6",cursor:"pointer"}}>Edit</div>
            {deleteConfirm===ct.id?(
              <><div onClick={()=>deleteContact(ct.id)} style={{padding:"5px 10px",borderRadius:5,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",fontSize:11,color:"#ef4444",cursor:"pointer"}}>Confirm delete</div>
              <div onClick={()=>setDeleteConfirm(null)} style={{padding:"5px 10px",borderRadius:5,background:"rgba(51,65,85,0.3)",border:"1px solid rgba(51,65,85,0.5)",fontSize:11,color:"#64748b",cursor:"pointer"}}>Cancel</div></>
            ):(
              <div onClick={()=>setDeleteConfirm(ct.id)} style={{padding:"5px 10px",borderRadius:5,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",fontSize:11,color:"#ef4444",cursor:"pointer"}}>Delete</div>
            )}
          </div>
        </div>}
      </Card>
    ))}
  </div>;
}

// ─── ALERTS ───────────────────────────────────────────────────────────────────

function AlertsScreen() {
  const [alerts,setAlerts]=useState(ALERTS_SEED);
  const ack=(id:string)=>setAlerts(prev=>prev.map(a=>a.id===id?{...a,ack:true}:a));
  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",gap:10,marginBottom:14}}>
      {["critical","high","medium"].map(s=>{
        const cnt=alerts.filter(a=>a.sev===s&&!a.ack).length;
        return <Card key={s} style={{flex:1,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:SEV_COLOR[s]}}>{cnt}</div><div style={{fontSize:10,color:"#64748b",textTransform:"uppercase" as const}}>{s}</div></Card>;
      })}
    </div>
    {alerts.map(a=>(
      <Card key={a.id} style={{marginBottom:8,opacity:a.ack?0.5:1,borderLeft:`3px solid ${SEV_COLOR[a.sev]}`,background:a.ack?"rgba(15,23,42,0.4)":SEV_BG[a.sev]}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,paddingRight:10}}>
            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
              <Badge label={a.sev} color={SEV_COLOR[a.sev]} bg={`${SEV_COLOR[a.sev]}18`}/>
              <span style={{fontSize:10,color:"#475569"}}>{a.time}</span>
            </div>
            <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>{a.title}</div>
            <div style={{fontSize:12,color:"#94a3b8"}}>{a.body}</div>
          </div>
          {!a.ack&&<div onClick={()=>ack(a.id)} style={{fontSize:10,color:"#475569",cursor:"pointer",padding:"4px 8px",border:"1px solid rgba(51,65,85,0.5)",borderRadius:4,whiteSpace:"nowrap" as const,marginTop:4}}>Ack</div>}
        </div>
      </Card>
    ))}
  </div>;
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

function CalendarScreen() {
  const [sel,setSel]=useState<string|null>(null);
  const [generating,setGenerating]=useState<string|null>(null);
  const [generatedBriefs,setGeneratedBriefs]=useState<Record<string,any>>({});
  const URG: Record<string,string>={critical:"#ef4444",high:"#f97316",medium:"#eab308"};
  const genBrief=async(ev:any)=>{
    setGenerating(ev.id);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:`You are Polis. Generate a prep brief for Jon Ossoff (D-GA, 47.8% approval) for: "${ev.title}" on ${ev.date}. Return ONLY valid JSON: {"context":"string","attacks":["string"],"message":"string","ask":"string","basedOn":"string"}`}]})});
      const data=await res.json();
      const text=data.content?.map((c:any)=>c.text||"").join("")||"";
      setGeneratedBriefs((p:any)=>({...p,[ev.id]:JSON.parse(text.replace(/```json|```/g,"").trim())}));
    }catch(e){setGeneratedBriefs((p:any)=>({...p,[ev.id]:{context:"Ossoff enters at +3.7 net.",attacks:["Inflation pivot to jobs"],message:"Georgia jobs first.",ask:"Set economic frame early.",basedOn:"AJC poll Apr 1"}}));}
    setGenerating(null);
  };
  const getBrief=(ev:any)=>generatedBriefs[ev.id]||ev.brief;
  return <div style={{maxWidth:720}}>
    {CALENDAR.map(ev=>(
      <Card key={ev.id} style={{marginBottom:8,borderLeft:`3px solid ${URG[ev.urgency]||"#475569"}`}}>
        <div onClick={()=>setSel(sel===ev.id?null:ev.id)} style={{cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{ev.title}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{ev.date} · {ev.time} · {ev.loc}</div></div>
            <div style={{display:"flex",gap:6}}>
              <Badge label={ev.urgency} color={URG[ev.urgency]||"#475569"} bg={`${URG[ev.urgency]||"#475569"}18`}/>
              <Badge label={getBrief(ev)?"Briefed":"Unbriefed"} color={getBrief(ev)?"#22c55e":"#f97316"} bg={getBrief(ev)?"rgba(34,197,94,0.1)":"rgba(249,115,22,0.1)"}/>
            </div>
          </div>
        </div>
        {sel===ev.id&&<div><Divider/>
          {getBrief(ev)?<div>
            <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>{getBrief(ev).context}</div>
            {getBrief(ev).attacks?.map((a:string,i:number)=><div key={i} style={{fontSize:12,color:"#cbd5e1",padding:"4px 0"}}><span style={{color:"#ef4444",marginRight:6}}>!</span>{a}</div>)}
            <Divider/>
            <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#475569",marginBottom:4}}>MESSAGE</div><div style={{fontSize:13,fontWeight:600,color:"#3b82f6"}}>{getBrief(ev).message}</div></div>
            <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#475569",marginBottom:4}}>ASK</div><div style={{fontSize:12,color:"#e2e8f0"}}>{getBrief(ev).ask}</div></div>
          </div>:<div>
            <div onClick={()=>genBrief(ev)} style={{background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:12,color:"#3b82f6",display:"inline-block"}}>{generating===ev.id?"Generating...":"Generate prep brief"}</div>
          </div>}
        </div>}
      </Card>
    ))}
  </div>;
}

// ─── EXTERNAL CONTEXT ─────────────────────────────────────────────────────────

function ExternalContextScreen() {
  const trendColors: Record<string,string>={up:"#22c55e",down:"#ef4444",flat:"#94a3b8"};
  const trends: Record<string,string>={up:"▲",down:"▼",flat:"→"};
  return <div style={{maxWidth:720}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
      {EXT_CONTEXT.map((m,i)=>(
        <Card key={i} style={{borderTop:`2px solid ${trendColors[m.trend]}`}}>
          <div style={{fontSize:11,color:"#64748b",marginBottom:6}}>{m.label}</div>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
            <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9"}}>{m.val}</div>
            <div style={{fontSize:11,fontWeight:600,color:trendColors[m.trend]}}>{trends[m.trend]} {m.change}</div>
          </div>
          <div style={{fontSize:10,color:"#475569",marginBottom:4}}>{m.src} · {m.period}</div>
          <div style={{fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>{m.note}</div>
        </Card>
      ))}
    </div>
  </div>;
}

// ─── NAV STRUCTURE ────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {id:"overview",label:"Overview",icon:"☀",screens:[{id:"brief",label:"Morning Brief",icon:"☀"}]},
  {id:"performance",label:"Performance",icon:"◈",screens:[{id:"approval",label:"Approval",icon:"◈"},{id:"opposition",label:"Opposition",icon:"⚔"}]},
  {id:"platform",label:"Platform",icon:"◆",screens:[{id:"narratives",label:"What They're Saying",icon:"◎"},{id:"platform_items",label:"Our Platform",icon:"💡"},{id:"ext_context",label:"External Context",icon:"🌐"}]},
  {id:"logistics",label:"Logistics",icon:"📅",screens:[{id:"calendar",label:"Calendar & Prep",icon:"📅"},{id:"contacts",label:"Contacts",icon:"👥"}]},
  {id:"alerts",label:"Alerts",icon:"⚡",screens:[{id:"alerts",label:"Alerts",icon:"⚡"}]},
];

const ALL_SCREENS = NAV_GROUPS.flatMap(g=>g.screens);

const BOTTOM_TABS = [
  {id:"brief",label:"Brief",icon:"☀"},
  {id:"approval",label:"Performance",icon:"◈"},
  {id:"narratives",label:"Intel",icon:"◎"},
  {id:"calendar",label:"Logistics",icon:"📅"},
  {id:"alerts",label:"Alerts",icon:"⚡"},
];

// ─── APP SHELL ────────────────────────────────────────────────────────────────

export default function App() {
  const [screen,setScreen]=useState("brief");
  const [openGroups,setOpenGroups]=useState<Record<string,boolean>>({overview:true,performance:true,platform:false,logistics:false,alerts:false});
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const isMobile=useIsMobile();
  const unread=ALERTS_SEED.filter(a=>!a.ack).length;
  const toggleGroup=(id:string)=>setOpenGroups(p=>({...p,[id]:!p[id]}));

  const renderScreen=()=>{
    switch(screen){
      case "brief": return <MorningBrief/>;
      case "approval": return <ApprovalScreen/>;
      case "opposition": return <OppositionScreen/>;
      case "narratives": return <NarrativesScreen/>;
      case "platform_items": return <PlatformScreen/>;
      case "ext_context": return <ExternalContextScreen/>;
      case "calendar": return <CalendarScreen/>;
      case "contacts": return <ContactsScreen/>;
      case "alerts": return <AlertsScreen/>;
      default: return <MorningBrief/>;
    }
  };

  const curScreen=ALL_SCREENS.find(s=>s.id===screen);

  // ─── MOBILE LAYOUT ──────────────────────────────────────────────────────────

  if(isMobile) return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",fontFamily:"'Inter',-apple-system,sans-serif",background:"#060d1a",color:"#e2e8f0",overflow:"hidden"}}>
      {/* Mobile top bar */}
      <div style={{height:52,background:"rgba(5,10,24,0.97)",borderBottom:"1px solid rgba(30,41,59,0.8)",display:"flex",alignItems:"center",padding:"0 16px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:24,height:24,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>P</div>
          <span style={{fontSize:15,fontWeight:800,color:"#f1f5f9"}}>Polis</span>
        </div>
        <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{curScreen?.label}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {unread>0&&<div onClick={()=>setScreen("alerts")} style={{background:"rgba(239,68,68,0.2)",borderRadius:10,padding:"2px 7px",fontSize:10,color:"#f87171",fontWeight:700}}>{unread}</div>}
          <div onClick={()=>setMobileMenuOpen(o=>!o)} style={{fontSize:18,color:"#64748b",cursor:"pointer",padding:"4px"}}>☰</div>
        </div>
      </div>

      {/* Mobile slide-over menu */}
      {mobileMenuOpen&&<div style={{position:"fixed",inset:0,zIndex:100}} onClick={()=>setMobileMenuOpen(false)}>
        <div style={{position:"absolute",top:0,right:0,width:240,height:"100%",background:"rgba(5,10,24,0.98)",borderLeft:"1px solid rgba(30,41,59,0.8)",padding:"16px 0",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:"0 16px 12px",borderBottom:"1px solid rgba(30,41,59,0.6)",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:"#f1f5f9"}}>Jon Ossoff</div>
            <div style={{fontSize:10,color:"#64748b"}}>D · Georgia Senate 2026</div>
            <div style={{display:"flex",gap:10,marginTop:6}}>
              <div><div style={{fontSize:16,fontWeight:800,color:"#3b82f6"}}>47.8%</div><div style={{fontSize:8,color:"#475569"}}>Approval</div></div>
              <div><div style={{fontSize:16,fontWeight:800,color:"#22c55e"}}>+3.7</div><div style={{fontSize:8,color:"#475569"}}>Net</div></div>
            </div>
          </div>
          {NAV_GROUPS.map(group=>(
            <div key={group.id}>
              <div onClick={()=>toggleGroup(group.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",cursor:"pointer"}}>
                <span style={{fontSize:12}}>{group.icon}</span>
                <span style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.04em",flex:1}}>{group.label}</span>
                <span style={{fontSize:10,color:"#334155"}}>{openGroups[group.id]?"▾":"▸"}</span>
              </div>
              {openGroups[group.id]&&group.screens.map(s=>(
                <div key={s.id} onClick={()=>{setScreen(s.id);setMobileMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px 8px 32px",cursor:"pointer",background:screen===s.id?"rgba(59,130,246,0.1)":"transparent"}}>
                  <span style={{fontSize:12,opacity:0.7}}>{s.icon}</span>
                  <span style={{fontSize:12,color:screen===s.id?"#93c5fd":"#64748b",fontWeight:screen===s.id?600:400}}>{s.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>}

      {/* Mobile content */}
      <div style={{flex:1,overflowY:"auto",padding:16,paddingBottom:80}}>
        {renderScreen()}
      </div>

      {/* Mobile bottom tab bar */}
      <div style={{height:64,background:"rgba(5,10,24,0.97)",borderTop:"1px solid rgba(30,41,59,0.8)",display:"flex",alignItems:"center",justifyContent:"space-around",flexShrink:0,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {BOTTOM_TABS.map(tab=>{
          const active=screen===tab.id||(tab.id==="approval"&&["approval","opposition","polls","social"].includes(screen))||(tab.id==="narratives"&&["narratives","platform_items","ext_context","talking"].includes(screen))||(tab.id==="calendar"&&["calendar","contacts"].includes(screen));
          return <div key={tab.id} onClick={()=>setScreen(tab.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",padding:"4px 12px",position:"relative"}}>
            <span style={{fontSize:20}}>{tab.icon}</span>
            <span style={{fontSize:9,color:active?"#3b82f6":"#475569",fontWeight:active?700:400}}>{tab.label}</span>
            {tab.id==="alerts"&&unread>0&&<div style={{position:"absolute",top:0,right:8,background:"#ef4444",borderRadius:8,padding:"1px 4px",fontSize:8,color:"#fff",fontWeight:700}}>{unread}</div>}
          </div>;
        })}
      </div>
    </div>
  );

  // ─── DESKTOP LAYOUT ─────────────────────────────────────────────────────────

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"'Inter',-apple-system,sans-serif",background:"#060d1a",color:"#e2e8f0",overflow:"hidden"}}>
      <div style={{width:208,flexShrink:0,background:"rgba(5,10,24,0.97)",borderRight:"1px solid rgba(30,41,59,0.8)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"14px 14px 10px",borderBottom:"1px solid rgba(30,41,59,0.6)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:26,height:26,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>P</div>
            <span style={{fontSize:16,fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.02em"}}>Polis</span>
          </div>
        </div>
        <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(30,41,59,0.6)"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#f1f5f9"}}>Jon Ossoff</div>
          <div style={{fontSize:10,color:"#64748b"}}>D · Georgia Senate 2026</div>
          <div style={{display:"flex",gap:10,marginTop:6}}>
            <div><div style={{fontSize:18,fontWeight:800,color:"#3b82f6"}}>47.8%</div><div style={{fontSize:8,color:"#475569"}}>Approval</div></div>
            <div><div style={{fontSize:18,fontWeight:800,color:"#22c55e"}}>+3.7</div><div style={{fontSize:8,color:"#475569"}}>Net</div></div>
            <div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontSize:18,fontWeight:800,color:"#22c55e"}}>+8.6</div><div style={{fontSize:8,color:"#475569"}}>vs Collins</div></div>
          </div>
        </div>
        <nav style={{flex:1,padding:"6px",overflowY:"auto"}}>
          {NAV_GROUPS.map(group=>{
            const isOpen=openGroups[group.id];
            const hasActive=group.screens.some(s=>s.id===screen);
            return <div key={group.id} style={{marginBottom:2}}>
              <div onClick={()=>toggleGroup(group.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:6,cursor:"pointer",background:hasActive&&!isOpen?"rgba(59,130,246,0.06)":"transparent"}}>
                <span style={{fontSize:13,width:18,textAlign:"center",flexShrink:0}}>{group.icon}</span>
                <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.04em",color:hasActive?"#93c5fd":"#475569",flex:1,textTransform:"uppercase"}}>
                  {group.label}
                  {group.id==="alerts"&&unread>0&&<span style={{marginLeft:5,background:"#ef4444",color:"#fff",borderRadius:8,padding:"1px 5px",fontSize:9}}>{unread}</span>}
                </span>
                <span style={{fontSize:10,color:"#334155"}}>{isOpen?"▾":"▸"}</span>
              </div>
              {isOpen&&group.screens.map(s=>(
                <div key={s.id} onClick={()=>setScreen(s.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px 5px 30px",borderRadius:6,cursor:"pointer",marginBottom:1,background:screen===s.id?"rgba(59,130,246,0.12)":"transparent",border:screen===s.id?"1px solid rgba(59,130,246,0.2)":"1px solid transparent"}}>
                  <span style={{fontSize:12,width:16,textAlign:"center",flexShrink:0,opacity:0.7}}>{s.icon}</span>
                  <span style={{fontSize:12,color:screen===s.id?"#93c5fd":"#64748b",fontWeight:screen===s.id?600:400,whiteSpace:"nowrap"}}>
                    {s.label}
                    {s.id==="alerts"&&unread>0&&<span style={{marginLeft:4,background:"#ef4444",color:"#fff",borderRadius:8,padding:"1px 4px",fontSize:9}}>{unread}</span>}
                  </span>
                </div>
              ))}
            </div>;
          })}
        </nav>
        <div style={{padding:"8px 14px",borderTop:"1px solid rgba(30,41,59,0.6)",fontSize:9,color:"#1e293b"}}>Georgia U.S. Senate 2026 · Demo</div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{height:46,background:"rgba(5,10,24,0.9)",borderBottom:"1px solid rgba(30,41,59,0.6)",display:"flex",alignItems:"center",padding:"0 20px",gap:12,flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>{curScreen?.icon} {curScreen?.label}</div>
          <div style={{flex:1}}/>
          <div style={{fontSize:11,color:"#334155"}}>April 5, 2026</div>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:6,padding:"4px 10px"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e"}}/>
            <span style={{fontSize:10,color:"#22c55e"}}>Signal live</span>
          </div>
          {unread>0&&<div onClick={()=>setScreen("alerts")} style={{background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:10,color:"#f87171"}}>{unread} alerts</div>}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:20}}>{renderScreen()}</div>
      </div>
    </div>
  );
}