// updateData.js
const fs = require("fs");
const axios = require("axios");
const dayjs = require("dayjs");

// 環境変数から取得
const API_TOKEN = process.env.CR_API_TOKEN;
const PLAYER_TAG = process.env.PLAYER_TAG;

async function main() {
	try {
		// Clash Royale API からデータを取得
		// https://developer.clashroyale.com/#/documentation
		// GET /players/{playerTag}
		const url = `https://api.clashroyale.com/v1/players/${encodeURIComponent(
			PLAYER_TAG
		)}`;
		const headers = {
			Authorization: `Bearer ${API_TOKEN}`,
		};
		const response = await axios.get(url, { headers });
		const playerData = response.data;

		// playerDataに含まれる値のうち、総試合数・総勝利数を読み取る
		// Clash Royale API の構造上、stats系情報をどう取得するか要確認
		// 例えば "wins", "losses", "battleCount" など
		const totalWins = playerData.wins;
		const totalLosses = playerData.losses;
		const totalMatches = totalWins + totalLosses;

		// 既存の data.json を読み込む
		const dataPath = "./data.json";
		const jsonData = fs.existsSync(dataPath)
			? JSON.parse(fs.readFileSync(dataPath, "utf8"))
			: [];

		// 日付を yyyy-mm-dd 形式で取得
		const today = dayjs().format("YYYY-MM-DD");

		// すでに今日の日付のデータがあれば更新しない
		const latest = jsonData[jsonData.length - 1];
		if (latest && latest.date === today) {
			console.log("Already updated today.");
			return;
		}

		// 差分を計算するため、前日のデータを取得
		const prev = jsonData.length > 0 ? jsonData[jsonData.length - 1] : null;
		let dailyWins = totalWins;
		let dailyLosses = totalLosses;

		if (prev) {
			dailyWins = totalWins - prev.totalWins;
			dailyLosses = totalLosses - prev.totalLossess;
		}
		let dailyMatches = dailyWins + dailyLosses;

		jsonData.push({
			date: today,
			wins: dailyWins,
			losses: dailyLosses,
			matches: dailyMatches,
			totalWins: totalWins,
			totalLosses: totalLosses,
			totalMatches: totalMatches,
		});

		fs.writeFileSync(dataPath, JSON.stringify(jsonData, null, 2));
		console.log("Data updated:", today, dailyWins, dailyLosses);
	} catch (error) {
		console.error("Error updating data:", error.message);
		process.exit(1); // エラーの場合はActionsを失敗にする
	}
}

main();
