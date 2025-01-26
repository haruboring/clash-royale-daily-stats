// updateData.js
const fs = require("fs");
const axios = require("axios");
const dayjs = require("dayjs");

// 環境変数から取得
const API_TOKEN = process.env.CR_API_TOKEN;
const PLAYER_TAG = process.env.PLAYER_TAG;

async function main() {
  try {
    const url = `https://proxy.royaleapi.dev/v1/players/${encodeURIComponent(PLAYER_TAG)}`;
    console.log("url:", url);
    console.log("API_TOKEN:", API_TOKEN);
    console.log("PLAYER_TAG:", PLAYER_TAG);

    const headers = {
      Authorization: `Bearer ${API_TOKEN}`,
    };
    const response = await axios.get(url, { headers });
    const playerData = response.data;

    const totalWins = playerData.wins;
    const totalLosses = playerData.losses;
    const totalMatches = totalWins + totalLosses;

    // data.json 読み込み
    const dataPath = "./data.json";
    const jsonData = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, "utf8"))
      : [];

    // 日付と時刻を別々に取得
    const now = dayjs().utc().add(9, 'hour')  // 日本時間に変換
    const currentDate = now.format("YYYY-MM-DD");  // 例: "2025-01-31"
    const currentTime = now.format("HH:mm");       // 例: "08:15"

    // 「同じ日付のデータがすでにあれば更新しない」というロジック
    // もし「1日に複数回記録したい」なら、この条件を変える必要があります
    const latest = jsonData[jsonData.length - 1];
    if (latest && latest.date === currentDate) {
      console.log("Already updated today.");
      return;
    }

    // 前日データがあれば差分を計算
    const prev = jsonData.length > 0 ? jsonData[jsonData.length - 1] : null;
    let dailyWins = totalWins;
    let dailyLosses = totalLosses;
    if (prev) {
      dailyWins = totalWins - prev.totalWins;
      dailyLosses = totalLosses - prev.totalLosses;
    }
    const dailyMatches = dailyWins + dailyLosses;

    // レコードに「date」「time」を個別フィールドとして保存
    jsonData.push({
      date: currentDate,
      time: currentTime,
      wins: dailyWins,
      losses: dailyLosses,
      matches: dailyMatches,
      totalWins: totalWins,
      totalLosses: totalLosses,
      totalMatches: totalMatches,
    });

    fs.writeFileSync(dataPath, JSON.stringify(jsonData, null, 2));
    console.log("Data updated:", currentDate, currentTime, dailyWins, dailyLosses);
  } catch (error) {
    console.error("Error updating data:", error.message);
    process.exit(1);
  }
}

main();
