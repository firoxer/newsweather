Newsweather
===

A dumb browser-based dashboard for news headlines and hourly weather forecast. Good for finding a use for a leftover tablet.

The headlines are fetched from YLE and the forecast is fetched from the Finnish Meteorological Institute.

The weather symbols are from [FMI](https://github.com/fmidev/opendata-resources).

Setup
---

Copy the file `static/js/fmi-api-key.js.sample` to `static/js/fmi-api-key.js` and fill your FMI API key in.

Copy the file `static/js/email-addresses.js.sample` to `static/js/email-addresses.js` and modify it to your needs.

Copy the file `.env.sh.sample` to `.env.sh` and fill in the above email addresses along with a SendGrid API KEY.

Development
---

Execute `source .env.sh`.

Run `./node_modules/.bin/nodemon -e js,html,css server.js`. Open [http://localhost:3000](http://localhost:3000).

Background Image Originals
---

[Sunny](https://unsplash.com/photos/a7IVuJwYjp8)
[Partly cloudy](https://unsplash.com/photos/u0ZgqJD55pE)
[Cloudy](https://unsplash.com/photos/fmOoOsc9Tn8)
[Rain](https://unsplash.com/photos/5rhtwXyZrQg)
[Heavy rain](https://unsplash.com/photos/ndbyw7oNI7Y)
[Snow](https://unsplash.com/photos/F8EpZ_CGnZU)
[Heavy snow](https://unsplash.com/photos/GekcjeaPbrI)
[Thunder](https://unsplash.com/photos/oGd18f8NLfU)
[Sleet](https://unsplash.com/photos/YaoGIQ67D40)
[Fog](https://unsplash.com/photos/EDPA3Aq6kCs)
[Night](https://unsplash.com/photos/DDhET-updco)