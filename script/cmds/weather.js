const https = require("https");

function fetchWeather(city) {
  return new Promise((resolve, reject) => {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const req = https.get(url, { headers: { "User-Agent": "curl/7.68.0" } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Location "${city}" not found or service unavailable.`));
      }
      let rawData = "";
      res.on("data", chunk => (rawData += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(rawData);
          resolve(json);
        } catch (e) {
          reject(new Error("Unable to parse weather data."));
        }
      });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("Weather lookup timed out."));
    });
  });
}

function getWeatherIcon(desc) {
  const d = (desc || "").toLowerCase();
  if (d.includes("sun") || d.includes("clear")) return "☀️";
  if (d.includes("partly cloudy")) return "⛅";
  if (d.includes("cloud") || d.includes("overcast")) return "☁️";
  if (d.includes("thunder") || d.includes("storm")) return "⛈️";
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) return "🌧️";
  if (d.includes("snow") || d.includes("ice") || d.includes("blizzard")) return "❄️";
  if (d.includes("fog") || d.includes("mist")) return "🌫️";
  return "🌤️";
}

module.exports = {
  config: {
    name: "weather",
    aliases: ["abohawa", "temp", "climate", "আবহাওয়া"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Check real-time global weather forecasts",
    longDescription: "Provides live temperature, humidity, wind speed, condition, and forecast for any city or location.",
    category: "utility",
    guide: "{p}weather <city or location name>"
  },

  onStart: async function ({ api, event, args, prefix }) {
    const threadID = event.threadID;
    const messageID = event.messageID;

    if (!args || args.length === 0) {
      return api.sendMessage(
        `❌ Please specify a city or location!\nUsage: ${prefix}weather <city name>\nExample: ${prefix}weather Dhaka`,
        threadID,
        messageID
      );
    }

    const query = args.join(" ").trim();
    await api.sendMessage(`🔍 Searching real-time weather report for "${query}"...`, threadID);

    try {
      const data = await fetchWeather(query);
      const current = data.current_condition && data.current_condition[0];
      const area = data.nearest_area && data.nearest_area[0];
      const astronomy = data.weather && data.weather[0] && data.weather[0].astronomy && data.weather[0].astronomy[0];

      if (!current || !area) {
        return api.sendMessage(`❌ No meteorological data found for "${query}".`, threadID, messageID);
      }

      const cityName = (area.areaName && area.areaName[0] && area.areaName[0].value) || query;
      const country = (area.country && area.country[0] && area.country[0].value) || "";
      const region = (area.region && area.region[0] && area.region[0].value) || "";

      const tempC = current.temp_C;
      const tempF = current.temp_F;
      const feelsLikeC = current.FeelsLikeC;
      const feelsLikeF = current.FeelsLikeF;
      const condition = current.weatherDesc && current.weatherDesc[0] && current.weatherDesc[0].value;
      const icon = getWeatherIcon(condition);
      const humidity = current.humidity;
      const windKmph = current.windspeedKmph;
      const windDir = current.winddir16Point;
      const uvIndex = current.uvIndex;
      const visibility = current.visibility;
      const precipMM = current.precipMM;

      const sunrise = astronomy ? astronomy.sunrise : "N/A";
      const sunset = astronomy ? astronomy.sunset : "N/A";

      const report = `${icon} WEATHER REPORT: ${cityName.toUpperCase()}${country ? `, ${country}` : ""}
━━━━━━━━━━━━━━━━━━━━
📌 Location: ${cityName}${region ? ` (${region})` : ""}
🌤️ Condition: ${condition}
🌡️ Temperature: ${tempC}°C / ${tempF}°F
🤔 Feels Like: ${feelsLikeC}°C / ${feelsLikeF}°F
💧 Humidity: ${humidity}%
💨 Wind Speed: ${windKmph} km/h (${windDir})
☔ Precipitation: ${precipMM} mm
👁️ Visibility: ${visibility} km
☀️ UV Index: ${uvIndex}
🌅 Sunrise: ${sunrise} | 🌇 Sunset: ${sunset}
━━━━━━━━━━━━━━━━━━━━
⏰ Observation Time: ${current.localObsDateTime || "Live"}`;

      return api.sendMessage(report, threadID, messageID);
    } catch (err) {
      return api.sendMessage(`❌ Error fetching weather: ${err.message}`, threadID, messageID);
    }
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
