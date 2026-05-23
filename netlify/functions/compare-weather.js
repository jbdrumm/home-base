// Temporary diagnostic function — delete after weather API decision
const LAT = 42.35389843766618;
const LON = -87.93890833519994;

exports.handler = async function() {
  const tomorrowKey = process.env.REACT_APP_TOMORROW_API_KEY;
  const results = {};

  try {
    const fields = ['temperature','temperatureApparent','humidity','dewPoint','windSpeed','windGust','windDirection','precipitationProbability','cloudCover','visibility','pressureSurfaceLevel','uvIndex','weatherCode'].join(',');
    const res = await fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${LAT},${LON}&fields=${fields}&units=imperial&apikey=${tomorrowKey}`);
    const data = await res.json();
    const v = data.data?.values || {};
    const CODES = {1000:'Clear',1001:'Cloudy',1100:'Mostly Clear',1101:'Partly Cloudy',1102:'Mostly Cloudy',4000:'Drizzle',4001:'Rain',4200:'Light Rain',4201:'Heavy Rain',8000:'Thunderstorm'};
    results.tomorrow_io = { temp:`${Math.round(v.temperature)}°F`, feelsLike:`${Math.round(v.temperatureApparent)}°F`, condition:CODES[v.weatherCode]||`code ${v.weatherCode}`, humidity:`${Math.round(v.humidity)}%`, dewPoint:`${Math.round(v.dewPoint)}°F`, wind:`${Math.round(v.windSpeed)} mph`, windGust:`${Math.round(v.windGust)} mph`, precipProb:`${Math.round(v.precipitationProbability)}%`, cloudCover:`${Math.round(v.cloudCover)}%`, visibility:`${Math.round(v.visibility)} mi`, pressure:`${Math.round(v.pressureSurfaceLevel)} hPa`, uvIndex:v.uvIndex };
  } catch(e) { results.tomorrow_io = { error: e.message }; }

  try {
    const H = { 'User-Agent':'HomeBase/1.0 (jacob.b.drumm@gmail.com)', 'Accept':'application/geo+json' };
    const pt = await (await fetch(`https://api.weather.gov/points/${LAT},${LON}`,{headers:H})).json();
    const { observationStations, gridId, gridX, gridY } = pt.properties;
    const st = await (await fetch(observationStations,{headers:H})).json();
    const station = st.features?.[0]?.properties?.stationIdentifier;
    const ob = await (await fetch(`https://api.weather.gov/stations/${station}/observations/latest`,{headers:H})).json();
    const v = ob.properties;
    const cToF=c=>c!=null?Math.round(c*9/5+32):null;
    const mToMph=m=>m!=null?Math.round(m*2.237):null;
    const paToHpa=p=>p!=null?Math.round(p/100):null;
    const mToMi=m=>m!=null?Math.round(m/1609.34):null;
    results.nws = { station, gridPoint:`${gridId} ${gridX},${gridY}`, temp:cToF(v.temperature?.value), feelsLike:cToF(v.heatIndex?.value??v.windChill?.value??v.temperature?.value), condition:v.textDescription, humidity:v.relativeHumidity?.value?Math.round(v.relativeHumidity.value):null, dewPoint:cToF(v.dewpoint?.value), wind:mToMph(v.windSpeed?.value), windGust:mToMph(v.windGust?.value), visibility:mToMi(v.visibility?.value), pressure:paToHpa(v.barometricPressure?.value), uvIndex:'not in observations', obsTime:v.timestamp };
  } catch(e) { results.nws = { error: e.message }; }

  return { statusCode:200, headers:{'Content-Type':'application/json'}, body:JSON.stringify(results,null,2) };
};
