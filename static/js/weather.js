const FORECAST_URL = `/cors/http://data.fmi.fi/fmi-apikey/${FMI_API_KEY}/wfs?request=getFeature&storedquery_id=fmi::forecast::hirlam::surface::point::timevaluepair&geoid=634963&parameters=Temperature,WindSpeedMS,WeatherSymbol3`;
async function fetchHourlyForecastData() {
  return new Promise((resolve, reject) => {
    fetch(FORECAST_URL)
      .then(response => response.text())
      .then(body => resolve(body))
      .catch(reject);
  });
}

function parseHourlyForecastData(hourlyForecastData) {
  const createForecastGroupMatcher = group => new RegExp(`<wml2:MeasurementTimeseries gml:id=".*?${group}">([\\s\\S]*?)</wml2:MeasurementTimeseries>`, 'g');
  const valueMatcher =
    /<wml2:time>([^<]+)<\/wml2:time>[\s\S]*?<wml2:value>([^<]+)<\/wml2:value>/g;

  const findValues = (source) => {
    const matches = [];
    while (true) {
      const match = valueMatcher.exec(source);
      if (match === null) {
        break;
      }
      matches.push([match[1], match[2]]);
    }
    return matches;
  };

  const temperatureSection =
    createForecastGroupMatcher('Temperature').exec(hourlyForecastData)[0];
  const windSpeedSection =
    createForecastGroupMatcher('WindSpeedMS').exec(hourlyForecastData)[0];
  const weatherSymbolSection =
    createForecastGroupMatcher('WeatherSymbol3').exec(hourlyForecastData)[0];

  if (!temperatureSection || !windSpeedSection || !weatherSymbolSection) {
    console.warn('Could not parse forecast XML');
    return;
  }

  const temperatureMatches = findValues(temperatureSection);
  const windSpeedMatches = findValues(windSpeedSection);
  const weatherSymbolMatches = findValues(weatherSymbolSection);

  // Use temperatures to create the basis for applying other things
  const hourlyForecasts =
    temperatureMatches
      .map(([time]) => ({ time }))
      .filter(({ time }) => new Date(time) > new Date()); // Drop ones in the past

  if (hourlyForecasts.length === 0) {
    console.warn('No future forecasts found');
    return;
  }

  temperatureMatches.forEach(([time, value]) => {
    const matchingForecast =
      hourlyForecasts.find(({ time: forecastTime }) => time === forecastTime);
    if (matchingForecast) {
      matchingForecast.temperature = parseFloat(value);
    }
  });

  windSpeedMatches.forEach(([time, value]) => {
    const matchingForecast =
      hourlyForecasts.find(({ time: forecastTime }) => time === forecastTime);
    if (matchingForecast) {
      matchingForecast.windSpeed = parseFloat(value);
    }
  });

  weatherSymbolMatches.forEach(([time, value]) => {
    const matchingForecast =
      hourlyForecasts.find(({ time: forecastTime }) => time === forecastTime);
    if (matchingForecast) {
      matchingForecast.weatherSymbol = parseInt(value); // Just keep it a string
    }
  });

  hourlyForecasts.forEach((f) => {
    // Won't do this earlier to keep the above time comparisons simple
    f.time = new Date(f.time);
  });

  return hourlyForecasts;
}

function renderHourlyForecasts(hourlyForecasts) {
  const hourlyForecastsElem = document.getElementById('hourly-forecasts');

  // Empty the parent
  while (hourlyForecastsElem.firstChild) {
    hourlyForecastsElem.removeChild(hourlyForecastsElem.firstChild);
  }

  for (const forecast of hourlyForecasts) {
    const rowElem = document.createElement('div');
    rowElem.className = 'hourly-forecast-row';

    const hourElem = document.createElement('div');
    hourElem.className = 'hourly-forecast-hours';
    const hours = forecast.time.getHours().toString().padStart(2, '0');
    hourElem.appendChild(document.createTextNode(hours));
    rowElem.appendChild(hourElem);

    const weatherSymbolElem = document.createElement('img');
    weatherSymbolElem.className = 'hourly-forecast-weather-symbol';
    weatherSymbolElem.src = `symbols/${forecast.weatherSymbol}.svg`;
    rowElem.appendChild(weatherSymbolElem);

    const restElem = document.createElement('div')
    restElem.className = 'hourly-forecast-rest';

    const temperatureElem = document.createElement('div');
    temperatureElem.appendChild(document.createTextNode(`${Math.round(forecast.temperature)}\u00A0\u00B0C`));
    restElem.appendChild(temperatureElem);

    const windSpeedElem = document.createElement('div');
    windSpeedElem.appendChild(document.createTextNode(`${Math.round(forecast.windSpeed)}\u00A0m/s`));
    restElem.appendChild(windSpeedElem);

    rowElem.appendChild(restElem);

    hourlyForecastsElem.appendChild(rowElem);
  }
}

async function refreshWeather() {
  const hourlyForecastData = await fetchHourlyForecastData();
  const hourlyForecasts = parseHourlyForecastData(hourlyForecastData);
  renderHourlyForecasts(hourlyForecasts);
}
