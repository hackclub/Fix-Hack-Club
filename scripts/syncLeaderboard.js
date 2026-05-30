import Airtable from "airtable";
import fs from "fs";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_TOKEN,
}).base(process.env.AIRTABLE_BASE_ID);

const records = [];

await base("Leaderboard")
  .select({
    sort: [{ field: "Contributions", direction: "desc" }],
  })
  .eachPage((pageRecords, fetchNextPage) => {
    pageRecords.forEach((record) => {
      records.push({
        name: record.get("Name"),
        score: record.get("Contributions") || 0,
      });
    });

    fetchNextPage();
  });

fs.writeFileSync(
  "./public/leaderboard.json",
  JSON.stringify(records, null, 2)
);

console.log(`Saved ${records.length} entries`);
