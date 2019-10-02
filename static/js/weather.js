let isNight = false;

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
  const dateNow = new Date();
  const dateTomorrow = new Date();
  dateTomorrow.setDate(dateTomorrow.getDate() + 1);
  const hourlyForecasts =
    temperatureMatches
      .map(([time]) => ({ time }))
      .filter(({ time }) =>
        new Date(time) >= dateNow && new Date(time) < dateTomorrow); // Drop ones in the past

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

function getBackgroundForWeatherSymbol(weatherSymbol) {
  const d = vals => `linear-gradient(to bottom right, ${vals})`;

  const lightText = '#F0F0F0';
  const darkText = '#080808';

  if (isNight) {
    switch (weatherSymbol) {

    }
  } else {
    switch (weatherSymbol) {
      case 1: // Clear
        return [
          d('rgb(216, 242, 255) 0%, rgb(136, 169, 179) 100%'),
          darkText,
        ] 

      case 2: // Partly cloudy
        return [
          d('rgb(194 209, 217) 0%, rgb(98, 126, 134) 100%'),
          darkText,
        ]; 

      case 3: // Cloudy
        return [
          d('rgb(172, 172, 172) 0%, rgb(172, 172, 172) 100%'),
          darkText,
        ]; 

      case 21: // Partly cloudy; light rain
      case 22: // Partly cloudy; rain
      case 22: // Partly cloudy; heavy rain
      case 31: // Cloudy; light rain
      case 32: // Cloudy; rain
      case 33: // Cloudy; heavy rain
        return [
        ];

      case 41: // Partly cloudy; light snow
      case 42: // Partly cloudy; snow
      case 43: // Partly cloudy; heavy snow
      case 51: // Cloudy; light snow
      case 52: // Cloudy; snow
      case 53: // Cloudy; heavy snow
        return [
        ];

      case 61: // Partly cloudy; thunder
      case 62: // Partly cloudy; heavy thunder
      case 63: // Cloudy; thunder
      case 64: // Cloudy; heavy thunder
        return [
        ];

      case 71: // Partly cloudy; light sleet
      case 72: // Partly cloudy; sleet
      case 73: // Partly cloudy; heavy sleet
        return [
        ];

      case 81: // Cloudy; light sleet
      case 82: // Cloudy; sleet
      case 83: // Cloudy; heavy sleet
        return [
        ];

      case 91: // Fog
      case 92: // Fog
        return [
        ];

      default:
        console.error(`Unknown weather symbol: ${weatherSymbol}`);
        return ['#FDFBF9', darkText];
    }
  }
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

  if (hourlyForecasts.length >= 1) {
    const { weatherSymbol } = hourlyForecasts[0];
    const [backgroundColor, textColor] =
      getBackgroundForWeatherSymbol(weatherSymbol);
    document.body.style.background = backgroundColor;
    document.body.style.color = textColor;
    document.body.style.backgroundAttachment = 'fixed'; // Has to be explicit
  }
}

async function refreshWeather() {
  const hourlyForecastData = await fetchHourlyForecastData();
  const hourlyForecasts = parseHourlyForecastData(hourlyForecastData);
  renderHourlyForecasts(hourlyForecasts);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      if (!position || !position.coords || !position.coords.latitude || !position.coords.longitude) {
        console.error('Location could not be got');
        return;
      }

      const dateNow = new Date();

      const timezoneOffset = dateNow.getTimezoneOffset() * (-1) / 60;
      const { sunrise: sunriseHours, sunset: sunsetHours } =
        sunrise(position.coords.latitude, position.coords.longitude, timezoneOffset);

      const currentHour = dateNow.getHours() + (dateNow.getMinutes() / 60); // Close enough
      isNight = currentHour < sunriseHours || currentHour > sunsetHours;
    });
  }
}
