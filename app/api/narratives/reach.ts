export const SOURCE_REACH: Record<string, { monthly: number; type: string }> = {
  // National broadcast
  "CNN": { monthly: 150000000, type: "broadcast" },
  "Fox News": { monthly: 180000000, type: "broadcast" },
  "MSNBC": { monthly: 90000000, type: "broadcast" },
  "ABC News": { monthly: 120000000, type: "broadcast" },
  "CBS News": { monthly: 110000000, type: "broadcast" },
  "NBC News": { monthly: 130000000, type: "broadcast" },
  "PBS": { monthly: 12000000, type: "broadcast" },
  "NPR": { monthly: 25000000, type: "broadcast" },

  // National print/digital
  "The New York Times": { monthly: 190000000, type: "newspaper" },
  "Washington Post": { monthly: 100000000, type: "newspaper" },
  "Wall Street Journal": { monthly: 80000000, type: "newspaper" },
  "USA Today": { monthly: 85000000, type: "newspaper" },
  "New York Post": { monthly: 90000000, type: "newspaper" },
  "The Guardian": { monthly: 70000000, type: "newspaper" },
  "Associated Press": { monthly: 60000000, type: "wire" },
  "Reuters": { monthly: 55000000, type: "wire" },
  "Politico": { monthly: 28000000, type: "digital" },
  "The Hill": { monthly: 32000000, type: "digital" },
  "Axios": { monthly: 20000000, type: "digital" },
  "Vox": { monthly: 18000000, type: "digital" },
  "HuffPost": { monthly: 40000000, type: "digital" },
  "BuzzFeed News": { monthly: 25000000, type: "digital" },
  "The Atlantic": { monthly: 15000000, type: "digital" },
  "Slate": { monthly: 12000000, type: "digital" },
  "Salon": { monthly: 8000000, type: "digital" },
  "The Nation": { monthly: 5000000, type: "digital" },
  "Breitbart News": { monthly: 22000000, type: "digital" },
  "Daily Caller": { monthly: 14000000, type: "digital" },
  "The Daily Caller": { monthly: 14000000, type: "digital" },
  "Daily Wire": { monthly: 18000000, type: "digital" },
  "Mediaite": { monthly: 8000000, type: "digital" },
  "Raw Story": { monthly: 6000000, type: "digital" },
  "TheWrap": { monthly: 4000000, type: "digital" },
  "Newsweek": { monthly: 30000000, type: "digital" },
  "Time": { monthly: 22000000, type: "digital" },
  "Forbes": { monthly: 70000000, type: "digital" },
  "The Times of India": { monthly: 200000000, type: "newspaper" },

  // Georgia local
  "Atlanta Journal-Constitution": { monthly: 4000000, type: "newspaper" },
  "AJC": { monthly: 4000000, type: "newspaper" },
  "Savannah Morning News": { monthly: 800000, type: "newspaper" },
  "Augusta Chronicle": { monthly: 600000, type: "newspaper" },
  "Macon Telegraph": { monthly: 500000, type: "newspaper" },
  "Athens Banner-Herald": { monthly: 400000, type: "newspaper" },
  "Georgia Public Broadcasting": { monthly: 1200000, type: "broadcast" },
  "WSB-TV": { monthly: 2000000, type: "broadcast" },
  "11Alive": { monthly: 1500000, type: "broadcast" },
  "WXIA": { monthly: 1500000, type: "broadcast" },
  "GPB News": { monthly: 1200000, type: "broadcast" },
  "Decatur News Online": { monthly: 200000, type: "newspaper" },
  "Patch": { monthly: 3000000, type: "digital" },

  // Social/aggregators
  "Twitter": { monthly: 350000000, type: "social" },
  "Reddit": { monthly: 430000000, type: "social" },
  "Facebook": { monthly: 2000000000, type: "social" },
};

export function getReach(sourceName: string): number {
  const key = Object.keys(SOURCE_REACH).find(k =>
    sourceName?.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(sourceName?.toLowerCase())
  );
  return key ? SOURCE_REACH[key].monthly : 2000000; // default 2M if unknown
}

export function formatReach(n: number): string {
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + "B";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n.toString();
}