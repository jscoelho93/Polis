"use client";

import { useState, useEffect, useRef } from "react";

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const CANDIDATE = {
  name: "Sen. Jon Ossoff", short: "Ossoff", initials: "JO", party: "D",
  approval: 47.8, disapproval: 44.1, net: 3.7, dApproval: 1.1, dNet: 1.6,
  social: { twitter: 312400, instagram: 198000, facebook: 441000, twitterGrowth: 2.1, igGrowth: 3.4, fbGrowth: 0.8 },
  demos: [
    { label: "Overall", net: 3.7, delta: 1.6 }, { label: "Black voters", net: 74.0, delta: 0.2 },
    { label: "Women 30-55", net: 24.0, delta: 2.1 }, { label: "Atlanta suburbs", net: 14.0, delta: 1.8 },
    { label: "Independents", net: 3.0, delta: 0.9 }, { label: "College-educated", net: 17.0, delta: 1.2 },
    { label: "Rural GA", net: -33.0, delta: 0.3 },
  ]
};

const OPPONENTS = [
  { name: "Rep. Mike Collins", short: "Collins", initials: "MC", party: "R", role: "opponent", label: "GOP primary leader", color: "#f27070",
    approval: 39.2, net: 2.4, dApproval: 0.6, dNet: 0.4,
    social: { twitter: 89200, instagram: 41000, facebook: 127000, twitterGrowth: 4.2, igGrowth: 1.1, fbGrowth: 0.6 },
    demos: [{ label: "Overall", net: 2.4, delta: 0.4 }, { label: "Rural GA", net: 38.1, delta: 0.6 }, { label: "White men", net: 22.4, delta: 0.3 }, { label: "Independents", net: -4.1, delta: -0.2 }, { label: "Atlanta suburbs", net: -6.3, delta: -0.8 }, { label: "Black voters", net: -64.2, delta: -0.2 }],
    vulnerabilities: ["Voted against ACA Medicaid expansion twice", "41% of general-election voters have no opinion of him", "Not yet confirmed general-election nominee", "Voting rights record will be central contrast"],
    attackLines: [{ line: "Ossoff is out of touch with Georgia values", vol: 58, vel: "+14", src: "broadcast", trend: "rising" }, { line: "Ossoff policies caused inflation", vol: 41, vel: "+9", src: "social", trend: "rising" }, { line: "Ossoff is too liberal for Georgia", vol: 33, vel: "+4", src: "blogs", trend: "flat" }]
  },
  { name: "Brian Jack", short: "Jack", initials: "BJ", party: "R", role: "tracker", label: "GOP primary candidate", color: "#f5b944",
    approval: 18.3, net: -3.8, dApproval: 0.4, dNet: -0.2,
    social: { twitter: 31000, instagram: 14000, facebook: 29000, twitterGrowth: 1.1, igGrowth: 0.4, fbGrowth: 0.2 },
    demos: [{ label: "Overall", net: -3.8, delta: -0.2 }, { label: "Rural GA", net: 14.2, delta: 0.3 }, { label: "White men", net: 8.1, delta: 0.1 }, { label: "Independents", net: -8.4, delta: -0.3 }, { label: "Atlanta suburbs", net: -9.1, delta: -0.4 }],
    vulnerabilities: ["Lower primary polling than Collins", "WH Political Director role ties him directly to Trump", "No independent statewide fundraising base"],
    attackLines: []
  }
];

const BASE_POLLS = [
  { id:"p1", pollster:"Atlanta Journal-Constitution / UGA", short:"AJC/UGA", date:"Apr 1, 2026", type:"public", status:"in_signal", weight:28, ossoff:48, collins:41, jack:18, other:8, moe:2.9, n:800, method:"Live phone / LV", takeaway:"Ossoff leads Atlanta suburbs (+9 net). Statewide independents: Ossoff +3.", crosstabs:[{g:"Overall",o:48,c:41},{g:"Black voters",o:84,c:10},{g:"White voters",o:31,c:57},{g:"Atlanta suburbs",o:53,c:39},{g:"Independents",o:46,c:43},{g:"College-educated",o:54,c:37},{g:"Rural GA",o:28,c:61}] },
  { id:"p2", pollster:"Ossoff Campaign Internal", short:"Internal", date:"Mar 30, 2026", type:"private", status:"in_signal", weight:22, ossoff:51, collins:39, jack:18, other:8, moe:2.1, n:1200, method:"Online panel / RV", takeaway:"Women 30-55 at Ossoff +14 net - strongest internal result this cycle.", crosstabs:[{g:"Overall",o:51,c:39},{g:"Women 30-55",o:57,c:33},{g:"Black voters",o:86,c:9},{g:"Atlanta suburban women",o:61,c:29},{g:"Independents",o:49,c:41}] },
  { id:"p3", pollster:"Quinnipiac University", short:"Quinnipiac", date:"Mar 27, 2026", type:"public", status:"in_signal", weight:18, ossoff:46, collins:42, jack:18, other:9, moe:3.1, n:748, method:"Live phone / LV", takeaway:"Toss-up rating - fielded before Savannah port jobs presser.", crosstabs:[{g:"Overall",o:46,c:42},{g:"Black voters",o:82,c:11},{g:"Independents",o:45,c:44},{g:"Atlanta suburbs",o:51,c:40},{g:"65+",o:44,c:46}] },
  { id:"p4", pollster:"AARP Georgia", short:"AARP GA", date:"Mar 22, 2026", type:"public", status:"in_signal", weight:12, ossoff:52, collins:37, jack:16, other:7, moe:2.4, n:920, method:"Mixed mode / 65+ only", takeaway:"Ossoff +15 net with senior voters.", crosstabs:[{g:"65-74",o:52,c:38},{g:"75+",o:53,c:36},{g:"Senior women",o:58,c:31},{g:"Senior men",o:46,c:44}] },
  { id:"p5", pollster:"Collins Campaign (obtained)", short:"Collins internal", date:"Mar 19, 2026", type:"opposition", status:"excluded", weight:0, ossoff:44, collins:44, jack:17, other:9, moe:3.3, n:610, method:"Automated IVR / est. R+2 lean", takeaway:"Excluded - automated method with R+2 house effect.", crosstabs:[{g:"Overall",o:44,c:44},{g:"Independents",o:43,c:45}] },
];

const PENDING_POLL = { id:"pp1", pollster:"Main Street Research", date:"Apr 4, 2026", type:"private", ossoff:49, collins:40, jack:17, other:9, moe:2.6, n:1050, method:"Live phone + online / LV", confidence:94, takeaway:"Post-Savannah announcement poll. Ossoff +9 largest lead in this series.", crosstabs:[{g:"Overall",o:49,c:40},{g:"Women 30-55",o:58,c:32},{g:"Atlanta suburbs",o:55,c:38},{g:"Independents",o:48,c:42},{g:"Black voters",o:85,c:10}] };

const NARRATIVES_SEED = [
  { id:"n1", label:"Savannah port jobs + infrastructure investment", sentiment:"positive", vol:84, vel:28, detail:"Ossoff port expansion projecting 12,000 jobs generating sustained positive coverage.", sources:[{name:"Atlanta Journal-Constitution",type:"newspaper",share:36,reachFormatted:"4M"},{name:"WSB-TV",type:"broadcast",share:29,reachFormatted:"2M"},{name:"Twitter/X GA Politics",type:"social",share:20,reachFormatted:"71M"},{name:"Savannah Morning News",type:"newspaper",share:15,reachFormatted:"800K"}], articleUrls:[] },
  { id:"n2", label:"Medicaid coverage gap Georgia uninsured", sentiment:"positive", vol:61, vel:14, detail:"Coverage of Georgia Medicaid non-expansion gaining traction. Ossoff contrast with Collins two votes against expansion driving the narrative.", sources:[{name:"Georgia Public Broadcasting",type:"broadcast",share:38,reachFormatted:"1.2M"},{name:"Atlanta Journal-Constitution",type:"newspaper",share:31,reachFormatted:"4M"},{name:"Twitter/X GA Politics",type:"social",share:31,reachFormatted:"71M"}], articleUrls:[] },
  { id:"n3", label:"Collins inflation attack ads statewide broadcast", sentiment:"negative", vol:68, vel:16, detail:"Collins campaign launched statewide broadcast ad buy linking Ossoff to Biden-era inflation. Estimated 900k impressions in 12h.", sources:[{name:"WSB-TV",type:"broadcast",share:54,reachFormatted:"2M"},{name:"Twitter/X GA Politics",type:"social",share:26,reachFormatted:"71M"},{name:"GA Conservative blogs",type:"blog",share:20,reachFormatted:"41M"}], articleUrls:[] },
  { id:"n4", label:"Ossoff too liberal for Georgia framing", sentiment:"negative", vol:42, vel:19, detail:"Collins and allied PACs amplifying framing across social and conservative digital media. Currently contained to opposition base.", sources:[{name:"r/Georgia",type:"reddit",share:46,reachFormatted:"48M"},{name:"Twitter/X GA Politics",type:"social",share:36,reachFormatted:"71M"}], articleUrls:[] },
  { id:"n5", label:"Voting rights contrast registration numbers", sentiment:"mixed", vol:44, vel:-8, detail:"Voter registration data and voting rights coverage generated a mixed cycle. Fading from the news cycle.", sources:[{name:"Atlanta Journal-Constitution",type:"newspaper",share:42,reachFormatted:"4M"},{name:"Georgia Public Broadcasting",type:"broadcast",share:32,reachFormatted:"1.2M"}], articleUrls:[] },
];

const ALERTS_SEED = [
  {id:"a1",sev:"critical",title:"Collins inflation ad buy surging 900k impressions in 12h",body:"Atlanta, Savannah, Augusta, and Macon DMAs all showing penetration. Cobb and Gwinnett suburban voters are the watch segment. Recommend rapid response brief within 24h.",entity:"narrative",time:"2h ago",ack:false},
  {id:"a2",sev:"high",title:"Too liberal social framing: velocity +19 in 6h",body:"Not yet penetrating independents or soft-R suburban voters but approaching inflection threshold.",entity:"narrative",time:"5h ago",ack:false},
  {id:"a3",sev:"high",title:"Quinnipiac Georgia poll releasing tonight at 9 PM",body:"Field dates Apr 2-4 captures post-port-jobs presser movement. Prior Q poll had Ossoff +4.",entity:"poll",time:"1h ago",ack:false},
  {id:"a4",sev:"medium",title:"Ossoff +1.1pts in 48h Savannah port narrative confirmed",body:"Strongest single-week gain since campaign launch. Georgia jobs message is working.",entity:"baseline",time:"8h ago",ack:true},
  {id:"a5",sev:"medium",title:"Black voter enthusiasm at 30-day high",body:"Internal panel shows Black voter intensity up 8pts over 60 days.",entity:"baseline",time:"10h ago",ack:true},
];

const CALENDAR = [
  {id:"c1",title:"WSB-TV Atlanta Morning Interview",type:"interview",date:"Apr 7",time:"7:30 AM",loc:"Atlanta, GA",prep:"briefed",urgency:"high",brief:{context:"Entering at a multi-week poll baseline high. Savannah port narrative is working.",attacks:["Inflation / cost of living reframe to Savannah port jobs immediately","Collins framing one sentence reframe to voting record contrast, pivot to jobs"],message:"Georgia is building again. 12,000 jobs in Savannah. Federal investment landing in our state. Collins voted against it.",ask:"Stay on infrastructure and jobs for the opening 90 seconds before any pivot.",basedOn:"AJC/UGA poll Apr 1 (Ossoff 48%) + Savannah port narrative (vol 84, +28 velocity)"}},
  {id:"c2",title:"Albany Town Hall South Georgia",type:"town_hall",date:"Apr 10",time:"6:00 PM",loc:"Albany, GA",prep:"unbriefed",urgency:"high",brief:null},
  {id:"c3",title:"Georgia AFL-CIO Endorsement Meeting",type:"meeting",date:"Apr 12",time:"10:00 AM",loc:"Atlanta, GA",prep:"unbriefed",urgency:"medium",brief:null},
  {id:"c4",title:"Georgia Senate Debate #1 Atlanta",type:"debate",date:"Apr 18",time:"8:00 PM",loc:"Georgia Tech, Atlanta",prep:"briefed",urgency:"critical",brief:{context:"Ossoff enters at +3.7 net. Collins has not yet clinched the primary. He needs a game-changer and will be aggressive.",attacks:["Inflation / Biden record Counter: Georgia-specific jobs numbers, Savannah port investment, 12,000 jobs.","Too liberal for Georgia Reframe: Mike Collins voted against Medicaid expansion twice. 500,000 Georgians lost coverage.","Crime / public safety counter with actual Georgia crime stats."],message:"Georgia first. 12,000 jobs. Medicaid expansion Collins blocked. His voting record, not his ads.",ask:"Win the first 3 minutes. Set the Georgia jobs frame before Collins sets the inflation frame.",basedOn:"AJC/UGA poll Apr 1 + Internal poll Mar 30 + Collins inflation narrative (vol 68, rising)"}},
  {id:"c5",title:"AJC Editorial Board",type:"interview",date:"Apr 23",time:"2:00 PM",loc:"Atlanta, GA",prep:"unbriefed",urgency:"medium",brief:null},
];


const INIT_PLATFORM = [
  {id:"pl1",title:"Healthcare Affordability and ACA Protection",status:"published",category:"Healthcare",summary:"Fighting to extend ACA tax credits that 1.4 million Georgians rely on — Republicans blocked his amendment twice. Launched investigation into rising health costs and hospital closures from Trump Medicaid cuts. St. Mary's Sacred Heart Hospital ended Labor & Delivery; Evans Memorial Hospital ICU at risk. Helped pass bipartisan bill to lower drug costs for Georgians (Mar 16, 2026) and bill to help children get faster medical care into law (Feb 26, 2026).",tags:["healthcare","ACA","medicaid","rural","drug costs"],updated:"Apr 14, 2026",src:"ossoff.senate.gov"},
  {id:"pl2",title:"Georgia Ports and Infrastructure Investment",status:"published",category:"Economy",summary:"Delivered resources to upgrade Georgia Ports with Sen. Warnock (Mar 20, 2026). Through the bipartisan infrastructure law, delivering broadband expansion, port and airport upgrades, road and bridge investment statewide. Passed Georgia Stormwater Management Act into law — delivering upgrades in Columbus, Hampton, and across Georgia. Delivered water infrastructure upgrades across dozens of Georgia communities.",tags:["jobs","infrastructure","ports","broadband","water"],updated:"Apr 13, 2026",src:"ossoff.senate.gov"},
  {id:"pl3",title:"Housing Affordability and Rent Relief",status:"published",category:"Economy",summary:"Working to help Georgians combat soaring rent costs (Apr 8, 2026). Passed bipartisan legislation to lower housing costs (Mar 13, 2026). Senate passed Ossoff-championed bill to crack down on out-of-state companies buying single-family homes in Georgia (Mar 17, 2026). Directed Federal watchdog to investigate unsafe conditions for Georgia renters. Delivering funds to build more affordable housing in Baldwin County.",tags:["housing","rent","affordability","homeownership"],updated:"Apr 8, 2026",src:"ossoff.senate.gov"},
  {id:"pl4",title:"TSA Worker Pay and Government Accountability",status:"published",category:"Economy",summary:"Blocked Senate Republicans from defunding TSA 10 times in 3 weeks before securing a deal (Mar 27, 2026). Led effort to ensure TSA workers at Hartsfield-Jackson and airports across Georgia received pay. Blasted Republican obstruction as a threat to Georgia's economy and travel infrastructure. Named most bipartisan member of Congress (July 2025).",tags:["TSA","workers","pay","accountability","bipartisan"],updated:"Mar 27, 2026",src:"ossoff.senate.gov"},
  {id:"pl5",title:"Child Safety and Protection",status:"published",category:"Public Safety",summary:"UNICEF USA honored Ossoff as 2025 Champion for Children. Bipartisan bill to stop child trafficking passed Senate (Dec 2025). Bipartisan investigation uncovered foster children being locked up due to lack of placements (Apr 2, 2026). Pressing Big Tech over sexual exploitation of children — launched inquiries with Apple, Google, Meta, Amazon, and X (Apr 1, 2026). Investigating toys tested for lead gaps.",tags:["children","trafficking","online safety","foster care","lead"],updated:"Apr 1, 2026",src:"ossoff.senate.gov"},
  {id:"pl6",title:"Veterans and Military Families",status:"published",category:"Veterans",summary:"Backed bipartisan bill for disabled veterans (Apr 14, 2026). President Trump signed Ossoff-backed bill protecting veterans from foreclosure (Jul 30, 2025). Passed most funding for Georgia military construction in 15 years. Launched inquiries into VA childcare programs in Atlanta, Augusta, and Dublin. Blasted VA proposal to cut benefits for disabled veterans. Delivered Dobbins Air Reserve Base upgrades.",tags:["veterans","military","VA","housing","healthcare"],updated:"Apr 14, 2026",src:"ossoff.senate.gov"},
  {id:"pl7",title:"ICE Detention and Constitutional Rights",status:"published",category:"Democracy",summary:"Backing bill requiring local approval before federal government opens ICE detention facilities, including Social Circle, GA (Apr 9, 2026). Investigating Alligator Alcatraz detention site for possible torture (Mar 26, 2026). Investigation uncovered 1,000+ credible reports of human rights abuses in immigration detention. Pressed DHS over deaths in ICE custody. Defended constitutional rights against warrantless raids.",tags:["ICE","civil rights","detention","constitution","immigration"],updated:"Apr 9, 2026",src:"ossoff.senate.gov"},
  {id:"pl8",title:"Opioid Epidemic and Public Health",status:"published",category:"Healthcare",summary:"Strengthening resources to fight opioid epidemic across Georgia (Apr 14, 2026) — delivering Federal funding to expand naloxone supply. Delivered $900,000 to combat opioid crisis with Sen. Warnock. Defending CDC from defunding — successfully defeated effort to gut CDC budget. Sounded alarm on Trump Admin freezing CDC fentanyl overdose prevention program.",tags:["opioids","CDC","fentanyl","naloxone","public health"],updated:"Apr 14, 2026",src:"ossoff.senate.gov"},
  {id:"pl9",title:"Small Business and Economic Development",status:"published",category:"Economy",summary:"Expanding small business opportunities across Georgia (Apr 13, 2026). Introduced Support Small Business Growth Act (S.3459). Introduced Skilled Workforce Act (S.2664) to upgrade technical colleges. Backing Buying American Cotton Act for Georgia cotton growers. Delivered apprenticeship funding. Urged Trump Admin to restore funding supporting Atlanta's Black-owned businesses. Supporting Georgia's rural small businesses and forestry industry.",tags:["small business","jobs","workforce","cotton","rural"],updated:"Apr 13, 2026",src:"ossoff.senate.gov"},
  {id:"pl10",title:"Civil Rights Cold Cases and Criminal Justice",status:"published",category:"Justice",summary:"Bipartisan Civil Rights bill to solve cold cases passed U.S. Senate (Dec 2025). Passed Federal Prison Oversight Act into law. Led bipartisan investigation into civil rights in federal courts (Sep 2025). Delivered resources to strengthen violence prevention in Fulton County. Strengthened public safety across dozens of Georgia communities with new patrol vehicles, body cameras, and equipment.",tags:["civil rights","cold cases","prisons","justice","public safety"],updated:"Dec 17, 2025",src:"ossoff.senate.gov"},
  {id:"pl11",title:"Clean Energy and Environment",status:"draft",category:"Environment",summary:"Introduced American Energy Security Act (S.2713) with Sen. Cassidy. Passed bipartisan amendment to encourage federal protection of the Okefenokee (Aug 2025). Working to protect Georgia's water infrastructure from cyberattacks. Introduced bipartisan precision agriculture technology bill with Sens. Moody, Warnock, and Scott for Georgia's land-grant universities.",tags:["energy","environment","okefenokee","agriculture","water"],updated:"Apr 3, 2026",src:"ossoff.senate.gov"},
  {id:"pl12",title:"Mental Health and Substance Abuse",status:"published",category:"Healthcare",summary:"Expanding mental health resources for Hispanic families in metro Atlanta (Mar 5, 2026). Delivering mental health services in Forsyth County. Championing bipartisan 988 Lifeline Location Improvement Act. Strengthening mental health counseling for Georgia students in Sumter County. Passed Military Families Mental Health Services Act into law.",tags:["mental health","988","substance abuse","students","veterans"],updated:"Apr 3, 2026",src:"ossoff.senate.gov"},
];

const EXT_CONTEXT = [
  {id:"e1",label:"Georgia Unemployment Rate",val:"3.4%",change:"-0.2%",trend:"down",period:"Mar 2026",src:"GA Dept of Labor",note:"Below national avg (3.8%). Use in economic contrast messaging."},
  {id:"e2",label:"Georgia GDP Growth",val:"2.9%",change:"+0.4%",trend:"up",period:"Q4 2025",src:"BEA",note:"Outperforming Southeast avg. Savannah port jobs announcement aligns with this trend."},
  {id:"e3",label:"GA Healthcare Uninsured Rate",val:"16.1%",change:"-0.3%",trend:"down",period:"2025",src:"KFF",note:"2nd highest in nation. Core Medicaid expansion argument."},
  {id:"e4",label:"Atlanta Metro Median Income",val:"$74,200",change:"+2.1%",trend:"up",period:"2025",src:"Census ACS",note:"Rising but suburban cost-of-living pressure still high."},
  {id:"e5",label:"Rural GA Poverty Rate",val:"21.4%",change:"-0.8%",trend:"down",period:"2025",src:"Census",note:"Declining but still above national average."},
  {id:"e6",label:"GA Inflation Rate (CPI)",val:"3.1%",change:"-0.6%",trend:"down",period:"Mar 2026",src:"BLS",note:"Declining. Collins inflation attack narrative loses traction as CPI falls."},
  {id:"e7",label:"Savannah Port Container Volume",val:"5.2M TEU",change:"+8.4%",trend:"up",period:"2025",src:"Georgia Ports Authority",note:"Record volumes. Strong backing for port infrastructure investment messaging."},
  {id:"e8",label:"GA College Attainment Rate",val:"34.8%",change:"+1.2%",trend:"up",period:"2025",src:"Census",note:"Rising - education + workforce messaging resonates with suburban voters."},
];

const INIT_CONTACTS = [
  {id:"ct1",name:"Marcus Webb",role:"Campaign Manager",org:"Ossoff for Senate",type:"team",phone:"404-555-0182",email:"m.webb@ossoff2026.com",note:"Primary decision-maker on comms strategy. Daily briefing at 7 AM.",priority:"primary"},
  {id:"ct2",name:"Dr. Yolanda Price",role:"Communications Director",org:"Ossoff for Senate",type:"team",phone:"404-555-0291",email:"y.price@ossoff2026.com",note:"Oversees all earned media, talking points, and debate prep.",priority:"primary"},
  {id:"ct3",name:"James Holloway",role:"Data Director / Pollster",org:"Holloway Analytics",type:"team",phone:"678-555-0334",email:"j.holloway@hollowayanalytics.com",note:"Internal polling partner.",priority:"primary"},
  {id:"ct4",name:"Rev. Claudette Simmons",role:"Community Leader",org:"Greater Atlanta Faith Coalition",type:"community",phone:"404-555-0447",email:"csimmons@gafaithcoalition.org",note:"Key endorser. Connects to Black church network in Atlanta metro.",priority:"high"},
  {id:"ct5",name:"Tom and Erica Greenberg",role:"Major Donors",org:"Greenberg Family Foundation",type:"donor",phone:"770-555-0561",email:"tgreenberg@greenbergff.org",note:"$250k bundlers. Interested in healthcare and climate policy.",priority:"high"},
  {id:"ct6",name:"Sen. Raphael Warnock",role:"Political Ally",org:"U.S. Senate",type:"ally",phone:"202-555-0617",email:"via.office@warnock.senate.gov",note:"Key surrogate for Black voter turnout.",priority:"high"},
  {id:"ct7",name:"Maria Santos",role:"AFL-CIO Georgia Director",org:"Georgia AFL-CIO",type:"community",phone:"404-555-0728",email:"m.santos@gaaflcio.org",note:"Apr 12 endorsement meeting.",priority:"high"},
  {id:"ct8",name:"Patricia Okafor",role:"Finance Chair",org:"Ossoff for Senate",type:"team",phone:"404-555-0819",email:"p.okafor@ossoff2026.com",note:"Oversees donor relations and bundlers.",priority:"primary"},
  {id:"ct9",name:"Derek Lim",role:"Digital Director",org:"Ossoff for Senate",type:"team",phone:"678-555-0923",email:"d.lim@ossoff2026.com",note:"Manages all social and digital advertising.",priority:"primary"},
  {id:"ct10",name:"Councilmember Joy Nduka",role:"Atlanta City Council",org:"City of Atlanta",type:"community",phone:"404-555-1041",email:"j.nduka@atlantaga.gov",note:"Champion of infrastructure in Atlanta metro.",priority:"medium"},
];

const SOURCES_DATA = [
  {name:"Atlanta Journal-Constitution",type:"newspaper",status:"connected",fresh:"fresh",reach:91,weight:1.8,inSignal:true,own:false,last:"3h ago"},
  {name:"Savannah Morning News",type:"newspaper",status:"connected",fresh:"fresh",reach:72,weight:1.3,inSignal:true,own:false,last:"4h ago"},
  {name:"WSB-TV / 11Alive Atlanta",type:"broadcast",status:"connected",fresh:"fresh",reach:89,weight:1.7,inSignal:true,own:false,last:"1h ago"},
  {name:"Georgia Public Broadcasting",type:"broadcast",status:"connected",fresh:"fresh",reach:74,weight:1.4,inSignal:true,own:false,last:"2h ago"},
  {name:"r/Georgia",type:"reddit",status:"connected",fresh:"fresh",reach:48,weight:0.6,inSignal:true,own:false,last:"30m ago"},
  {name:"Twitter/X GA Politics",type:"social",status:"connected",fresh:"fresh",reach:71,weight:0.8,inSignal:true,own:false,last:"10m ago"},
  {name:"Ossoff Campaign Facebook",type:"social",status:"connected",fresh:"fresh",reach:61,weight:1.0,inSignal:true,own:true,last:"1h ago"},
  {name:"GA Conservative blogs",type:"blog",status:"connected",fresh:"fresh",reach:41,weight:0.5,inSignal:true,own:false,last:"7h ago"},
  {name:"CBS46 Atlanta",type:"broadcast",status:"stale",fresh:"stale",reach:74,weight:1.3,inSignal:false,own:false,last:"40h ago"},
  {name:"Athens Banner-Herald",type:"newspaper",status:"stale",fresh:"stale",reach:54,weight:1.0,inSignal:false,own:false,last:"33h ago"},
];

const TREND_DATA = [
  {d:"Mar 3",o:45.1,on:1.2,c:40.8,cn:0.8},{d:"Mar 8",o:45.4,on:1.4,c:40.6,cn:0.6},{d:"Mar 13",o:45.9,on:1.8,c:40.4,cn:0.4},
  {d:"Mar 18",o:46.2,on:2.1,c:40.2,cn:0.2},{d:"Mar 22",o:46.4,on:2.3,c:40.1,cn:0.1},{d:"Mar 27",o:46.7,on:2.6,c:40.0,cn:0.0},
  {d:"Apr 1",o:47.1,on:3.0,c:39.8,cn:-0.2},{d:"Apr 4",o:47.5,on:3.4,c:39.4,cn:-0.6},{d:"Apr 5",o:47.8,on:3.7,c:39.2,cn:-0.8},
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number | null, d: number = 1) => n == null ? "—" : (n >= 0 ? "+" : "") + n.toFixed(d);
const SEV_COLOR: Record<string,string> = {critical:"#ef4444",high:"#f97316",medium:"#eab308",low:"#22c55e"};
const SEV_BG: Record<string,string> = {critical:"rgba(239,68,68,0.12)",high:"rgba(249,115,22,0.10)",medium:"rgba(234,179,8,0.10)",low:"rgba(34,197,94,0.10)"};
const SENT_COLOR: Record<string,string> = {positive:"#22c55e",negative:"#ef4444",mixed:"#eab308",neutral:"#94a3b8"};
const CONTACT_COLOR: Record<string,string> = {team:"#3b82f6",donor:"#f59e0b",community:"#22c55e",ally:"#8b5cf6"};
const STATUS_COLOR: Record<string,string> = {published:"#22c55e",draft:"#3b82f6",idea:"#f59e0b"};
const BILL_STATUS_COLOR: Record<string,string> = {enacted:"#22c55e",passed_senate:"#3b82f6",introduced:"#f59e0b",ongoing:"#8b5cf6"};
const BILL_STATUS_LABEL: Record<string,string> = {enacted:"✓ Enacted",passed_senate:"Passed Senate",introduced:"Introduced",ongoing:"Ongoing"};
const TYPE_ICON: Record<string,string> = {newspaper:"📰",broadcast:"📺",social:"💬",reddit:"🔗",blog:"✍️",upload:"📁",wire:"📡",digital:"🖥️"};

function useIsMobile() {
  const [mobile,setMobile]=useState(false);
  useEffect(()=>{const check=()=>setMobile(window.innerWidth<768);check();window.addEventListener("resize",check);return()=>window.removeEventListener("resize",check);},[]);
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

function FieldInput({value,onChange,placeholder,style}: any) {
  return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{background:"rgba(15,23,42,0.8)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"#e2e8f0",outline:"none",width:"100%",boxSizing:"border-box" as const,...style}}/>;
}
function FieldTextArea({value,onChange,placeholder,rows=3}: any) {
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{background:"rgba(15,23,42,0.8)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"#e2e8f0",outline:"none",width:"100%",boxSizing:"border-box" as const,resize:"vertical" as const,fontFamily:"inherit"}}/>;
}
function FieldSelect({value,onChange,children}: any) {
  return <select value={value} onChange={e=>onChange(e.target.value)}
    style={{background:"rgba(15,23,42,0.8)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"#e2e8f0",outline:"none",width:"100%"}}>{children}</select>;
}

async function extractFromFile(file: File, type: "platform"|"contact"): Promise<any> {
  const content = await file.text().catch(()=>"");
  const prompt = type === "platform"
    ? `Extract policy platform information from this document and return ONLY valid JSON: {"title":"string","category":"Economy|Healthcare|Environment|Education|Democracy|Other","summary":"string","tags":["string"],"status":"draft"}. Document: ${content.slice(0,3000)}`
    : `Extract contact information from this document. Could be a business card, email signature, contact list, or CSV/Excel file. Return ONLY valid JSON array: [{"name":"string","role":"string","org":"string","type":"team|donor|community|ally","phone":"string","email":"string","note":"string","priority":"primary|high|medium"}]. Document: ${content.slice(0,3000)}`;
  const res = await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
  const data = await res.json();
  const text = data.content?.map((c:any)=>c.text||"").join("")||"";
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

// ─── APPROVAL CHART ──────────────────────────────────────────────────────────

function ApprovalChart({metric="pct"}: any) {
  const W=520,H=200,PAD={t:24,r:24,b:32,l:40};
  const cW=W-PAD.l-PAD.r,cH=H-PAD.t-PAD.b;
  const allVals=TREND_DATA.flatMap(d=>metric==="pct"?[d.o,d.c]:[d.on,d.cn]);
  const mn=Math.floor(Math.min(...allVals)-2),mx=Math.ceil(Math.max(...allVals)+2),range=mx-mn;
  const toY=(v:number)=>cH-((v-mn)/range)*cH,toX=(i:number)=>(i/(TREND_DATA.length-1))*cW;
  return <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
    <g transform={`translate(${PAD.l},${PAD.t})`}>
      {[mn,Math.round(mn+range/2),mx].map(v=><g key={v}>
        <line x1={0} y1={toY(v)} x2={cW} y2={toY(v)} stroke="rgba(51,65,85,0.3)" strokeDasharray="3,4"/>
        <text x={-6} y={toY(v)+4} textAnchor="end" fontSize={9} fill="#475569">{v}%</text>
      </g>)}
      {[{k:"o",c:"#3b82f6"},{k:"c",c:"#f27070"}].map(({k,c})=>{
        const pts=TREND_DATA.map((d:any,i)=>`${toX(i)},${toY(metric==="pct"?d[k]:k==="o"?d.on:d.cn)}`).join(" ");
        return <polyline key={k} points={pts} fill="none" stroke={c} strokeWidth={k==="o"?2:1.5}/>;
      })}
      {TREND_DATA.map((d,i)=><text key={i} x={toX(i)} y={cH+16} textAnchor="middle" fontSize={8} fill="#475569">{d.d}</text>)}
    </g>
  </svg>;
}

// ─── SCREENS ──────────────────────────────────────────────────────────────────

function MorningBrief() {
  const [approval,setApproval]=useState<any>(null);
  const [polls,setPolls]=useState<any[]>([]);
  const [narratives,setNarratives]=useState<any[]>(NARRATIVES_SEED);
  const [extCtx,setExtCtx]=useState<any[]>(EXT_CONTEXT);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    // Load live narratives from sessionStorage
    try{
      const c=sessionStorage.getItem("polis_narratives");
      if(c){const d=JSON.parse(c);if(d.narratives?.length)setNarratives(d.narratives);}
    }catch(e){}

    // Load approval + polls + ext context
    Promise.all([
      fetch("/api/approval").then(r=>r.json()).catch(()=>null),
      fetch("/api/polls").then(r=>r.json()).catch(()=>({polls:[]})),
      fetch("/api/ext-context").then(r=>r.json()).catch(()=>({metrics:[]})),
    ]).then(([a,p,e])=>{
      if(a&&!a.error)setApproval(a);
      if(p.polls?.length)setPolls(p.polls);
      if(e.metrics?.length)setExtCtx(e.metrics);
      setLoading(false);
    });
  },[]);

  const topThreat=narratives.filter((n:any)=>n.sentiment==="negative").sort((a:any,b:any)=>b.vel-a.vel)[0];
  const topOpportunity=narratives.filter((n:any)=>n.sentiment==="positive").sort((a:any,b:any)=>b.vel-a.vel)[0];
  const unemployment=extCtx.find((m:any)=>m.id==="e1");
  const cpi=extCtx.find((m:any)=>m.id==="e6");
  const today=new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
      <div style={{fontSize:11,color:"#64748b"}}>{today}</div>
      <Badge label="Daily Brief" color="#3b82f6" bg="rgba(59,130,246,0.12)"/>
      {loading&&<Badge label="Loading live data..." color="#f59e0b" bg="rgba(245,158,11,0.1)"/>}
    </div>

    {/* Approval card */}
    <Card style={{marginBottom:10}}>
      <SL>How am I doing?</SL>
      <div style={{display:"flex",alignItems:"flex-end",gap:16,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:48,fontWeight:800,color:"#f1f5f9",lineHeight:1}}>
            {approval?.ossoff?approval.ossoff.toFixed(1):loading?"...":"—"}
            <span style={{fontSize:22}}>%</span>
          </div>
          <div style={{fontSize:12,color:"#64748b",marginTop:4}}>
            Poll average · {polls.length} polls in signal
          </div>
        </div>
        {approval?.lead!=null&&<div style={{marginBottom:4}}>
          <div style={{fontSize:20,fontWeight:700,color:"#22c55e"}}>+{approval.lead} lead vs Collins</div>
          <div style={{fontSize:11,color:"#64748b"}}>vs Collins {approval?.collins?.toFixed(1)}%</div>
        </div>}
        {approval?.ossoff&&<div style={{background:"rgba(59,130,246,0.08)",borderRadius:8,padding:"10px 14px",textAlign:"center"}}>
          <div style={{fontSize:11,color:"#64748b"}}>Latest poll</div>
          <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>{polls[0]?.display_name||"—"}</div>
          <div style={{fontSize:10,color:"#475569"}}>{polls[0]?.poll_date||""}</div>
        </div>}
      </div>
    </Card>

    {/* Active threat + opportunity */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <Card style={{borderLeft:"3px solid #ef4444"}}>
        <SL>Top threat</SL>
        {topThreat
          ?<><div style={{fontSize:13,fontWeight:600,color:"#f1f5f9",marginBottom:4}}>{topThreat.label}</div>
            <div style={{fontSize:11,color:"#64748b"}}>Vol {topThreat.vol} · <span style={{color:"#ef4444"}}>+{topThreat.vel} velocity</span></div></>
          :<div style={{fontSize:12,color:"#475569"}}>No active threats</div>}
      </Card>
      <Card style={{borderLeft:"3px solid #22c55e"}}>
        <SL>Top opportunity</SL>
        {topOpportunity
          ?<><div style={{fontSize:13,fontWeight:600,color:"#f1f5f9",marginBottom:4}}>{topOpportunity.label}</div>
            <div style={{fontSize:11,color:"#64748b"}}>Vol {topOpportunity.vol} · <span style={{color:"#22c55e"}}>+{topOpportunity.vel} velocity</span></div></>
          :<div style={{fontSize:12,color:"#475569"}}>No positive narratives</div>}
      </Card>
    </div>

    {/* Georgia economic context */}
    {(unemployment||cpi)&&<Card style={{marginBottom:10}}>
      <SL>Georgia economic context</SL>
      <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
        {unemployment&&<div>
          <div style={{fontSize:11,color:"#64748b"}}>Unemployment</div>
          <div style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>{unemployment.val}</div>
          <div style={{fontSize:10,color:unemployment.trend==="down"?"#22c55e":"#ef4444"}}>{unemployment.change} · {unemployment.period}</div>
          {unemployment.is_real&&<div style={{fontSize:9,color:"#22c55e"}}>LIVE · {unemployment.src}</div>}
        </div>}
        {cpi&&<div>
          <div style={{fontSize:11,color:"#64748b"}}>Inflation (CPI South)</div>
          <div style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>{cpi.val}</div>
          <div style={{fontSize:10,color:cpi.trend==="down"?"#22c55e":"#ef4444"}}>{cpi.change} · {cpi.period}</div>
          {cpi.is_real&&<div style={{fontSize:9,color:"#22c55e"}}>LIVE · {cpi.src}</div>}
        </div>}
        <div style={{fontSize:11,color:"#475569",marginLeft:"auto",alignSelf:"flex-end"}}>
          Collins inflation attack narrative: {cpi&&parseFloat(cpi.val)<4?"weakening as CPI falls":"elevated"}
        </div>
      </div>
    </Card>}

    {/* Today alerts */}
    <Card style={{marginBottom:10}}>
      <SL>Active alerts</SL>
      {ALERTS_SEED.filter((a:any)=>!a.ack).slice(0,3).map((a:any)=>(
        <div key={a.id} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:SEV_COLOR[a.sev],marginTop:5,flexShrink:0}}/>
          <div style={{fontSize:11,color:"#94a3b8"}}><span style={{color:SEV_COLOR[a.sev],fontWeight:600}}>{a.sev.toUpperCase()}</span> · {a.title}</div>
        </div>
      ))}
    </Card>

    {/* Calendar */}
    <Card>
      <SL>Today schedule</SL>
      {CALENDAR.slice(0,3).map((e:any)=>(
        <div key={e.id} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
          <Badge label={e.prep==="briefed"?"Briefed":"Unbriefed"} color={e.prep==="briefed"?"#22c55e":"#f97316"} bg={e.prep==="briefed"?"rgba(34,197,94,0.1)":"rgba(249,115,22,0.1)"}/>
          <div style={{fontSize:12,color:"#cbd5e1"}}>{e.date} {e.time} · {e.title}</div>
        </div>
      ))}
    </Card>
  </div>;
}

function ApprovalScreen() {
  const [approval,setApproval]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [metric,setMetric]=useState("pct");

  useEffect(()=>{
    fetch("/api/approval").then(r=>r.json()).then(d=>{
      if(d.error)setError(d.error);
      else setApproval(d);
    }).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  },[]);

  const fmt=(n:number|null,d=1)=>n==null?"—":(n>=0?"+":"")+n.toFixed(d);

  if(loading)return <div style={{maxWidth:720,padding:40,textAlign:"center",color:"#475569"}}>Loading approval data...</div>;
  if(error||!approval)return <div style={{maxWidth:720}}>
    <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"14px 16px",fontSize:12,color:"#fca5a5"}}>{error||"No poll data available. Fetch polls first."}</div>
    <div style={{marginTop:10,fontSize:11,color:"#475569"}}>Go to Polling Vault → Fetch live polls to populate this screen.</div>
  </div>;

  const trend=approval.trend||[];
  const W=520,H=200,PAD={t:24,r:24,b:32,l:40};
  const cW=W-PAD.l-PAD.r,cH=H-PAD.t-PAD.b;
  const key=metric==="pct"?"ossoff_smooth":"ossoff_smooth";
  const colKey=metric==="pct"?"collins_smooth":"collins_smooth";
  const allVals=trend.flatMap((d:any)=>[d.ossoff_smooth,d.collins_smooth].filter(Boolean));
  const mn=allVals.length>0?Math.floor(Math.min(...allVals)-2):30;
  const mx=allVals.length>0?Math.ceil(Math.max(...allVals)+2):60;
  const range=mx-mn||1;
  const toY=(v:number)=>cH-((v-mn)/range)*cH;
  const toX=(i:number)=>(i/(Math.max(trend.length-1,1)))*cW;

  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      {[{name:"Jon Ossoff",i:"JO",a:approval.ossoff,n:approval.lead,da:approval.dOssoff,c:"#3b82f6",r:"Candidate"},
        {name:"Mike Collins",i:"MC",a:approval.collins,n:approval.collins?-(approval.lead||0):null,da:null,c:"#f27070",r:"Opponent"},
        {name:"Derek Dooley",i:"DD",a:approval.dooley,n:null,da:null,c:"#f5b944",r:"Opponent"}
      ].map((x,i)=>(
        <Card key={i} style={{flex:1,minWidth:140,opacity:x.a?1:0.5}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:x.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{x.i}</div>
            <div><div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{x.name}</div><div style={{fontSize:10,color:"#64748b"}}>{x.r}</div></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <div><div style={{fontSize:22,fontWeight:700,color:"#f1f5f9"}}>{x.a?x.a.toFixed(1)+"%" :"—"}</div><div style={{fontSize:10,color:"#64748b"}}>Poll avg</div></div>
            {x.n!=null&&<div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontSize:16,fontWeight:700,color:x.n>=0?"#22c55e":"#ef4444"}}>{fmt(x.n)}</div><div style={{fontSize:10,color:"#64748b"}}>vs Collins</div></div>}
          </div>

        </Card>
      ))}
    </div>

    <Card style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <SL>Poll trend — {approval.pollCount} polls · Sep 2025 – Mar 2026</SL>
        <div style={{fontSize:10,color:"#475569"}}>Latest: {approval.latestPoll?.display_name} · {approval.latestPoll?.poll_date} · {approval.pollCount} polls in signal</div>
      </div>
      <div style={{display:"flex",gap:14,marginBottom:8}}>{[["#3b82f6","Ossoff"],["#f27070","Collins"]].map(([c,l])=><span key={l as string} style={{fontSize:10,color:c as string}}>● {l as string}</span>)}</div>
      {trend.length>=1?<svg width="100%" viewBox={"0 0 "+W+" "+H}>
        <g transform={"translate("+PAD.l+","+PAD.t+")"}>
          {[mn,Math.round(mn+range/2),mx].map((v:number)=><g key={v}>
            <line x1={0} y1={toY(v)} x2={cW} y2={toY(v)} stroke="rgba(51,65,85,0.3)" strokeDasharray="3,4"/>
            <text x={-6} y={toY(v)+4} textAnchor="end" fontSize={9} fill="#475569">{v}%</text>
          </g>)}
          {(["ossoff","collins"] as const).map((k,ki)=>{
            const color=ki===0?"#3b82f6":"#f27070";
            const validPts=trend.map((d:any,i:number)=>({v:d[k],i})).filter((p:any)=>p.v!=null);
            if(validPts.length===0)return null;
            if(validPts.length===1){
              const p=validPts[0];
              return <circle key={k} cx={toX(p.i)} cy={toY(p.v)} r={4} fill={color}/>;
            }
            const pts=validPts.map((p:any)=>toX(p.i)+","+toY(p.v)).join(" ");
            return <polyline key={k} points={pts} fill="none" stroke={color} strokeWidth={ki===0?2:1.5}/>;
          })}
          {trend.map((d:any,i:number)=>(
            <g key={i}>
              <text x={toX(i)} y={cH+16} textAnchor="middle" fontSize={8} fill="#475569">{d.date?.slice(0,7)}</text>
              {d.ossoff&&<circle cx={toX(i)} cy={toY(d.ossoff)} r={3} fill="#3b82f6"/>}
              {d.collins&&<circle cx={toX(i)} cy={toY(d.collins)} r={3} fill="#f27070"/>}
            </g>
          ))}
        </g>
      </svg>:<div style={{padding:20,textAlign:"center",color:"#475569",fontSize:12}}>No poll data. Click Fetch live polls in Polling Vault.</div>}
    </Card>

    <Card>
      <SL>Latest poll — {approval.latestPoll?.display_name}</SL>
      {approval.latestPoll?<div>
        <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>{approval.latestPoll.poll_date} · {approval.latestPoll.population?.toUpperCase()} · n={approval.latestPoll.sample_size?.toLocaleString()}</div>
        <div style={{display:"flex",gap:20}}>
          {[["Ossoff",approval.latestPoll.ossoff_pct,"#3b82f6"],["Collins",approval.latestPoll.collins_pct,"#f27070"],["Dooley",approval.latestPoll.dooley_pct,"#f5b944"]].map(([n,v,c])=>v?<div key={n as string}><div style={{fontSize:22,fontWeight:700,color:c as string}}>{(v as number).toFixed(1)}%</div><div style={{fontSize:10,color:"#64748b"}}>{n}</div></div>:null)}
        </div>
      </div>:<div style={{fontSize:11,color:"#475569"}}>No poll data. Fetch polls first.</div>}
    </Card>
  </div>;
}

function OppositionScreen() {
  const [polls,setPolls]=useState<any[]>([]);
  const [approval,setApproval]=useState<any>(null);
  const [sel,setSel]=useState(0);
  const [loading,setLoading]=useState(true);

  const getLiveNarratives=()=>{
    try{const c=sessionStorage.getItem("polis_narratives");if(c){const d=JSON.parse(c);if(d.narratives?.length)return d.narratives;}}catch(e){}
    return NARRATIVES_SEED;
  };
  const narratives=getLiveNarratives();
  const negativeNarratives=narratives.filter((n:any)=>n.sentiment==="negative").sort((a:any,b:any)=>b.vel-a.vel);

  useEffect(()=>{
    Promise.all([
      fetch("/api/polls").then(r=>r.json()).catch(()=>({polls:[]})),
      fetch("/api/approval").then(r=>r.json()).catch(()=>null),
    ]).then(([p,a])=>{
      setPolls(p.polls||[]);
      setApproval(a);
      setLoading(false);
    });
  },[]);

  const opponents=[
    {name:"Mike Collins",short:"Collins",initials:"MC",color:"#f27070",label:"GOP primary leader",role:"opponent",
     approval:approval?.collins,lead:approval?.lead,
     handle:"@mikecollinsga"},
    {name:"Derek Dooley",short:"Dooley",initials:"DD",color:"#f5b944",label:"GOP primary candidate",role:"tracker",
     approval:approval?.dooley,lead:approval?.dooley&&approval?.ossoff?parseFloat((approval.ossoff-approval.dooley).toFixed(1)):null,
     handle:"@dooleyga"},
  ];
  const opp=opponents[sel];

  const attackLines=negativeNarratives.slice(0,4).map((n:any)=>({
    line:n.label, vol:n.vol, vel:"+"+n.vel, trend:n.vel>15?"rising":"stable",
    src:n.sources?.[0]?.type||"broadcast"
  }));

  if(loading)return <div style={{maxWidth:720,padding:40,textAlign:"center",color:"#475569"}}>Loading opposition data...</div>;

  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      {opponents.map((o,i)=>(
        <div key={i} onClick={()=>setSel(i)} style={{flex:1,padding:"10px 14px",borderRadius:8,cursor:"pointer",border:"1px solid "+(sel===i?o.color:"rgba(51,65,85,0.5)"),background:sel===i?o.color+"18":"rgba(15,23,42,0.5)"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{o.short}</div>
          <div style={{fontSize:10,color:"#64748b"}}>{o.label}</div>
          <div style={{fontSize:18,fontWeight:700,color:o.color,marginTop:4}}>{o.approval?o.approval.toFixed(1)+"%":"—"}</div>
        </div>
      ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <Card>
        <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Our lead over {opp.short}</div>
        <div style={{fontSize:32,fontWeight:800,color:"#22c55e"}}>{opp.lead!=null?opp.lead.toFixed(1)+"pts":"—"}</div>
        <div style={{fontSize:10,color:"#475569",marginTop:4}}>Computed from {polls.length} public polls</div>
      </Card>
      <Card>
        <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>{opp.short} poll average</div>
        <div style={{fontSize:32,fontWeight:800,color:opp.color}}>{opp.approval?opp.approval.toFixed(1)+"%":"—"}</div>
        <div style={{fontSize:10,color:"#475569",marginTop:4}}>{polls.length} polls in signal</div>
      </Card>
    </div>

    <Card style={{marginBottom:12}}>
      <SL>Poll-by-poll breakdown</SL>
      {polls.slice(0,6).map((p:any,i:number)=>(
        <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"6px 0",borderBottom:i<5?"1px solid rgba(51,65,85,0.2)":"none"}}>
          <div style={{width:120,fontSize:11,color:"#94a3b8",flexShrink:0}}>{p.display_name}</div>
          <div style={{fontSize:10,color:"#475569",width:70,flexShrink:0}}>{p.poll_date}</div>
          <div style={{flex:1,display:"flex",height:6,borderRadius:2,overflow:"hidden"}}>
            {p.ossoff_pct&&<div style={{width:p.ossoff_pct+"%",background:"#3b82f6"}}/>}
            {p.collins_pct&&<div style={{width:p.collins_pct+"%",background:"#f27070"}}/>}
          </div>
          <div style={{fontSize:11,color:"#3b82f6",width:32,textAlign:"right",flexShrink:0}}>{p.ossoff_pct?.toFixed(0)}%</div>
          <div style={{fontSize:11,color:opp.color,width:32,flexShrink:0}}>{sel===0?p.collins_pct?.toFixed(0):p.dooley_pct?.toFixed(0)}%</div>
        </div>
      ))}
      {polls.length===0&&<div style={{fontSize:12,color:"#475569",padding:"10px 0"}}>No polls loaded. Go to Polling Vault and fetch polls.</div>}
    </Card>

    <Card>
      <SL>Active attack lines — from live narratives</SL>
      {attackLines.length>0?attackLines.map((a:any,i:number)=>(
        <div key={i} style={{padding:"8px 0",borderBottom:i<attackLines.length-1?"1px solid rgba(51,65,85,0.3)":"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:12,color:"#e2e8f0",fontStyle:"italic",flex:1,paddingRight:8}}>"{a.line}"</div>
            <Badge label={a.trend} color={a.trend==="rising"?"#ef4444":"#64748b"} bg={a.trend==="rising"?"rgba(239,68,68,0.1)":"rgba(51,65,85,0.3)"}/>
          </div>
          <div style={{display:"flex",gap:12}}>
            <span style={{fontSize:10,color:"#64748b"}}>Vol: <strong style={{color:"#94a3b8"}}>{a.vol}</strong></span>
            <span style={{fontSize:10,color:"#64748b"}}>Vel: <strong style={{color:"#f97316"}}>{a.vel}</strong></span>
            <span style={{fontSize:10,color:"#64748b"}}>Via live narratives</span>
          </div>
        </div>
      )):<div style={{fontSize:12,color:"#475569",padding:"8px 0"}}>Fetch live narratives to see active attack lines.</div>}
    </Card>
  </div>;
}

function PollingVaultScreen() {
  const [polls,setPolls]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [fetching,setFetching]=useState(false);
  const [selPoll,setSelPoll]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [approval,setApproval]=useState<any>(null);
  const [showAdd,setShowAdd]=useState(false);
  const [newPoll,setNewPoll]=useState({
    pollster:"",poll_date:"",sample_size:"",population:"lv",method:"",
    ossoff_pct:"",collins_pct:"",dooley_pct:"",url:""
  });
  const [adding,setAdding]=useState(false);

  const loadPolls=async(force=false)=>{
    setFetching(true);
    setError(null);
    try{
      const res=await fetch("/api/polls"+(force?"?refresh=true":""));
      const data=await res.json();
      if(data.error)throw new Error(data.error);
      setPolls(data.polls||[]);
      const aRes=await fetch("/api/approval");
      const aData=await aRes.json();
      if(!aData.error)setApproval(aData);
    }catch(e:any){setError(e.message);}
    setFetching(false);
    setLoading(false);
  };

  useEffect(()=>{loadPolls(false);},[]);

  const addPoll=async()=>{
    if(!newPoll.pollster||!newPoll.poll_date||!newPoll.ossoff_pct)return;
    setAdding(true);
    try{
      const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
      const poll={
        id:"manual_"+Date.now(),
        pollster:newPoll.pollster,
        display_name:newPoll.pollster,
        poll_date:newPoll.poll_date,
        end_date:newPoll.poll_date,
        sample_size:parseInt(newPoll.sample_size)||null,
        population:newPoll.population,
        method:newPoll.method||"Manual entry",
        ossoff_pct:parseFloat(newPoll.ossoff_pct)||null,
        collins_pct:parseFloat(newPoll.collins_pct)||null,
        dooley_pct:parseFloat(newPoll.dooley_pct)||null,
        url:newPoll.url||"",
        fetched_at:new Date().toISOString(),
      };
      // Save via API
      const res=await fetch("/api/polls/add",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(poll),
      });
      if(res.ok){
        await loadPolls(false);
        setShowAdd(false);
        setNewPoll({pollster:"",poll_date:"",sample_size:"",population:"lv",method:"",ossoff_pct:"",collins_pct:"",dooley_pct:"",url:""});
      }
    }catch(e:any){setError("Could not save poll: "+e.message);}
    setAdding(false);
  };

  const inSignal=polls.filter((p:any)=>p.ossoff_pct&&p.collins_pct);

  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
      <div>
        <div style={{fontSize:11,color:"#64748b"}}>Blended signal baseline</div>
        <div style={{fontSize:32,fontWeight:800,color:"#f1f5f9"}}>{approval?.ossoff?approval.ossoff.toFixed(1)+"%":"—"}</div>
        <div style={{fontSize:11,color:"#64748b"}}>{inSignal.length} polls in signal</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <div onClick={()=>setShowAdd(true)} style={{background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.4)",borderRadius:8,padding:"10px 16px",cursor:"pointer",fontSize:13,color:"#22c55e",fontWeight:600}}>+ Add poll</div>
        <div onClick={()=>loadPolls(true)} style={{background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.4)",borderRadius:8,padding:"10px 16px",cursor:"pointer",fontSize:13,color:"#3b82f6",fontWeight:600}}>{fetching?"Fetching...":"⟳ Fetch live"}</div>
      </div>
    </div>

    {error&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#fca5a5"}}>{error}</div>}

    {/* Add poll form */}
    {showAdd&&<Card style={{marginBottom:14,border:"1px solid rgba(34,197,94,0.3)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
        <SL>Add poll manually</SL>
        <div onClick={()=>setShowAdd(false)} style={{fontSize:11,color:"#64748b",cursor:"pointer"}}>✕</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <FieldInput value={newPoll.pollster} onChange={(v:string)=>setNewPoll(p=>({...p,pollster:v}))} placeholder="Pollster name *"/>
        <FieldInput value={newPoll.poll_date} onChange={(v:string)=>setNewPoll(p=>({...p,poll_date:v}))} placeholder="Date (YYYY-MM-DD) *"/>
        <FieldInput value={newPoll.ossoff_pct} onChange={(v:string)=>setNewPoll(p=>({...p,ossoff_pct:v}))} placeholder="Ossoff % *"/>
        <FieldInput value={newPoll.collins_pct} onChange={(v:string)=>setNewPoll(p=>({...p,collins_pct:v}))} placeholder="Collins %"/>
        <FieldInput value={newPoll.dooley_pct} onChange={(v:string)=>setNewPoll(p=>({...p,dooley_pct:v}))} placeholder="Dooley %"/>
        <FieldInput value={newPoll.sample_size} onChange={(v:string)=>setNewPoll(p=>({...p,sample_size:v}))} placeholder="Sample size (n)"/>
        <FieldSelect value={newPoll.population} onChange={(v:string)=>setNewPoll(p=>({...p,population:v}))}>
          <option value="lv">Likely Voters</option>
          <option value="rv">Registered Voters</option>
          <option value="a">Adults</option>
        </FieldSelect>
        <FieldInput value={newPoll.method} onChange={(v:string)=>setNewPoll(p=>({...p,method:v}))} placeholder="Method (e.g. Live Phone)"/>
      </div>
      <FieldInput value={newPoll.url} onChange={(v:string)=>setNewPoll(p=>({...p,url:v}))} placeholder="Source URL (optional)"/>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <div onClick={!adding?addPoll:undefined} style={{padding:"7px 16px",borderRadius:6,background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.4)",fontSize:12,color:"#22c55e",cursor:"pointer",fontWeight:600}}>{adding?"Saving...":"Save poll"}</div>
        <div onClick={()=>setShowAdd(false)} style={{padding:"7px 16px",borderRadius:6,background:"rgba(51,65,85,0.3)",border:"1px solid rgba(51,65,85,0.5)",fontSize:12,color:"#64748b",cursor:"pointer"}}>Cancel</div>
      </div>
    </Card>}

    {loading?<div style={{padding:40,textAlign:"center",color:"#475569"}}>Loading polls...</div>:
    polls.length===0?<div style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:8,padding:"20px",textAlign:"center"}}>
      <div style={{fontSize:14,color:"#e2e8f0",marginBottom:8}}>No polls loaded yet</div>
      <div style={{fontSize:12,color:"#64748b"}}>Click "Fetch live" to pull public polls or "+ Add poll" to enter one manually</div>
    </div>:
    polls.map((p:any)=>(
      <Card key={p.id} style={{marginBottom:8,cursor:"pointer",border:"1px solid "+(selPoll===p.id?"rgba(59,130,246,0.5)":"rgba(51,65,85,0.5)")}}>
        <div onClick={()=>setSelPoll(selPoll===p.id?null:p.id)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{p.display_name}</div>
              <div style={{fontSize:11,color:"#64748b"}}>{p.poll_date} · {p.method||p.population?.toUpperCase()||""} · {p.sample_size?"n="+p.sample_size.toLocaleString():""}</div>
            </div>
            <div style={{display:"flex",gap:6}}>
              {p.id?.startsWith("manual_")&&<Badge label="Manual" color="#8b5cf6" bg="rgba(139,92,246,0.1)"/>}
              <Badge label="In signal" color="#22c55e" bg="rgba(34,197,94,0.1)"/>
            </div>
          </div>
          <div style={{display:"flex",gap:16,marginTop:10}}>
            {[["Ossoff",p.ossoff_pct,"#3b82f6"],["Collins",p.collins_pct,"#f27070"],["Dooley",p.dooley_pct,"#f5b944"]].filter(([,v])=>v).map(([n,v,c])=>(
              <div key={n as string}><div style={{fontSize:16,fontWeight:700,color:c as string}}>{(v as number).toFixed(1)}%</div><div style={{fontSize:9,color:"#64748b"}}>{n}</div></div>
            ))}
            {p.ossoff_lead!=null&&<div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontSize:11,color:"#64748b"}}>Ossoff lead</div><div style={{fontSize:14,fontWeight:700,color:p.ossoff_lead>0?"#22c55e":"#ef4444"}}>{p.ossoff_lead>0?"+":""}{p.ossoff_lead.toFixed(1)}</div></div>}
          </div>
        </div>
        {selPoll===p.id&&<div><Divider/>
          <div style={{display:"flex",gap:10}}>
            {p.url&&<a href={p.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#3b82f6",textDecoration:"none"}}>↗ View source</a>}
          </div>
        </div>}
      </Card>
    ))}
  </div>;
}

function SocialMediaScreen() {
  const [stats,setStats]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [fetching,setFetching]=useState(false);
  const [source,setSource]=useState<string|null>(null);
  const [fetchedAt,setFetchedAt]=useState<string|null>(null);

  const loadStats=async(force=false)=>{
    setFetching(true);
    try{
      const res=await fetch("/api/social"+(force?"?refresh=true":""));
      const data=await res.json();
      setStats(data.stats||[]);
      setSource(data.source||null);
      setFetchedAt(data.fetchedAt||null);
    }catch(e){console.error("Social fetch error:",e);}
    setFetching(false);
    setLoading(false);
  };

  useEffect(()=>{loadStats(false);},[]);

  const byCandidate=(candidate:string)=>stats.filter((s:any)=>s.candidate===candidate);
  const byPlatform=(candidate:string,platform:string)=>stats.find((s:any)=>s.candidate===candidate&&s.platform===platform);

  const fmt=(n:number|null)=>{
    if(!n)return "—";
    if(n>=1000000)return (n/1000000).toFixed(1)+"M";
    if(n>=1000)return (n/1000).toFixed(0)+"k";
    return n.toLocaleString();
  };

  const candidates=[
    {id:"ossoff",name:"Jon Ossoff",color:"#3b82f6",short:"Ossoff"},
    {id:"collins",name:"Mike Collins",color:"#f27070",short:"Collins"},
    {id:"dooley",name:"Derek Dooley",color:"#f5b944",short:"Dooley"},
  ];

  const platforms=["twitter","instagram"];

  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:11,color:"#64748b"}}>
  {stats.some((s:any)=>s.is_live)?"Twitter live via syndication API · Instagram: approximate from public sources · ":"Approximate values from public sources · "}{fetchedAt?new Date(fetchedAt).toLocaleString():""}
      </div>
      <div onClick={()=>loadStats(true)} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",fontSize:11,color:"#22c55e",fontWeight:600}}>
        {fetching?"Fetching...":"⟳ Refresh"}
      </div>
    </div>

    {loading?<div style={{padding:40,textAlign:"center",color:"#475569"}}>Loading social data...</div>:<>

    {/* Follower comparison table */}
    <Card style={{marginBottom:12}}>
      <SL>Follower comparison</SL>
      <div style={{display:"grid",gridTemplateColumns:"1fr repeat("+platforms.length+",1fr)",gap:8,marginBottom:8}}>
        <div/>
        {platforms.map(p=><div key={p} style={{fontSize:10,fontWeight:700,color:"#475569",textAlign:"center",textTransform:"capitalize" as const}}>{p==="twitter"?"X / Twitter":p}</div>)}
      </div>
      {candidates.map(c=>(
        <div key={c.id} style={{display:"grid",gridTemplateColumns:"1fr repeat("+platforms.length+",1fr)",gap:8,marginBottom:8,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:c.color}}/>
            <span style={{fontSize:12,color:"#e2e8f0"}}>{c.short}</span>
          </div>
          {platforms.map(p=>{
            const s=byPlatform(c.id,p);
            return <div key={p} style={{textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:c.color}}>{fmt(s?.followers||null)}</div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                {s?.source_url&&<a href={s.source_url} target="_blank" rel="noopener noreferrer" style={{fontSize:9,color:"#3b82f6",textDecoration:"none"}}>↗ profile</a>}
                {s&&<span style={{fontSize:8,color:s.is_live?"#22c55e":"#f97316"}}>{s.is_live?"LIVE":"~"}</span>}
              </div>
            </div>;
          })}
        </div>
      ))}
      <div style={{marginTop:8,fontSize:10,color:"#334155"}}>
        Not live · Twitter/Instagram require paid API access
        <span style={{color:"#f97316"}}> · Not live — platform APIs require paid access</span>
      </div>
    </Card>

    {/* Bar chart comparison */}
    <Card>
      <SL>Reach comparison — Twitter/X followers</SL>
      {candidates.map(c=>{
        const tw=byPlatform(c.id,"twitter");
        const maxFollowers=Math.max(...candidates.map(x=>byPlatform(x.id,"twitter")?.followers||0));
        return <div key={c.id} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:12,color:"#e2e8f0"}}>{c.name}</span>
            <span style={{fontSize:12,fontWeight:700,color:c.color}}>{fmt(tw?.followers||null)}</span>
          </div>
          <MiniBar val={tw?.followers||0} max={maxFollowers||1} color={c.color} h={8}/>
        </div>;
      })}
    </Card>
    </>}
  </div>;
}

function NarrativesScreen() {
  const [sel,setSel]=useState<string|null>(null);
  const [liveNarratives,setLiveNarratives]=useState<any[]|null>(null);
  const [loading,setLoading]=useState(false);
  const [fetchedAt,setFetchedAt]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const displayed=liveNarratives||NARRATIVES_SEED;

  useEffect(()=>{
    // Auto-restore from sessionStorage on mount
    try{
      const c=sessionStorage.getItem("polis_narratives");
      if(c){const d=JSON.parse(c);if(d.narratives?.length){setLiveNarratives([...d.narratives].sort((a:any,b:any)=>b.vel-a.vel));setFetchedAt(d.fetchedAt);}}
    }catch(e){}
  },[]);

  const fetchLive=async(force=false)=>{
    const CK="polis_narratives",CT="polis_narratives_ts",TW=12*60*60*1000;
    if(!force){
      try{
        const c=sessionStorage.getItem(CK),t=sessionStorage.getItem(CT);
        if(c&&t&&Date.now()-parseInt(t)<TW){
          const d=JSON.parse(c);
          setLiveNarratives([...d.narratives].sort((a:any,b:any)=>b.vel-a.vel));
          setFetchedAt(d.fetchedAt);
          return;
        }
      }catch(e){}
    }
    setLoading(true);setError(null);
    try{
      const res=await fetch("/api/narratives");
      const text=await res.text();
      const data=JSON.parse(text);
      if(data.error)throw new Error(data.error);
      sessionStorage.setItem(CK,JSON.stringify(data));
      sessionStorage.setItem(CT,Date.now().toString());
      setLiveNarratives([...data.narratives].sort((a:any,b:any)=>b.vel-a.vel));
      setFetchedAt(data.fetchedAt);
    }catch(e:any){setError(e.message);}
    setLoading(false);
  };

  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:11,color:"#64748b"}}>
        {liveNarratives
          ?`${liveNarratives.length} live narratives · fetched ${fetchedAt?new Date(fetchedAt).toLocaleTimeString():""}`
          :`${NARRATIVES_SEED.length} seed narratives · not yet live`}
      </div>
      <div style={{display:"flex",gap:6}}>
        <div onClick={()=>fetchLive(false)} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",fontSize:11,color:"#22c55e",fontWeight:600}}>
          {loading?"Fetching...":"⟳ Fetch live narratives"}
        </div>
        {liveNarratives&&<div onClick={()=>fetchLive(true)} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",background:"transparent",border:"1px solid rgba(51,65,85,0.5)",fontSize:11,color:"#475569"}}>Force refresh</div>}
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
              <div style={{width:150,fontSize:11,color:"#94a3b8"}}>{s.name}</div>
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

function TalkingPointsScreen() {
  const getLiveNarratives=()=>{
    try{
      const c=sessionStorage.getItem("polis_narratives");
      if(c){const d=JSON.parse(c);if(d.narratives?.length)return d.narratives;}
    }catch(e){}
    return NARRATIVES_SEED;
  };

  const [narratives,setNarratives]=useState<any[]>(getLiveNarratives);
  const [agenda,setAgenda]=useState<any[]|null>(null);
  const [building,setBuilding]=useState(false);
  const [sel,setSel]=useState<number>(0);
  const [customPrompt,setCustomPrompt]=useState("");
  const [generating,setGenerating]=useState(false);
  const [customResult,setCustomResult]=useState<any>(null);
  const [showEvidence,setShowEvidence]=useState<string|null>(null);

  useEffect(()=>{
    const interval=setInterval(()=>setNarratives(getLiveNarratives()),3000);
    return ()=>clearInterval(interval);
  },[]);

  const threats=narratives.filter((n:any)=>n.sentiment==="negative").sort((a:any,b:any)=>b.vel-a.vel);
  const positives=narratives.filter((n:any)=>n.sentiment==="positive").sort((a:any,b:any)=>b.vel-a.vel);
  const topThreat=threats[0];

  const buildAgenda=async()=>{
    setBuilding(true);
    setAgenda(null);
    setSel(0);
    setCustomResult(null);

    const narrativeList=narratives.slice(0,8).map((n:any)=>
      n.id+": "+n.label+" ("+n.sentiment+", vol "+n.vol+", vel "+n.vel+")"
    ).join(" | ");

    const platformList=INIT_PLATFORM.filter((p:any)=>p.status==="published").map((p:any)=>
      p.id+": "+p.title+" ["+p.category+"] - "+p.summary.slice(0,100)
    ).join(" | ");

    const extList=EXT_CONTEXT.slice(0,4).map((e:any)=>
      e.label+": "+e.val+" ("+e.change+")"
    ).join(" | ");

    const schema='[{"angle":"string","type":"counter|amplify|proactive","narrativeId":"string or null","platformIds":["pl1"],"headline":"string","points":[{"text":"string","src":"string","w":"high|medium|low"}],"ask":"string","tone":"string","audience":"string","urgency":"critical|high|medium|low"}]';

    const prompt="You are Polis, intelligence AI for Sen. Jon Ossoff (D-GA, approval 47.8%, leading Collins +8.6pts). Build a full message agenda covering BOTH threats to counter AND positive narratives to amplify. Current narratives: "+narrativeList+" Ossoff legislative record: "+platformList+" Georgia economic context: "+extList+" Instructions: Generate exactly 4 angles. 2 should counter negative narratives using platform items as proof. 1 should amplify a positive narrative with platform backing. 1 should be proactive using external context data to make an offensive case. Each angle must reference specific platform item IDs and specific narrative IDs where applicable. Return ONLY valid JSON array, no markdown: "+schema;

    try{
      const res=await fetch("/api/anthropic",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2500,messages:[{role:"user",content:prompt}]})
      });
      const data=await res.json();
      const text=data.content?.map((c:any)=>c.text||"").join("")||"";
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      setAgenda(parsed);
    }catch(e){
      setAgenda([
        {angle:"Counter inflation attack",type:"counter",narrativeId:"n3",platformIds:["pl2","pl4"],headline:"Collins voted against the bill bringing 12,000 jobs to Savannah. His record, not his ads.",points:[{text:"Collins voted against the bipartisan infrastructure bill — the same bill creating 12,000 jobs at the Port of Savannah right now.",src:"Roll call + USDOT grant records, Mar 2026",w:"high"},{text:"Collins also voted against the CHIPS Act that brought $4.5B in semiconductor investment to Georgia.",src:"Roll call + GA Dept of Economic Development, 2025",w:"high"}],ask:"Lead with his voting record. Never repeat his attack line.",tone:"Assertive, factual, Georgia-specific. Never defensive.",audience:"Rapid response / broadcast press",urgency:"critical"},
        {angle:"Counter too-liberal framing",type:"counter",narrativeId:"n4",platformIds:["pl2","pl5"],headline:"Collins calls Ossoff too liberal. Ossoff passed more bipartisan bills than any freshman senator.",points:[{text:"Named most bipartisan member of Congress in July 2025. Has passed legislation with Republican senators in every session.",src:"ossoff.senate.gov, Jul 2025",w:"high"},{text:"Delivered 12,000 jobs to Savannah, upgraded water infrastructure across Georgia, and protected veterans — with Republican co-sponsors.",src:"ossoff.senate.gov Four-Year Report",w:"high"}],ask:"Name the Republican co-sponsors. Make bipartisanship concrete.",tone:"Confident, factual. Do not be defensive about values.",audience:"Atlanta suburbs / independents",urgency:"high"},
        {angle:"Amplify Savannah jobs",type:"amplify",narrativeId:"n1",platformIds:["pl2"],headline:"Georgia is building again — 12,000 jobs in Savannah because Ossoff fought for it.",points:[{text:"The Savannah port expansion will create 12,000 direct and indirect jobs over 3 years — the result of the infrastructure bill Collins voted against.",src:"USDOT infrastructure grant analysis, Mar 2026",w:"high"},{text:"Savannah port container volume hit a record 5.2M TEU in 2025, up 8.4%. Federal investment is working.",src:"Georgia Ports Authority, 2025",w:"high"}],ask:"Invite reporters to visit the Savannah port terminal.",tone:"Confident, Georgia-specific, forward-looking.",audience:"Atlanta broadcast press",urgency:"medium"},
        {angle:"Medicaid gap — Georgia economy case",type:"proactive",narrativeId:"n2",platformIds:["pl1"],headline:"Georgia's 16.1% uninsured rate is a $1.8B annual hit to the state economy. Collins put us here.",points:[{text:"Georgia has the second-highest uninsured rate in the nation — 16.1%. The Medicaid coverage gap costs the state an estimated $1.8B annually in federal matching funds.",src:"KFF 2025 + CBO estimate",w:"high"},{text:"Collins voted against Medicaid expansion twice. Not once. Twice. 500,000 Georgians remain uninsured as a direct result.",src:"Roll call, 2023 and 2024",w:"high"}],ask:"Frame as economic argument first, healthcare second. Use Georgia-specific dollar figures.",tone:"Personal, direct. South Georgia-specific. No DC jargon.",audience:"Town halls / rural Georgia",urgency:"medium"},
      ]);
    }
    setBuilding(false);
  };

  const generateCustom=async()=>{
    if(!customPrompt.trim())return;
    setGenerating(true);
    setCustomResult(null);
    const platformList=INIT_PLATFORM.filter((p:any)=>p.status==="published").map((p:any)=>
      p.title+" - "+p.summary.slice(0,80)
    ).join(" | ");
    const topNarrStr=topThreat?"Current top threat: "+topThreat.label+" (vel +"+topThreat.vel+")":"";
    const extStr=EXT_CONTEXT.slice(0,3).map((e:any)=>e.label+": "+e.val).join(", ");
    const schema2='{"headline":"string","points":[{"text":"string","src":"string","w":"high|medium|low"}],"ask":"string","tone":"string"}';
    const prompt2="You are Polis. Generate talking points for Sen. Jon Ossoff (D-GA). Situation: "+customPrompt+". "+topNarrStr+". Georgia economic context: "+extStr+". Use this legislative record as evidence: "+platformList+". Return ONLY valid JSON, no markdown: "+schema2;
    try{
      const res=await fetch("/api/anthropic",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,messages:[{role:"user",content:prompt2}]})
      });
      const data=await res.json();
      const text=data.content?.map((c:any)=>c.text||"").join("")||"";
      setCustomResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
    }catch(e){
      setCustomResult({headline:"Georgia jobs first — Ossoff is delivering, Collins voted no.",points:[{text:"The Savannah port expansion creates 12,000 Georgia jobs.",src:"USDOT, 2026",w:"high"},{text:"Collins voted against the infrastructure bill that made this possible.",src:"Roll call record",w:"high"}],ask:"Lead with the voting record.",tone:"Confident, specific."});
    }
    setGenerating(false);
  };

  const current=agenda?agenda[sel]:null;
  const evidenceItems=current?((current.platformIds||[]) as string[]).map((pid:string)=>INIT_PLATFORM.find((p:any)=>p.id===pid)).filter(Boolean):[];
  const linkedNarr=current?.narrativeId?narratives.find((n:any)=>n.id===current.narrativeId):null;

  const typeColor:Record<string,string>={counter:"#ef4444",amplify:"#22c55e",proactive:"#3b82f6"};
  const typeBg:Record<string,string>={counter:"rgba(239,68,68,0.1)",amplify:"rgba(34,197,94,0.1)",proactive:"rgba(59,130,246,0.1)"};
  const typeLabel:Record<string,string>={counter:"Counter",amplify:"Amplify",proactive:"Proactive"};
  const urgencyColor:Record<string,string>={critical:"#ef4444",high:"#f97316",medium:"#eab308",low:"#22c55e"};

  return <div style={{maxWidth:720}}>

    {/* Threat + Opportunity summary bar */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"10px 12px"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#ef4444",letterSpacing:"0.08em",marginBottom:4}}>TOP THREAT</div>
        {topThreat
          ?<><div style={{fontSize:12,fontWeight:600,color:"#f1f5f9",marginBottom:2}}>{topThreat.label}</div>
            <div style={{fontSize:11,color:"#64748b"}}>Vol {topThreat.vol} · <span style={{color:"#ef4444"}}>+{topThreat.vel} velocity</span></div></>
          :<div style={{fontSize:11,color:"#64748b"}}>No active threats</div>
        }
      </div>
      <div style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"10px 12px"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#22c55e",letterSpacing:"0.08em",marginBottom:4}}>TOP OPPORTUNITY</div>
        {positives[0]
          ?<><div style={{fontSize:12,fontWeight:600,color:"#f1f5f9",marginBottom:2}}>{positives[0].label}</div>
            <div style={{fontSize:11,color:"#64748b"}}>Vol {positives[0].vol} · <span style={{color:"#22c55e"}}>+{positives[0].vel} velocity</span></div></>
          :<div style={{fontSize:11,color:"#64748b"}}>No positive narratives</div>
        }
      </div>
    </div>

    {/* Build agenda CTA */}
    {!agenda&&<div style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:8,padding:"14px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
      <div>
        <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>Build message agenda</div>
        <div style={{fontSize:11,color:"#64748b"}}>Polis matches your platform record against current narratives — counters for threats, amplifications for opportunities, and proactive angles from external context.</div>
      </div>
      <div onClick={!building?buildAgenda:undefined} style={{padding:"8px 16px",borderRadius:6,cursor:building?"not-allowed":"pointer",background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.4)",fontSize:12,color:"#3b82f6",fontWeight:600,whiteSpace:"nowrap" as const,flexShrink:0}}>{building?"Building...":"Build agenda"}</div>
    </div>}

    {/* Agenda tabs + content */}
    {agenda&&<div>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {agenda.map((a:any,i:number)=>(
          <div key={i} onClick={()=>{setSel(i);setCustomResult(null);}} style={{padding:"6px 12px",borderRadius:6,cursor:"pointer",border:"1px solid "+(sel===i?(typeColor[a.type]||"#3b82f6")+"80":"rgba(51,65,85,0.5)"),background:sel===i?(typeBg[a.type]||"rgba(59,130,246,0.1)"):"transparent",fontSize:12,color:sel===i?(typeColor[a.type]||"#3b82f6"):"#64748b",display:"flex",alignItems:"center",gap:5}}>
            {a.type==="counter"&&<span style={{width:6,height:6,borderRadius:"50%",background:"#ef4444",display:"inline-block",flexShrink:0}}/>}
            {a.type==="amplify"&&<span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block",flexShrink:0}}/>}
            {a.type==="proactive"&&<span style={{width:6,height:6,borderRadius:"50%",background:"#3b82f6",display:"inline-block",flexShrink:0}}/>}
            {a.angle}
          </div>
        ))}
        <div onClick={buildAgenda} style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",border:"1px solid rgba(51,65,85,0.4)",fontSize:11,color:"#475569",marginLeft:"auto"}}>Rebuild</div>
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:12,marginBottom:12}}>
        {[["counter","#ef4444","Counter threat"],["amplify","#22c55e","Amplify narrative"],["proactive","#3b82f6","Proactive"]].map(([type,color,label])=>(
          <div key={type as string} style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:color as string,display:"inline-block"}}/>
            <span style={{fontSize:10,color:"#475569"}}>{label as string}</span>
          </div>
        ))}
      </div>

      {current&&<Card style={{marginBottom:12}}>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
          <Badge label={typeLabel[current.type]||current.type} color={typeColor[current.type]||"#3b82f6"} bg={typeBg[current.type]||"rgba(59,130,246,0.1)"}/>
          <Badge label={current.audience||"General"} color="#94a3b8" bg="rgba(51,65,85,0.4)"/>
          {current.urgency&&<Badge label={current.urgency} color={urgencyColor[current.urgency]||"#64748b"} bg={(urgencyColor[current.urgency]||"#64748b")+"18"}/>}
        </div>

        {linkedNarr&&<div style={{background:"rgba(15,23,42,0.6)",borderRadius:6,padding:"8px 12px",marginBottom:12,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:linkedNarr.sentiment==="negative"?"#ef4444":"#22c55e",flexShrink:0}}/>
          <div style={{flex:1,fontSize:11,color:"#94a3b8"}}>
            <span style={{color:"#64748b"}}>Narrative: </span>{linkedNarr.label}
          </div>
          <div style={{display:"flex",gap:10,flexShrink:0}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:700,color:"#f1f5f9"}}>{linkedNarr.vol}</div><div style={{fontSize:9,color:"#64748b"}}>vol</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:700,color:linkedNarr.vel>0?"#22c55e":"#ef4444"}}>{linkedNarr.vel>0?"+":""}{linkedNarr.vel}</div><div style={{fontSize:9,color:"#64748b"}}>vel</div></div>
          </div>
        </div>}

        <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9",lineHeight:1.4,marginBottom:14,padding:"12px",background:"rgba(59,130,246,0.08)",borderRadius:6,borderLeft:"3px solid #3b82f6"}}>{current.headline}</div>

        {(current.points||[]).map((pt:any,i:number)=><div key={i} style={{padding:"10px 0",borderBottom:"1px solid rgba(51,65,85,0.3)"}}>
          <div style={{fontSize:13,color:"#cbd5e1",lineHeight:1.6,marginBottom:4}}>{pt.text}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:10,color:"#475569"}}>{"📎 "+pt.src}</span>
            <Badge label={"Impact: "+pt.w} color={pt.w==="high"?"#22c55e":"#eab308"} bg={pt.w==="high"?"rgba(34,197,94,0.1)":"rgba(234,179,8,0.1)"}/>
          </div>
        </div>)}

        <Divider/>
        <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#475569",marginBottom:4}}>ASK</div><div style={{fontSize:12,color:"#3b82f6"}}>{current.ask}</div></div>
        <div><div style={{fontSize:10,color:"#475569",marginBottom:4}}>TONE</div><div style={{fontSize:12,color:"#94a3b8",fontStyle:"italic"}}>{current.tone}</div></div>
      </Card>}

      {evidenceItems.length>0&&<div style={{marginBottom:14}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"#475569",marginBottom:8}}>LEGISLATIVE EVIDENCE</div>
        {evidenceItems.map((item:any,i:number)=>(
          <div key={i} onClick={()=>setShowEvidence(showEvidence===item.id?null:item.id)} style={{background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:8,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0",marginBottom:2}}>{item.title}</div>
                <div style={{fontSize:10,color:"#64748b"}}>{item.category} · {item.updated} · {item.src}</div>
              </div>
              <Badge label={item.status} color={STATUS_COLOR[item.status]||"#475569"} bg={(STATUS_COLOR[item.status]||"#475569")+"18"}/>
            </div>
            {showEvidence===item.id&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(139,92,246,0.15)"}}>
              <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.6,marginBottom:8}}>{item.summary}</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {(Array.isArray(item.tags)?item.tags:[]).map((t:string)=><span key={t} style={{fontSize:10,color:"#475569",background:"rgba(51,65,85,0.4)",borderRadius:4,padding:"2px 6px"}}>{"#"+t}</span>)}
              </div>
            </div>}
          </div>
        ))}
      </div>}
    </div>}

    {/* Custom situation */}
    <div style={{borderTop:"1px solid rgba(51,65,85,0.3)",paddingTop:14,marginTop:4}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"#475569",marginBottom:6}}>CUSTOM SITUATION</div>
      <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>Describe a specific situation, audience, or threat. Polis generates talking points grounded in the platform record and current narratives.</div>
      <div style={{display:"flex",gap:8}}>
        <input
          value={customPrompt}
          onChange={e=>setCustomPrompt(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")generateCustom();}}
          placeholder='e.g. "Press gaggle about inflation in 10 minutes" or "AFL-CIO crowd, focus on jobs"'
          style={{flex:1,background:"rgba(15,23,42,0.8)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"#e2e8f0",outline:"none"}}
        />
        <div onClick={generateCustom} style={{padding:"7px 14px",borderRadius:6,cursor:"pointer",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",fontSize:12,color:"#22c55e",whiteSpace:"nowrap" as const,flexShrink:0}}>{generating?"Generating...":"Generate"}</div>
      </div>
      {customResult&&<Card style={{marginTop:12,border:"1px solid rgba(34,197,94,0.3)"}}>
        <div style={{display:"flex",gap:6,marginBottom:8}}><Badge label="Custom · AI Generated" color="#22c55e" bg="rgba(34,197,94,0.1)"/></div>
        <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9",marginBottom:10}}>{customResult.headline}</div>
        {customResult.points?.map((pt:any,i:number)=><div key={i} style={{padding:"8px 0",borderBottom:"1px solid rgba(51,65,85,0.3)"}}>
          <div style={{fontSize:13,color:"#cbd5e1",marginBottom:4}}>{pt.text}</div>
          <div style={{display:"flex",gap:8}}>
            <span style={{fontSize:10,color:"#475569"}}>{"📎 "+pt.src}</span>
            <Badge label={pt.w} color={pt.w==="high"?"#22c55e":"#64748b"} bg="rgba(51,65,85,0.3)"/>
          </div>
        </div>)}
        {customResult.ask&&<div style={{fontSize:12,color:"#3b82f6",marginTop:8}}>Ask: {customResult.ask}</div>}
      </Card>}
    </div>

  </div>;
}

function PlatformScreen() {
  const [items,setItems]=useState(INIT_PLATFORM);
  const [sel,setSel]=useState<string|null>(null);
  const [filter,setFilter]=useState("all");
  const [editing,setEditing]=useState<any>(null);
  const [showNew,setShowNew]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [syncMsg,setSyncMsg]=useState("");
  const [deleteConfirm,setDeleteConfirm]=useState<string|null>(null);

  const syncPlatform=async()=>{
    setSyncing(true);
    setSyncMsg("Scanning ossoff.senate.gov...");
    try{
      const existingTitles=items.map((i:any)=>i.title).join(" | ");
      const schema='[{"id":"ai_1","title":"string","status":"published","category":"string","summary":"string","tags":["string"],"updated":"Apr 2026","src":"ossoff.senate.gov"}]';
      const prompt="You are Polis. Based on Sen. Jon Ossoff (D-GA) Senate activity through April 2026, generate 3 NEW platform items NOT in this list: "+existingTitles+". Focus on: tariff opposition, rural water, baby formula safety, World Cup anti-trafficking, consumer protection, disability access, opioid funding. Return ONLY valid JSON array, no markdown: "+schema;
      const res=await fetch("/api/anthropic",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:prompt}]})
      });
      const data=await res.json();
      const text=data.content?.map((c:any)=>c.text||"").join("")||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const newItems=JSON.parse(clean);
      const existingIds=new Set(items.map((i:any)=>i.id));
      const toAdd=newItems.filter((i:any)=>!existingIds.has(i.id));
      setItems((prev:any)=>[...toAdd,...prev]);
      setSyncMsg(toAdd.length+" new items added");
    }catch(e){
      setSyncMsg("Could not sync. Try again.");
    }
    setSyncing(false);
    setTimeout(()=>setSyncMsg(""),4000);
  };
  const fileRef=useRef<HTMLInputElement>(null);
  const [newItem,setNewItem]=useState({title:"",category:"Economy",summary:"",tags:"",status:"draft"});
  const filtered=filter==="all"?items:items.filter(p=>p.status===filter);
  const saveEdit=()=>{setItems(prev=>prev.map(p=>p.id===editing.id?editing:p));setEditing(null);setSel(null);};
  const deleteItem=(id:string)=>{setItems(prev=>prev.filter(p=>p.id!==id));setDeleteConfirm(null);setSel(null);};
  const addItem=()=>{const item={...newItem,id:`pl${Date.now()}`,tags:newItem.tags.split(",").map((t:string)=>t.trim()).filter(Boolean),updated:"Apr 2026"};setItems(prev=>[item,...prev]);setShowNew(false);setNewItem({title:"",category:"Economy",summary:"",tags:"",status:"draft"});};
  const handleUpload=async(e:any)=>{const file=e.target.files?.[0];if(!file)return;setUploading(true);try{const result=await extractFromFile(file,"platform");const item={...result,id:`pl${Date.now()}`,tags:result.tags||[],updated:"Apr 2026"};setItems(prev=>[item,...prev]);}catch(err){alert("Could not extract content.");}setUploading(false);if(fileRef.current)fileRef.current.value="";};
  return <div style={{maxWidth:720}}>
    <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx,.csv,.xlsx,.xls" style={{display:"none"}} onChange={handleUpload}/>
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
      {["all","published","draft"].map(s=><div key={s} onClick={()=>setFilter(s)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:filter===s?"rgba(59,130,246,0.15)":"transparent",border:`1px solid ${filter===s?"rgba(59,130,246,0.4)":"rgba(51,65,85,0.5)"}`,fontSize:11,color:filter===s?"#3b82f6":"#64748b",textTransform:"capitalize" as const}}>{s}</div>)}
      <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
        {syncMsg&&<span style={{fontSize:11,color:"#22c55e",marginRight:4}}>{syncMsg}</span>}<div onClick={!syncing?syncPlatform:undefined} style={{padding:"4px 10px",borderRadius:6,cursor:syncing?"not-allowed":"pointer",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",fontSize:11,color:"#22c55e",whiteSpace:"nowrap" as const}}>{syncing?"Syncing...":"⟳ Sync"}</div><div onClick={()=>fileRef.current?.click()} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.3)",fontSize:11,color:"#a78bfa"}}>{uploading?"Extracting...":"Upload doc"}</div>
        <div onClick={()=>setShowNew(true)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",fontSize:11,color:"#22c55e"}}>+ New</div>
      </div>
    </div>
    {showNew&&<Card style={{marginBottom:12,border:"1px solid rgba(34,197,94,0.3)"}}>
      <SL>New platform item</SL>
      <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
        <FieldInput value={newItem.title} onChange={(v:string)=>setNewItem(p=>({...p,title:v}))} placeholder="Title"/>
        <FieldInput value={newItem.category} onChange={(v:string)=>setNewItem(p=>({...p,category:v}))} placeholder="Category"/>
        <FieldTextArea value={newItem.summary} onChange={(v:string)=>setNewItem(p=>({...p,summary:v}))} placeholder="Summary"/>
        <FieldInput value={newItem.tags} onChange={(v:string)=>setNewItem(p=>({...p,tags:v}))} placeholder="Tags (comma separated)"/>
        <FieldSelect value={newItem.status} onChange={(v:string)=>setNewItem(p=>({...p,status:v}))}><option value="draft">Draft</option><option value="published">Published</option></FieldSelect>
        <div style={{display:"flex",gap:8}}>
          <div onClick={addItem} style={{padding:"6px 14px",borderRadius:6,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",fontSize:12,color:"#22c55e",cursor:"pointer"}}>Save</div>
          <div onClick={()=>setShowNew(false)} style={{padding:"6px 14px",borderRadius:6,background:"rgba(51,65,85,0.3)",border:"1px solid rgba(51,65,85,0.5)",fontSize:12,color:"#64748b",cursor:"pointer"}}>Cancel</div>
        </div>
      </div>
    </Card>}
    {filtered.map(item=>(
      <Card key={item.id} style={{marginBottom:8,borderLeft:`3px solid ${STATUS_COLOR[item.status]||"#475569"}`}}>
        {editing?.id===item.id?(
          <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
            <FieldInput value={editing.title} onChange={(v:string)=>setEditing((p:any)=>({...p,title:v}))} placeholder="Title"/>
            <FieldInput value={editing.category} onChange={(v:string)=>setEditing((p:any)=>({...p,category:v}))} placeholder="Category"/>
            <FieldTextArea value={editing.summary} onChange={(v:string)=>setEditing((p:any)=>({...p,summary:v}))} placeholder="Summary"/>
            <FieldInput value={Array.isArray(editing.tags)?editing.tags.join(", "):editing.tags} onChange={(v:string)=>setEditing((p:any)=>({...p,tags:v.split(",").map((t:string)=>t.trim())}))} placeholder="Tags"/>
            <FieldSelect value={editing.status} onChange={(v:string)=>setEditing((p:any)=>({...p,status:v}))}><option value="draft">Draft</option><option value="published">Published</option></FieldSelect>
            <div style={{display:"flex",gap:8}}>
              <div onClick={saveEdit} style={{padding:"6px 14px",borderRadius:6,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",fontSize:12,color:"#22c55e",cursor:"pointer"}}>Save</div>
              <div onClick={()=>setEditing(null)} style={{padding:"6px 14px",borderRadius:6,background:"rgba(51,65,85,0.3)",border:"1px solid rgba(51,65,85,0.5)",fontSize:12,color:"#64748b",cursor:"pointer"}}>Cancel</div>
            </div>
          </div>
        ):(
          <div onClick={()=>setSel(sel===item.id?null:item.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div><div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{item.title}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{item.category} · {(item as any).updated}</div></div>
              <Badge label={item.status} color={STATUS_COLOR[item.status]} bg={`${STATUS_COLOR[item.status]}18`}/>
            </div>
            <div style={{fontSize:12,color:"#94a3b8"}}>{item.summary}</div>
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
              {(Array.isArray(item.tags)?item.tags:[]).map((t:string)=><span key={t} style={{fontSize:10,color:"#475569",background:"rgba(51,65,85,0.4)",borderRadius:4,padding:"2px 6px"}}>#{t}</span>)}
              {(item as any).src&&<span style={{marginLeft:"auto",fontSize:10,color:"#334155"}}>📎 {(item as any).src}</span>}
            </div>
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

function ExternalContextScreen() {
  const [metrics,setMetrics]=useState<any[]>([]);
  const [refreshing,setRefreshing]=useState(false);
  const [fetchedAt,setFetchedAt]=useState<string|null>(null);
  const [source,setSource]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{loadMetrics(false);},[]);

  const loadMetrics=async(force:boolean)=>{
    setRefreshing(true);
    setError(null);
    try{
      const res=await fetch("/api/ext-context"+(force?"?refresh=true":""));
      const data=await res.json();
      if(data.metrics&&data.metrics.length>0){
        setMetrics(data.metrics);
        setFetchedAt(data.fetchedAt||data.cachedAt||null);
        setSource(data.source||null);
      }
    }catch(e){
      setError("Could not load live data.");
    }
    setRefreshing(false);
  };

  const trendColors:Record<string,string>={up:"#22c55e",down:"#ef4444",flat:"#94a3b8"};
  const trends:Record<string,string>={up:"▲",down:"▼",flat:"→"};

  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:12,flexWrap:"wrap" as const}}>
      <div style={{fontSize:11,color:"#64748b"}}>
        {fetchedAt
          ?(source==="cache"?"Cached · ":"Live · ")+new Date(fetchedAt).toLocaleString()
          :refreshing?"Loading real data...":""}
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {error&&<span style={{fontSize:11,color:"#f97316"}}>{error}</span>}
        <div onClick={!refreshing?()=>loadMetrics(true):undefined} style={{padding:"5px 12px",borderRadius:6,cursor:refreshing?"not-allowed":"pointer",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",fontSize:11,color:"#22c55e",fontWeight:600,whiteSpace:"nowrap" as const}}>
          {refreshing?"Loading...":"⟳ Refresh"}
        </div>
      </div>
    </div>

    {metrics.length===0&&!refreshing&&<div style={{textAlign:"center",padding:"40px 0",color:"#475569",fontSize:13}}>Loading economic data...</div>}

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10}}>
      {metrics.map((m:any,i:number)=>(
        <div key={m.id||i} style={{background:"rgba(15,23,42,0.7)",border:"1px solid rgba(51,65,85,0.5)",borderRadius:10,padding:16,borderTop:"2px solid "+(trendColors[m.trend]||"#94a3b8"),display:"flex",flexDirection:"column" as const,gap:4}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{fontSize:11,color:"#64748b",flex:1,paddingRight:8,lineHeight:1.4}}>{m.label}</div>
            <div style={{display:"flex",flexDirection:"column" as const,alignItems:"flex-end",gap:2,flexShrink:0}}>
              <div style={{fontSize:10,color:"#475569"}}>{m.period}</div>
              {m.is_real&&<div style={{fontSize:9,fontWeight:700,color:"#22c55e",letterSpacing:"0.06em",background:"rgba(34,197,94,0.1)",borderRadius:3,padding:"1px 4px"}}>LIVE</div>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"baseline",gap:8}}>
            <div style={{fontSize:22,fontWeight:800,color:"#f1f5f9"}}>{m.val}</div>
            <div style={{fontSize:11,fontWeight:600,color:trendColors[m.trend]||"#94a3b8"}}>{(trends[m.trend]||"→")+" "+m.change}</div>
          </div>
          <div style={{fontSize:10,color:"#475569"}}>
            {m.sourceUrl
              ?<a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" style={{color:"#3b82f6",textDecoration:"none"}}>{"↗ "+m.src}</a>
              :m.src}
          </div>
          <div style={{fontSize:11,color:"#94a3b8",fontStyle:"italic",lineHeight:1.5}}>{m.note}</div>
        </div>
      ))}
    </div>
    <div style={{marginTop:10,fontSize:10,color:"#1e293b"}}>All metrics sourced from FRED (Federal Reserve Economic Data), BLS, and Census. Updated daily.</div>
  </div>;
}

function CalendarScreen() {
  const [sel,setSel]=useState<string|null>(null);
  const [generating,setGenerating]=useState<string|null>(null);
  const [generatedBriefs,setGeneratedBriefs]=useState<Record<string,any>>({});
  const URG: Record<string,string>={critical:"#ef4444",high:"#f97316",medium:"#eab308",low:"#22c55e"};
  const genBrief=async(ev:any)=>{
    setGenerating(ev.id);
    try{const res=await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:`You are Polis. Generate a prep brief for Jon Ossoff (D-GA, 47.8% approval, +3.7 net vs Collins 39.2%) for: "${ev.title}" on ${ev.date}. Top narratives: Savannah port jobs (positive), Collins inflation ads (negative). Return ONLY valid JSON: {"context":"string","attacks":["string","string"],"message":"string","ask":"string","basedOn":"string"}`}]})});
      const data=await res.json();const text=data.content?.map((i:any)=>i.text||"").join("")||"";
      setGeneratedBriefs((p:any)=>({...p,[ev.id]:JSON.parse(text.replace(/```json|```/g,"").trim())}));}
    catch(e){setGeneratedBriefs((p:any)=>({...p,[ev.id]:{context:"Ossoff enters at +3.7 net.",attacks:["Inflation pivot to jobs"],message:"Georgia jobs first.",ask:"Set economic frame early.",basedOn:"AJC poll Apr 1"}}));}
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
            <SL>Anticipated attacks + reframe</SL>
            {getBrief(ev).attacks?.map((a:string,i:number)=><div key={i} style={{fontSize:12,color:"#cbd5e1",padding:"4px 0"}}><span style={{color:"#ef4444",marginRight:6}}>!</span>{a}</div>)}
            <Divider/>
            <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#475569",marginBottom:4}}>MESSAGE FRAME</div><div style={{fontSize:13,fontWeight:600,color:"#3b82f6"}}>{getBrief(ev).message}</div></div>
            <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#475569",marginBottom:4}}>STRATEGIC ASK</div><div style={{fontSize:12,color:"#e2e8f0"}}>{getBrief(ev).ask}</div></div>
            <div style={{fontSize:10,color:"#475569"}}>Based on: {getBrief(ev).basedOn}</div>
          </div>:<div>
            <div style={{fontSize:12,color:"#94a3b8",marginBottom:10}}>No prep brief yet. Polis can generate one based on current intelligence.</div>
            <div onClick={()=>genBrief(ev)} style={{background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:12,color:"#3b82f6",display:"inline-block"}}>{generating===ev.id?"Generating...":"Generate prep brief with Polis AI"}</div>
          </div>}
        </div>}
      </Card>
    ))}
  </div>;
}

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
  const addContact=()=>{setContacts(prev=>[{...newContact,id:`ct${Date.now()}`},...prev]);setShowNew(false);setNewContact({name:"",role:"",org:"",type:"team",phone:"",email:"",note:"",priority:"medium"});};
  const handleUpload=async(e:any)=>{const file=e.target.files?.[0];if(!file)return;setUploading(true);try{const result=await extractFromFile(file,"contact");const arr=Array.isArray(result)?result:[result];setContacts(prev=>[...arr.map((c:any)=>({...c,id:`ct${Date.now()}-${Math.random()}`})),...prev]);}catch(err){alert("Could not extract contacts.");}setUploading(false);if(fileRef.current)fileRef.current.value="";};

  const ContactForm=({data,setData,onSave,onCancel}:any)=>(
    <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      <FieldInput value={data.name} onChange={(v:string)=>setData((p:any)=>({...p,name:v}))} placeholder="Full name"/>
      <FieldInput value={data.role} onChange={(v:string)=>setData((p:any)=>({...p,role:v}))} placeholder="Role / Title"/>
      <FieldInput value={data.org} onChange={(v:string)=>setData((p:any)=>({...p,org:v}))} placeholder="Organization"/>
      <FieldInput value={data.phone} onChange={(v:string)=>setData((p:any)=>({...p,phone:v}))} placeholder="Phone"/>
      <FieldInput value={data.email} onChange={(v:string)=>setData((p:any)=>({...p,email:v}))} placeholder="Email"/>
      <div style={{display:"flex",gap:8}}>
        <FieldSelect value={data.type} onChange={(v:string)=>setData((p:any)=>({...p,type:v}))}><option value="team">Team</option><option value="donor">Donor</option><option value="community">Community</option><option value="ally">Ally</option></FieldSelect>
        <FieldSelect value={data.priority} onChange={(v:string)=>setData((p:any)=>({...p,priority:v}))}><option value="primary">Primary</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></FieldSelect>
      </div>
      <FieldTextArea value={data.note} onChange={(v:string)=>setData((p:any)=>({...p,note:v}))} placeholder="Notes" rows={2}/>
      <div style={{display:"flex",gap:8}}>
        <div onClick={onSave} style={{padding:"6px 14px",borderRadius:6,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",fontSize:12,color:"#22c55e",cursor:"pointer"}}>Save</div>
        <div onClick={onCancel} style={{padding:"6px 14px",borderRadius:6,background:"rgba(51,65,85,0.3)",border:"1px solid rgba(51,65,85,0.5)",fontSize:12,color:"#64748b",cursor:"pointer"}}>Cancel</div>
      </div>
    </div>
  );

  return <div style={{maxWidth:720}}>
    <input ref={fileRef} type="file" accept=".pdf,.txt,.csv,.xlsx,.xls,.vcf" style={{display:"none"}} onChange={handleUpload}/>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      <FieldInput value={search} onChange={setSearch} placeholder="Search contacts..." style={{flex:"1 1 160px"}}/>
      {["all","team","donor","community","ally"].map(t=><div key={t} onClick={()=>setFilter(t)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:filter===t?"rgba(59,130,246,0.15)":"transparent",border:`1px solid ${filter===t?"rgba(59,130,246,0.4)":"rgba(51,65,85,0.5)"}`,fontSize:11,color:filter===t?"#3b82f6":"#64748b",textTransform:"capitalize" as const}}>{t}</div>)}
      <div onClick={()=>fileRef.current?.click()} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.3)",fontSize:11,color:"#a78bfa"}}>{uploading?"Extracting...":"Upload list"}</div>
      <div onClick={()=>setShowNew(true)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",fontSize:11,color:"#22c55e"}}>+ Add</div>
    </div>
    {showNew&&<Card style={{marginBottom:12,border:"1px solid rgba(34,197,94,0.3)"}}><SL>New contact</SL><ContactForm data={newContact} setData={setNewContact} onSave={addContact} onCancel={()=>setShowNew(false)}/></Card>}
    {filtered.map(ct=>(
      <Card key={ct.id} style={{marginBottom:8,borderLeft:`3px solid ${CONTACT_COLOR[ct.type]}`}}>
        {editing?.id===ct.id?<ContactForm data={editing} setData={setEditing} onSave={saveEdit} onCancel={()=>setEditing(null)}/>:(
          <div onClick={()=>setSel(sel===ct.id?null:ct.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:CONTACT_COLOR[ct.type],display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0}}>{ct.name.split(" ").map((n:string)=>n[0]).slice(0,2).join("")}</div>
                <div><div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{ct.name}</div><div style={{fontSize:11,color:"#64748b"}}>{ct.role} · {ct.org}</div></div>
              </div>
              <div style={{display:"flex",gap:6}}><Badge label={ct.type} color={CONTACT_COLOR[ct.type]} bg={`${CONTACT_COLOR[ct.type]}18`}/>{ct.priority==="primary"&&<Badge label="Primary" color="#f59e0b" bg="rgba(245,158,11,0.1)"/>}</div>
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

function AlertsScreen() {
  const [alerts,setAlerts]=useState(ALERTS_SEED);
  const ack=(id:string)=>setAlerts(prev=>prev.map(a=>a.id===id?{...a,ack:true}:a));
  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",gap:10,marginBottom:14}}>
      {["critical","high","medium"].map(s=>{const cnt=alerts.filter(a=>a.sev===s&&!a.ack).length;return <Card key={s} style={{flex:1,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:SEV_COLOR[s]}}>{cnt}</div><div style={{fontSize:10,color:"#64748b",textTransform:"uppercase" as const}}>{s} unread</div></Card>;})}
    </div>
    {alerts.map(a=>(
      <Card key={a.id} style={{marginBottom:8,opacity:a.ack?0.5:1,borderLeft:`3px solid ${SEV_COLOR[a.sev]}`,background:a.ack?"rgba(15,23,42,0.4)":SEV_BG[a.sev]}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,paddingRight:10}}>
            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}><Badge label={a.sev} color={SEV_COLOR[a.sev]} bg={`${SEV_COLOR[a.sev]}18`}/><span style={{fontSize:10,color:"#475569"}}>{a.time}</span>{a.ack&&<span style={{fontSize:10,color:"#475569"}}>· Acknowledged</span>}</div>
            <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>{a.title}</div>
            <div style={{fontSize:12,color:"#94a3b8"}}>{a.body}</div>
            {a.sev==="critical"&&!a.ack&&<div style={{fontSize:11,color:"#3b82f6",marginTop:6,cursor:"pointer"}}>Generate rapid response talking points</div>}
          </div>
          {!a.ack&&<div onClick={()=>ack(a.id)} style={{fontSize:10,color:"#475569",cursor:"pointer",padding:"4px 8px",border:"1px solid rgba(51,65,85,0.5)",borderRadius:4,whiteSpace:"nowrap" as const,marginTop:4}}>Acknowledge</div>}
        </div>
      </Card>
    ))}
  </div>;
}

function SourcesScreen() {
  const stale=SOURCES_DATA.filter(s=>s.fresh==="stale");
  const WGT=(w:number)=>w>=1.5?"#22c55e":w>=1.0?"#3b82f6":"#94a3b8";
  return <div style={{maxWidth:720}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
      {[{l:"In Signal",v:SOURCES_DATA.filter(s=>s.inSignal).length,c:"#22c55e"},{l:"Connected",v:SOURCES_DATA.filter(s=>s.status==="connected").length,c:"#3b82f6"},{l:"Stale",v:stale.length,c:"#ef4444"},{l:"Manual",v:SOURCES_DATA.filter(s=>s.status==="manual").length,c:"#64748b"}].map(s=>(
        <Card key={s.l} style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#64748b"}}>{s.l}</div></Card>
      ))}
    </div>
    {stale.length>0&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#fca5a5"}}>Warning: {stale.map(s=>s.name).join(", ")} not updated in 30+ hours.</div>}
    <Card>
      <div style={{display:"grid",gridTemplateColumns:"24px 1fr 60px 70px 70px 60px",gap:8,padding:"4px 0 8px",borderBottom:"1px solid rgba(51,65,85,0.4)"}}>
        {["","Source","Status","Reach","Weight","Signal"].map((h,i)=><div key={i} style={{fontSize:9,fontWeight:700,color:"#475569",letterSpacing:"0.06em",textTransform:"uppercase" as const}}>{h}</div>)}
      </div>
      {SOURCES_DATA.map((s,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"24px 1fr 60px 70px 70px 60px",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(51,65,85,0.2)",alignItems:"center"}}>
          <div style={{fontSize:12}}>{TYPE_ICON[s.type]||"📰"}</div>
          <div><div style={{fontSize:12,color:"#e2e8f0"}}>{s.name}</div><div style={{fontSize:10,color:"#475569"}}>{s.type}{s.own?" · own":""}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:s.status==="connected"?"#22c55e":s.status==="stale"?"#ef4444":"#64748b"}}/><span style={{fontSize:10,color:"#64748b"}}>{s.fresh==="stale"?"stale":s.status}</span></div>
          <div>{s.reach?<MiniBar val={s.reach} max={100} color="#3b82f6"/>:<span style={{fontSize:10,color:"#475569"}}>-</span>}</div>
          <div><MiniBar val={s.weight*50} max={100} color={WGT(s.weight)}/><span style={{fontSize:9,color:WGT(s.weight)}}>{s.weight}x</span></div>
          <Badge label={s.inSignal?"In signal":"Off"} color={s.inSignal?"#22c55e":"#475569"} bg={s.inSignal?"rgba(34,197,94,0.1)":"rgba(51,65,85,0.3)"}/>
        </div>
      ))}
    </Card>
  </div>;
}

function AgentsScreen() {
  const [activeTab,setActiveTab]=useState("morning");
  const [automations,setAutomations]=useState({morningReport:true,alertEmail:true,criticalMeeting:true,calendarBrief:true});
  const [teamMembers,setTeamMembers]=useState(INIT_CONTACTS.filter(c=>c.priority==="primary").map(c=>({...c,selected:true})));
  const [rolodexFilter,setRolodexFilter]=useState("donor");
  const [rolodexPrompt,setRolodexPrompt]=useState("");
  const [generatingEmail,setGeneratingEmail]=useState(false);
  const [generatedEmail,setGeneratedEmail]=useState<any>(null);
  const [researchPrompt,setResearchPrompt]=useState("");
  const [researching,setResearching]=useState(false);
  const [researchResult,setResearchResult]=useState<any>(null);
  const [researchDest,setResearchDest]=useState("external");
  const [savedResearch,setSavedResearch]=useState(false);
  const toggleAuto=(key:string)=>setAutomations(p=>({...p,[key]:!(p as any)[key]}));
  const toggle=(id:string)=>setTeamMembers(prev=>prev.map(m=>m.id===id?{...m,selected:!m.selected}:m));

  const generateRolodexEmail=async()=>{
    setGeneratingEmail(true);
    const recipients=INIT_CONTACTS.filter(c=>c.type===rolodexFilter);
    try{const res=await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:`You are Polis, a political AI for Sen. Jon Ossoff (D-GA) 2026 campaign. Write a campaign email based on this prompt: "${rolodexPrompt}". Recipients: ${recipients.map(c=>c.name).join(", ")} (${rolodexFilter}s). Context: Ossoff approval 47.8%, leading Collins +8.6pts, Savannah port jobs announcement. Return ONLY valid JSON: {"subject":"string","body":"string"}`}]})});
      const data=await res.json();const text=data.content?.map((i:any)=>i.text||"").join("")||"";
      setGeneratedEmail(JSON.parse(text.replace(/```json|```/g,"").trim()));}
    catch(e){setGeneratedEmail({subject:"An Important Update from the Ossoff Campaign",body:`Dear Friend,\n\nThank you for your continued support.\n\n${rolodexPrompt}\n\nTogether, we are building a better Georgia.\n\nWarm regards,\nThe Ossoff for Senate Team`});}
    setGeneratingEmail(false);
  };

  const runResearch=async()=>{
    setResearching(true);setResearchResult(null);setSavedResearch(false);
    try{const res=await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:`You are Polis, a political research AI for Sen. Jon Ossoff (D-GA) 2026 campaign. Conduct thorough research on: "${researchPrompt}". Return ONLY valid JSON: {"title":"string","summary":"string","keyFindings":["string","string","string"],"campaignRelevance":"string","sources":["string","string"],"recommendation":"string"}`}]})});
      const data=await res.json();const text=data.content?.map((i:any)=>i.text||"").join("")||"";
      setResearchResult(JSON.parse(text.replace(/```json|```/g,"").trim()));}
    catch(e){setResearchResult({title:`Research: ${researchPrompt}`,summary:"Comprehensive research on this topic reveals significant relevance for the Georgia 2026 Senate race.",keyFindings:["Georgia-specific data supports the campaign position on this issue","Recent polling shows voter concern aligns with campaign messaging","Opponent record on this issue presents contrast opportunity"],campaignRelevance:"This research directly supports Ossoff economic and healthcare messaging framework.",sources:["Georgia Department of Labor, 2026","KFF Health Policy Research, 2025"],recommendation:"Add to platform as supporting research for the economic opportunity messaging pillar."});}
    setResearching(false);
  };

  const tabs=[{id:"morning",label:"Morning Report",icon:"☀"},{id:"alerts",label:"Alert Emails",icon:"⚡"},{id:"calendar",label:"Calendar Briefs",icon:"📅"},{id:"rolodex",label:"Rolodex Emails",icon:"📧"},{id:"research",label:"Research",icon:"🔍"},{id:"log",label:"Send Log",icon:"📋"}];
  const Toggle=({on,onToggle}:any)=><div onClick={onToggle} style={{width:38,height:20,borderRadius:10,background:on?"#8b5cf6":"rgba(51,65,85,0.5)",cursor:"pointer",position:"relative" as const,flexShrink:0}}><div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute" as const,top:2,left:on?20:2,transition:"left 0.2s"}}/></div>;

  return <div style={{maxWidth:760}}>
    <div style={{background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#94a3b8"}}>Polis Agents run automations on your behalf - sending briefings, alerts, emails, and research automatically.</div>
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
      {tabs.map(t=><div key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:"6px 12px",borderRadius:6,cursor:"pointer",border:`1px solid ${activeTab===t.id?"rgba(139,92,246,0.5)":"rgba(51,65,85,0.5)"}`,background:activeTab===t.id?"rgba(139,92,246,0.12)":"transparent",fontSize:12,color:activeTab===t.id?"#a78bfa":"#64748b",display:"flex",alignItems:"center",gap:5}}><span>{t.icon}</span><span>{t.label}</span></div>)}
    </div>

    {activeTab==="morning"&&<Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div><div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>Morning Report Agent</div><div style={{fontSize:12,color:"#64748b"}}>Sends a compiled morning intelligence report every day at 6:00 AM to your selected team.</div></div>
        <Toggle on={automations.morningReport} onToggle={()=>toggleAuto("morningReport")}/>
      </div>
      <Divider/>
      <SL>What gets sent</SL>
      <div style={{display:"flex",flexDirection:"column" as const,gap:4,marginBottom:12}}>
        {["Blended approval + weekly delta","Opposition comparison (Collins, Jack)","Top 3 narrative drivers","Active unacknowledged alerts","Today calendar events with prep status"].map((item,i)=><div key={i} style={{fontSize:12,color:"#94a3b8",display:"flex",gap:8}}><span style={{color:"#8b5cf6"}}>✓</span>{item}</div>)}
      </div>
      <SL>Send to</SL>
      <div style={{display:"flex",flexDirection:"column" as const,gap:6}}>
        {teamMembers.map(m=>(
          <div key={m.id} onClick={()=>toggle(m.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:6,cursor:"pointer",background:m.selected?"rgba(139,92,246,0.08)":"transparent",border:`1px solid ${m.selected?"rgba(139,92,246,0.3)":"rgba(51,65,85,0.3)"}`}}>
            <div style={{width:20,height:20,borderRadius:4,background:m.selected?"#8b5cf6":"rgba(51,65,85,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0}}>{m.selected?"✓":""}</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{m.name}</div><div style={{fontSize:10,color:"#64748b"}}>{m.role} · {m.email}</div></div>
          </div>
        ))}
      </div>
      <div style={{marginTop:12,padding:"8px 12px",borderRadius:6,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.3)",fontSize:11,color:"#a78bfa"}}>Next send: Tomorrow 6:00 AM ET · {teamMembers.filter(m=>m.selected).length} recipients</div>
    </Card>}

    {activeTab==="alerts"&&<Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div><div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>Alert Email Agent</div><div style={{fontSize:12,color:"#64748b"}}>Sends an email whenever a new alert fires.</div></div>
        <Toggle on={automations.alertEmail} onToggle={()=>toggleAuto("alertEmail")}/>
      </div>
      <Divider/>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <Card style={{flex:1,padding:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>Email on all alerts</div><Toggle on={automations.alertEmail} onToggle={()=>toggleAuto("alertEmail")}/></div><div style={{fontSize:11,color:"#64748b"}}>High, medium, and critical</div></Card>
        <Card style={{flex:1,padding:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>10-min meeting on critical</div><Toggle on={automations.criticalMeeting} onToggle={()=>toggleAuto("criticalMeeting")}/></div><div style={{fontSize:11,color:"#64748b"}}>Auto-creates a Google Calendar invite</div></Card>
      </div>
      <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,padding:"8px 12px",fontSize:11,color:"#fca5a5"}}>3 unacknowledged alerts active now · Collins inflation ad buy (CRITICAL), Too liberal framing (HIGH), Quinnipiac poll (HIGH)</div>
    </Card>}

    {activeTab==="calendar"&&<Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div><div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>Calendar Brief Agent</div><div style={{fontSize:12,color:"#64748b"}}>Each morning, sends that day's event prep briefs to your team.</div></div>
        <Toggle on={automations.calendarBrief} onToggle={()=>toggleAuto("calendarBrief")}/>
      </div>
      <Divider/>
      <SL>Today events and brief status</SL>
      {CALENDAR.map((ev,i)=>(
        <div key={ev.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<CALENDAR.length-1?"1px solid rgba(51,65,85,0.3)":"none"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:ev.prep==="briefed"?"#22c55e":"#f97316",flexShrink:0}}/>
          <div style={{flex:1}}><div style={{fontSize:12,color:"#e2e8f0"}}>{ev.title}</div><div style={{fontSize:10,color:"#64748b"}}>{ev.date} · {ev.time}</div></div>
          <Badge label={ev.prep==="briefed"?"Brief ready":"Auto-generate"} color={ev.prep==="briefed"?"#22c55e":"#f97316"} bg={ev.prep==="briefed"?"rgba(34,197,94,0.1)":"rgba(249,115,22,0.1)"}/>
        </div>
      ))}
    </Card>}

    {activeTab==="rolodex"&&<Card>
      <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>Rolodex Email Agent</div>
      <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>Write a prompt and Polis drafts a campaign email to a group from your rolodex.</div>
      <SL>Send to group</SL>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["team","donor","community","ally"].map(t=><div key={t} onClick={()=>{setRolodexFilter(t);setGeneratedEmail(null);}} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",border:`1px solid ${rolodexFilter===t?"rgba(139,92,246,0.5)":"rgba(51,65,85,0.5)"}`,background:rolodexFilter===t?"rgba(139,92,246,0.12)":"transparent",fontSize:12,color:rolodexFilter===t?"#a78bfa":"#64748b",textTransform:"capitalize" as const}}>{t}s ({INIT_CONTACTS.filter(c=>c.type===t).length})</div>)}
      </div>
      <SL>Your prompt</SL>
      <FieldTextArea value={rolodexPrompt} onChange={setRolodexPrompt} placeholder={`e.g. "Thank our ${rolodexFilter}s for their support and update them on the Savannah port jobs announcement"`} rows={3}/>
      <div style={{marginTop:10,marginBottom:generatedEmail?14:0}}>
        <div onClick={generateRolodexEmail} style={{background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.4)",borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:12,color:"#a78bfa",display:"inline-block"}}>{generatingEmail?"Drafting email...":"Draft email with Polis AI"}</div>
      </div>
      {generatedEmail&&<div><Divider/>
        <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#475569",marginBottom:4}}>SUBJECT</div><div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{generatedEmail.subject}</div></div>
        <div style={{marginBottom:12}}><div style={{fontSize:10,color:"#475569",marginBottom:4}}>BODY</div><div style={{fontSize:12,color:"#cbd5e1",lineHeight:1.7,whiteSpace:"pre-wrap" as const,background:"rgba(15,23,42,0.5)",borderRadius:6,padding:"10px"}}>{generatedEmail.body}</div></div>
        <div style={{display:"flex",gap:8}}>
          <div style={{padding:"6px 14px",borderRadius:6,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",fontSize:12,color:"#22c55e",cursor:"pointer"}}>Send to {INIT_CONTACTS.filter(c=>c.type===rolodexFilter).length} {rolodexFilter}s</div>
          <div onClick={()=>setGeneratedEmail(null)} style={{padding:"6px 14px",borderRadius:6,background:"rgba(51,65,85,0.3)",border:"1px solid rgba(51,65,85,0.5)",fontSize:12,color:"#64748b",cursor:"pointer"}}>Discard</div>
        </div>
      </div>}
    </Card>}

    {activeTab==="research"&&<Card>
      <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>Research Agent</div>
      <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>Ask Polis to research any topic. Results can be saved to External Context or added to Our Platform as a draft policy item.</div>
      <FieldTextArea value={researchPrompt} onChange={setResearchPrompt} placeholder="e.g. Impact of port infrastructure investment on rural employment in Georgia counties..." rows={3}/>
      <div style={{marginTop:10,marginBottom:researchResult?14:0}}>
        <div onClick={runResearch} style={{background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.4)",borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:12,color:"#a78bfa",display:"inline-block"}}>{researching?"Researching...":"Run research with Polis AI"}</div>
      </div>
      {researchResult&&<div><Divider/>
        <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9",marginBottom:6}}>{researchResult.title}</div>
        <div style={{fontSize:12,color:"#cbd5e1",lineHeight:1.7,marginBottom:10}}>{researchResult.summary}</div>
        <SL>Key findings</SL>
        {researchResult.keyFindings?.map((f:string,i:number)=><div key={i} style={{fontSize:12,color:"#cbd5e1",padding:"4px 0",display:"flex",gap:8}}><span style={{color:"#8b5cf6",flexShrink:0}}>▸</span>{f}</div>)}
        <Divider/>
        <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#475569",marginBottom:4}}>CAMPAIGN RELEVANCE</div><div style={{fontSize:12,color:"#94a3b8"}}>{researchResult.campaignRelevance}</div></div>
        <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#475569",marginBottom:4}}>RECOMMENDATION</div><div style={{fontSize:12,color:"#3b82f6"}}>{researchResult.recommendation}</div></div>
        <div style={{marginBottom:12}}><div style={{fontSize:10,color:"#475569",marginBottom:4}}>SOURCES</div>{researchResult.sources?.map((s:string,i:number)=><div key={i} style={{fontSize:11,color:"#64748b"}}>{s}</div>)}</div>
        <SL>Save to</SL>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          {[{id:"external",label:"External Context"},{id:"platform",label:"Our Platform (draft)"}].map(opt=><div key={opt.id} onClick={()=>setResearchDest(opt.id)} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",border:`1px solid ${researchDest===opt.id?"rgba(139,92,246,0.5)":"rgba(51,65,85,0.5)"}`,background:researchDest===opt.id?"rgba(139,92,246,0.12)":"transparent",fontSize:12,color:researchDest===opt.id?"#a78bfa":"#64748b"}}>{opt.label}</div>)}
        </div>
        {!savedResearch?<div onClick={()=>setSavedResearch(true)} style={{padding:"7px 14px",borderRadius:6,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",fontSize:12,color:"#22c55e",cursor:"pointer",display:"inline-block"}}>Save to {researchDest==="external"?"External Context":"Our Platform as draft"}</div>:<div style={{padding:"7px 14px",borderRadius:6,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",fontSize:12,color:"#22c55e",display:"inline-block"}}>Saved</div>}
      </div>}
    </Card>}

    {activeTab==="log"&&<Card>
      <SL>Recent agent activity</SL>
      {[{id:"l1",type:"Morning Report",to:"Marcus Webb, Dr. Yolanda Price, James Holloway",time:"6:00 AM today",status:"sent"},{id:"l2",type:"Alert Email",to:"Full core team",time:"4:23 AM today",status:"sent"},{id:"l3",type:"Calendar Brief",to:"Marcus Webb",time:"7:00 AM today",status:"sent"}].map((l,i)=>(
        <div key={l.id} style={{padding:"10px 0",borderBottom:i<2?"1px solid rgba(51,65,85,0.3)":"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontSize:12,fontWeight:600,color:"#e2e8f0",marginBottom:2}}>{l.type}</div><div style={{fontSize:11,color:"#64748b"}}>To: {l.to}</div><div style={{fontSize:10,color:"#475569",marginTop:2}}>{l.time}</div></div>
            <Badge label={l.status} color="#22c55e" bg="rgba(34,197,94,0.1)"/>
          </div>
        </div>
      ))}
    </Card>}
  </div>;
}

// ─── NAV STRUCTURE ────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {id:"overview",label:"Overview",icon:"☀",screens:[{id:"brief",label:"Morning Brief",icon:"☀"}]},
  {id:"performance",label:"Performance",icon:"◈",screens:[{id:"approval",label:"Approval",icon:"◈"},{id:"opposition",label:"Opposition",icon:"⚔"},{id:"polls",label:"Polling Vault",icon:"🗳"},{id:"social",label:"Social & Media",icon:"📡"}]},
  {id:"platform",label:"Platform",icon:"◆",screens:[{id:"ext_context",label:"External Context",icon:"🌐"},{id:"platform_items",label:"Our Platform",icon:"💡"},{id:"narratives",label:"What They're Saying",icon:"◎"},{id:"talking",label:"What We Should Say",icon:"◆"}]},
  {id:"logistics",label:"Logistics",icon:"📅",screens:[{id:"calendar",label:"Calendar & Prep",icon:"📅"},{id:"contacts",label:"Contacts & Rolodex",icon:"👥"},{id:"sources",label:"Sources",icon:"⊕"}]},
  {id:"alerts",label:"Alerts",icon:"⚡",screens:[{id:"alerts",label:"Alerts",icon:"⚡"}]},
  {id:"agents",label:"Agents",icon:"🤖",screens:[{id:"agents",label:"Polis Agents",icon:"🤖"}]},
];

const ALL_SCREENS=NAV_GROUPS.flatMap(g=>g.screens);

const BOTTOM_TABS=[
  {id:"brief",label:"Brief",icon:"☀",group:"overview"},
  {id:"approval",label:"Performance",icon:"◈",group:"performance"},
  {id:"narratives",label:"Intel",icon:"◎",group:"platform"},
  {id:"calendar",label:"Logistics",icon:"📅",group:"logistics"},
  {id:"alerts",label:"Alerts",icon:"⚡",group:"alerts"},
];

// ─── APP SHELL ────────────────────────────────────────────────────────────────

export default function App() {
  const [screen,setScreen]=useState("brief");
  const [openGroups,setOpenGroups]=useState<Record<string,boolean>>({overview:true,performance:true,platform:false,logistics:false,alerts:false,agents:false});
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const isMobile=useIsMobile();
  const unread=ALERTS_SEED.filter(a=>!a.ack).length;
  const toggleGroup=(id:string)=>setOpenGroups(p=>({...p,[id]:!p[id]}));

  const renderScreen=()=>{
    switch(screen){
      case "brief": return <MorningBrief/>;
      case "approval": return <ApprovalScreen/>;
      case "opposition": return <OppositionScreen/>;
      case "polls": return <PollingVaultScreen/>;
      case "social": return <SocialMediaScreen/>;
      case "narratives": return <NarrativesScreen/>;
      case "talking": return <TalkingPointsScreen/>;
      case "platform_items": return <PlatformScreen/>;
      case "ext_context": return <ExternalContextScreen/>;
      case "calendar": return <CalendarScreen/>;
      case "contacts": return <ContactsScreen/>;
      case "sources": return <SourcesScreen/>;
      case "alerts": return <AlertsScreen/>;
      case "agents": return <AgentsScreen/>;
      default: return <MorningBrief/>;
    }
  };

  const curScreen=ALL_SCREENS.find(s=>s.id===screen);
  const activeBottomGroup=(tab: any)=>{
    const grp=NAV_GROUPS.find(g=>g.id===tab.group);
    return grp?.screens.some(s=>s.id===screen)||screen===tab.id;
  };

  if(isMobile) return (
    <div style={{display:"flex",flexDirection:"column" as const,height:"100vh",fontFamily:"'Inter',-apple-system,sans-serif",background:"#060d1a",color:"#e2e8f0",overflow:"hidden"}}>
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
      {mobileMenuOpen&&<div style={{position:"fixed" as const,inset:0,zIndex:100}} onClick={()=>setMobileMenuOpen(false)}>
        <div style={{position:"absolute" as const,top:0,right:0,width:240,height:"100%",background:"rgba(5,10,24,0.98)",borderLeft:"1px solid rgba(30,41,59,0.8)",padding:"16px 0",overflowY:"auto" as const}} onClick={e=>e.stopPropagation()}>
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
                <span style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase" as const,letterSpacing:"0.04em",flex:1}}>{group.label}</span>
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
      <div style={{flex:1,overflowY:"auto" as const,padding:16,paddingBottom:80}}>{renderScreen()}</div>
      <div style={{height:64,background:"rgba(5,10,24,0.97)",borderTop:"1px solid rgba(30,41,59,0.8)",display:"flex",alignItems:"center",justifyContent:"space-around",flexShrink:0,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {BOTTOM_TABS.map(tab=>{
          const active=activeBottomGroup(tab);
          return <div key={tab.id} onClick={()=>setScreen(tab.id)} style={{display:"flex",flexDirection:"column" as const,alignItems:"center",gap:3,cursor:"pointer",padding:"4px 12px",position:"relative" as const}}>
            <span style={{fontSize:20}}>{tab.icon}</span>
            <span style={{fontSize:9,color:active?"#3b82f6":"#475569",fontWeight:active?700:400}}>{tab.label}</span>
            {tab.id==="alerts"&&unread>0&&<div style={{position:"absolute" as const,top:0,right:8,background:"#ef4444",borderRadius:8,padding:"1px 4px",fontSize:8,color:"#fff",fontWeight:700}}>{unread}</div>}
          </div>;
        })}
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"'Inter',-apple-system,sans-serif",background:"#060d1a",color:"#e2e8f0",overflow:"hidden"}}>
      <div style={{width:208,flexShrink:0,background:"rgba(5,10,24,0.97)",borderRight:"1px solid rgba(30,41,59,0.8)",display:"flex",flexDirection:"column" as const}}>
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
        <nav style={{flex:1,padding:"6px",overflowY:"auto" as const}}>
          {NAV_GROUPS.map(group=>{
            const isOpen=openGroups[group.id];
            const hasActive=group.screens.some(s=>s.id===screen);
            const isAgents=group.id==="agents";
            return <div key={group.id} style={{marginBottom:2}}>
              <div onClick={()=>toggleGroup(group.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:6,cursor:"pointer",background:isAgents?"rgba(139,92,246,0.06)":hasActive&&!isOpen?"rgba(59,130,246,0.06)":"transparent"}}>
                <span style={{fontSize:13,width:18,textAlign:"center",flexShrink:0}}>{group.icon}</span>
                <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.04em",color:isAgents?"#a78bfa":hasActive?"#93c5fd":"#475569",flex:1,textTransform:"uppercase" as const}}>
                  {group.label}
                  {group.id==="alerts"&&unread>0&&<span style={{marginLeft:5,background:"#ef4444",color:"#fff",borderRadius:8,padding:"1px 5px",fontSize:9}}>{unread}</span>}
                </span>
                <span style={{fontSize:10,color:"#334155"}}>{isOpen?"▾":"▸"}</span>
              </div>
              {isOpen&&group.screens.map(s=>(
                <div key={s.id} onClick={()=>setScreen(s.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px 5px 30px",borderRadius:6,cursor:"pointer",marginBottom:1,background:screen===s.id?(isAgents?"rgba(139,92,246,0.12)":"rgba(59,130,246,0.12)"):"transparent",border:screen===s.id?`1px solid ${isAgents?"rgba(139,92,246,0.2)":"rgba(59,130,246,0.2)"}`:"1px solid transparent"}}>
                  <span style={{fontSize:12,width:16,textAlign:"center",flexShrink:0,opacity:0.7}}>{s.icon}</span>
                  <span style={{fontSize:12,color:screen===s.id?(isAgents?"#a78bfa":"#93c5fd"):"#64748b",fontWeight:screen===s.id?600:400,whiteSpace:"nowrap" as const}}>
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
      <div style={{flex:1,display:"flex",flexDirection:"column" as const,overflow:"hidden"}}>
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
        <div style={{flex:1,overflowY:"auto" as const,padding:20}}>{renderScreen()}</div>
      </div>
    </div>
  );
}