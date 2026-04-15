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

const TALKING_POINTS = [
  {id:"t1",issue:"Savannah port + jobs",audience:"Atlanta broadcast press",date:"Apr 5, 2026",narrative:"n1",poll:"p1",headline:"Georgia is building again — 12,000 jobs in Savannah, and Collins voted against it.",points:[{text:"The Savannah port expansion will create an estimated 12,000 direct and indirect jobs over 3 years.",src:"USDOT infrastructure grant analysis, Mar 2026",w:"high"},{text:"Georgia port infrastructure was at capacity — this investment addresses a bottleneck costing exporters $400M annually.",src:"Georgia Ports Authority, 2025",w:"high"},{text:"Collins voted against the federal infrastructure bill that funds this expansion.",src:"Roll call record 2023-2025",w:"high"}],ask:"Invite the reporter to visit the Savannah port terminal.",tone:"Confident, Georgia-specific, factual. Never defensive."},
  {id:"t2",issue:"Healthcare / Medicaid gap",audience:"Town hall South Georgia",date:"Apr 5, 2026",narrative:"n2",poll:"p2",headline:"500,000 Georgians fell into the coverage gap. Collins put them there — twice.",points:[{text:"Georgia has the second-highest uninsured rate in the nation. More than 500,000 Georgians fall into the coverage gap.",src:"KFF Health Insurance Coverage Data, 2025",w:"high"},{text:"Collins voted against ACA Medicaid expansion twice. Not once. Twice.",src:"Roll call, 2023 and 2024",w:"high"}],ask:"Invite 2-3 audience members who have personal coverage gap stories.",tone:"Personal, direct, South Georgia-specific. No DC jargon."},
  {id:"t3",issue:"Inflation counter-narrative",audience:"Rapid response opposition",date:"Apr 4, 2026",narrative:"n3",poll:null,headline:"Collins is running $2.4M in ads. Here is his actual record on Georgia economy.",points:[{text:"Collins voted against the bipartisan infrastructure bill — the same bill bringing 12,000 jobs to Savannah right now.",src:"Roll call + USDOT grant records, Mar 2026",w:"high"},{text:"Collins voted against the CHIPS Act which brought two semiconductor facilities to Georgia worth $4.5B.",src:"Roll call + GA Dept of Economic Development, 2025",w:"high"}],ask:"Do not repeat his attack line. Lead with his voting record on Georgia-specific economic bills.",tone:"Assertive, factual, Georgia-specific. Never defensive."},
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
  const W=520,H=160,PAD={t:12,r:12,b:28,l:36};
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
  const recentPosts = [
    {who:"Ossoff",platform:"Twitter",content:"Georgia is building again. 12,000 new jobs at the Port of Savannah.",likes:4821,shares:1204,time:"3h ago",sent:"positive"},
    {who:"Collins",platform:"Twitter",content:"Ossoff voted with Biden 96% of the time. Inflation is still hammering Georgia families.",likes:2341,shares:891,time:"8h ago",sent:"negative"},
    {who:"Ossoff",platform:"Instagram",content:"Visited the Port of Savannah today. The infrastructure investment we secured is already creating jobs.",likes:8930,shares:0,time:"5h ago",sent:"positive"},
  ];
  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
      <div style={{fontSize:11,color:"#64748b"}}>Sunday, April 5, 2026 · 6:00 AM ET</div>
      <Badge label="Daily Brief" color="#3b82f6" bg="rgba(59,130,246,0.12)"/>
    </div>
    <Card style={{marginBottom:10}}>
      <SL>How am I doing?</SL>
      <div style={{display:"flex",alignItems:"flex-end",gap:16,flexWrap:"wrap"}}>
        <div><div style={{fontSize:48,fontWeight:800,color:"#f1f5f9",lineHeight:1}}>47.8<span style={{fontSize:22}}>%</span></div><div style={{fontSize:12,color:"#64748b",marginTop:4}}>Blended approval · 4 polls in signal</div></div>
        <div style={{marginBottom:4}}><div style={{fontSize:20,fontWeight:700,color:"#22c55e"}}>+3.7 net</div><DeltaBadge v={1.6}/> <span style={{fontSize:11,color:"#64748b"}}>this week · 30-day high</span></div>
        <div style={{background:"rgba(59,130,246,0.08)",borderRadius:8,padding:"10px 14px",textAlign:"center"}}><div style={{fontSize:11,color:"#64748b"}}>Lead over Collins</div><div style={{fontSize:28,fontWeight:800,color:"#22c55e"}}>+8.6</div><div style={{fontSize:10,color:"#22c55e"}}>▲ +3.8 this week</div></div>
      </div>
    </Card>
    <Card style={{marginBottom:10}}>
      <SL>What changed and why</SL>
      <p style={{fontSize:13,color:"#cbd5e1",lineHeight:1.6,margin:"0 0 10px"}}>Women 30-55 moved <strong style={{color:"#f1f5f9"}}>+3.2 pts</strong> this week driven by the Savannah port jobs narrative (+1.8pt approval correlation). Atlanta suburban voters moved <strong style={{color:"#f1f5f9"}}>+1.8 pts</strong>. Collins inflation ads at 900k impressions - no polling movement yet, 72h watch window.</p>
      <div style={{fontSize:14,fontWeight:600,color:"#3b82f6",marginBottom:6}}>"Georgia is building again. 12,000 jobs in Savannah. Collins voted against it."</div>
    </Card>
    <Card style={{marginBottom:10}}>
      <SL>Social media pulse - last 12h</SL>
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
        <div key={i} style={{padding:"7px 0",borderBottom:i<recentPosts.length-1?"1px solid rgba(51,65,85,0.3)":"none"}}>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:SENT_COLOR[p.sent]}}/>
            <Badge label={p.who} color={p.who==="Ossoff"?"#3b82f6":"#f27070"} bg={p.who==="Ossoff"?"rgba(59,130,246,0.1)":"rgba(242,112,112,0.1)"}/>
            <Badge label={p.platform} color="#64748b" bg="rgba(51,65,85,0.3)"/>
            <span style={{fontSize:10,color:"#475569",marginLeft:"auto"}}>{p.time}</span>
          </div>
          <div style={{fontSize:12,color:"#94a3b8",fontStyle:"italic"}}>"{p.content.slice(0,90)}"</div>
          <div style={{fontSize:10,color:"#475569",marginTop:2}}>❤ {p.likes.toLocaleString()} · ↗ {p.shares.toLocaleString()}</div>
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

function ApprovalScreen() {
  const [metric,setMetric]=useState("pct");
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <SL>30-day trend</SL>
        <div style={{display:"flex",gap:4}}>
          {["pct","net"].map(m=><div key={m} onClick={()=>setMetric(m)} style={{fontSize:10,padding:"3px 8px",borderRadius:4,cursor:"pointer",background:metric===m?"rgba(59,130,246,0.2)":"transparent",color:metric===m?"#3b82f6":"#475569",border:`1px solid ${metric===m?"rgba(59,130,246,0.4)":"rgba(51,65,85,0.4)"}`}}>{m==="pct"?"Approval %":"Net Approval"}</div>)}
        </div>
      </div>
      <div style={{display:"flex",gap:14,marginBottom:8}}>{[["#3b82f6","Ossoff"],["#f27070","Collins"]].map(([c,l])=><span key={l} style={{fontSize:10,color:c}}>● {l}</span>)}</div>
      <ApprovalChart metric={metric}/>
    </Card>
    <Card>
      <SL>Demographic breakdown</SL>
      {CANDIDATE.demos.map((d,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <div style={{width:130,fontSize:11,color:"#94a3b8"}}>{d.label}</div>
          <div style={{flex:1,position:"relative",height:6,background:"rgba(51,65,85,0.4)",borderRadius:3,overflow:"hidden"}}>
            <div style={{position:"absolute",left:d.net>=0?"50%":`${50+(d.net/80)*50}%`,width:`${Math.abs(d.net)/80*50}%`,height:"100%",background:d.net>=0?"#3b82f6":"#ef4444",borderRadius:3}}/>
            <div style={{position:"absolute",left:"50%",top:0,width:1,height:"100%",background:"rgba(100,116,139,0.5)"}}/>
          </div>
          <div style={{width:40,fontSize:11,fontWeight:600,color:d.net>=0?"#22c55e":"#ef4444",textAlign:"right"}}>{fmt(d.net)}</div>
          <DeltaBadge v={d.delta}/>
        </div>
      ))}
    </Card>
  </div>;
}

function OppositionScreen() {
  const [sel,setSel]=useState(0);
  const opp=OPPONENTS[sel];
  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      {OPPONENTS.map((o,i)=>(
        <div key={i} onClick={()=>setSel(i)} style={{flex:1,padding:"10px 14px",borderRadius:8,cursor:"pointer",border:`1px solid ${sel===i?o.color:"rgba(51,65,85,0.5)"}`,background:sel===i?`${o.color}18`:"rgba(15,23,42,0.5)"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{o.short}</div>
          <div style={{fontSize:10,color:"#64748b"}}>{o.label}</div>
          <div style={{fontSize:18,fontWeight:700,color:o.color,marginTop:4}}>{o.approval?.toFixed(1)}%</div>
        </div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <Card><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Our lead over {opp.short}</div><div style={{fontSize:32,fontWeight:800,color:"#22c55e"}}>{fmt(CANDIDATE.approval-opp.approval,1)}<span style={{fontSize:16}}>pts</span></div></Card>
      <Card><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>{opp.short} net approval</div><div style={{fontSize:32,fontWeight:800,color:opp.net>=0?"#22c55e":"#ef4444"}}>{fmt(opp.net)}</div><DeltaBadge v={opp.dNet}/></Card>
    </div>
    <Card style={{marginBottom:12}}>
      <SL>Demographics</SL>
      {opp.demos.map((d,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
          <div style={{width:140,fontSize:11,color:"#94a3b8"}}>{d.label}</div>
          <div style={{flex:1}}><MiniBar val={Math.max(0,d.net+70)} max={140} color={d.net>=0?opp.color:"#475569"} h={5}/></div>
          <div style={{width:40,fontSize:11,fontWeight:600,color:d.net>=0?opp.color:"#ef4444",textAlign:"right"}}>{fmt(d.net)}</div>
        </div>
      ))}
    </Card>
    <Card style={{marginBottom:12}}>
      <SL>Vulnerabilities</SL>
      {opp.vulnerabilities.map((v,i)=><div key={i} style={{fontSize:12,color:"#cbd5e1",padding:"5px 0",borderBottom:i<opp.vulnerabilities.length-1?"1px solid rgba(51,65,85,0.3)":"none"}}><span style={{color:"#f59e0b",marginRight:6}}>◆</span>{v}</div>)}
    </Card>
    {opp.attackLines.length>0&&<Card>
      <SL>Active attack lines</SL>
      {opp.attackLines.map((a,i)=>(
        <div key={i} style={{padding:"8px 0",borderBottom:i<opp.attackLines.length-1?"1px solid rgba(51,65,85,0.3)":"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:12,color:"#e2e8f0",fontStyle:"italic"}}>"{a.line}"</div>
            <Badge label={a.trend} color={a.trend==="rising"?"#ef4444":"#64748b"} bg={a.trend==="rising"?"rgba(239,68,68,0.1)":"rgba(51,65,85,0.3)"}/>
          </div>
          <div style={{display:"flex",gap:12}}>
            <span style={{fontSize:10,color:"#64748b"}}>Vol: <strong style={{color:"#94a3b8"}}>{a.vol}</strong></span>
            <span style={{fontSize:10,color:"#64748b"}}>Vel: <strong style={{color:"#f97316"}}>{a.vel}</strong></span>
          </div>
        </div>
      ))}
    </Card>}
  </div>;
}

function PollingVaultScreen() {
  const [polls,setPolls]=useState(BASE_POLLS);
  const [showUpload,setShowUpload]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [extracted,setExtracted]=useState(false);
  const [selPoll,setSelPoll]=useState<string|null>(null);
  const inSignal=polls.filter(p=>p.status==="in_signal");
  const totalW=inSignal.reduce((s,p)=>s+p.weight,0);
  const baseline=inSignal.reduce((s,p)=>s+p.ossoff*p.weight,0)/totalW;
  const doUpload=()=>{setUploading(true);setTimeout(()=>{setUploading(false);setExtracted(true);},1800);};
  const confirmPoll=()=>{setPolls(prev=>[...prev.filter(p=>p.id!=="pp1c"),{...PENDING_POLL,status:"in_signal",weight:20,id:"pp1c"} as any]);setShowUpload(false);setExtracted(false);};
  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><div style={{fontSize:11,color:"#64748b"}}>Blended signal baseline</div><div style={{fontSize:32,fontWeight:800,color:"#f1f5f9"}}>{baseline.toFixed(1)}<span style={{fontSize:16}}>%</span></div><div style={{fontSize:11,color:"#64748b"}}>{inSignal.length} polls in signal</div></div>
      <div onClick={()=>setShowUpload(true)} style={{background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.4)",borderRadius:8,padding:"10px 16px",cursor:"pointer",fontSize:13,color:"#3b82f6",fontWeight:600}}>+ Upload private poll</div>
    </div>
    {showUpload&&<Card style={{marginBottom:14,border:"1px solid rgba(59,130,246,0.4)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><SL>Upload private poll</SL><div onClick={()=>{setShowUpload(false);setExtracted(false);setUploading(false);}} style={{fontSize:11,color:"#64748b",cursor:"pointer"}}>x</div></div>
      {!extracted?<div>
        <div style={{background:"rgba(15,23,42,0.8)",border:"2px dashed rgba(59,130,246,0.3)",borderRadius:8,padding:24,textAlign:"center",marginBottom:12}}><div style={{fontSize:24,marginBottom:8}}>📄</div><div style={{fontSize:13,color:"#94a3b8"}}>Main Street Research Apr 4, 2026.pdf</div></div>
        {!uploading?<div onClick={doUpload} style={{background:"#3b82f6",borderRadius:6,padding:"10px",textAlign:"center",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:600}}>Extract and analyze with Polis AI</div>:<div style={{background:"rgba(59,130,246,0.1)",borderRadius:6,padding:"10px",textAlign:"center",fontSize:13,color:"#3b82f6"}}>Extracting...</div>}
      </div>:<div>
        <div style={{display:"flex",gap:8,marginBottom:10}}><Badge label="94% confidence" color="#22c55e" bg="rgba(34,197,94,0.1)"/><span style={{fontSize:11,color:"#64748b"}}>{PENDING_POLL.method}</span></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:10}}>
          {[["Ossoff",PENDING_POLL.ossoff,"#3b82f6"],["Collins",PENDING_POLL.collins,"#f27070"],["Jack",PENDING_POLL.jack,"#f5b944"],["Other",PENDING_POLL.other,"#475569"]].map(([n,v,c])=><div key={n as string} style={{textAlign:"center",background:"rgba(15,23,42,0.6)",borderRadius:6,padding:8}}><div style={{fontSize:18,fontWeight:700,color:c as string}}>{v}%</div><div style={{fontSize:10,color:"#64748b"}}>{n}</div></div>)}
        </div>
        <div onClick={confirmPoll} style={{background:"#22c55e",borderRadius:6,padding:"10px",textAlign:"center",cursor:"pointer",fontSize:13,color:"#000",fontWeight:700}}>Confirm and add to signal</div>
      </div>}
    </Card>}
    {polls.map(p=>(
      <Card key={p.id} style={{marginBottom:8,cursor:"pointer",border:`1px solid ${selPoll===p.id?"rgba(59,130,246,0.5)":"rgba(51,65,85,0.5)"}`}}>
        <div onClick={()=>setSelPoll(selPoll===p.id?null:p.id)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{p.pollster}</div><div style={{fontSize:11,color:"#64748b"}}>{p.date} · {p.method} · n={p.n?.toLocaleString()}</div></div>
            <div style={{display:"flex",gap:6}}>
              <Badge label={p.type} color={p.type==="private"?"#8b5cf6":p.type==="opposition"?"#f97316":"#3b82f6"} bg={p.type==="private"?"rgba(139,92,246,0.1)":p.type==="opposition"?"rgba(249,115,22,0.1)":"rgba(59,130,246,0.1)"}/>
              <Badge label={p.status==="in_signal"?"In signal":p.status==="excluded"?"Excluded":p.status} color={p.status==="in_signal"?"#22c55e":"#64748b"} bg={p.status==="in_signal"?"rgba(34,197,94,0.1)":"rgba(51,65,85,0.3)"}/>
            </div>
          </div>
          <div style={{display:"flex",gap:16,marginTop:10}}>
            {[["Ossoff",p.ossoff,"#3b82f6"],["Collins",p.collins,"#f27070"],["Jack",p.jack,"#f5b944"]].map(([n,v,c])=><div key={n as string}><div style={{fontSize:16,fontWeight:700,color:c as string}}>{v}%</div><div style={{fontSize:9,color:"#64748b"}}>{n}</div></div>)}
            {p.status==="in_signal"&&<div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontSize:11,color:"#64748b"}}>Weight</div><div style={{fontSize:14,fontWeight:700,color:"#94a3b8"}}>{p.weight}%</div></div>}
          </div>
        </div>
        {selPoll===p.id&&<div><Divider/><div style={{fontSize:12,color:"#94a3b8",fontStyle:"italic",marginBottom:10}}>"{p.takeaway}"</div><SL>Crosstabs</SL>
          {p.crosstabs.map((ct,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:4,alignItems:"center"}}>
              <div style={{width:150,fontSize:11,color:"#94a3b8"}}>{ct.g}</div>
              <div style={{flex:1,display:"flex",height:8,borderRadius:2,overflow:"hidden"}}>
                <div style={{width:`${ct.o}%`,background:"#3b82f6"}}/><div style={{width:`${ct.c}%`,background:"#f27070"}}/>
              </div>
              <div style={{fontSize:11,color:"#3b82f6",width:30,textAlign:"right"}}>{ct.o}%</div>
              <div style={{fontSize:11,color:"#f27070",width:30}}>{ct.c}%</div>
            </div>
          ))}
        </div>}
      </Card>
    ))}
  </div>;
}

function SocialMediaScreen() {
  const all=[CANDIDATE,...OPPONENTS];
  const recentPosts=[
    {who:"Ossoff",platform:"Twitter",content:"Georgia is building again. 12,000 new jobs at the Port of Savannah. Federal investment delivering for our state.",likes:4821,shares:1204,comments:312,time:"3h ago",sent:"positive"},
    {who:"Ossoff",platform:"Instagram",content:"Visited the Port of Savannah today. The infrastructure investment we secured is already creating jobs.",likes:8930,shares:0,comments:441,time:"5h ago",sent:"positive"},
    {who:"Collins",platform:"Twitter",content:"Ossoff voted with Biden 96% of the time. Inflation is still hammering Georgia families.",likes:2341,shares:891,comments:188,time:"8h ago",sent:"negative"},
    {who:"Collins",platform:"Facebook",content:"Join us this week as we take our message of real Georgia values across the state.",likes:1102,shares:203,comments:77,time:"12h ago",sent:"neutral"},
  ];
  return <div style={{maxWidth:720}}>
    <Card style={{marginBottom:12}}>
      <SL>Follower comparison</SL>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {[{key:"twitter",label:"Twitter / X",icon:"𝕏"},{key:"instagram",label:"Instagram",icon:"📸"},{key:"facebook",label:"Facebook",icon:"📘"}].map(plat=>(
          <div key={plat.key} style={{background:"rgba(15,23,42,0.6)",borderRadius:8,padding:12}}>
            <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>{plat.icon} {plat.label}</div>
            {all.map((person,i)=>{
              const val=(person.social as any)?.[plat.key]||0;
              const growth=(person.social as any)?.[`${plat.key}Growth`]||0;
              const color=i===0?"#3b82f6":i===1?"#f27070":"#f5b944";
              return <div key={i} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color}}>{person.short}</span><span style={{fontSize:11,fontWeight:700,color:"#e2e8f0"}}>{val>=1000?(val/1000).toFixed(0)+"k":val}</span></div>
                <MiniBar val={val} max={500000} color={color} h={4}/>
                <div style={{fontSize:9,color:"#22c55e",marginTop:2}}>▲ {growth}% / wk</div>
              </div>;
            })}
          </div>
        ))}
      </div>
    </Card>
    <Card>
      <SL>Recent posts</SL>
      {recentPosts.map((p,i)=>(
        <div key={i} style={{padding:"10px 0",borderBottom:i<recentPosts.length-1?"1px solid rgba(51,65,85,0.3)":"none"}}>
          <div style={{display:"flex",gap:8,marginBottom:4,alignItems:"center"}}>
            <Badge label={p.who} color={p.who==="Ossoff"?"#3b82f6":"#f27070"} bg={p.who==="Ossoff"?"rgba(59,130,246,0.1)":"rgba(242,112,112,0.1)"}/>
            <Badge label={p.platform} color="#64748b" bg="rgba(51,65,85,0.3)"/>
            <span style={{fontSize:10,color:"#475569",marginLeft:"auto"}}>{p.time}</span>
          </div>
          <div style={{fontSize:12,color:"#cbd5e1",fontStyle:"italic",marginBottom:4}}>"{p.content.slice(0,100)}"</div>
          <div style={{display:"flex",gap:12}}>
            <span style={{fontSize:10,color:"#64748b"}}>❤ {p.likes.toLocaleString()}</span>
            {p.shares>0&&<span style={{fontSize:10,color:"#64748b"}}>↗ {p.shares.toLocaleString()}</span>}
            <span style={{fontSize:10,color:"#64748b"}}>💬 {p.comments.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </Card>
  </div>;
}

function NarrativesScreen() {
  const [sel,setSel]=useState<string|null>(null);
  const [liveNarratives,setLiveNarratives]=useState<any[]|null>(null);
  const [loading,setLoading]=useState(false);
  const [fetchedAt,setFetchedAt]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const displayed=liveNarratives||NARRATIVES_SEED;

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
  const [sel,setSel]=useState("t1");
  const [generating,setGenerating]=useState(false);
  const [aiResult,setAiResult]=useState<any>(null);
  const tp=TALKING_POINTS.find(t=>t.id===sel);
  const narr=NARRATIVES_SEED.find(n=>n.id===tp?.narrative);
  const poll=BASE_POLLS.find(p=>p.id===tp?.poll);
  const generate=async()=>{
    setGenerating(true);
    try{
      const res=await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`You are Polis. Generate talking points for Jon Ossoff (D-GA, 47.8% approval, leading Collins) targeting undecided suburban Georgia voter in 2026. Context: Savannah port +12,000 jobs, Collins inflation ads running. Return ONLY valid JSON: {"headline":"string","points":[{"text":"string","src":"string","w":"high|medium|low"}],"ask":"string","tone":"string"} 3 points max.`}]})});
      const data=await res.json();
      const text=data.content?.map((i:any)=>i.text||"").join("")||"";
      setAiResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
    }catch(e){setAiResult({headline:"Georgia jobs first - Ossoff is delivering, Collins voted no.",points:[{text:"The Savannah port expansion creates 12,000 Georgia jobs.",src:"USDOT, 2026",w:"high"},{text:"Collins voted against the infrastructure bill that made this possible.",src:"Roll call record",w:"high"}],ask:"Which candidate has actually delivered for Georgia?",tone:"Confident, specific."});}
    setGenerating(false);
  };
  return <div style={{maxWidth:720}}>
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
      {TALKING_POINTS.map(t=><div key={t.id} onClick={()=>{setSel(t.id);setAiResult(null);}} style={{padding:"6px 12px",borderRadius:6,cursor:"pointer",border:`1px solid ${sel===t.id?"rgba(59,130,246,0.5)":"rgba(51,65,85,0.5)"}`,background:sel===t.id?"rgba(59,130,246,0.1)":"transparent",fontSize:12,color:sel===t.id?"#3b82f6":"#64748b"}}>{t.issue}</div>)}
      <div onClick={generate} style={{padding:"6px 12px",borderRadius:6,cursor:"pointer",border:"1px solid rgba(34,197,94,0.4)",background:"rgba(34,197,94,0.08)",fontSize:12,color:"#22c55e"}}>{generating?"Generating...":"Generate new (AI)"}</div>
    </div>
    {aiResult&&<Card style={{marginBottom:12,border:"1px solid rgba(34,197,94,0.3)"}}>
      <div style={{display:"flex",gap:6,marginBottom:10}}><Badge label="AI Generated" color="#22c55e" bg="rgba(34,197,94,0.1)"/></div>
      <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9",marginBottom:10}}>{aiResult.headline}</div>
      {aiResult.points?.map((pt:any,i:number)=><div key={i} style={{padding:"8px 0",borderBottom:"1px solid rgba(51,65,85,0.3)"}}><div style={{fontSize:13,color:"#cbd5e1",marginBottom:4}}>{pt.text}</div><div style={{display:"flex",gap:8}}><span style={{fontSize:10,color:"#475569"}}>{pt.src}</span><Badge label={pt.w} color={pt.w==="high"?"#22c55e":"#64748b"} bg="rgba(51,65,85,0.3)"/></div></div>)}
      {aiResult.ask&&<div style={{fontSize:12,color:"#3b82f6",marginTop:8}}>Ask: {aiResult.ask}</div>}
    </Card>}
    {tp&&<Card>
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        <Badge label={tp.audience} color="#94a3b8" bg="rgba(51,65,85,0.4)"/>
        <Badge label={tp.date} color="#475569" bg="rgba(51,65,85,0.3)"/>
      </div>
      {narr&&<div style={{fontSize:11,color:"#64748b",marginBottom:10}}>From: <span style={{color:"#3b82f6"}}>{narr.label}</span>{poll?` + ${poll.short}`:""}</div>}
      <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9",lineHeight:1.4,marginBottom:14,padding:"12px",background:"rgba(59,130,246,0.08)",borderRadius:6,borderLeft:"3px solid #3b82f6"}}>{tp.headline}</div>
      {tp.points.map((pt,i)=><div key={i} style={{padding:"10px 0",borderBottom:"1px solid rgba(51,65,85,0.3)"}}>
        <div style={{fontSize:13,color:"#cbd5e1",lineHeight:1.6,marginBottom:4}}>{pt.text}</div>
        <div style={{display:"flex",gap:8}}><span style={{fontSize:10,color:"#475569"}}>📎 {pt.src}</span><Badge label={`Impact: ${pt.w}`} color={pt.w==="high"?"#22c55e":"#eab308"} bg={pt.w==="high"?"rgba(34,197,94,0.1)":"rgba(234,179,8,0.1)"}/></div>
      </div>)}
      <Divider/>
      <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#475569",marginBottom:4}}>SPECIFIC ASK</div><div style={{fontSize:12,color:"#3b82f6"}}>{tp.ask}</div></div>
      <div><div style={{fontSize:10,color:"#475569",marginBottom:4}}>TONE</div><div style={{fontSize:12,color:"#94a3b8",fontStyle:"italic"}}>{tp.tone}</div></div>
    </Card>}
  </div>;
}

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
  const saveEdit=()=>{setItems(prev=>prev.map(p=>p.id===editing.id?editing:p));setEditing(null);setSel(null);};
  const deleteItem=(id:string)=>{setItems(prev=>prev.filter(p=>p.id!==id));setDeleteConfirm(null);setSel(null);};
  const addItem=()=>{const item={...newItem,id:`pl${Date.now()}`,tags:newItem.tags.split(",").map((t:string)=>t.trim()).filter(Boolean),updated:"Apr 2026"};setItems(prev=>[item,...prev]);setShowNew(false);setNewItem({title:"",category:"Economy",summary:"",tags:"",status:"draft"});};
  const handleUpload=async(e:any)=>{const file=e.target.files?.[0];if(!file)return;setUploading(true);try{const result=await extractFromFile(file,"platform");const item={...result,id:`pl${Date.now()}`,tags:result.tags||[],updated:"Apr 2026"};setItems(prev=>[item,...prev]);}catch(err){alert("Could not extract content.");}setUploading(false);if(fileRef.current)fileRef.current.value="";};
  return <div style={{maxWidth:720}}>
    <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx,.csv,.xlsx,.xls" style={{display:"none"}} onChange={handleUpload}/>
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
      {["all","published","draft"].map(s=><div key={s} onClick={()=>setFilter(s)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:filter===s?"rgba(59,130,246,0.15)":"transparent",border:`1px solid ${filter===s?"rgba(59,130,246,0.4)":"rgba(51,65,85,0.5)"}`,fontSize:11,color:filter===s?"#3b82f6":"#64748b",textTransform:"capitalize" as const}}>{s}</div>)}
      <div style={{marginLeft:"auto",display:"flex",gap:6}}>
        <div onClick={()=>fileRef.current?.click()} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.3)",fontSize:11,color:"#a78bfa"}}>{uploading?"Extracting...":"Upload doc"}</div>
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
};

      const res=await fetch("/api/anthropic",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:2000,
          messages:[{role:"user",content:prompt}]
        })
      });
      const data=await res.json();
      const text=data.content?.map((c:any)=>c.text||"").join("")||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const newItems=JSON.parse(clean);

      setRefreshLog(p=>[...p,`Found ${newItems.length} new items — merging into platform...`]);
      await new Promise(r=>setTimeout(r,400));

      setItems(prev=>{
        const existingIds=new Set(prev.map((i:any)=>i.id));
        const toAdd=newItems.filter((i:any)=>!existingIds.has(i.id));
        return [...toAdd,...prev];
      });

      const ts=new Date().toLocaleTimeString();
      setLastRefreshed(ts);
      setRefreshLog(p=>[...p,`✓ Done — ${newItems.length} items added · ${ts}`]);
    }catch(e){
      setRefreshLog(p=>[...p,"⚠ Could not reach API. Using cached data."]);
    }
    setRefreshing(false);
  };

  const cats=["all",...Array.from(new Set(items.map(p=>p.category)))];
  const filtered=items.filter(p=>(filter==="all"||p.status===filter)&&(catFilter==="all"||p.category===catFilter));
  const enacted=items.filter(p=>(p as any).billStatus==="enacted").length;
  const passed=items.filter(p=>(p as any).billStatus==="passed_senate").length;
  
  const saveEdit=()=>{setItems(prev=>prev.map(p=>p.id===editing.id?editing:p));setEditing(null);setSel(null);};
  const deleteItem=(id:string)=>{setItems(prev=>prev.filter(p=>p.id!==id));setDeleteConfirm(null);setSel(null);};
  const addItem=()=>{const item={...newItem,id:`pl${Date.now()}`,tags:newItem.tags.split(",").map((t:string)=>t.trim()).filter(Boolean),updated:"Apr 2026",source:"Manual entry",billStatus:"introduced"};setItems(prev=>[item,...prev]);setShowNew(false);setNewItem({title:"",category:"Economy",summary:"",tags:"",status:"draft"});};
  const handleUpload=async(e:any)=>{const file=e.target.files?.[0];if(!file)return;setUploading(true);try{const result=await extractFromFile(file,"platform");const item={...result,id:`pl${Date.now()}`,tags:result.tags||[],updated:"Apr 2026",source:"Uploaded document",billStatus:"draft"};setItems(prev=>[item,...prev]);}catch(err){alert("Could not extract content.");}setUploading(false);if(fileRef.current)fileRef.current.value="";};
  
  return <div style={{maxWidth:720}}>
    <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx,.csv,.xlsx,.xls" style={{display:"none"}} onChange={handleUpload}/>
    
    {/* Summary stats */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
      {[{l:"Total",v:items.length,c:"#94a3b8"},{l:"Enacted",v:enacted,c:"#22c55e"},{l:"Passed Senate",v:passed,c:"#3b82f6"},{l:"In Progress",v:items.length-enacted-passed,c:"#f59e0b"}].map(s=>(
        <Card key={s.l} style={{textAlign:"center",padding:10}}>
          <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
          <div style={{fontSize:9,color:"#64748b",textTransform:"uppercase" as const,letterSpacing:"0.06em"}}>{s.l}</div>
        </Card>
      ))}
    </div>
    
    {/* Source notice + refresh */}
    <div style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:8,padding:"8px 12px",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" as const}}>
      <div style={{flex:1,fontSize:11,color:"#64748b"}}>
        📎 Sourced from <span style={{color:"#3b82f6"}}>ossoff.senate.gov</span>, <span style={{color:"#3b82f6"}}>GovTrack</span>, <span style={{color:"#3b82f6"}}>Congress.gov</span>
        {lastRefreshed&&<span style={{color:"#22c55e",marginLeft:8}}>· Last synced {lastRefreshed}</span>}
      </div>
      <div
        onClick={!refreshing?refreshFromSenateGov:undefined}
        style={{padding:"5px 12px",borderRadius:6,cursor:refreshing?"not-allowed":"pointer",background:refreshing?"rgba(59,130,246,0.05)":"rgba(59,130,246,0.12)",border:`1px solid ${refreshing?"rgba(59,130,246,0.2)":"rgba(59,130,246,0.4)"}`,fontSize:11,color:refreshing?"#475569":"#3b82f6",fontWeight:600,whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:6}}
      >
        <span>⟳</span>
        {refreshing?"Syncing...":"Sync from ossoff.senate.gov"}
      </div>
    </div>

    {/* Refresh log */}
    {refreshLog.length>0&&<div style={{background:"rgba(15,23,42,0.8)",border:"1px solid rgba(51,65,85,0.4)",borderRadius:8,padding:"10px 14px",marginBottom:12,fontFamily:"monospace"}}>
      {refreshLog.map((line,i)=>(
        <div key={i} style={{fontSize:11,color:line.startsWith("✓")?"#22c55e":line.startsWith("⚠")?"#f97316":"#64748b",marginBottom:2,display:"flex",gap:8}}>
          <span style={{color:"#334155",flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
          <span>{line}</span>
        </div>
      ))}
      {!refreshing&&<div onClick={()=>setRefreshLog([])} style={{fontSize:10,color:"#334155",cursor:"pointer",marginTop:6}}>clear log</div>}
    </div>}
    
    {/* Filters */}
    <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
      {["all","published","draft"].map(s=><div key={s} onClick={()=>setFilter(s)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:filter===s?"rgba(59,130,246,0.15)":"transparent",border:`1px solid ${filter===s?"rgba(59,130,246,0.4)":"rgba(51,65,85,0.5)"}`,fontSize:11,color:filter===s?"#3b82f6":"#64748b",textTransform:"capitalize" as const}}>{s==="all"?`All (${items.length})`:s==="published"?`Published (${items.filter(i=>i.status==="published").length})`:`Draft (${items.filter(i=>i.status==="draft").length})`}</div>)}
      <div style={{marginLeft:"auto",display:"flex",gap:6}}>
        <div onClick={()=>fileRef.current?.click()} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.3)",fontSize:11,color:"#a78bfa"}}>{uploading?"Extracting...":"Upload doc"}</div>
        <div onClick={()=>setShowNew(true)} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",fontSize:11,color:"#22c55e"}}>+ New</div>
      </div>
    </div>
    
    {/* Category filter */}
    <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap"}}>
      {cats.map(c=><div key={c} onClick={()=>setCatFilter(c)} style={{padding:"3px 8px",borderRadius:4,cursor:"pointer",background:catFilter===c?"rgba(51,65,85,0.6)":"transparent",border:`1px solid ${catFilter===c?"rgba(100,116,139,0.6)":"rgba(51,65,85,0.4)"}`,fontSize:10,color:catFilter===c?"#cbd5e1":"#475569"}}>{c}</div>)}
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
              <div style={{flex:1,paddingRight:8}}>
                <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{item.title}</div>
                <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{item.category} · {item.updated}</div>
              </div>
              <div style={{display:"flex",gap:4,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                {(item as any).billStatus&&<Badge label={BILL_STATUS_LABEL[(item as any).billStatus]||((item as any).billStatus)} color={BILL_STATUS_COLOR[(item as any).billStatus]||"#64748b"} bg={`${BILL_STATUS_COLOR[(item as any).billStatus]||"#64748b"}18`}/>}
                <Badge label={item.status} color={STATUS_COLOR[item.status]} bg={`${STATUS_COLOR[item.status]}18`}/>
              </div>
            </div>
            <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{item.summary}</div>
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
              {(Array.isArray(item.tags)?item.tags:[]).map((t:string)=><span key={t} style={{fontSize:10,color:"#475569",background:"rgba(51,65,85,0.4)",borderRadius:4,padding:"2px 6px"}}>#{t}</span>)}
              {(item as any).source&&<span style={{marginLeft:"auto",fontSize:10,color:"#334155"}}>📎 {(item as any).source}</span>}
            </div>
          </div>
        )}
        {sel===item.id&&!editing&&<div><Divider/>
          {(item as any).sourceUrl&&<a href={(item as any).sourceUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#3b82f6",display:"block",marginBottom:10,textDecoration:"none"}}>→ View source: {(item as any).source}</a>}
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
  const trendColors: Record<string,string>={up:"#22c55e",down:"#ef4444",flat:"#94a3b8"};
  const trends: Record<string,string>={up:"▲",down:"▼",flat:"→"};
  return <div style={{maxWidth:720}}>
    <div style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#94a3b8"}}>Key economic and social metrics for Georgia. Updated monthly.</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
      {EXT_CONTEXT.map((m,i)=>(
        <Card key={i} style={{borderTop:`2px solid ${trendColors[m.trend]}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontSize:11,color:"#64748b",flex:1,paddingRight:8}}>{m.label}</div><div style={{fontSize:10,color:"#475569"}}>{m.period}</div></div>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}><div style={{fontSize:20,fontWeight:800,color:"#f1f5f9"}}>{m.val}</div><div style={{fontSize:11,fontWeight:600,color:trendColors[m.trend]}}>{trends[m.trend]} {m.change}</div></div>
          <div style={{fontSize:10,color:"#475569",marginBottom:4}}>{m.src}</div>
          <div style={{fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>{m.note}</div>
        </Card>
      ))}
    </div>
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
  {id:"platform",label:"Platform",icon:"◆",screens:[{id:"narratives",label:"What They're Saying",icon:"◎"},{id:"talking",label:"What We're Saying",icon:"◆"},{id:"platform_items",label:"Our Platform",icon:"💡"},{id:"ext_context",label:"External Context",icon:"🌐"}]},
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