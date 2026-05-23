// Temp diagnostic — NWS hourly pop key matching
const LAT = 42.3706;
const LON  = -87.9284;
const NWS_UA = 'HomeBase/1.0 (jacob.b.drumm@gmail.com)';

exports.handler = async function() {
  const tomorrowKey = process.env.REACT_APP_TOMORROW_API_KEY;
  try {
    // NWS hourly
    const pt = await (await fetch(`https://api.weather.gov/points/${LAT},${LON}`, {
      headers: { 'User-Agent': NWS_UA, 'Accept': 'application/geo+json' }
    })).json();
    const fh = await (await fetch(pt.properties.forecastHourly, {
      headers: { 'User-Agent': NWS_UA, 'Accept': 'application/geo+json' }
    })).json();
    const nwsPeriods = fh.properties.periods.slice(0, 5).map(p => ({
      startTime: p.startTime,
      key: new Date(p.startTime).toISOString().slice(0, 13),
      pop: p.probabilityOfPrecipitation?.value,
    }));

    // Tomorrow.io hourly
    const tRes = await fetch(
      `https://api.tomorrow.io/v4/weather/forecast?location=${LAT},${LON}&fields=temperature,precipitationProbability&units=imperial&timesteps=1h&apikey=${tomorrowKey}`
    );
    const tData = await tRes.json();
    const tHourly = (tData.timelines?.hourly || []).slice(0, 5).map(h => ({
      time: h.time,
      key: new Date(h.time).toISOString().slice(0, 13),
      pop: h.values.precipitationProbability,
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nwsPeriods, tHourly }, null, 2),
    };
  } catch(e) {
    return { statusCode: 500, body: e.message };
  }
};
